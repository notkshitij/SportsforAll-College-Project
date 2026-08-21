/**
 * Utility to parse and verify Poornima University student email addresses.
 *
 * Standard Poornima Student Email Pattern:
 *   [YEAR][COURSE][SPECIALIZATION][FIRSTNAME][REGISTRATION]@poornima.edu.in
 * Examples:
 *   - 2024btechcsemanveer1234@poornima.edu.in
 *   - 2023bcaaijohn4521@poornima.edu.in
 *   - 2022btechaimlrahul543@poornima.edu.in
 *   - 2024.btech.cse.manveer.1234@poornima.edu.in
 *   - 2021btechcsmanish001@poornima.edu.in
 */

export interface ParsedEmail {
  rawEmail: string;
  year: string; // e.g. "2024"
  course: string; // e.g. "B.Tech", "BCA", "BBA"
  rawCourse: string; // e.g. "btech"
  specialization: string; // e.g. "CSE", "AI", "AIML"
  rawSpecialization: string; // e.g. "cse"
  firstName: string; // e.g. "Manveer"
  registration: string; // e.g. "1234"
  isStudentEmail: boolean;
}

export interface VerificationResult {
  isValid: boolean;
  errors: {
    name?: string;
    enrollment?: string;
    department?: string;
    year?: string;
    phone?: string;
  };
  mismatches: string[];
}

const KNOWN_COURSES: { key: string; label: string; aliases: string[] }[] = [
  { key: 'btech', label: 'B.Tech', aliases: ['btech', 'b.tech', 'bt', 'b tech'] },
  { key: 'mtech', label: 'M.Tech', aliases: ['mtech', 'm.tech', 'mt', 'm tech'] },
  { key: 'bca', label: 'BCA', aliases: ['bca', 'computer application', 'computer applications'] },
  { key: 'mca', label: 'MCA', aliases: ['mca', 'master of computer applications'] },
  { key: 'bba', label: 'BBA', aliases: ['bba', 'business administration', 'management'] },
  { key: 'mba', label: 'MBA', aliases: ['mba', 'master of business administration'] },
  { key: 'bdes', label: 'B.Des', aliases: ['bdes', 'b.des', 'design'] },
  { key: 'mdes', label: 'M.Des', aliases: ['mdes', 'm.des'] },
  { key: 'barch', label: 'B.Arch', aliases: ['barch', 'b.arch', 'architecture'] },
  { key: 'bsc', label: 'B.Sc', aliases: ['bsc', 'b.sc', 'science'] },
  { key: 'msc', label: 'M.Sc', aliases: ['msc', 'm.sc'] },
  { key: 'bcom', label: 'B.Com', aliases: ['bcom', 'b.com', 'commerce'] },
  { key: 'bpharma', label: 'B.Pharm', aliases: ['bpharma', 'bpharm', 'pharmacy', 'pharmaceutical'] },
  { key: 'mpharma', label: 'M.Pharm', aliases: ['mpharma', 'mpharm'] },
  { key: 'diploma', label: 'Diploma', aliases: ['diploma', 'dip', 'polytechnic'] },
  { key: 'phd', label: 'Ph.D', aliases: ['phd', 'doctorate'] },
];

const KNOWN_SPECIALIZATIONS: { key: string; label: string; aliases: string[]; keywords: string[] }[] = [
  { key: 'aiml', label: 'AI & ML', aliases: ['aiml', 'ai-ml', 'ai_ml', 'ai/ml'], keywords: ['ai', 'ml', 'artificial intelligence', 'machine learning', 'aiml', 'cse', 'computer science'] },
  { key: 'aids', label: 'AI & Data Science', aliases: ['aids', 'ai-ds', 'ai_ds'], keywords: ['ai', 'data science', 'ds', 'aids', 'cse', 'computer science'] },
  { key: 'cse', label: 'Computer Science & Engineering', aliases: ['cse', 'cs', 'ce'], keywords: ['cse', 'cs', 'computer science', 'computer engineering', 'software', 'information technology', 'it', 'comp sci'] },
  { key: 'cs', label: 'Computer Science', aliases: ['cs'], keywords: ['computer science', 'cs', 'cse', 'software', 'it', 'comp sci'] },
  { key: 'ai', label: 'Artificial Intelligence', aliases: ['ai'], keywords: ['artificial intelligence', 'ai', 'computer science', 'cse', 'data science'] },
  { key: 'ds', label: 'Data Science', aliases: ['ds'], keywords: ['data science', 'ds', 'analytics', 'computer science', 'cse'] },
  { key: 'cyber', label: 'Cyber Security', aliases: ['cyber', 'cses', 'cybersecurity'], keywords: ['cyber', 'security', 'cybersecurity', 'computer science', 'cse'] },
  { key: 'iot', label: 'IoT', aliases: ['iot'], keywords: ['iot', 'internet of things', 'computer science', 'cse'] },
  { key: 'cloud', label: 'Cloud Computing', aliases: ['cloud', 'cc'], keywords: ['cloud', 'cloud computing', 'cse', 'computer science'] },
  { key: 'it', label: 'Information Technology', aliases: ['it', 'cce'], keywords: ['information technology', 'it', 'computer science', 'cse'] },
  { key: 'civil', label: 'Civil Engineering', aliases: ['civil', 'cv'], keywords: ['civil', 'civil engineering', 'structure'] },
  { key: 'mech', label: 'Mechanical Engineering', aliases: ['mech', 'me', 'mechanical'], keywords: ['mech', 'mechanical', 'automobile'] },
  { key: 'ece', label: 'Electronics & Communication', aliases: ['ece', 'ec'], keywords: ['electronics', 'communication', 'ece', 'ec'] },
  { key: 'ee', label: 'Electrical Engineering', aliases: ['ee', 'eee'], keywords: ['electrical', 'ee', 'eee'] },
];

/**
 * Capitalizes first letter of each word
 */
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Parses Poornima student email to extract student attributes.
 */
export function parsePoornimaEmail(email: string): ParsedEmail | null {
  if (!email || typeof email !== 'string') return null;

  const clean = email.trim().toLowerCase();
  if (!clean.endsWith('@poornima.edu.in')) {
    return null;
  }

  const localPart = clean.split('@')[0];
  if (!localPart || localPart === 'student' || localPart.startsWith('guard') || localPart.includes('security')) {
    return null;
  }

  // Handle delimiter separated formats (e.g., 2024.btech.cse.manveer.1234 or 2024-btech-cse-manveer-1234)
  if (localPart.includes('.') || localPart.includes('-') || localPart.includes('_')) {
    const parts = localPart.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 3) {
      const yearMatch = parts[0].match(/^(20\d{2}|\d{2})$/);
      const year = yearMatch ? (parts[0].length === 2 ? `20${parts[0]}` : parts[0]) : '';

      // Check if parts[1] is course
      const courseFound = KNOWN_COURSES.find((c) => c.aliases.includes(parts[1]));
      const rawCourse = courseFound ? courseFound.key : parts[1];
      const courseLabel = courseFound ? courseFound.label : capitalize(parts[1]);

      let rawSpecialization = '';
      let specLabel = '';
      let firstName = '';
      let registration = '';

      if (parts.length >= 5) {
        // [Year, Course, Specialization, FirstName, Reg]
        const specFound = KNOWN_SPECIALIZATIONS.find((s) => s.aliases.includes(parts[2]));
        rawSpecialization = specFound ? specFound.key : parts[2];
        specLabel = specFound ? specFound.label : parts[2].toUpperCase();
        firstName = capitalize(parts[3]);
        registration = parts.slice(4).join('');
      } else if (parts.length === 4) {
        // [Year, Course, FirstName, Reg] OR [Year, Spec, FirstName, Reg]
        const specFound = KNOWN_SPECIALIZATIONS.find((s) => s.aliases.includes(parts[1]));
        if (specFound && !courseFound) {
          rawSpecialization = specFound.key;
          specLabel = specFound.label;
          firstName = capitalize(parts[2]);
          registration = parts[3];
        } else {
          firstName = capitalize(parts[2]);
          registration = parts[3];
        }
      } else {
        // 3 parts: [Year, FirstName, Reg]
        firstName = capitalize(parts[1]);
        registration = parts[2];
      }

      if (year && firstName) {
        return {
          rawEmail: clean,
          year,
          course: courseLabel,
          rawCourse,
          specialization: specLabel,
          rawSpecialization,
          firstName,
          registration,
          isStudentEmail: true,
        };
      }
    }
  }

  // Handle contiguous format: 2024btechcsemanveer1234
  // 1. Year at start (4 digits: 20XX or 2 digits)
  const yearMatch = localPart.match(/^(20\d{2}|\d{2})/);
  if (!yearMatch) {
    return null;
  }

  const rawYearStr = yearMatch[1];
  const year = rawYearStr.length === 2 ? `20${rawYearStr}` : rawYearStr;
  let remaining = localPart.slice(rawYearStr.length);

  // 2. Trailing registration digits / code
  const regMatch = remaining.match(/(\d+)$/);
  let registration = '';
  if (regMatch) {
    registration = regMatch[1];
    remaining = remaining.slice(0, -regMatch[1].length);
  }

  // 3. Match Course from beginning of remaining text
  let rawCourse = '';
  let courseLabel = '';
  for (const c of KNOWN_COURSES) {
    for (const alias of c.aliases) {
      if (remaining.startsWith(alias)) {
        rawCourse = c.key;
        courseLabel = c.label;
        remaining = remaining.slice(alias.length);
        break;
      }
    }
    if (rawCourse) break;
  }

  // 4. Match Specialization from remaining text
  let rawSpecialization = '';
  let specLabel = '';
  for (const s of KNOWN_SPECIALIZATIONS) {
    for (const alias of s.aliases) {
      if (remaining.startsWith(alias)) {
        rawSpecialization = s.key;
        specLabel = s.label;
        remaining = remaining.slice(alias.length);
        break;
      }
    }
    if (rawSpecialization) break;
  }

  // 5. Remaining letters are the student's first name
  const firstName = capitalize(remaining.replace(/[^a-zA-Z]/g, ''));

  if (!firstName) {
    return null;
  }

  return {
    rawEmail: clean,
    year,
    course: courseLabel || 'B.Tech',
    rawCourse: rawCourse || 'btech',
    specialization: specLabel || (rawSpecialization ? rawSpecialization.toUpperCase() : ''),
    rawSpecialization,
    firstName,
    registration,
    isStudentEmail: true,
  };
}

/**
 * Validates the student's manually entered details against their authenticated university email.
 * Red-flags any field that contradicts the email identity.
 */
export function verifyStudentDetailsWithEmail(
  input: {
    name: string;
    enrollment: string;
    department: string;
    year: string;
    phone: string;
  },
  parsedEmail: ParsedEmail | null
): VerificationResult {
  const errors: Record<string, string> = {};
  const mismatches: string[] = [];

  const cleanName = input.name.trim();
  const cleanEnrollment = input.enrollment.trim();
  const cleanDepartment = input.department.trim();
  const cleanYear = input.year.trim();
  const cleanPhone = input.phone.trim();

  // Basic required checks
  if (!cleanName) {
    errors.name = 'Full name is required';
  }
  if (!cleanEnrollment) {
    errors.enrollment = 'Registration number is required';
  }
  if (!cleanDepartment) {
    errors.department = 'Department / Branch is required';
  }
  if (!cleanYear) {
    errors.year = 'Academic year is required';
  }
  if (!cleanPhone) {
    errors.phone = 'Phone number is required';
  } else if (!/^[0-9+\-\s]{7,15}$/.test(cleanPhone)) {
    errors.phone = 'Enter a valid phone number (10 digits)';
  }

  // If no email could be parsed (e.g. demo account or general email), fallback to standard basic validation
  if (!parsedEmail || !parsedEmail.isStudentEmail) {
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      mismatches,
    };
  }

  // 1. FIRST NAME VERIFICATION
  // Student email only contains their first name.
  // We extract the first word of the entered full name and verify it matches email first name.
  if (cleanName && parsedEmail.firstName) {
    const enteredFirstName = cleanName.split(/\s+/)[0].toLowerCase();
    const expectedFirstName = parsedEmail.firstName.toLowerCase();

    if (enteredFirstName !== expectedFirstName) {
      const msg = `First name "${cleanName.split(/\s+/)[0]}" must match email name "${parsedEmail.firstName}".`;
      errors.name = `First name must be "${parsedEmail.firstName}" (as in your university email)`;
      mismatches.push(msg);
    }
  }

  // 2. REGISTRATION NUMBER VERIFICATION
  // The entered registration code/number should match or contain the registration digits from the email.
  if (cleanEnrollment && parsedEmail.registration) {
    const enteredDigits = cleanEnrollment.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const emailReg = parsedEmail.registration.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    const matchesReg =
      enteredDigits.includes(emailReg) ||
      emailReg.includes(enteredDigits) ||
      enteredDigits.endsWith(emailReg);

    if (!matchesReg) {
      const msg = `Registration number must match your student email ID (ending with "${parsedEmail.registration}").`;
      errors.enrollment = `Must contain "${parsedEmail.registration}" from your student email`;
      mismatches.push(msg);
    }
  }

  // 3. ADMISSION YEAR / ACADEMIC YEAR VERIFICATION
  // Email starts with admission year (e.g. 2024).
  // Student might enter "2024", "2nd Year", "2nd Year (2024)", "2024-2028", "2", "3rd Year", "Final Year", etc.
  if (cleanYear && parsedEmail.year) {
    const enteredYearStr = cleanYear.toLowerCase();
    const admissionYear = parsedEmail.year;

    // Check if 4-digit admission year is present in input
    const hasAdmissionYear = enteredYearStr.includes(admissionYear);

    // Check if 2-digit suffix is present (e.g. '24' for 2024)
    const twoDigitYear = admissionYear.slice(-2);
    const hasTwoDigit = enteredYearStr.includes(twoDigitYear);

    // Check if user entered a standard year of study (1st, 2nd, 3rd, 4th, 5th, Final Year)
    const hasStandardStudyYear =
      /\b(1st|2nd|3rd|4th|5th|1|2|3|4|5|first|second|third|fourth|final)\b/i.test(enteredYearStr) ||
      enteredYearStr.includes('year');

    // Check for explicit conflicting 4-digit years like entering 2018 or 2030 when admission is 2024
    const fourDigitMatch = enteredYearStr.match(/\b(20\d{2})\b/);
    const hasConflictingFourDigit = fourDigitMatch && fourDigitMatch[1] !== admissionYear;

    let isYearValid = (hasAdmissionYear || hasTwoDigit || hasStandardStudyYear) && !hasConflictingFourDigit;

    if (!isYearValid) {
      const msg = `Academic year does not match your admission year (${parsedEmail.year}) in your email.`;
      errors.year = `Must correspond to admission year ${parsedEmail.year}`;
      mismatches.push(msg);
    }
  }

  // 4. DEPARTMENT / COURSE VERIFICATION (Helpful warning / match if specified)
  if (cleanDepartment && (parsedEmail.rawSpecialization || parsedEmail.rawCourse)) {
    const enteredDept = cleanDepartment.toLowerCase();

    // Check specialization keywords if email has a specialization
    let hasDeptMatch = false;
    if (parsedEmail.rawSpecialization) {
      const specObj = KNOWN_SPECIALIZATIONS.find(
        (s) => s.key === parsedEmail.rawSpecialization || s.aliases.includes(parsedEmail.rawSpecialization)
      );
      if (specObj) {
        hasDeptMatch = specObj.keywords.some((kw) => {
          if (kw.length <= 3) {
            const wordRegex = new RegExp(`\\b${kw}\\b`, 'i');
            return wordRegex.test(enteredDept);
          }
          return enteredDept.includes(kw);
        });
      }
    } else if (parsedEmail.rawCourse) {
      // If no specialization in email, check course keywords
      const courseObj = KNOWN_COURSES.find((c) => c.key === parsedEmail.rawCourse);
      if (courseObj) {
        hasDeptMatch =
          courseObj.aliases.some((alias) => {
            if (alias.length <= 3) {
              const wordRegex = new RegExp(`\\b${alias}\\b`, 'i');
              return wordRegex.test(enteredDept);
            }
            return enteredDept.includes(alias);
          }) || enteredDept.includes(courseObj.label.toLowerCase());
      }
    }

    if (!hasDeptMatch && (parsedEmail.specialization || parsedEmail.course)) {
      const targetLabel = [parsedEmail.course, parsedEmail.specialization].filter(Boolean).join(' ');
      const msg = `Department should match your course/branch (${targetLabel}) from your email.`;
      errors.department = `Must match course branch (${targetLabel})`;
      mismatches.push(msg);
    }
  }

  return {
    isValid: Object.keys(errors).length === 0 && mismatches.length === 0,
    errors,
    mismatches,
  };
}

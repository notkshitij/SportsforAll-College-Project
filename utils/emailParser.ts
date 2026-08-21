/**
 * Robust University Email Parser & Credential Verification Engine
 * for Poornima University (@poornima.edu.in).
 *
 * Supported Poornima Email Patterns:
 *   - Contiguous: 2024btechcsemanveer1234@poornima.edu.in
 *   - Short branch: 2024btcsemanveer1234@poornima.edu.in
 *   - Delimited: 2024.btech.cse.manveer.1234@poornima.edu.in
 *   - AI/ML, Data Science: 2022btechaimlrahul543@poornima.edu.in
 *   - BCA/BBA: 2023bcaaijohn4521@poornima.edu.in
 *   - Roll only: 2024btechcse001@poornima.edu.in
 *   - Name first: manveer.2024btechcse1234@poornima.edu.in
 */

export interface ParsedEmail {
  rawEmail: string;
  year: string; // e.g. "2024"
  course: string; // e.g. "B.Tech", "BCA", "BBA"
  rawCourse: string; // e.g. "btech"
  specialization: string; // e.g. "CSE", "AI & ML"
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

interface CourseDef {
  key: string;
  label: string;
  aliases: string[];
}

interface SpecDef {
  key: string;
  label: string;
  aliases: string[];
  keywords: string[];
}

const KNOWN_COURSES: CourseDef[] = [
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

const KNOWN_SPECIALIZATIONS: SpecDef[] = [
  { key: 'aiml', label: 'AI & ML', aliases: ['aiml', 'ai-ml', 'ai_ml', 'ai/ml'], keywords: ['ai', 'ml', 'artificial intelligence', 'machine learning', 'aiml', 'cse', 'computer science'] },
  { key: 'aids', label: 'AI & Data Science', aliases: ['aids', 'ai-ds', 'ai_ds'], keywords: ['ai', 'data science', 'ds', 'aids', 'cse', 'computer science'] },
  { key: 'cse', label: 'Computer Science & Engineering', aliases: ['cse', 'cs', 'ce', 'comp', 'computer'], keywords: ['cse', 'cs', 'computer science', 'computer engineering', 'software', 'information technology', 'it', 'comp sci'] },
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

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Parses any Poornima University email address to extract embedded student attributes.
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

  // 1. EXTRACT ADMISSION YEAR
  // Look for 4-digit year (e.g. 2018-2030) or 2-digit year at start (e.g. 24 -> 2024)
  let extractedYear = '';
  const fourDigitYearMatch = localPart.match(/(20[1-3]\d)/);
  if (fourDigitYearMatch) {
    extractedYear = fourDigitYearMatch[1];
  } else {
    const twoDigitMatch = localPart.match(/^(1[8-9]|2[0-9])/);
    if (twoDigitMatch) {
      extractedYear = `20${twoDigitMatch[1]}`;
    }
  }

  // 2. EXTRACT COURSE
  let matchedCourse: CourseDef | null = null;
  for (const c of KNOWN_COURSES) {
    // Sort aliases by length descending so "btech" matches before "bt"
    const sortedAliases = [...c.aliases].sort((a, b) => b.length - a.length);
    for (const alias of sortedAliases) {
      const cleanAlias = alias.replace(/[^a-z0-9]/g, '');
      const cleanLocal = localPart.replace(/[^a-z0-9]/g, '');
      if (cleanLocal.includes(cleanAlias)) {
        matchedCourse = c;
        break;
      }
    }
    if (matchedCourse) break;
  }

  // 3. EXTRACT SPECIALIZATION / BRANCH
  let matchedSpec: SpecDef | null = null;
  for (const s of KNOWN_SPECIALIZATIONS) {
    const sortedAliases = [...s.aliases].sort((a, b) => b.length - a.length);
    for (const alias of sortedAliases) {
      const cleanAlias = alias.replace(/[^a-z0-9]/g, '');
      const cleanLocal = localPart.replace(/[^a-z0-9]/g, '');
      // Ensure we don't falsely match small substring inside course
      if (cleanLocal.includes(cleanAlias)) {
        // Double check it's not just part of the course name
        matchedSpec = s;
        break;
      }
    }
    if (matchedSpec) break;
  }

  // 4. EXTRACT REGISTRATION DIGITS
  // Remove the 4-digit admission year from the local part, then find remaining number sequences
  let remainingForReg = localPart;
  if (extractedYear) {
    remainingForReg = remainingForReg.replace(extractedYear, '');
  }
  const digitMatches = remainingForReg.match(/(\d+)/g);
  let extractedRegistration = '';
  if (digitMatches && digitMatches.length > 0) {
    // Pick the most significant digits (often at the end or largest group)
    extractedRegistration = digitMatches[digitMatches.length - 1];
  }

  // 5. EXTRACT FIRST NAME
  // Remove year, course alias, spec alias, and all digits/delimiters from localPart
  let remainingForName = localPart;
  if (extractedYear) {
    remainingForName = remainingForName.replace(extractedYear, '');
  }
  if (matchedCourse) {
    for (const alias of matchedCourse.aliases) {
      remainingForName = remainingForName.replace(alias.replace(/[^a-z0-9]/g, ''), '');
    }
  }
  if (matchedSpec) {
    for (const alias of matchedSpec.aliases) {
      remainingForName = remainingForName.replace(alias.replace(/[^a-z0-9]/g, ''), '');
    }
  }
  // Strip all digits and delimiters
  const cleanNameLetters = remainingForName.replace(/[^a-zA-Z]/g, '');
  const extractedFirstName = capitalize(cleanNameLetters);

  return {
    rawEmail: clean,
    year: extractedYear || '',
    course: matchedCourse ? matchedCourse.label : '',
    rawCourse: matchedCourse ? matchedCourse.key : '',
    specialization: matchedSpec ? matchedSpec.label : '',
    rawSpecialization: matchedSpec ? matchedSpec.key : '',
    firstName: extractedFirstName || '',
    registration: extractedRegistration || '',
    isStudentEmail: true,
  };
}

/**
 * Validates the student's manually entered details against their authenticated university email.
 * Strictly red-flags any field that contradicts the email identity.
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
    errors.phone = 'Enter a valid 10-digit phone number';
  }

  // If no email could be parsed, basic checks apply
  if (!parsedEmail) {
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      mismatches,
    };
  }

  // 1. FIRST NAME VERIFICATION
  // The first word of the entered full name must match the student's first name in their email
  if (cleanName && parsedEmail.firstName && parsedEmail.firstName.length >= 2) {
    const enteredFirstName = cleanName.split(/\s+/)[0].toLowerCase();
    const expectedFirstName = parsedEmail.firstName.toLowerCase();

    if (enteredFirstName !== expectedFirstName) {
      const msg = `First name "${cleanName.split(/\s+/)[0]}" does not match email student name ("${parsedEmail.firstName}").`;
      errors.name = `First name must be "${parsedEmail.firstName}" (as in ${parsedEmail.rawEmail})`;
      mismatches.push(msg);
    }
  }

  // 2. REGISTRATION NUMBER VERIFICATION
  // The entered registration code must contain/match the registration digits from the email
  if (cleanEnrollment && parsedEmail.registration && parsedEmail.registration.length >= 1) {
    const enteredDigits = cleanEnrollment.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const emailReg = parsedEmail.registration.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    const matchesReg =
      enteredDigits.includes(emailReg) ||
      emailReg.includes(enteredDigits) ||
      enteredDigits.endsWith(emailReg);

    if (!matchesReg) {
      const msg = `Registration number "${cleanEnrollment}" does not match email registration code ("${parsedEmail.registration}").`;
      errors.enrollment = `Must contain "${parsedEmail.registration}" from your university email`;
      mismatches.push(msg);
    }
  }

  // 3. ADMISSION YEAR / ACADEMIC YEAR VERIFICATION
  // Must correspond to the admission year extracted from email (e.g. 2024)
  if (cleanYear && parsedEmail.year && parsedEmail.year.length === 4) {
    const enteredYearStr = cleanYear.toLowerCase();
    const admissionYear = parsedEmail.year;

    // Check if 4-digit admission year is present in input
    const hasAdmissionYear = enteredYearStr.includes(admissionYear);

    // Check if 2-digit suffix is present (e.g. '24' for 2024)
    const twoDigitYear = admissionYear.slice(-2);
    const hasTwoDigit = enteredYearStr.includes(twoDigitYear);

    // Check for explicit conflicting 4-digit years like entering 2019 or 2030 when admission is 2024
    const fourDigitMatch = enteredYearStr.match(/\b(20\d{2})\b/);
    const hasConflictingFourDigit = fourDigitMatch && fourDigitMatch[1] !== admissionYear;

    // Check if standard academic year string (e.g. "2nd Year", "1st Year", "3rd Year", "4th Year")
    const hasStandardStudyYear =
      /\b(1st|2nd|3rd|4th|5th|1|2|3|4|5|first|second|third|fourth|final)\b/i.test(enteredYearStr) ||
      enteredYearStr.includes('year');

    let isYearValid = (hasAdmissionYear || hasTwoDigit || hasStandardStudyYear) && !hasConflictingFourDigit;

    if (!isYearValid) {
      const msg = `Academic year does not match your admission year (${parsedEmail.year}) in your email.`;
      errors.year = `Must correspond to admission year ${parsedEmail.year}`;
      mismatches.push(msg);
    }
  }

  // 4. DEPARTMENT / COURSE VERIFICATION
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

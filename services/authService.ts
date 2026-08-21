import { APP_STRINGS } from '../constants/strings';
import { User } from '../types';
import { isValidPoornimaEmail } from '../utils/validationUtils';
import { INITIAL_GUARD_USER, INITIAL_STUDENT_USER, INITIAL_USERS } from './mockDb';
import { signInWithGoogleNative, signInWithGoogleOAuth } from './supabase';

/**
 * Deterministic id from an email address. Same email ALWAYS produces the
 * same id, so the same person logging in twice (even on different days,
 * even after logging out) maps to the same profile row in Supabase
 * instead of a brand new one.
 */
function stableIdFromEmail(email: string, prefix: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  }
  return `${prefix}_${hash.toString(36)}`;
}

export class AuthService {
  /**
   * Real Google Sign-in flow (Native Google Play Services on mobile, OAuth on Web)
   */
  static async signInWithGoogle(): Promise<{ user: User }> {
    const { user } = await signInWithGoogleNative();
    return { user };
  }

  /**
   * Directly authenticate by Poornima University email
   */
  static async authenticateByEmail(email: string): Promise<{ user: User }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!isValidPoornimaEmail(cleanEmail)) {
      throw new Error(APP_STRINGS.ERRORS.INVALID_EMAIL);
    }

    // Brief realistic verification delay
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Check if matching predefined user
    const existing = INITIAL_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { user: existing };
    }

    // Dynamic user creation based on email prefix and role
    const isGuard = cleanEmail.startsWith('guard') || cleanEmail.includes('security');
    const namePart = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = namePart
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const newUser: User = {
      id: stableIdFromEmail(cleanEmail, isGuard ? 'guard' : 'stu'),
      email: cleanEmail,
      name: isGuard ? (formattedName || 'Security Officer') : '',
      enrollment: isGuard ? 'SEC-STAFF' : '',
      department: isGuard ? 'Campus Security Department' : '',
      year: isGuard ? undefined : '',
      role: isGuard ? 'guard' : 'student',
      createdAt: new Date().toISOString(),
    };

    return { user: newUser };
  }

  static getDemoStudent(): User {
    return INITIAL_STUDENT_USER;
  }

  static getDemoGuard(): User {
    return INITIAL_GUARD_USER;
  }
}

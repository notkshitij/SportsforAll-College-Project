import { APP_STRINGS } from '../constants/strings';
import { User } from '../types';
import { isValidPoornimaEmail } from '../utils/validationUtils';
import { INITIAL_GUARD_USER, INITIAL_STUDENT_USER, INITIAL_USERS } from './mockDb';
import { signInWithGoogleNative } from './supabase';

export class AuthService {
  /**
   * Real Supabase Google OAuth sign-in flow (native, no browser)
   */
  static async signInWithGoogle(): Promise<{ user: User }> {
    try {
      const { user } = await signInWithGoogleNative();
      return { user };
    } catch (err: any) {
      throw err;
    }
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
      id: isGuard ? `guard_${Date.now()}` : `stu_${Date.now()}`,
      email: cleanEmail,
      name: formattedName || (isGuard ? 'Security Officer' : 'Poornima Student'),
      enrollment: isGuard ? 'SEC-STAFF' : `PU-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      department: isGuard ? 'Campus Security Department' : 'Computer Science & Engineering',
      year: isGuard ? undefined : '2nd Year',
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

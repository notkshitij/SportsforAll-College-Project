import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AuthService } from '../services/authService';
import { supabase } from '../services/supabase';
import { ProfileService } from '../services/profileService';
import { INITIAL_GUARD_USER, INITIAL_STUDENT_USER } from '../services/mockDb';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: UserRole | null;
  pendingEmail: string;

  // Actions
  setPendingEmail: (email: string) => void;
  loginWithGoogle: () => Promise<User>;
  loginWithEmail: (email: string) => Promise<User>;
  loginAsDemoStudent: () => void;
  loginAsDemoGuard: () => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      activeRole: null,
      pendingEmail: '',

      setPendingEmail: (email: string) => {
        set({ pendingEmail: email.trim().toLowerCase() });
      },

      loginWithGoogle: async () => {
        set({ isLoading: true });
        try {
          const { user } = await AuthService.signInWithGoogle();
          set({
            user,
            isAuthenticated: true,
            activeRole: user.role,
            isLoading: false,
          });
          // Persist the full profile to Supabase (fire-and-forget so login isn't blocked)
          ProfileService.upsertProfile(user).catch((e) =>
            console.warn('Profile sync failed:', e?.message)
          );
          return user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithEmail: async (email: string) => {
        set({ isLoading: true });
        try {
          const { user } = await AuthService.authenticateByEmail(email);
          set({
            user,
            isAuthenticated: true,
            activeRole: user.role,
            isLoading: false,
          });
          // Persist the full profile to Supabase (fire-and-forget so login isn't blocked)
          ProfileService.upsertProfile(user).catch((e) =>
            console.warn('Profile sync failed:', e?.message)
          );
          return user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginAsDemoStudent: () => {
        const student = INITIAL_STUDENT_USER;
        set({
          user: student,
          isAuthenticated: true,
          activeRole: 'student',
          pendingEmail: student.email,
        });
      },

      loginAsDemoGuard: () => {
        const guard = INITIAL_GUARD_USER;
        set({
          user: guard,
          isAuthenticated: true,
          activeRole: 'guard',
          pendingEmail: guard.email,
        });
      },

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          activeRole: user?.role || null,
        });
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (_) {}
        set({
          user: null,
          isAuthenticated: false,
          activeRole: null,
          pendingEmail: '',
        });
      },

      updateUserProfile: async (updates) => {
        const current = get().user;
        if (!current) return;

        const updatedUser: User = {
          ...current,
          ...updates,
        };

        // Update local state immediately for a snappy UI
        set({ user: updatedUser });

        // Persist the FULL profile to Supabase
        try {
          const saved = await ProfileService.upsertProfile(updatedUser);
          set({ user: saved });
        } catch (error) {
          // Roll back local state if the Supabase write fails
          set({ user: current });
          throw error;
        }
      },
    }),
    {
      name: 'sportsforall-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { APP_CONFIG } from '../constants/config';
import { darkColors, lightColors, ThemeColors } from '../constants/theme';

interface ThemeState {
  isDarkMode: boolean;
  guardName: string;
  colors: ThemeColors;
  toggleTheme: () => void;
  setGuardName: (name: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      guardName: APP_CONFIG.DEFAULT_GUARD.name,
      colors: lightColors,

      toggleTheme: () => {
        const nextMode = !get().isDarkMode;
        set({
          isDarkMode: nextMode,
          colors: nextMode ? darkColors : lightColors,
        });
      },

      setGuardName: (name: string) => {
        set({ guardName: name });
      },
    }),
    {
      name: 'poornima_guard_theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        guardName: state.guardName,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.colors = state.isDarkMode ? darkColors : lightColors;
        }
      },
    }
  )
);

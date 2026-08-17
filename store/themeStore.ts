import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AppColors, darkColors, lightColors } from '../constants/colors';

interface ThemeState {
  isDarkMode: boolean;
  colors: AppColors;
  toggleTheme: () => void;
  setDarkMode: (enabled: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      colors: lightColors,
      toggleTheme: () => {
        const next = !get().isDarkMode;
        set({
          isDarkMode: next,
          colors: next ? darkColors : lightColors,
        });
      },
      setDarkMode: (enabled: boolean) => {
        set({
          isDarkMode: enabled,
          colors: enabled ? darkColors : lightColors,
        });
      },
    }),
    {
      name: 'sportsforall-theme',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.colors = state.isDarkMode ? darkColors : lightColors;
        }
      },
    }
  )
);

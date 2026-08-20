import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { APP_CONFIG } from '../constants/config';
import { useThemeStore } from '../store/themeStore';

interface HeaderProps {
  currentRoute?: 'scanner' | 'monthly';
}

export const Header: React.FC<HeaderProps> = ({ currentRoute }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, isDarkMode, toggleTheme } = useThemeStore();

  const isMonthlyRoute = currentRoute === 'monthly' || pathname.includes('monthly');

  const handleNavToggle = () => {
    if (isMonthlyRoute) {
      router.replace('/scanner');
    } else {
      router.push('/monthly');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Brand & Logo */}
      <View style={styles.brandGroup}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/pu_logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <View style={styles.titles}>
          <Text style={[styles.title, { color: colors.primary }]}>
            Sports Pass Verification
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {APP_CONFIG.UNIVERSITY_NAME}
          </Text>
        </View>
      </View>

      {/* Header Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.navBtn,
            {
              backgroundColor: colors.backgroundSubtle,
              borderColor: colors.border,
            },
          ]}
          onPress={handleNavToggle}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isMonthlyRoute ? 'qr-code-outline' : 'calendar-outline'}
            size={14}
            color={colors.text}
          />
          <Text style={[styles.navBtnText, { color: colors.text }]}>
            {isMonthlyRoute ? 'Scanner' : 'Records'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeBtn,
            {
              backgroundColor: colors.backgroundSubtle,
              borderColor: colors.border,
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
            size={18}
            color={isDarkMode ? '#FBBF24' : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  titles: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  themeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

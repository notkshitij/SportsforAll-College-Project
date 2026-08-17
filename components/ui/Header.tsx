import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { APP_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showThemeToggle?: boolean;
  showRoleBadge?: boolean;
  showLogo?: boolean;
  rightAction?: React.ReactNode;
  onBackPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  showThemeToggle = true,
  showRoleBadge = false,
  showLogo = true,
  rightAction,
  onBackPress,
}) => {
  const router = useRouter();
  const { colors, isDarkMode, toggleTheme } = useThemeStore();
  const { activeRole } = useAuthStore();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? colors.surfaceCard : '#FFFFFF',
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.backButton, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : showLogo ? (
            <View style={styles.logoBadge}>
              <Image
                source={require('../../assets/pu_logo.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>
          ) : null}

          <View style={styles.titleWrapper}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {title}
              </Text>
              {showRoleBadge && activeRole && (
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor:
                        activeRole === 'guard'
                          ? isDarkMode
                            ? '#78350F'
                            : '#FEF3C7'
                          : isDarkMode
                          ? '#1E3A8A'
                          : '#DBEAFE',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleText,
                      {
                        color:
                          activeRole === 'guard'
                            ? isDarkMode
                              ? '#FDE68A'
                              : '#92400E'
                            : isDarkMode
                            ? '#93C5FD'
                            : '#1E40AF',
                      },
                    ]}
                  >
                    {activeRole === 'guard' ? '🛡️ GUARD' : '🎓 STUDENT'}
                  </Text>
                </View>
              )}
            </View>

            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : (
              <Text style={[styles.univTag, { color: colors.textMuted }]}>
                {APP_CONFIG.UNIVERSITY_NAME}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.rightSection}>
          {showThemeToggle && (
            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.iconButton,
                { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isDarkMode ? 'sunny' : 'moon'}
                size={18}
                color={isDarkMode ? '#FBBF24' : '#64748B'}
              />
            </TouchableOpacity>
          )}

          {rightAction}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  titleWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  roleBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  univTag: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

interface BadgeProps {
  label: string;
  variant?: 'valid' | 'expired' | 'invalid' | 'warning' | 'info' | 'primary';
  size?: 'sm' | 'md';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'valid',
  size = 'md',
  icon,
  style,
}) => {
  const { colors, isDarkMode } = useThemeStore();

  const getColors = () => {
    switch (variant) {
      case 'valid':
        return {
          bg: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : colors.successLight,
          border: colors.success,
          text: colors.success,
          defaultIcon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
        };
      case 'expired':
        return {
          bg: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : colors.dangerLight,
          border: colors.danger,
          text: colors.danger,
          defaultIcon: 'close-circle' as keyof typeof Ionicons.glyphMap,
        };
      case 'invalid':
        return {
          bg: isDarkMode ? 'rgba(239, 68, 68, 0.25)' : colors.dangerLight,
          border: colors.danger,
          text: colors.dangerDark,
          defaultIcon: 'alert-circle' as keyof typeof Ionicons.glyphMap,
        };
      case 'warning':
        return {
          bg: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : colors.warningLight,
          border: colors.warning,
          text: colors.warning,
          defaultIcon: 'time' as keyof typeof Ionicons.glyphMap,
        };
      case 'info':
        return {
          bg: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : colors.infoLight,
          border: colors.info,
          text: colors.info,
          defaultIcon: 'information-circle' as keyof typeof Ionicons.glyphMap,
        };
      case 'primary':
      default:
        return {
          bg: isDarkMode ? 'rgba(37, 99, 235, 0.25)' : colors.primaryLight,
          border: colors.primary,
          text: colors.primary,
          defaultIcon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
        };
    }
  };

  const scheme = getColors();
  const iconName = icon || scheme.defaultIcon;
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: scheme.bg,
          borderColor: scheme.border,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 10,
        },
        style,
      ]}
    >
      <Ionicons
        name={iconName}
        size={isSmall ? 12 : 14}
        color={scheme.text}
        style={styles.icon}
      />
      <Text
        style={[
          styles.text,
          {
            color: scheme.text,
            fontSize: isSmall ? 11 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});

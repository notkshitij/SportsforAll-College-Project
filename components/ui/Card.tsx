import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'elevated',
  style,
  ...props
}) => {
  const { colors, isDarkMode } = useThemeStore();

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: isDarkMode ? colors.surfaceCard : colors.surface,
      borderRadius: 16,
      padding: 18,
      borderWidth: variant === 'outlined' ? 1 : isDarkMode ? 1 : 0,
      borderColor: variant === 'outlined' ? colors.border : isDarkMode ? colors.border : 'transparent',
    };

    if (variant === 'elevated') {
      return {
        ...baseStyle,
        shadowColor: isDarkMode ? '#000000' : colors.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDarkMode ? 0.35 : 0.08,
        shadowRadius: 12,
        elevation: 3,
      };
    }

    return baseStyle;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        style={[getContainerStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getContainerStyle(), style]} {...props}>
      {children}
    </View>
  );
};

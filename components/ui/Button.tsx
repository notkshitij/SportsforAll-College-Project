import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = true,
}) => {
  const { colors } = useThemeStore();

  const getContainerStyle = (): ViewStyle => {
    let bg = colors.primary;
    let borderColor = 'transparent';
    let borderWidth = 0;

    switch (variant) {
      case 'primary':
        bg = colors.primary;
        break;
      case 'secondary':
        bg = colors.secondary;
        break;
      case 'outline':
        bg = 'transparent';
        borderColor = colors.primary;
        borderWidth = 1.5;
        break;
      case 'danger':
        bg = colors.danger;
        break;
      case 'success':
        bg = colors.success;
        break;
      case 'ghost':
        bg = 'transparent';
        break;
    }

    let paddingVertical = 14;
    let paddingHorizontal = 20;
    let borderRadius = 12;

    if (size === 'sm') {
      paddingVertical = 8;
      paddingHorizontal = 14;
      borderRadius = 8;
    } else if (size === 'lg') {
      paddingVertical = 16;
      paddingHorizontal = 24;
      borderRadius = 14;
    }

    return {
      backgroundColor: disabled ? (variant === 'outline' || variant === 'ghost' ? 'transparent' : colors.border) : bg,
      borderColor: disabled ? (variant === 'outline' ? colors.border : 'transparent') : borderColor,
      borderWidth,
      paddingVertical,
      paddingHorizontal,
      borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: disabled && !loading ? 0.6 : 1,
      width: fullWidth ? '100%' : 'auto',
      shadowColor: variant === 'primary' && !disabled ? colors.primary : 'transparent',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: variant === 'primary' && !disabled ? 0.25 : 0,
      shadowRadius: 8,
      elevation: variant === 'primary' && !disabled ? 3 : 0,
    };
  };

  const getTextColor = (): string => {
    if (disabled && (variant === 'outline' || variant === 'ghost')) {
      return colors.textMuted;
    }
    switch (variant) {
      case 'outline':
      case 'ghost':
        return colors.primary;
      case 'primary':
      case 'secondary':
      case 'danger':
      case 'success':
      default:
        return '#FFFFFF';
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return 13;
      case 'lg':
        return 17;
      case 'md':
      default:
        return 15;
    }
  };

  const textColor = getTextColor();
  const fontSize = getFontSize();
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={textColor} style={styles.iconLeft} />
          )}
          <Text
            style={[
              styles.text,
              {
                color: textColor,
                fontSize,
                fontWeight: '700',
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={textColor} style={styles.iconRight} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

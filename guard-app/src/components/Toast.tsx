import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  const insets = useSafeAreaInsets();

  if (!toasts || toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 10 }]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </View>
  );
};

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: () => void;
}> = ({ toast, onDismiss }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getVariantStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: '#ECFDF5',
          border: '#10B981',
          text: '#065F46',
          icon: 'checkmark-circle' as const,
          iconColor: '#10B981',
        };
      case 'error':
        return {
          bg: '#FEF2F2',
          border: '#EF4444',
          text: '#991B1B',
          icon: 'alert-circle' as const,
          iconColor: '#EF4444',
        };
      case 'warning':
        return {
          bg: '#FFFBEB',
          border: '#F59E0B',
          text: '#92400E',
          icon: 'warning' as const,
          iconColor: '#F59E0B',
        };
      default:
        return {
          bg: '#EFF6FF',
          border: '#3B82F6',
          text: '#1E40AF',
          icon: 'information-circle' as const,
          iconColor: '#3B82F6',
        };
    }
  };

  const variant = getVariantStyles();

  return (
    <Animated.View
      style={[
        styles.toastCard,
        {
          backgroundColor: variant.bg,
          borderColor: variant.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Ionicons name={variant.icon} size={20} color={variant.iconColor} />
      <Text style={[styles.toastText, { color: variant.text }]}>{toast.message}</Text>
      <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} activeOpacity={0.7}>
        <Ionicons name="close" size={16} color={variant.text} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
    gap: 8,
  },
  toastCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_CONFIG } from '../constants/config';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function RootUnmatchedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDarkMode } = useThemeStore();
  const { isAuthenticated } = useAuthStore();

  const handleReturnHome = () => {
    if (isAuthenticated) {
      router.replace('/(student)');
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
          <Ionicons name="compass-outline" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Screen Not Found</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          The requested page could not be located in {APP_CONFIG.APP_NAME}. Return to your portal to continue.
        </Text>

        <TouchableOpacity
          style={[styles.returnBtn, { backgroundColor: colors.primary }]}
          onPress={handleReturnHome}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          <Text style={styles.returnBtnText}>
            {isAuthenticated ? 'Return to Dashboard' : 'Return to Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  iconBox: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  desc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'center',
  },
  returnBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

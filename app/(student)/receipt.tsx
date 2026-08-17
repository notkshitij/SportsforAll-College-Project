import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ReceiptCard } from '../../components/ReceiptCard';
import { Header } from '../../components/ui/Header';
import { APP_CONFIG } from '../../constants/config';
import { INITIAL_EXTENSIONS } from '../../services/mockDb';
import { useAuthStore } from '../../store/authStore';
import { useStayExtensionStore } from '../../store/stayExtensionStore';
import { useThemeStore } from '../../store/themeStore';

export default function ReceiptScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const { lastCreatedPass, activePass, getActivePassForStudent } = useStayExtensionStore();

  const studentUser = user || APP_CONFIG.DEMO_STUDENT;
  const currentPass =
    lastCreatedPass ||
    activePass ||
    getActivePassForStudent(studentUser.id || 'stu_001') ||
    INITIAL_EXTENSIONS[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Official Receipt"
        subtitle="Sports Stay Payment Voucher"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ReceiptCard
          extension={currentPass}
          onViewQr={() => router.push('/(student)/qr-display')}
          onHomePress={() => router.replace('/(student)')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
    alignItems: 'center',
  },
});

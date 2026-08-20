import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { QRDisplay } from '../../components/QRDisplay';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { APP_CONFIG } from '../../constants/config';
import { INITIAL_EXTENSIONS } from '../../services/mockDb';
import { useAuthStore } from '../../store/authStore';
import { useStayExtensionStore } from '../../store/stayExtensionStore';
import { useThemeStore } from '../../store/themeStore';

export default function QRDisplayScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const { lastCreatedPass, activePass, getActivePassForStudent } = useStayExtensionStore();

  const studentUser = user || APP_CONFIG.DEMO_STUDENT;
  const candidatePass =
    lastCreatedPass ||
    activePass ||
    getActivePassForStudent(studentUser.id || 'stu_001');

  // Strict check: only render QR if the pass object actually has a valid non-empty id
  const currentPass =
    candidatePass && typeof candidatePass.id === 'string' && candidatePass.id.trim().length > 0
      ? candidatePass
      : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Digital QR Pass"
        subtitle="Poornima University Sports Pass"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentPass ? (
          <QRDisplay
            extension={currentPass}
            /* onViewReceipt={() => router.push('/(student)/receipt')} */
          />
        ) : (
          <Card variant="elevated" style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Active Pass Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Please purchase a sports stay pass from the dashboard.
            </Text>
          </Card>
        )}
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
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});

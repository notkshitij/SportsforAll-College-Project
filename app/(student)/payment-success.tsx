import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { useStayExtensionStore } from '../../store/stayExtensionStore';
import { useThemeStore } from '../../store/themeStore';
import { formatDateTimeNice } from '../../utils/dateUtils';
import { formatCurrencyINR } from '../../utils/formatUtils';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ transactionId?: string; amount?: string; paidAt?: string }>();
  const { colors, isDarkMode } = useThemeStore();
  const { lastCreatedPass } = useStayExtensionStore();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const txnId = params.transactionId || lastCreatedPass?.transactionId || 'TXN12345678';
  const amountVal = params.amount ? parseInt(params.amount) : 100;
  const paidAtTime = params.paidAt || lastCreatedPass?.createdAt || new Date().toISOString();

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Payment Status"
        subtitle="UPI Transaction Completed"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={styles.card}>
          {/* Animated Success Badge */}
          <Animated.View
            style={[
              styles.successCircle,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </Animated.View>

          <Text style={[styles.successTitle, { color: colors.text }]}>
            PAYMENT SUCCESSFUL!
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            Your sports stay pass has been issued and approved by Poornima University.
          </Text>

          {/* Transaction Info Box */}
          <Animated.View
            style={[
              styles.infoBox,
              {
                opacity: fadeAnim,
                backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Amount Paid
              </Text>
              <Text style={[styles.infoAmount, { color: colors.success }]}>
                {formatCurrencyINR(amountVal)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Transaction ID
              </Text>
              <Text style={[styles.infoValue, { color: colors.primary, fontWeight: '800' }]}>
                {txnId}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Payment Date & Time
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDateTimeNice(paidAtTime)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Status
              </Text>
              <Text style={[styles.infoValue, { color: colors.success }]}>
                ✅ Confirmed & Issued
              </Text>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              title="VIEW QR CODE PASS"
              variant="primary"
              size="lg"
              icon="qr-code"
              onPress={() => router.push('/(student)/qr-display')}
              style={styles.actionBtn}
            />

            <Button
              title="DOWNLOAD RECEIPT"
              variant="outline"
              size="md"
              icon="download-outline"
              onPress={() => router.push('/(student)/receipt')}
              style={styles.actionBtn}
            />

            <Button
              title="BACK TO DASHBOARD"
              variant="ghost"
              size="sm"
              icon="home-outline"
              onPress={() => router.replace('/(student)')}
              style={styles.actionBtn}
            />
          </View>
        </Card>
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
  card: {
    width: '100%',
    maxWidth: 440,
    padding: 24,
    alignItems: 'center',
  },
  successCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  infoBox: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  actionBtn: {
    width: '100%',
  },
});

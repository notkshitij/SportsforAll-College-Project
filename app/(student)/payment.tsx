import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PaymentButton } from '../../components/PaymentButton';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { APP_CONFIG } from '../../constants/config';
import { PassHistoryService } from '../../services/passHistoryService';
import { PaymentService } from '../../services/paymentService';
import { useAuthStore } from '../../store/authStore';
import { useStayExtensionStore } from '../../store/stayExtensionStore';
import { useThemeStore } from '../../store/themeStore';
import { formatTime12h, getTodayStayWindow } from '../../utils/dateUtils';
import { formatCurrencyINR } from '../../utils/formatUtils';

export default function PaymentScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { addExtension, setLastCreatedPass } = useStayExtensionStore();

  const studentUser = user as NonNullable<typeof user>;

  const [loading, setLoading] = useState(false);

  const { validFrom, validUntil } = getTodayStayWindow();

  const handleProcessPayment = async (selectedUpiApp: string) => {
    setLoading(true);
    try {
      const { paymentResult, extension } = await PaymentService.processUpiPayment({
        student: studentUser,
        upiApp: selectedUpiApp,
      });

      // Save into store
      addExtension(extension);
      try {
        await PassHistoryService.upsertPass(extension);
      } catch (e: any) {
        console.warn('Immediate pass sync notice:', e?.message);
      }
      setLastCreatedPass(extension);

      // Route to success screen
      router.replace({
        pathname: '/(student)/payment-success',
        params: {
          transactionId: paymentResult.transactionId,
          amount: paymentResult.amount.toString(),
          paidAt: paymentResult.paidAt,
        },
      });
    } catch (err) {
      console.warn('Payment failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Confirm & Pay"
        subtitle="UPI Gateway Simulation"
        showBack
        showThemeToggle={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Details Card */}
        <Card variant="elevated" style={styles.card}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.puLogoBadge,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <Image
                source={require('../../assets/pu_logo.png')}
                style={styles.puLogo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Order Summary
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                Poornima Sports Stay Pass
              </Text>
            </View>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                Student Name
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {studentUser.name}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                Registration No.
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {studentUser.enrollment}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                Stay Window
              </Text>
              <Text style={[styles.detailValue, { color: colors.success, fontWeight: '800' }]}>
                Today, {formatTime12h(validFrom)} - {formatTime12h(validUntil)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                Payment Mode
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                UPI (Unified Payments Interface)
              </Text>
            </View>
          </View>

          {/* Amount Breakdown */}
          <View
            style={[
              styles.amountContainer,
              {
                backgroundColor: isDarkMode ? '#172554' : '#EFF6FF',
                borderColor: isDarkMode ? '#1E3A8A' : '#BFDBFE',
              },
            ]}
          >
            <View style={styles.amountRow}>
              <Text style={[styles.amountLabel, { color: colors.primary }]}>
                Total Payable Amount
              </Text>
              <Text style={[styles.amountValue, { color: colors.primaryDark }]}>
                {formatCurrencyINR(APP_CONFIG.EXTENSION_PRICE_INR)}
              </Text>
            </View>
            <Text style={[styles.mockNotice, { color: colors.textMuted }]}>
              (Mock Payment: Auto-success approval after 2s)
            </Text>
          </View>
        </Card>

        {/* UPI Payment Selector & Trigger */}
        <View style={styles.paymentSection}>
          <PaymentButton
            amount={APP_CONFIG.EXTENSION_PRICE_INR}
            onPayPress={handleProcessPayment}
            loading={loading}
          />
        </View>

        {/* Trust Badges */}
        <View style={styles.trustBadges}>
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed" size={16} color={colors.success} />
            <Text style={[styles.trustText, { color: colors.textMuted }]}>
              100% Secure UPI Payment
            </Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="flash" size={16} color={colors.primary} />
            <Text style={[styles.trustText, { color: colors.textMuted }]}>
              Instant QR Pass Generation
            </Text>
          </View>
        </View>
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
    gap: 16,
  },
  card: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  puLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    borderWidth: 1.5,
  },
  puLogo: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  detailsList: {
    gap: 10,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  amountContainer: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  mockNotice: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  paymentSection: {
    marginTop: 4,
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

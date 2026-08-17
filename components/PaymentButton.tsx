import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal as RNModal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { APP_CONFIG } from '../constants/config';
import { useThemeStore } from '../store/themeStore';
import { formatCurrencyINR } from '../utils/formatUtils';
import { Button } from './ui/Button';

interface PaymentButtonProps {
  amount: number;
  onPayPress: (selectedApp: string) => Promise<void>;
  loading?: boolean;
}

const UPI_APPS = [
  { id: 'Google Pay', name: 'Google Pay', icon: 'logo-google', color: '#4285F4', tag: 'Fast UPI' },
  { id: 'PhonePe', name: 'PhonePe', icon: 'flash', color: '#5F259F', tag: 'Recommended' },
  { id: 'Paytm', name: 'Paytm UPI', icon: 'wallet', color: '#00BAF2', tag: 'Instant' },
  { id: 'BHIM UPI', name: 'BHIM Government UPI', icon: 'shield-checkmark', color: '#008479', tag: 'Govt NPCI' },
];

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  onPayPress,
  loading = false,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState(UPI_APPS[0].id);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      await onPayPress(selectedApp);
      setModalVisible(false);
    } catch (e) {
      console.warn('Payment error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={`Pay ${formatCurrencyINR(amount)} with UPI`}
        variant="primary"
        size="lg"
        icon="card"
        onPress={handleOpenModal}
        loading={loading}
      />

      {/* Razorpay UPI Simulator Modal */}
      <RNModal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !isProcessing && setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDarkMode ? colors.surfaceCard : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={[styles.rzpIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="flash" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.rzpTitle, { color: colors.text }]}>
                    Razorpay UPI Gateway
                  </Text>
                  <Text style={[styles.rzpSubtitle, { color: colors.textMuted }]}>
                    Secured by 256-Bit NPCI Encryption
                  </Text>
                </View>
              </View>

              {!isProcessing && (
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
                >
                  <Ionicons name="close" size={18} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>

            {/* Bill Summary */}
            <View
              style={[
                styles.summaryBox,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Purpose:
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  Today's Sports Complex Stay (4 PM - 8 PM)
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Payee:
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {APP_CONFIG.UNIVERSITY_NAME}
                </Text>
              </View>
              <View style={[styles.summaryRow, { marginTop: 4 }]}>
                <Text style={[styles.amountLabel, { color: colors.text }]}>Amount to Pay:</Text>
                <Text style={[styles.amountValue, { color: colors.primary }]}>
                  {formatCurrencyINR(amount)}
                </Text>
              </View>
            </View>

            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.processingTitle, { color: colors.text }]}>
                  Processing UPI Payment...
                </Text>
                <Text style={[styles.processingSubtitle, { color: colors.textMuted }]}>
                  Authenticating with {selectedApp}. Do not press back or close this window.
                </Text>
                <View style={styles.secBadge}>
                  <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                  <Text style={[styles.secText, { color: colors.success }]}>
                    Mock Auto-Approval in 2s
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  SELECT UPI APP:
                </Text>

                <View style={styles.appList}>
                  {UPI_APPS.map((app) => {
                    const isSelected = selectedApp === app.id;
                    return (
                      <TouchableOpacity
                        key={app.id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedApp(app.id)}
                        style={[
                          styles.appItem,
                          {
                            backgroundColor: isSelected
                              ? isDarkMode
                                ? '#1E3A8A'
                                : '#EFF6FF'
                              : isDarkMode
                              ? '#1E293B'
                              : '#FFFFFF',
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <View style={styles.appLeft}>
                          <View style={[styles.appIconWrapper, { backgroundColor: app.color }]}>
                            <Ionicons name={app.icon as any} size={18} color="#FFFFFF" />
                          </View>
                          <View>
                            <Text style={[styles.appName, { color: colors.text }]}>
                              {app.name}
                            </Text>
                            <Text style={[styles.appTag, { color: colors.textMuted }]}>
                              {app.tag}
                            </Text>
                          </View>
                        </View>

                        <Ionicons
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={isSelected ? colors.primary : colors.textMuted}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Button
                  title={`Approve & Pay ${formatCurrencyINR(amount)}`}
                  variant="success"
                  size="lg"
                  icon="checkmark-done"
                  onPress={handleConfirmPayment}
                  style={styles.confirmBtn}
                />
              </>
            )}
          </View>
        </View>
      </RNModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rzpIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rzpTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  rzpSubtitle: {
    fontSize: 11,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  amountLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  appList: {
    gap: 8,
    marginBottom: 20,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  appLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
  },
  appTag: {
    fontSize: 11,
  },
  confirmBtn: {
    marginTop: 4,
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 12,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  processingSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  secBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  secText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

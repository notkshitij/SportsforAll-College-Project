import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useStayExtensionStore } from '../store/stayExtensionStore';
import { useThemeStore } from '../store/themeStore';
import { StayExtension } from '../types';
import { formatDateTimeNice, formatTime12h, getRemainingTime } from '../utils/dateUtils';
import { encodeSecureQRPayload } from '../utils/qrUtils';
import { QRGenerator } from './QRGenerator';
import { Badge } from './ui/Badge';

interface QRDisplayProps {
  extension: StayExtension;
  onViewReceipt?: () => void;
}

export const QRDisplay: React.FC<QRDisplayProps> = ({
  extension,
  onViewReceipt,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const [currentPass, setCurrentPass] = useState<StayExtension>(extension);
  const [timeRemaining, setTimeRemaining] = useState(getRemainingTime(extension.validUntil));
  const [entryPayload, setEntryPayload] = useState('');
  const [exitPayload, setExitPayload] = useState('');
  const [secondsToRefresh, setSecondsToRefresh] = useState(30);

  // Real-time listener & polling to detect when the guard approves Entry / Exit in Supabase
  useEffect(() => {
    let isMounted = true;

    async function fetchLatestPassStatus() {
      try {
        const { data, error } = await supabase
          .from('pass_history')
          .select('*')
          .eq('id', extension.id)
          .single();

        if (!error && data && isMounted) {
          setCurrentPass((prev) => ({
            ...prev,
            status: data.status,
            verifiedBy: data.verified_by || prev.verifiedBy,
            verifiedAt: data.verified_at || prev.verifiedAt,
          }));
        }
      } catch (err) {
        // Fallback quiet
      }
    }

    fetchLatestPassStatus();

    // Poll every 2 seconds for instant reactive UI updates upon guard scan
    const pollInterval = setInterval(fetchLatestPassStatus, 2000);

    // Postgres change listener
    const channel = supabase
      .channel(`pass_status_${extension.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pass_history',
          filter: `id=eq.${extension.id}`,
        },
        (payload: any) => {
          if (payload?.new && isMounted) {
            setCurrentPass((prev) => ({
              ...prev,
              status: payload.new.status,
              verifiedBy: payload.new.verified_by || prev.verifiedBy,
              verifiedAt: payload.new.verified_at || prev.verifiedAt,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [extension.id]);

  // Real-time ticking timer for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getRemainingTime(currentPass.validUntil));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPass.validUntil]);

  // Secure Dynamic QR Codes refresh loop (refreshes both codes every 30 seconds)
  useEffect(() => {
    const updatePayloads = () => {
      const entry = encodeSecureQRPayload(currentPass.id, 'entry');
      const exit = encodeSecureQRPayload(currentPass.id, 'exit');
      setEntryPayload(entry);
      setExitPayload(exit);
      setSecondsToRefresh(30);
    };

    updatePayloads();

    const refreshInterval = setInterval(() => {
      setSecondsToRefresh((prev) => {
        if (prev <= 1) {
          updatePayloads();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(refreshInterval);
  }, [currentPass.id]);

  const isExpired = timeRemaining.isExpired;
  const isEntryApproved = currentPass.status === 'CheckedIn' || currentPass.status === 'CheckedOut';
  const isExitApproved = currentPass.status === 'CheckedOut';

  return (
    <View style={styles.wrapper}>
      {/* Digital Pass Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? colors.surfaceCard : '#FFFFFF',
            borderColor: isExpired
              ? colors.danger
              : isExitApproved
              ? '#64748B'
              : isEntryApproved
              ? '#10B981'
              : colors.primary,
            shadowColor: isExpired ? colors.danger : colors.primary,
          },
        ]}
      >
        {/* Pass Top Ribbon */}
        <View
          style={[
            styles.ribbon,
            {
              backgroundColor: isExpired
                ? isDarkMode
                  ? '#7F1D1D'
                  : '#FEE2E2'
                : isExitApproved
                ? isDarkMode
                  ? '#334155'
                  : '#F1F5F9'
                : isEntryApproved
                ? isDarkMode
                  ? '#064E3B'
                  : '#D1FAE5'
                : isDarkMode
                ? '#1E3A8A'
                : '#DBEAFE',
            },
          ]}
        >
          <View style={styles.ribbonLeft}>
            <Ionicons
              name={
                isExpired
                  ? 'alert-circle'
                  : isExitApproved
                  ? 'checkmark-done-circle'
                  : isEntryApproved
                  ? 'shield-checkmark'
                  : 'shield-checkmark'
              }
              size={18}
              color={
                isExpired
                  ? colors.danger
                  : isExitApproved
                  ? '#64748B'
                  : isEntryApproved
                  ? '#10B981'
                  : colors.primary
              }
            />
            <Text
              style={[
                styles.ribbonTitle,
                {
                  color: isExpired
                    ? colors.danger
                    : isExitApproved
                    ? '#475569'
                    : isEntryApproved
                    ? '#047857'
                    : colors.primaryDark,
                },
              ]}
            >
              {isExpired
                ? 'EXPIRED STAY PASS'
                : isExitApproved
                ? 'COMPLETED STAY PASS'
                : isEntryApproved
                ? 'ACTIVE STAY PASS • INSIDE'
                : 'OFFICIAL STAY PASS'}
            </Text>
          </View>
          <Badge
            label={
              isExpired
                ? 'EXPIRED'
                : isExitApproved
                ? 'COMPLETED'
                : isEntryApproved
                ? 'INSIDE CAMPUS'
                : 'AWAITING ENTRY'
            }
            variant={
              isExpired
                ? 'expired'
                : isExitApproved
                ? 'primary'
                : isEntryApproved
                ? 'valid'
                : 'info'
            }
            size="sm"
          />
        </View>

        {/* Student Info Header */}
        <View style={styles.studentInfoSection}>
          <Text style={[styles.studentName, { color: colors.text }]}>
            {currentPass.studentName}
          </Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
              Registration No.:
            </Text>
            <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
              {currentPass.studentEnrollment}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
              Stay Window:
            </Text>
            <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
              {formatTime12h(currentPass.validFrom || currentPass.createdAt)} -{' '}
              {formatTime12h(currentPass.validUntil)}
            </Text>
          </View>
        </View>

        {/* Dashed Separator */}
        <View style={styles.dashedSeparator} />

        {/* Smart Dynamic QR Section */}
        <View style={styles.dualQrContainer}>
          {/* 1. ENTRY PASS SECTION */}
          {!isEntryApproved ? (
            /* Entry QR is Active (Show QR to guard) */
            <View
              style={[
                styles.singleQrBlock,
                {
                  borderColor: colors.primary,
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                },
              ]}
            >
              <View
                style={[
                  styles.qrHeader,
                  {
                    backgroundColor: isDarkMode ? '#0F172A' : '#EFF6FF',
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="log-in-outline" size={18} color={colors.primary} />
                <Text style={[styles.qrHeaderText, { color: colors.primary }]}>
                  1. ENTRY CHECK-IN PASS
                </Text>
                <Badge label="SCAN AT GATE" variant="info" size="sm" style={styles.usedBadgeInline} />
              </View>

              <View style={styles.qrCodeWrapper}>
                <QRGenerator
                  value={entryPayload}
                  size={220}
                  backgroundColor="#FFFFFF"
                  color={isExpired ? '#94A3B8' : '#0F172A'}
                />
                {isExpired && (
                  <View style={styles.expiredOverlay}>
                    <Text style={styles.overlayText}>EXPIRED</Text>
                  </View>
                )}
              </View>

              <View style={styles.qrInstructionBox}>
                <Text style={[styles.qrInstructionText, { color: colors.textSecondary }]}>
                  Show this QR code to the gate guard to verify and open the gate.
                </Text>
              </View>
            </View>
          ) : (
            /* Entry QR has been Scanned & Approved by Guard (QR REMOVED) */
            <View
              style={[
                styles.approvedStatusCard,
                {
                  backgroundColor: isDarkMode ? '#064E3B20' : '#ECFDF5',
                  borderColor: '#10B981',
                },
              ]}
            >
              <View style={styles.approvedIconCircle}>
                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
              </View>
              <View style={styles.approvedTextGroup}>
                <Text style={styles.approvedTitle}>ENTRY APPROVED & SCANNED</Text>
                <Text style={[styles.approvedSub, { color: colors.textSecondary }]}>
                  Gate check-in verified by Gate Guard. You are authorized inside the complex.
                </Text>
              </View>
            </View>
          )}

          {/* 2. EXIT PASS SECTION */}
          {!isEntryApproved ? (
            /* Exit QR is LOCKED until Guard Approves Entry */
            <View
              style={[
                styles.lockedExitBox,
                {
                  borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                  backgroundColor: isDarkMode ? '#0F172A80' : '#F8FAFC',
                },
              ]}
            >
              <View style={styles.lockIconWrap}>
                <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
              </View>
              <Text style={[styles.lockedTitle, { color: colors.text }]}>
                Exit QR Pass Locked
              </Text>
              <Text style={[styles.lockedSub, { color: colors.textMuted }]}>
                The Exit QR will unlock automatically as soon as the guard scans and approves your Entry QR.
              </Text>
            </View>
          ) : !isExitApproved ? (
            /* Exit QR is UNLOCKED & ACTIVE */
            <View
              style={[
                styles.singleQrBlock,
                {
                  borderColor: '#3B82F6',
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                },
              ]}
            >
              <View
                style={[
                  styles.qrHeader,
                  {
                    backgroundColor: isDarkMode ? '#0F172A' : '#EFF6FF',
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="log-out-outline" size={18} color="#3B82F6" />
                <Text style={[styles.qrHeaderText, { color: '#3B82F6' }]}>
                  2. EXIT CHECK-OUT PASS
                </Text>
                <Badge label="READY TO EXIT" variant="primary" size="sm" style={styles.usedBadgeInline} />
              </View>

              <View style={styles.qrCodeWrapper}>
                <QRGenerator
                  value={exitPayload}
                  size={220}
                  backgroundColor="#FFFFFF"
                  color={isExpired ? '#94A3B8' : '#0F172A'}
                />
                {isExpired && (
                  <View style={styles.expiredOverlay}>
                    <Text style={styles.overlayText}>EXPIRED</Text>
                  </View>
                )}
              </View>

              <View style={styles.qrInstructionBox}>
                <Text style={[styles.qrInstructionText, { color: colors.textSecondary }]}>
                  Show this Exit QR to the security guard when checking out to leave the premises.
                </Text>
              </View>
            </View>
          ) : (
            /* Exit QR has been Scanned & Approved (Completed) */
            <View
              style={[
                styles.approvedStatusCard,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                  borderColor: '#94A3B8',
                },
              ]}
            >
              <View style={[styles.approvedIconCircle, { backgroundColor: '#E2E8F0' }]}>
                <Ionicons name="checkmark-done-circle" size={32} color="#64748B" />
              </View>
              <View style={styles.approvedTextGroup}>
                <Text style={[styles.approvedTitle, { color: '#475569' }]}>
                  EXIT APPROVED • COMPLETED
                </Text>
                <Text style={[styles.approvedSub, { color: colors.textMuted }]}>
                  You have successfully checked out of the sports complex.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Secure Dynamic Indicator (Shown when at least one QR is active) */}
        {!isExpired && !isExitApproved && (
          <View style={styles.refreshIndicator}>
            <Ionicons name="shield-checkmark" size={14} color={colors.success} />
            <Text style={[styles.refreshText, { color: colors.textSecondary }]}>
              Secure dynamic QR refreshes in{' '}
              <Text style={{ color: colors.success, fontWeight: '700' }}>
                {secondsToRefresh}s
              </Text>
            </Text>
          </View>
        )}

        {/* Live Timer Countdown Box */}
        <View
          style={[
            styles.timerBox,
            {
              backgroundColor: isExpired
                ? isDarkMode
                  ? '#3F1A1A'
                  : '#FEF2F2'
                : isDarkMode
                ? '#172554'
                : '#EFF6FF',
              borderColor: isExpired ? colors.danger : colors.primaryLight,
            },
          ]}
        >
          <Ionicons
            name={isExpired ? 'time-outline' : 'stopwatch'}
            size={20}
            color={isExpired ? colors.danger : colors.primary}
          />
          <View style={styles.timerContent}>
            <Text
              style={[
                styles.timerLabel,
                { color: isExpired ? colors.danger : colors.primary },
              ]}
            >
              {isExpired ? 'PASS STATUS' : 'LIVE STAY TIME REMAINING'}
            </Text>
            <Text
              style={[
                styles.timerCountdown,
                { color: isExpired ? colors.danger : colors.text },
              ]}
            >
              {timeRemaining.formatted}
            </Text>
          </View>
        </View>

        {/* Pass Metadata Footer */}
        <View style={styles.passFooter}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            TXN: {currentPass.transactionId} • {formatDateTimeNice(currentPass.createdAt)}
          </Text>
          <Text style={[styles.securityNotice, { color: colors.textMuted }]}>
            Poornima University Sports Pass Verification System
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ribbonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ribbonTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  studentInfoSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  dashedSeparator: {
    height: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  dualQrContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 14,
  },
  singleQrBlock: {
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 6,
    position: 'relative',
  },
  qrHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  qrCodeWrapper: {
    padding: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrInstructionBox: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  qrInstructionText: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 15,
  },
  usedBadgeInline: {
    position: 'absolute',
    right: 10,
  },
  approvedStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  approvedIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  approvedTextGroup: {
    flex: 1,
  },
  approvedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.3,
  },
  approvedSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
    fontWeight: '500',
  },
  lockedExitBox: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(100, 116, 139, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  lockedTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  lockedSub: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 12,
  },
  expiredOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(254, 242, 242, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  overlayText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  refreshText: {
    fontSize: 11,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 12,
  },
  timerContent: {
    flex: 1,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerCountdown: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  passFooter: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  securityNotice: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 14,
  },
});

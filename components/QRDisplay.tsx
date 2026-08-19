import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { APP_CONFIG } from '../constants/config';
import { QRService } from '../services/qrService';
import { useThemeStore } from '../store/themeStore';
import { StayExtension } from '../types';
import { formatDateTimeNice, formatTime12h, getRemainingTime } from '../utils/dateUtils';
import { encodeSecureQRPayload } from '../utils/qrUtils';
import { QRGenerator } from './QRGenerator';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface QRDisplayProps {
  extension: StayExtension;
  onViewReceipt?: () => void;
}

export const QRDisplay: React.FC<QRDisplayProps> = ({
  extension,
  onViewReceipt,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const [timeRemaining, setTimeRemaining] = useState(getRemainingTime(extension.validUntil));
  const [isSharing, setIsSharing] = useState(false);
  const [entryPayload, setEntryPayload] = useState('');
  const [exitPayload, setExitPayload] = useState('');
  const [secondsToRefresh, setSecondsToRefresh] = useState(30);
  const [showExitQr, setShowExitQr] = useState(false);

  // Real-time ticking timer for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getRemainingTime(extension.validUntil));
    }, 1000);

    return () => clearInterval(interval);
  }, [extension.validUntil]);

  // Secure Dynamic QR Codes refresh loop (refreshes both codes every 30 seconds)
  useEffect(() => {
    const updatePayloads = () => {
      const entry = encodeSecureQRPayload(extension.id, 'entry');
      const exit = encodeSecureQRPayload(extension.id, 'exit');
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
  }, [extension.id]);

  const isExpired = timeRemaining.isExpired;

  /*
  const handleShare = async () => {
    setIsSharing(true);
    try {
      await QRService.shareReceiptText(extension);
    } finally {
      setIsSharing(false);
    }
  };
  */

  return (
    <View style={styles.wrapper}>
      {/* Digital Pass Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? colors.surfaceCard : '#FFFFFF',
            borderColor: isExpired ? colors.danger : colors.primary,
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
                : isDarkMode
                ? '#1E3A8A'
                : '#DBEAFE',
            },
          ]}
        >
          <View style={styles.ribbonLeft}>
            <Ionicons
              name={isExpired ? 'alert-circle' : 'shield-checkmark'}
              size={18}
              color={isExpired ? colors.danger : colors.primary}
            />
            <Text
              style={[
                styles.ribbonTitle,
                { color: isExpired ? colors.danger : colors.primaryDark },
              ]}
            >
              {isExpired ? 'EXPIRED STAY PASS' : 'OFFICIAL STAY PASS'}
            </Text>
          </View>
          <Badge
            label={isExpired ? 'EXPIRED' : extension.status === 'CheckedIn' ? 'CHECKED IN' : extension.status === 'CheckedOut' ? 'COMPLETED' : 'VALID'}
            variant={isExpired ? 'expired' : extension.status === 'CheckedIn' ? 'info' : extension.status === 'CheckedOut' ? 'primary' : 'valid'}
            size="sm"
          />
        </View>

        {/* Student Info Header */}
        <View style={styles.studentInfoSection}>
          <Text style={[styles.studentName, { color: colors.text }]}>
            {extension.studentName}
          </Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
              Registration No.:
            </Text>
            <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
              {extension.studentEnrollment}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
              Stay Window:
            </Text>
            <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
              {formatTime12h(extension.validFrom || extension.createdAt)} - {formatTime12h(extension.validUntil)}
            </Text>
          </View>
        </View>

        {/* Dashed Separator */}
        <View style={styles.dashedSeparator} />

        {/* Dual QR Code Container */}
        <View style={styles.dualQrContainer}>
          {/* Entry Pass Block */}
          <View style={[styles.singleQrBlock, { borderColor: colors.border, backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
            <View style={[styles.qrHeader, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderBottomColor: colors.border }]}>
              <Ionicons name="log-in-outline" size={16} color={colors.success} />
              <Text style={[styles.qrHeaderText, { color: colors.text }]}>1. ENTRY CHECK-IN PASS</Text>
              {extension.status === 'CheckedIn' && (
                <Badge label="USED" variant="info" size="sm" style={styles.usedBadgeInline} />
              )}
            </View>
            <View style={styles.qrCodeWrapper}>
              <QRGenerator
                value={entryPayload}
                size={220}
                backgroundColor="#FFFFFF"
                color={isExpired || extension.status === 'CheckedIn' || extension.status === 'CheckedOut' ? '#94A3B8' : '#0F172A'}
              />
              {isExpired && (
                <View style={styles.expiredOverlay}>
                  <Text style={styles.overlayText}>EXPIRED</Text>
                </View>
              )}
              {extension.status === 'CheckedIn' && !isExpired && (
                <View style={styles.usedOverlay}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.usedOverlayText}>CHECKED IN</Text>
                </View>
              )}
              {extension.status === 'CheckedOut' && !isExpired && (
                <View style={styles.usedOverlay}>
                  <Ionicons name="checkmark-done-circle" size={24} color="#64748B" />
                  <Text style={[styles.usedOverlayText, { color: '#64748B' }]}>USED</Text>
                </View>
              )}
            </View>
          </View>

          {/* Exit Pass Block */}
          {!showExitQr ? (
            <TouchableOpacity
              style={[
                styles.showExitButton,
                { borderColor: colors.primary, backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF' },
              ]}
              onPress={() => setShowExitQr(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.primary} />
              <Text style={[styles.showExitButtonText, { color: colors.primary }]}>
                Request Exit QR Pass
              </Text>
              <Text style={[styles.showExitSubtext, { color: colors.textSecondary }]}>
                Reveal the QR code to check out when leaving the complex
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.singleQrBlock, { borderColor: colors.border, backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
              <View style={[styles.qrHeader, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderBottomColor: colors.border }]}>
                <Ionicons name="log-out-outline" size={16} color={colors.primary} />
                <Text style={[styles.qrHeaderText, { color: colors.text }]}>2. EXIT CHECK-OUT PASS</Text>
                {extension.status === 'CheckedOut' && (
                  <Badge label="USED" variant="primary" size="sm" style={styles.usedBadgeInline} />
                )}
                <TouchableOpacity 
                  onPress={() => setShowExitQr(false)} 
                  style={{ position: 'absolute', left: 12, padding: 4 }}
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.qrCodeWrapper}>
                <QRGenerator
                  value={exitPayload}
                  size={220}
                  backgroundColor="#FFFFFF"
                  color={isExpired || extension.status === 'CheckedOut' ? '#94A3B8' : '#0F172A'}
                />
                {isExpired && (
                  <View style={styles.expiredOverlay}>
                    <Text style={styles.overlayText}>EXPIRED</Text>
                  </View>
                )}
                {extension.status === 'CheckedOut' && !isExpired && (
                  <View style={styles.usedOverlay}>
                    <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                    <Text style={styles.usedOverlayText}>CHECKED OUT</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Secure Dynamic Indicator */}
        {!isExpired && (
          <View style={styles.refreshIndicator}>
            <Ionicons name="shield-checkmark" size={14} color={colors.success} />
            <Text style={[styles.refreshText, { color: colors.textSecondary }]}>
              Secure dynamic QRs refresh in <Text style={{ color: colors.success, fontWeight: '700' }}>{secondsToRefresh}s</Text>
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
              {isExpired ? 'PASS STATUS' : 'LIVE TIME REMAINING'}
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
            TXN: {extension.transactionId} • {formatDateTimeNice(extension.createdAt)}
          </Text>
          <Text style={[styles.securityNotice, { color: colors.textMuted }]}>
            Present correct QR code at checkpoint for entry or exit verification.
          </Text>
        </View>
      </View>

      {/* Action Buttons - Commented Out Sharing Details
      <View style={styles.actionButtonsContainer}>
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            style={[
              styles.actionButton,
              { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: colors.border },
            ]}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="share-social" size={18} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Share Pass Details</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      */}
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
    marginVertical: 10,
  },
  dualQrContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 16,
  },
  singleQrBlock: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
  },
  showExitButton: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  showExitButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  showExitSubtext: {
    fontSize: 11,
    textAlign: 'center',
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 6,
    position: 'relative',
  },
  qrHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  qrCodeWrapper: {
    padding: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usedBadgeInline: {
    position: 'absolute',
    right: 8,
  },
  usedOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 4,
  },
  usedOverlayText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
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
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  refreshText: {
    fontSize: 12,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 14,
  },
  timerContent: {
    flex: 1,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerCountdown: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 1,
  },
  passFooter: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    marginTop: 4,
    lineHeight: 14,
  },
  actionButtonsContainer: {
    width: '100%',
    maxWidth: 420,
    marginTop: 18,
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

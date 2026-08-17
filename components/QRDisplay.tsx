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
import { encodeQRPayload } from '../utils/qrUtils';
import { QRGenerator } from './QRGenerator';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface QRDisplayProps {
  extension: StayExtension;
  onViewReceipt?: () => void;
  onHomePress?: () => void;
}

export const QRDisplay: React.FC<QRDisplayProps> = ({
  extension,
  onViewReceipt,
  onHomePress,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const [timeRemaining, setTimeRemaining] = useState(getRemainingTime(extension.validUntil));
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Real-time ticking timer for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getRemainingTime(extension.validUntil));
    }, 1000);

    return () => clearInterval(interval);
  }, [extension.validUntil]);

  const qrPayload = extension.qrCode || encodeQRPayload(extension);
  const isExpired = timeRemaining.isExpired;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await QRService.shareReceiptText(extension);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await QRService.generateReceiptPdf(extension);
    } finally {
      setIsDownloading(false);
    }
  };

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
            label={isExpired ? 'EXPIRED' : 'VALID'}
            variant={isExpired ? 'expired' : 'valid'}
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

        {/* QR Code Container */}
        <View style={styles.qrContainer}>
          <QRGenerator
            value={qrPayload}
            size={200}
            backgroundColor="#FFFFFF"
            color={isExpired ? '#94A3B8' : '#0F172A'}
          />
          {isExpired && (
            <View style={styles.expiredOverlay}>
              <View style={styles.expiredBadge}>
                <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                <Text style={styles.expiredBadgeText}>PASS EXPIRED</Text>
              </View>
            </View>
          )}
        </View>

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
            Present this QR at checkpoint for {APP_CONFIG.UNIVERSITY_NAME} security verification.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
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
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Share</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDownloadPdf}
            disabled={isDownloading}
            style={[
              styles.actionButton,
              { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: colors.border },
            ]}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.text }]}>PDF Receipt</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {onViewReceipt && (
          <Button
            title="View Full Receipt"
            variant="outline"
            icon="receipt-outline"
            onPress={onViewReceipt}
            style={styles.fullWidthBtn}
          />
        )}

        {onHomePress && (
          <Button
            title="Back to Dashboard"
            variant="primary"
            icon="home-outline"
            onPress={onHomePress}
            style={styles.fullWidthBtn}
          />
        )}
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
    marginVertical: 10,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  expiredOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  expiredBadge: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  expiredBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
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
  fullWidthBtn: {
    marginTop: 2,
  },
});

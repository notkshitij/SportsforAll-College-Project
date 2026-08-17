import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { APP_CONFIG } from '../constants/config';
import { QRService } from '../services/qrService';
import { useThemeStore } from '../store/themeStore';
import { StayExtension } from '../types';
import { formatDateTimeNice, formatTime12h } from '../utils/dateUtils';
import { formatCurrencyINR, generateReceiptId } from '../utils/formatUtils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface ReceiptCardProps {
  extension: StayExtension;
  onViewQr?: () => void;
  onHomePress?: () => void;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({
  extension,
  onViewQr,
  onHomePress,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const receiptId = generateReceiptId(new Date(extension.createdAt));
  const isExpired = extension.status === 'expired';

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
    <View style={styles.container}>
      {/* Official Receipt Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? colors.surfaceCard : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        {/* Header Ribbon */}
        <View style={styles.header}>
          <View style={styles.univRow}>
            <Image
              source={require('../assets/pu_logo.png')}
              style={styles.logoMini}
              resizeMode="contain"
            />
            <Text style={[styles.univTitle, { color: colors.primary }]}>
              {APP_CONFIG.UNIVERSITY_NAME}
            </Text>
          </View>
          <Text style={[styles.appTitle, { color: colors.textSecondary }]}>
            {APP_CONFIG.APP_NAME} - E-RECEIPT
          </Text>
          <Badge
            label={isExpired ? 'EXPIRED PASS' : 'PAYMENT VERIFIED'}
            variant={isExpired ? 'expired' : 'valid'}
            size="sm"
            style={styles.badge}
          />
        </View>

        {/* Receipt ID Bar */}
        <View
          style={[
            styles.receiptIdBar,
            { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' },
          ]}
        >
          <Text style={[styles.receiptIdLabel, { color: colors.textMuted }]}>
            RECEIPT NO:
          </Text>
          <Text style={[styles.receiptIdValue, { color: colors.text }]}>
            {receiptId}
          </Text>
        </View>

        {/* Details Table */}
        <View style={styles.detailsTable}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Student Name</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>{extension.studentName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Registration No.</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>{extension.studentEnrollment}</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Department</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>{extension.department}</Text>
          </View>

          {extension.studentYear ? (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Year</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>{extension.studentYear}</Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Stay Window</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>
              {formatTime12h(extension.validFrom || extension.createdAt)} - {formatTime12h(extension.validUntil)}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Issue Date & Time</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>{formatDateTimeNice(extension.createdAt)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Valid Until</Text>
            <Text style={[styles.rowValue, { color: isExpired ? colors.danger : colors.success }]}>
              {formatTime12h(extension.validUntil)} ({formatDateTimeNice(extension.validUntil)})
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Payment Method</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>UPI ({extension.upiApp || 'Online'})</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Transaction ID</Text>
            <Text style={[styles.rowValue, { color: colors.primary, fontWeight: '800' }]}>
              {extension.transactionId}
            </Text>
          </View>

          {extension.reason ? (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Purpose</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>{extension.reason}</Text>
            </View>
          ) : null}
        </View>

        {/* Amount Box */}
        <View
          style={[
            styles.amountContainer,
            {
              backgroundColor: isDarkMode ? '#172554' : '#EFF6FF',
              borderColor: isDarkMode ? '#1E3A8A' : '#BFDBFE',
            },
          ]}
        >
          <Text style={[styles.amountLabel, { color: colors.primary }]}>Total Amount Paid</Text>
          <Text style={[styles.amountValue, { color: colors.primaryDark }]}>
            {formatCurrencyINR(extension.amount)}
          </Text>
          <Text style={[styles.amountStatus, { color: colors.success }]}>
            ✅ Verified via Razorpay UPI
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Issued by Directorate of Sports & Student Welfare
          </Text>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            {APP_CONFIG.UNIVERSITY_NAME}, {APP_CONFIG.UNIVERSITY_CAMPUS}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            style={[
              styles.actionBtn,
              { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: colors.border },
            ]}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.text }]}>Share</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDownloadPdf}
            disabled={isDownloading}
            style={[
              styles.actionBtn,
              { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: colors.border },
            ]}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.text }]}>Download PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {onViewQr && (
          <Button
            title="View Digital QR Pass"
            variant="primary"
            icon="qr-code-outline"
            onPress={onViewQr}
          />
        )}

        {onHomePress && (
          <Button
            title="Back to Dashboard"
            variant="outline"
            icon="home-outline"
            onPress={onHomePress}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  univRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoMini: {
    width: 28,
    height: 28,
  },
  univTitle: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  badge: {
    marginTop: 8,
  },
  receiptIdBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  receiptIdLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  receiptIdValue: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailsTable: {
    gap: 10,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
    paddingBottom: 8,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1.2,
  },
  amountContainer: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 4,
  },
  amountStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingTop: 12,
    gap: 2,
  },
  footerText: {
    fontSize: 10,
    textAlign: 'center',
  },
  actionsContainer: {
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
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

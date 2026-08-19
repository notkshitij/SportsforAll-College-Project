import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { APP_CONFIG } from '../constants/config';
import { useThemeStore } from '../store/themeStore';
import { StayExtension, VerificationResult } from '../types';
import { formatDateTimeNice, formatTime12h, getRemainingTime } from '../utils/dateUtils';

interface StudentPassVerificationCardProps {
  result: VerificationResult;
  onApprove: (pass: StayExtension) => Promise<void> | void;
  onReset: () => void;
}

export const StudentPassVerificationCard: React.FC<StudentPassVerificationCardProps> = ({
  result,
  onApprove,
  onReset,
}) => {
  const { colors } = useThemeStore();
  const { pass, scanResult, remainingFormatted, errorReason, signatureValid, qrExpired, qrType = 'entry' } = result;

  const isExit = qrType === 'exit';

  const computeIsApproved = (status: string, type: 'entry' | 'exit') => {
    if (type === 'exit') {
      return status === 'CheckedOut';
    }
    return status === 'CheckedIn' || status === 'CheckedOut';
  };

  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(
    computeIsApproved(pass.status, isExit ? 'exit' : 'entry')
  );
  const [liveCountdown, setLiveCountdown] = useState(
    getRemainingTime(pass.validUntil).formatted
  );

  useEffect(() => {
    setIsApproved(
      computeIsApproved(result.pass.status, result.qrType === 'exit' ? 'exit' : 'entry')
    );
  }, [result]);

  // Live ticking countdown for validity
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveCountdown(getRemainingTime(pass.validUntil).formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, [pass.validUntil]);

  const isValid = scanResult === 'valid' && signatureValid && !qrExpired;
  const isExpiredState = scanResult === 'expired' || qrExpired;
  const isInvalidState = !signatureValid || scanResult === 'invalid' || pass.status === 'Failed';

  const handleApproveClick = async () => {
    if (isApproved || !isValid) return;
    setIsApproving(true);
    try {
      await onApprove(pass);
      setIsApproved(true);
    } finally {
      setIsApproving(false);
    }
  };

  const bannerBg = isInvalidState
    ? colors.dangerLight
    : isExpiredState
    ? colors.warningLight
    : isApproved
    ? colors.successLight
    : colors.infoLight;

  const bannerBorder = isInvalidState
    ? colors.danger
    : isExpiredState
    ? colors.warning
    : isApproved
    ? colors.success
    : colors.primary;

  const bannerTextColor = isInvalidState
    ? colors.dangerDark
    : isExpiredState
    ? colors.warningDark
    : isApproved
    ? colors.successDark
    : colors.primaryDark;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.receiptCard,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Top University Header */}
        <View style={[styles.receiptHeader, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.univRow}>
            <Image
              source={require('../../assets/pu_logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
            <View style={styles.univInfo}>
              <Text style={[styles.univName, { color: colors.primary }]}>
                {APP_CONFIG.UNIVERSITY_NAME}
              </Text>
              <Text style={[styles.univSub, { color: colors.textSecondary }]}>
                DIRECTORATE OF SPORTS & RECREATION • GATE CHECKPOINT
              </Text>
            </View>
          </View>
          <View style={[styles.docTitleBadge, { backgroundColor: colors.backgroundSubtle }]}>
            <Text style={[styles.docTitleText, { color: colors.textSecondary }]}>
              OFFICIAL SPORTS STAY PASS & E-RECEIPT
            </Text>
          </View>
        </View>

        {/* Verification Status Banner */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: bannerBg,
              borderColor: bannerBorder,
            },
          ]}
        >
          <Ionicons
            name={
              isInvalidState
                ? 'close-circle'
                : isExpiredState
                ? 'time'
                : isApproved
                ? 'checkmark-circle'
                : 'shield-checkmark'
            }
            size={28}
            color={bannerTextColor}
          />
          <View style={styles.statusTextWrap}>
            <Text style={[styles.statusBannerTitle, { color: bannerTextColor }]}>
              {isInvalidState
                ? 'INVALID / FLAGGED PASS'
                : isExpiredState
                ? 'EXPIRED SPORTS PASS'
                : isApproved
                ? isExit
                  ? 'EXIT APPROVED • CHECKED OUT'
                  : 'ENTRY APPROVED & GATE OPENED'
                : isExit
                ? 'EXIT CHECKOUT VERIFIED'
                : 'PAYMENT VERIFIED & VALID PASS'}
            </Text>
            <Text style={[styles.statusBannerDesc, { color: bannerTextColor }]}>
              {errorReason
                ? errorReason
                : isValid
                ? isApproved
                  ? isExit
                    ? 'Student checkout recorded successfully.'
                    : 'Gate entry verified and logged.'
                  : isExit
                  ? 'Student verified inside complex • Ready for exit approval'
                  : `Valid Stay Window: ${liveCountdown || remainingFormatted || 'Active'}`
                : 'Access Denied'}
            </Text>
          </View>
        </View>

        {/* Receipt No Bar */}
        <View
          style={[
            styles.receiptNoBar,
            {
              backgroundColor: colors.backgroundSubtle,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <Text style={[styles.receiptNoLabel, { color: colors.textMuted }]}>
            RECEIPT / PASS NO:
          </Text>
          <Text style={[styles.receiptNoValue, { color: colors.primary }]}>
            PU-REC-{pass.transactionId || pass.id}
          </Text>
        </View>

        {/* Student & Fee Details Table */}
        <View style={styles.detailsTable}>
          <DetailRow label="Student Name" value={pass.studentName} highlight isPrimary colors={colors} />
          <DetailRow label="Registration No. (Roll No)" value={pass.studentEnrollment} highlight colors={colors} />
          <DetailRow label="Department" value={pass.department || 'Poornima University'} colors={colors} />
          {pass.studentYear ? <DetailRow label="Academic Year" value={pass.studentYear} colors={colors} /> : null}
          <DetailRow
            label="Stay Window"
            value={`${formatTime12h(pass.validFrom || pass.createdAt)} – ${formatTime12h(pass.validUntil)}`}
            colors={colors}
          />
          <DetailRow label="Issue Date & Time" value={formatDateTimeNice(pass.createdAt)} colors={colors} />
          <DetailRow
            label="Valid Until"
            value={`${formatTime12h(pass.validUntil)} (${liveCountdown})`}
            valueColor={isExpiredState ? colors.danger : colors.success}
            colors={colors}
          />
          <DetailRow label="Payment Method" value={`UPI (${pass.upiApp || 'Online Verified'})`} colors={colors} />
          <DetailRow label="Transaction ID" value={pass.transactionId} isMonospace colors={colors} />
          {pass.reason ? <DetailRow label="Purpose" value={pass.reason} colors={colors} /> : null}
        </View>

        {/* Total Amount Paid Box */}
        <View
          style={[
            styles.amountBox,
            {
              backgroundColor: colors.backgroundSubtle,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
            TOTAL AMOUNT PAID
          </Text>
          <Text style={[styles.amountVal, { color: colors.text }]}>
            ₹{pass.amount || 100}.00
          </Text>
          <View style={styles.amountSub}>
            <Ionicons name="shield-checkmark" size={14} color={colors.success} />
            <Text style={[styles.amountSubText, { color: colors.textSecondary }]}>
              Verified via Razorpay UPI • Instant Gateway
            </Text>
          </View>
        </View>

        {/* Action Button Section */}
        <View style={styles.actionsBox}>
          {isValid ? (
            <TouchableOpacity
              style={[
                styles.approveBtn,
                {
                  backgroundColor: isApproved ? colors.success : colors.primary,
                  opacity: isApproving ? 0.7 : 1,
                },
              ]}
              onPress={handleApproveClick}
              disabled={isApproving || isApproved}
              activeOpacity={0.8}
            >
              {isApproving ? (
                <View style={styles.btnRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.approveBtnText}>
                    {isExit ? 'Confirming Exit...' : 'Confirming Entry...'}
                  </Text>
                </View>
              ) : isApproved ? (
                <View style={styles.btnRow}>
                  <Ionicons name="checkmark-done" size={22} color="#FFFFFF" />
                  <Text style={styles.approveBtnText}>
                    {isExit ? 'EXIT APPROVED • CHECKED OUT' : 'ENTRY APPROVED • GATE OPENED'}
                  </Text>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.approveBtnText}>
                    {isExit ? 'APPROVE EXIT' : 'APPROVE ENTRY'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={[styles.approveBtn, { backgroundColor: colors.danger }]}>
              <Ionicons name="close-circle-outline" size={22} color="#FFFFFF" />
              <Text style={styles.approveBtnText}>
                ACCESS DENIED (PASS EXPIRED / INVALID)
              </Text>
            </View>
          )}

          {/* Quick Scan Next Button */}
          <TouchableOpacity
            style={[
              styles.scanNextBtn,
              {
                borderColor: colors.border,
                backgroundColor: colors.backgroundSubtle,
              },
            ]}
            onPress={onReset}
            activeOpacity={0.7}
          >
            <Ionicons name="scan-outline" size={16} color={colors.text} />
            <Text style={[styles.scanNextText, { color: colors.text }]}>
              Scan Next Student Pass
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const DetailRow: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  isPrimary?: boolean;
  valueColor?: string;
  isMonospace?: boolean;
  colors: any;
}> = ({ label, value, highlight, isPrimary, valueColor, isMonospace, colors }) => (
  <View style={[styles.detailRow, { borderBottomColor: colors.borderLight }]}>
    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
    <Text
      style={[
        styles.detailValue,
        {
          color: valueColor
            ? valueColor
            : isPrimary
            ? colors.primary
            : highlight
            ? colors.text
            : colors.text,
          fontWeight: highlight || isPrimary ? '700' : '500',
          fontFamily: isMonospace ? undefined : undefined,
        },
      ]}
      numberOfLines={2}
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  receiptCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 14,
  },
  receiptHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  univRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImg: {
    width: 44,
    height: 44,
  },
  univInfo: {
    flex: 1,
  },
  univName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  univSub: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  docTitleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  docTitleText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  statusBannerDesc: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  receiptNoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  receiptNoLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  receiptNoValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  detailsTable: {
    gap: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    textAlign: 'right',
    flex: 1.2,
  },
  amountBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  amountVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  amountSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  amountSubText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionsBox: {
    gap: 10,
    marginTop: 4,
  },
  approveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  scanNextBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  scanNextText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

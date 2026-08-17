import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal as RNModal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScanResultType } from '../types';
import { formatDateTimeNice, formatTime12h, getRemainingTime } from '../utils/dateUtils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface ScanResultModalProps {
  visible: boolean;
  onClose: () => void;
  onScanNext: () => void;
  onGoHome: () => void;
  result: {
    scanResult: ScanResultType;
    studentName: string;
    enrollment: string;
    validUntil: string;
    reason?: string;
    remainingFormatted?: string;
  } | null;
}

export const ScanResultModal: React.FC<ScanResultModalProps> = ({
  visible,
  onClose,
  onScanNext,
  onGoHome,
  result,
}) => {
  if (!result) return null;

  const isValid = result.scanResult === 'valid';
  const isExpired = result.scanResult === 'expired';
  const isInvalid = result.scanResult === 'invalid';

  const timeRemaining = result.validUntil ? getRemainingTime(result.validUntil) : null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              borderColor: isValid ? '#10B981' : '#EF4444',
            },
          ]}
        >
          {/* Header Banner */}
          <View
            style={[
              styles.headerBanner,
              {
                backgroundColor: isValid ? '#10B981' : '#EF4444',
              },
            ]}
          >
            <Ionicons
              name={isValid ? 'checkmark-circle' : 'close-circle'}
              size={36}
              color="#FFFFFF"
            />
            <Text style={styles.headerTitle}>
              {isValid
                ? 'VALID ENTRY PASS'
                : isExpired
                ? 'INVALID / EXPIRED PASS'
                : 'INVALID / UNRECOGNIZED PASS'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isValid
                ? 'Student is authorized to use Sports Complex'
                : 'Access to Sports Facility is Denied'}
            </Text>
          </View>

          {/* Details Content */}
          <View style={styles.body}>
            <View style={styles.statusChipRow}>
              <Badge
                label={isValid ? 'APPROVED' : isExpired ? 'EXPIRED' : 'FORGED / INVALID'}
                variant={isValid ? 'valid' : 'expired'}
                size="md"
              />
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Student Name</Text>
                <Text style={styles.value} numberOfLines={1}>
                  {result.studentName}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.label}>Enrollment No.</Text>
                <Text style={styles.value}>{result.enrollment}</Text>
              </View>

              {result.validUntil ? (
                <>
                  <View style={styles.detailItem}>
                    <Text style={styles.label}>Valid Until</Text>
                    <Text
                      style={[
                        styles.value,
                        { color: isValid ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {formatTime12h(result.validUntil)} ({formatDateTimeNice(result.validUntil)})
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.label}>
                      {isValid ? 'Time Remaining' : 'Expired Ago'}
                    </Text>
                    <Text
                      style={[
                        styles.value,
                        {
                          color: isValid ? '#10B981' : '#EF4444',
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {result.remainingFormatted || timeRemaining?.formatted || 'N/A'}
                    </Text>
                  </View>
                </>
              ) : null}

              {result.reason ? (
                <View style={styles.reasonBox}>
                  <Ionicons name="warning" size={16} color="#EF4444" />
                  <Text style={styles.reasonText}>{result.reason}</Text>
                </View>
              ) : null}
            </View>

            {/* Guard Decision Ribbon */}
            <View
              style={[
                styles.decisionBox,
                {
                  backgroundColor: isValid ? '#ECFDF5' : '#FEF2F2',
                  borderColor: isValid ? '#A7F3D0' : '#FECACA',
                },
              ]}
            >
              <Ionicons
                name={isValid ? 'checkmark-done-circle' : 'hand-left'}
                size={22}
                color={isValid ? '#059669' : '#DC2626'}
              />
              <Text
                style={[
                  styles.decisionText,
                  { color: isValid ? '#065F46' : '#991B1B' },
                ]}
              >
                {isValid ? '✅ ALLOWED TO PROCEED' : '❌ NOT ALLOWED TO ENTER'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Button
                title="Scan Next Pass"
                variant="primary"
                icon="scan"
                onPress={onScanNext}
                style={styles.actionBtn}
              />
              <Button
                title="Dashboard"
                variant="outline"
                icon="home-outline"
                onPress={onGoHome}
                style={styles.actionBtn}
              />
            </View>
          </View>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  headerBanner: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  body: {
    padding: 20,
  },
  statusChipRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 2,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  reasonText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  decisionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    marginBottom: 18,
  },
  decisionText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  actionRow: {
    gap: 10,
  },
  actionBtn: {
    width: '100%',
  },
});

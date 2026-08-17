import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { useStayExtensionStore } from '../../store/stayExtensionStore';
import { useThemeStore } from '../../store/themeStore';
import { formatDateTimeNice, formatTime12h, getRemainingTime } from '../../utils/dateUtils';

export default function ScanResultScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useThemeStore();
  const { lastScanResult, scanLogs } = useStayExtensionStore();

  const currentResult = lastScanResult || (scanLogs[0] ? {
    scanLog: scanLogs[0],
    scanResult: scanLogs[0].scanResult,
    studentName: scanLogs[0].studentName,
    enrollment: scanLogs[0].enrollment,
    studentYear: scanLogs[0].studentYear,
    validFrom: scanLogs[0].validFrom,
    validUntil: scanLogs[0].validUntil,
    reason: scanLogs[0].reason,
    remainingFormatted: scanLogs[0].validUntil ? getRemainingTime(scanLogs[0].validUntil).formatted : undefined,
  } : null);

  const isValid = currentResult?.scanResult === 'valid';
  const isExpired = currentResult?.scanResult === 'expired';
  const isInvalid = currentResult?.scanResult === 'invalid' || !currentResult;

  const timeRemaining = currentResult?.validUntil ? getRemainingTime(currentResult.validUntil) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Pass Verification Result"
        subtitle="Poornima Security Gate Log"
        showBack
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card
          variant="elevated"
          style={[
            styles.resultCard,
            {
              borderColor: isValid ? colors.success : colors.danger,
            },
          ]}
        >
          {/* Top Result Banner */}
          <View
            style={[
              styles.banner,
              {
                backgroundColor: isValid
                  ? '#10B981'
                  : '#EF4444',
              },
            ]}
          >
            <View style={styles.bannerIconBox}>
              <Ionicons
                name={isValid ? 'checkmark-circle' : 'close-circle'}
                size={48}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.bannerTitle}>
              {isValid
                ? 'VALID ENTRY PASS'
                : isExpired
                ? 'INVALID / EXPIRED PASS'
                : 'CORRUPT / UNRECOGNIZED PASS'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {isValid
                ? 'Authorized for sports complex stay pass'
                : 'Access to Sports Facility is strictly prohibited'}
            </Text>
          </View>

          {/* Body Information */}
          <View style={styles.body}>
            <View style={styles.badgeRow}>
              <Badge
                label={isValid ? 'ENTRY GRANTED' : isExpired ? 'PASS EXPIRED' : 'INVALID PASS'}
                variant={isValid ? 'valid' : 'expired'}
                size="md"
              />
            </View>

            <View style={styles.infoTable}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, { color: colors.textMuted }]}>
                  Student Name
                </Text>
                <Text style={[styles.tableValue, { color: colors.text }]}>
                  {currentResult?.studentName || 'Unknown Student'}
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, { color: colors.textMuted }]}>
                  Enrollment ID
                </Text>
                <Text style={[styles.tableValue, { color: colors.text }]}>
                  {currentResult?.enrollment || 'N/A'}
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tableLabel, { color: colors.textMuted }]}>
                  Student Year
                </Text>
                <Text style={[styles.tableValue, { color: colors.text }]}>
                  {currentResult?.studentYear || 'N/A'}
                </Text>
              </View>

              {currentResult?.validUntil ? (
                <>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableLabel, { color: colors.textMuted }]}>
                      Valid Until
                    </Text>
                    <Text
                      style={[
                        styles.tableValue,
                        { color: isValid ? colors.success : colors.danger },
                      ]}
                    >
                      {formatTime12h(currentResult.validUntil)} ({formatDateTimeNice(currentResult.validUntil)})
                    </Text>
                  </View>

                  <View style={styles.tableRow}>
                    <Text style={[styles.tableLabel, { color: colors.textMuted }]}>
                      {isValid ? 'Time Remaining' : 'Status / Expired'}
                    </Text>
                    <Text
                      style={[
                        styles.tableValue,
                        {
                          color: isValid ? colors.success : colors.danger,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {currentResult.remainingFormatted || timeRemaining?.formatted || 'N/A'}
                    </Text>
                  </View>
                </>
              ) : null}

              {currentResult?.reason ? (
                <View
                  style={[
                    styles.reasonBox,
                    {
                      backgroundColor: isDarkMode ? '#3F1A1A' : '#FEF2F2',
                      borderColor: colors.danger,
                    },
                  ]}
                >
                  <Ionicons name="warning" size={18} color={colors.danger} />
                  <Text style={[styles.reasonText, { color: colors.danger }]}>
                    {currentResult.reason}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Officer Action Ribbon */}
            <View
              style={[
                styles.decisionBox,
                {
                  backgroundColor: isValid
                    ? isDarkMode
                      ? '#064E3B'
                      : '#ECFDF5'
                    : isDarkMode
                    ? '#7F1D1D'
                    : '#FEF2F2',
                  borderColor: isValid ? colors.success : colors.danger,
                },
              ]}
            >
              <Ionicons
                name={isValid ? 'shield-checkmark' : 'hand-left'}
                size={24}
                color={isValid ? colors.success : colors.danger}
              />
              <Text
                style={[
                  styles.decisionText,
                  { color: isValid ? colors.successDark : colors.dangerDark },
                ]}
              >
                {isValid ? '✅ ALLOWED TO PROCEED' : '❌ NOT ALLOWED TO ENTER'}
              </Text>
            </View>

            {/* Navigation Actions */}
            <View style={styles.actions}>
              <Button
                title="SCAN NEXT PASS"
                variant="primary"
                size="lg"
                icon="qr-code"
                onPress={() => router.replace('/(guard)/scanner')}
              />

              <Button
                title="BACK TO DASHBOARD"
                variant="outline"
                size="md"
                icon="home-outline"
                onPress={() => router.replace('/(guard)')}
              />

              <Button
                title="VIEW ALL SCAN LOGS"
                variant="ghost"
                size="sm"
                icon="list-outline"
                onPress={() => router.push('/(guard)/scan-logs')}
              />
            </View>
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
  resultCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    padding: 0,
  },
  banner: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bannerIconBox: {
    marginBottom: 4,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  body: {
    padding: 20,
    gap: 16,
  },
  badgeRow: {
    alignItems: 'center',
  },
  infoTable: {
    gap: 10,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  tableLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  tableValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    marginLeft: 14,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  decisionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  decisionText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
});

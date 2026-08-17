import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ManualEntryModal } from '../../components/ManualEntryModal';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { APP_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { useStayExtensionStore } from '../../store/stayExtensionStore';
import { useThemeStore } from '../../store/themeStore';
import { formatDateTimeNice, formatTime12h } from '../../utils/dateUtils';

export default function GuardDashboard() {
  const router = useRouter();
  const { colors, isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { scanLogs, verifyCodeAndLog } = useStayExtensionStore();

  const [manualModalVisible, setManualModalVisible] = useState(false);

  const guardUser = user || APP_CONFIG.DEMO_GUARD;

  // Stats calculation
  const totalScans = scanLogs.length;
  const validScans = scanLogs.filter((l) => l.scanResult === 'valid').length;
  const invalidScans = scanLogs.filter((l) => l.scanResult !== 'valid').length;

  const recentLogs = scanLogs.slice(0, 5);

  const handleManualCodeSubmit = (code: string) => {
    setManualModalVisible(false);
    verifyCodeAndLog(code, guardUser);
    router.push('/(guard)/scan-result');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Sportsforall"
        subtitle="Security Checkpoint Terminal"
        showRoleBadge
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Guard Welcome Card */}
        <Card
          variant="elevated"
          style={[
            styles.welcomeCard,
            {
              backgroundColor: isDarkMode ? '#78350F' : '#FFFBEB',
              borderColor: isDarkMode ? '#92400E' : '#FDE68A',
            },
          ]}
        >
          <View style={styles.welcomeTop}>
            <View style={styles.welcomeLeft}>
              <View style={styles.guardAvatar}>
                <Ionicons name="shield" size={24} color="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.welcomeGreeting, { color: colors.textSecondary }]}>
                  Duty Officer On Duty
                </Text>
                <Text style={[styles.guardName, { color: colors.text }]}>
                  {guardUser.name} 🛡️
                </Text>
              </View>
            </View>

            <Badge label="ACTIVE DUTY" variant="warning" size="sm" />
          </View>

          <Text style={[styles.shiftInfo, { color: colors.textSecondary }]}>
            Location: Poornima Sports Complex Main Gate • Staff ID: {guardUser.enrollment || 'SEC-804'}
          </Text>
        </Card>

        {/* PRIMARY ACTION: BIG SCAN QR CODE BUTTON */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/(guard)/scanner')}
          style={[
            styles.bigScanBtn,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
        >
          <View style={styles.scanIconCircle}>
            <Ionicons name="qr-code" size={36} color="#FFFFFF" />
          </View>
          <View style={styles.scanBtnContent}>
            <Text style={styles.scanBtnTitle}>SCAN STUDENT QR CODE</Text>
            <Text style={styles.scanBtnSubtitle}>
              Open camera to auto-verify stay extension validity
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Manual Fallback Entry Button */}
        <Button
          title="Manual Pass Entry (Fallback)"
          variant="outline"
          size="md"
          icon="keypad-outline"
          onPress={() => setManualModalVisible(true)}
          style={styles.manualBtn}
        />

        {/* TODAY'S VERIFICATION STATS */}
        <View style={styles.statsRow}>
          <Card variant="outlined" style={[styles.statBox, { borderColor: colors.border }]}>
            <Text style={[styles.statVal, { color: colors.primary }]}>{totalScans}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Scans</Text>
          </Card>

          <Card variant="outlined" style={[styles.statBox, { borderColor: colors.success }]}>
            <Text style={[styles.statVal, { color: colors.success }]}>{validScans}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Valid Passes</Text>
          </Card>

          <Card variant="outlined" style={[styles.statBox, { borderColor: colors.danger }]}>
            <Text style={[styles.statVal, { color: colors.danger }]}>{invalidScans}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Expired/Alerts</Text>
          </Card>
        </View>

        {/* RECENT SCANS LIST */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Scans
          </Text>
          <TouchableOpacity onPress={() => router.push('/(guard)/scan-logs')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              View All Logs →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logsList}>
          {recentLogs.map((log) => {
            const isValid = log.scanResult === 'valid';
            const isExpired = log.scanResult === 'expired';

            return (
              <Card
                key={log.id}
                variant="outlined"
                style={[
                  styles.logCard,
                  {
                    borderColor: isValid
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)',
                  },
                ]}
              >
                <View style={styles.logRow}>
                  <View
                    style={[
                      styles.logIcon,
                      {
                        backgroundColor: isValid
                          ? isDarkMode
                            ? 'rgba(16, 185, 129, 0.2)'
                            : '#D1FAE5'
                          : isDarkMode
                          ? 'rgba(239, 68, 68, 0.15)'
                          : '#FEE2E2',
                      },
                    ]}
                  >
                    <Ionicons
                      name={isValid ? 'checkmark-circle' : isExpired ? 'time' : 'alert-circle'}
                      size={22}
                      color={isValid ? colors.success : colors.danger}
                    />
                  </View>

                  <View style={styles.logInfo}>
                    <Text style={[styles.studentName, { color: colors.text }]}>
                      {log.studentName}
                    </Text>
                    <Text style={[styles.logMeta, { color: colors.textMuted }]}>
                      {formatTime12h(log.scannedAt)} • Enrollment: {log.enrollment}
                    </Text>
                    {log.reason ? (
                      <Text style={[styles.logReason, { color: colors.danger }]}>
                        {log.reason}
                      </Text>
                    ) : null}
                  </View>

                  <Badge
                    label={isValid ? 'VALID' : isExpired ? 'EXPIRED' : 'INVALID'}
                    variant={isValid ? 'valid' : 'expired'}
                    size="sm"
                  />
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>

      {/* Manual Code Input Modal */}
      <ManualEntryModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        onSubmit={handleManualCodeSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 110,
    gap: 16,
  },
  welcomeCard: {
    padding: 18,
    borderWidth: 1.5,
    borderRadius: 18,
    gap: 10,
  },
  welcomeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeGreeting: {
    fontSize: 12,
    fontWeight: '500',
  },
  guardName: {
    fontSize: 18,
    fontWeight: '800',
  },
  shiftInfo: {
    fontSize: 12,
    lineHeight: 16,
  },
  bigScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 18,
    gap: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  scanIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnContent: {
    flex: 1,
  },
  scanBtnTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  scanBtnSubtitle: {
    color: '#DBEAFE',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  manualBtn: {
    marginTop: -4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
  },
  statVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  logsList: {
    gap: 10,
  },
  logCard: {
    padding: 14,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
  },
  logMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  logReason: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});

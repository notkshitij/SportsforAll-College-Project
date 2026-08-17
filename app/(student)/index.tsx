import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { APP_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { useStayExtensionStore } from '../../store/stayExtensionStore';
import { useThemeStore } from '../../store/themeStore';
import {
  formatDateShort,
  formatDateTimeNice,
  formatTime12h,
  getRemainingTime,
  isFacilityOperatingNow,
} from '../../utils/dateUtils';
import { formatCurrencyINR } from '../../utils/formatUtils';

export default function StudentDashboard() {
  const router = useRouter();
  const { colors, isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const {
    extensions,
    getActivePassForStudent,
    refreshStatuses,
    setLastCreatedPass,
  } = useStayExtensionStore();

  const [refreshing, setRefreshing] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState(formatTime12h(new Date()));
  const [operatingStatus, setOperatingStatus] = useState(isFacilityOperatingNow());

  const studentUser = user || APP_CONFIG.DEMO_STUDENT;
  const activePass = React.useMemo(() => {
    return getActivePassForStudent(studentUser.id || 'stu_001');
  }, [extensions, studentUser.id, getActivePassForStudent]);

  // Real-time clock & operating status update
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(formatTime12h(now));
      setOperatingStatus(isFacilityOperatingNow());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStatuses();
    }, [refreshStatuses])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    refreshStatuses();
    setTimeout(() => setRefreshing(false), 500);
  };

  const studentPasses = React.useMemo(() => {
    return extensions.filter(
      (e) => e.studentId === (studentUser.id || 'stu_001')
    );
  }, [extensions, studentUser.id]);

  const recentPasses = React.useMemo(() => studentPasses.slice(0, 3), [studentPasses]);

  const activePassRemaining = activePass ? getRemainingTime(activePass.validUntil) : null;

  const handleOpenQR = (pass: typeof activePass) => {
    if (!pass) return;
    setLastCreatedPass(pass);
    router.push('/(student)/qr-display');
  };

  const handleOpenReceipt = (pass: typeof activePass) => {
    if (!pass) return;
    setLastCreatedPass(pass);
    router.push('/(student)/receipt');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Sportsforall"
        subtitle="Student Sports Pass Portal"
        showRoleBadge
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Welcome Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
              Welcome back,
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {studentUser.name} 👋
            </Text>
          </View>
          <View style={styles.deptBadge}>
            <Text style={[styles.deptText, { color: colors.primary }]}>
              {studentUser.enrollment || 'PU-2024-1001'}
            </Text>
          </View>
        </View>

        {/* Operating Hours & Current Time Card */}
        <Card
          variant="elevated"
          style={[
            styles.operatingCard,
            {
              backgroundColor: operatingStatus.isOpen
                ? isDarkMode
                  ? '#064E3B'
                  : '#ECFDF5'
                : isDarkMode
                ? '#1E293B'
                : '#F8FAFC',
              borderColor: operatingStatus.isOpen ? colors.success : colors.border,
            },
          ]}
        >
          <View style={styles.operatingTop}>
            <View style={styles.timeSection}>
              <Text style={[styles.timeLabel, { color: colors.textMuted }]}>
                Current Time
              </Text>
              <Text style={[styles.timeValue, { color: colors.text }]}>
                {currentTimeStr}
              </Text>
            </View>

            <View style={styles.statusBadgeWrapper}>
              <Badge
                label={operatingStatus.isOpen ? 'OPEN (4 PM - 8 PM)' : 'CLOSED'}
                variant={operatingStatus.isOpen ? 'valid' : 'warning'}
                size="sm"
              />
            </View>
          </View>

          <View style={styles.operatingFooter}>
            <Ionicons
              name={operatingStatus.isOpen ? 'checkmark-circle' : 'time-outline'}
              size={16}
              color={operatingStatus.isOpen ? colors.success : colors.warning}
            />
            <Text
              style={[
                styles.operatingMsg,
                { color: operatingStatus.isOpen ? colors.successDark : colors.textSecondary },
              ]}
            >
              {operatingStatus.message}
            </Text>
          </View>
        </Card>

        {/* ACTIVE STAY EXTENSION BANNER (if available) */}
        {activePass ? (
          <Card
            variant="elevated"
            style={[
              styles.activePassCard,
              {
                backgroundColor: isDarkMode ? '#172554' : '#EFF6FF',
                borderColor: colors.primary,
              },
            ]}
          >
            <View style={styles.activePassHeader}>
              <View style={styles.activePassTitleRow}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                <Text style={[styles.activePassTitle, { color: colors.primary }]}>
                  ACTIVE STAY PASS
                </Text>
              </View>
              <Badge label="VALID" variant="valid" size="sm" />
            </View>

            <View style={styles.activePassBody}>
              <View style={styles.passDetailCol}>
                <Text style={[styles.passDetailLabel, { color: colors.textMuted }]}>
                  Expires At
                </Text>
                <Text style={[styles.passDetailValue, { color: colors.text }]}>
                  {formatTime12h(activePass.validUntil)}
                </Text>
              </View>

              <View style={styles.passDetailCol}>
                <Text style={[styles.passDetailLabel, { color: colors.textMuted }]}>
                  Live Remaining
                </Text>
                <Text
                  style={[
                    styles.passDetailValue,
                    { color: colors.primary, fontWeight: '800' },
                  ]}
                >
                  {activePassRemaining?.formatted || 'Active'}
                </Text>
              </View>
            </View>

            <View style={styles.activePassActions}>
              <Button
                title="Show QR Code"
                variant="primary"
                size="sm"
                icon="qr-code"
                onPress={() => handleOpenQR(activePass)}
                style={styles.passActionBtn}
              />
              <Button
                title="E-Receipt"
                variant="outline"
                size="sm"
                icon="receipt-outline"
                onPress={() => handleOpenReceipt(activePass)}
                style={styles.passActionBtn}
              />
            </View>
          </Card>
        ) : null}

        {/* REQUEST STAY EXTENSION ACTION BUTTON */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(student)/payment')}
            style={[
              styles.bigRequestButton,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
            ]}
          >
            <View style={styles.requestBtnLeft}>
              <View style={styles.requestIconBadge}>
                <Ionicons name="add-circle" size={28} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.requestBtnTitle}>STAY TODAY (4 PM - 8 PM)</Text>
                <Text style={styles.requestBtnSubtitle}>
                  Pay ₹100 & get instant QR pass
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* RECENT TRANSACTIONS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Transactions
          </Text>
          <TouchableOpacity onPress={() => router.push('/(student)/history')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              View All History →
            </Text>
          </TouchableOpacity>
        </View>

        {recentPasses.length > 0 ? (
          <View style={styles.transactionsList}>
            {recentPasses.map((pass) => {
              const isPassValid = pass.status === 'valid';
              return (
                <Card
                  key={pass.id}
                  variant="outlined"
                  onPress={() => handleOpenQR(pass)}
                  style={styles.txCard}
                >
                  <View style={styles.txRow}>
                    <View style={styles.txLeft}>
                      <View
                        style={[
                          styles.txIconWrapper,
                          {
                            backgroundColor: isPassValid
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
                          name={isPassValid ? 'checkmark-circle' : 'time'}
                          size={20}
                          color={isPassValid ? colors.success : colors.danger}
                        />
                      </View>
                      <View>
                        <Text style={[styles.txTitle, { color: colors.text }]}>
                          {formatDateShort(pass.createdAt)} - {pass.duration} Hour
                          {pass.duration > 1 ? 's' : ''} Stay
                        </Text>
                        <Text style={[styles.txSubtitle, { color: colors.textMuted }]}>
                          {formatDateTimeNice(pass.createdAt)} • {pass.transactionId}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.txRight}>
                      <Text style={[styles.txAmount, { color: colors.text }]}>
                        {formatCurrencyINR(pass.amount)}
                      </Text>
                      <Badge
                        label={isPassValid ? 'PAID / VALID' : 'EXPIRED'}
                        variant={isPassValid ? 'valid' : 'expired'}
                        size="sm"
                      />
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        ) : (
          <Card variant="flat" style={styles.emptyCard}>
            <Ionicons name="ticket-outline" size={32} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No sports passes yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              Purchase your stay pass above to generate an instant QR pass.
            </Text>
          </Card>
        )}

        {/* Poornima Sports Facility Guidelines */}
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={[styles.infoCardTitle, { color: colors.text }]}>
              Facility Stay Policy
            </Text>
          </View>
          <Text style={[styles.infoCardBody, { color: colors.textSecondary }]}>
            • Operating hours are strictly between 4:00 PM and 8:00 PM daily.{'\n'}
            • Passes must be shown to the campus security officer at entry and exit.{'\n'}
            • Carry your student ID card alongside the digital QR pass.
          </Text>
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
    paddingBottom: 110,
    gap: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
  },
  deptBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  deptText: {
    fontSize: 12,
    fontWeight: '700',
  },
  operatingCard: {
    padding: 16,
    borderWidth: 1.5,
  },
  operatingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeSection: {
    gap: 2,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statusBadgeWrapper: {
    alignItems: 'flex-end',
  },
  operatingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingTop: 10,
  },
  operatingMsg: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  activePassCard: {
    padding: 18,
    borderWidth: 1.5,
    borderRadius: 18,
  },
  activePassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activePassTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activePassTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activePassBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  passDetailCol: {
    gap: 2,
  },
  passDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  passDetailValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  activePassActions: {
    flexDirection: 'row',
    gap: 10,
  },
  passActionBtn: {
    flex: 1,
  },
  actionSection: {
    width: '100%',
  },
  bigRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  requestBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  requestIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestBtnTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  requestBtnSubtitle: {
    color: '#DBEAFE',
    fontSize: 12,
    marginTop: 2,
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
  transactionsList: {
    gap: 10,
  },
  txCard: {
    padding: 14,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  txSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  infoCard: {
    padding: 16,
    gap: 8,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoCardBody: {
    fontSize: 12,
    lineHeight: 18,
  },
});

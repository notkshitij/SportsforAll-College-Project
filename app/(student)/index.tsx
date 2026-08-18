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
import { useAuthStore } from '../../store/authStore';
import { useStayExtensionStore } from '../../store/stayExtensionStore';
import { useThemeStore } from '../../store/themeStore';
import {
  formatTime12h,
  getRemainingTime,
  isFacilityOperatingNow,
} from '../../utils/dateUtils';

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

  const studentUser = user as NonNullable<typeof user>;
  const activePass = React.useMemo(() => {
    return getActivePassForStudent(studentUser.id);
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
              {studentUser.enrollment}
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
              {/* E-Receipt hidden for students */}
              {/* <Button
                title="E-Receipt"
                variant="outline"
                size="sm"
                icon="receipt-outline"
                onPress={() => handleOpenReceipt(activePass)}
                style={styles.passActionBtn}
              /> */}
            </View>
          </Card>
        ) : null}

        {/* STAY TODAY BLUE INFO BANNER */}
        <View
          style={[
            styles.stayInfoBanner,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
        >
          <View style={styles.stayInfoLeft}>
            <View style={styles.stayIconBadge}>
              <Ionicons name="time" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stayBannerTitle}>STAY TODAY (4 PM - 8 PM)</Text>
              <Text style={styles.stayBannerSubtitle}>
                Fixed ₹100 • Instant QR Pass
              </Text>
            </View>
          </View>
          <View style={styles.stayPriceBadge}>
            <Text style={styles.stayPriceText}>₹100</Text>
          </View>
        </View>

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
            • Passes must be shown to the campus guard at entry and exit.{'\n'}
            • Carry your student ID card alongside the digital QR pass.
          </Text>
        </Card>

        {/* COMPACT PAY ₹100 BUTTON */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/(student)/payment')}
          style={[
            styles.payButtonCompact,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
        >
          <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
          <Text style={styles.payButtonText}>Pay ₹100</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
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
  stayInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  stayInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  stayIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stayBannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  stayBannerSubtitle: {
    color: '#DBEAFE',
    fontSize: 12,
    marginTop: 2,
  },
  stayPriceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stayPriceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  payButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 24,
    alignSelf: 'center',
    minWidth: 160,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
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

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { APP_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function GuardProfileScreen() {
  const router = useRouter();
  const { colors, isDarkMode, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();

  const guardUser = user || APP_CONFIG.DEMO_GUARD;

  const handleLogout = () => {
    Alert.alert(
      'End Shift & Log Out',
      'Are you sure you want to end your shift and log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Shift',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Security Profile"
        subtitle="Staff Credentials & Shift"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Guard Credentials Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: 'transparent',
                  borderColor: colors.border,
                  borderWidth: 1.5,
                },
              ]}
            >
              <Ionicons name="person" size={32} color={colors.warningDark} />
            </View>
            <View style={styles.nameSection}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {guardUser.name}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {guardUser.email}
              </Text>
              <View style={styles.roleChip}>
                <Ionicons name="shield-checkmark" size={12} color={colors.warningDark} />
                <Text style={[styles.roleChipText, { color: colors.warningDark }]}>
                  Authorized Verification Officer
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Staff Security ID
              </Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>
                {guardUser.enrollment || 'SEC-804'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Duty Station
              </Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>
                Main Sports Complex Gate
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Active Shift
              </Text>
              <Text style={[styles.infoVal, { color: colors.success }]}>
                Evening (3:30 PM – 9:00 PM)
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Scanner Clearance
              </Text>
              <Text style={[styles.infoVal, { color: colors.primary }]}>
                Level-2 Campus Verifier
              </Text>
            </View>
          </View>
        </Card>

        {/* System Settings & Utilities */}
        <Card variant="elevated" style={styles.settingsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Security Terminal Settings
          </Text>

          {/* Dark Mode Switch */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons
                name={isDarkMode ? 'moon' : 'sunny'}
                size={20}
                color={colors.primary}
              />
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Dark Theme Mode
                </Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                  Optimize display for night patrols
                </Text>
              </View>
            </View>

            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#CBD5E1', true: colors.primaryLight }}
              thumbColor={isDarkMode ? colors.primary : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          {/* Campus Control Room & Support */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="headset-outline" size={20} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Campus Security & Admin Support
                </Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                  Hotline: {APP_CONFIG.EMERGENCY_SECURITY_PHONE}
                </Text>
                <Text style={[styles.settingSub, { color: colors.textMuted, marginTop: 2 }]}>
                  Email: {APP_CONFIG.HELPDESK_EMAIL}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* LOGOUT */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={[
            styles.logoutButton,
            {
              backgroundColor: isDarkMode
                ? 'rgba(239, 68, 68, 0.12)'
                : 'rgba(239, 68, 68, 0.06)',
              borderColor: isDarkMode
                ? 'rgba(239, 68, 68, 0.35)'
                : 'rgba(239, 68, 68, 0.25)',
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>
            End Shift & Log Out
          </Text>
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
  profileCard: {
    padding: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameSection: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 13,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    marginVertical: 14,
  },
  infoList: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 13,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  settingsCard: {
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
    borderWidth: 1.5,
    marginTop: 10,
    alignSelf: 'center',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { APP_CONFIG } from '../../constants/config';
import { StayExtensionService } from '../../services/stayExtensionService';
import { useAuthStore } from '../../store/authStore';
import { useStayExtensionStore } from '../../store/stayExtensionStore';
import { useThemeStore } from '../../store/themeStore';
import { formatTime12h, getRemainingTime } from '../../utils/dateUtils';

export default function StudentProfileScreen() {
  const router = useRouter();
  const { colors, isDarkMode, toggleTheme } = useThemeStore();
  const { user, logout, updateUserProfile } = useAuthStore();
  const { extensions, refreshStatuses } = useStayExtensionStore();

  const studentUser = user as NonNullable<typeof user>;

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [name, setName] = useState(studentUser.name);
  const [department, setDepartment] = useState(studentUser.department);
  const [year, setYear] = useState(studentUser.year || '');
  const [phone, setPhone] = useState(studentUser.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [tick, setTick] = useState(0);

  const isFocused = useIsFocused();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.98);

  useEffect(() => {
    if (isFocused) {
      opacity.value = 0;
      scale.value = 0.98;
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [isFocused]);

  const animatedPageStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Refresh pass statuses when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshStatuses();
    }, [refreshStatuses])
  );

  // Real-time ticker to auto-update status when time passes 4 PM / 8 PM / expiry
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Compute dynamic Facility Pass Status
  const passStatus = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeVal = currentHour + currentMinute / 60;
    const startHour = APP_CONFIG.OPERATING_HOURS_START; // 16 (4:00 PM)
    const endHour = APP_CONFIG.OPERATING_HOURS_END;     // 20 (8:00 PM)

    // 1. Check if student has a valid active pass
    const activePass = StayExtensionService.getActiveStudentPass(extensions, studentUser.id);
    if (activePass) {
      const { isExpired } = getRemainingTime(activePass.validUntil);
      if (!isExpired) {
        return {
          label: `✅ Active (Till ${formatTime12h(activePass.validUntil)})`,
          color: colors.success,
        };
      }
    }

    // 2. After 8:00 PM: Facility closed for today (booking not allowed)
    if (currentTimeVal >= endHour) {
      return {
        label: '❌ Expired (Closed for Today)',
        color: colors.danger,
      };
    }

    // 3. Between 4:00 PM & 8:00 PM (Facility open): Student has not booked / paid yet
    if (currentTimeVal >= startHour && currentTimeVal < endHour) {
      return {
        label: '⭕ Book Pass (4 PM – 8 PM)',
        color: colors.warning,
      };
    }

    // 4. Before 4:00 PM: Facility not yet open
    return {
      label: '⭕ Inactive (Opens at 4:00 PM)',
      color: colors.textMuted,
    };
  }, [extensions, studentUser.id, colors, tick]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        department: department.trim(),
        year: year.trim(),
        phone: phone.trim(),
      });
      setEditModalVisible(false);
    } catch (error: any) {
      Alert.alert(
        'Could Not Save',
        error?.message || 'Something went wrong while saving your profile. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
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
      <Animated.View style={[animatedPageStyle, { flex: 1 }]}>
      <Header
        title="My Profile"
        subtitle="Student Sports Membership"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
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
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
            <View style={styles.nameSection}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {studentUser.name}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {studentUser.email}
              </Text>
              <View style={styles.roleChip}>
                <Ionicons name="school" size={12} color={colors.primary} />
                <Text style={[styles.roleChipText, { color: colors.primary }]}>
                  Poornima University Student
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Academic Info */}
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Registration Number
              </Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>
                {studentUser.enrollment}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Department
              </Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>
                {studentUser.department}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Academic Year
              </Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>
                {studentUser.year}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Phone Number
              </Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>
                {studentUser.phone}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Facility Pass Status
              </Text>
              <Text style={[styles.infoVal, { color: passStatus.color }]}>
                {passStatus.label}
              </Text>
            </View>
          </View>

          {/* Edit Profile CTA */}
          <Button
            title="Edit Profile"
            variant="outline"
            size="sm"
            icon="create-outline"
            onPress={() => setEditModalVisible(true)}
            style={styles.editBtn}
          />
        </Card>

        {/* Preferences & Settings */}
        <Card variant="elevated" style={styles.settingsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            App Preferences
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
                  Switch between light and dark UI
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

          {/* Operating Hours Info */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="time-outline" size={20} color={colors.warning} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Complex Operating Hours
                </Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                  4:00 PM to 8:00 PM (Daily)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Contact Us */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="headset-outline" size={20} color={colors.info} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Contact Us
                </Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                  Phone: {APP_CONFIG.EMERGENCY_SECURITY_PHONE}
                </Text>
                <Text style={[styles.settingSub, { color: colors.textMuted, marginTop: 2 }]}>
                  Email: {APP_CONFIG.HELPDESK_EMAIL}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* LOGOUT BUTTON */}
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
            Log Out from Account
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        title="Edit Profile"
      >
        <View style={styles.modalContent}>
          <Input
            label="Student Full Name"
            value={name}
            onChangeText={setName}
            leftIcon="person-outline"
          />

          <Input
            label="Department"
            value={department}
            onChangeText={setDepartment}
            leftIcon="school-outline"
          />

          <Input
            label="Academic Year"
            value={year}
            onChangeText={setYear}
            leftIcon="calendar-outline"
          />

          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            leftIcon="call-outline"
            keyboardType="phone-pad"
          />

          <Button
            title="Save Profile Updates"
            variant="primary"
            icon="save-outline"
            onPress={handleSaveProfile}
            loading={isSaving}
            disabled={isSaving}
            style={{ marginTop: 8 }}
          />
        </View>
      </Modal>
      </Animated.View>
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
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
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
  editBtn: {
    marginTop: 16,
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
  modalContent: {
    gap: 10,
    paddingTop: 8,
  },
});

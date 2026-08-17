import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { APP_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function StudentProfileScreen() {
  const router = useRouter();
  const { colors, isDarkMode, toggleTheme } = useThemeStore();
  const { user, logout, updateUserProfile } = useAuthStore();

  const studentUser = user || APP_CONFIG.DEMO_STUDENT;

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [name, setName] = useState(studentUser.name);
  const [department, setDepartment] = useState(studentUser.department || 'Computer Science');
  const [year, setYear] = useState(studentUser.year || '2nd Year');

  const handleSaveProfile = () => {
    updateUserProfile({
      name: name.trim(),
      department: department.trim(),
      year: year.trim(),
    });
    setEditModalVisible(false);
  };

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitials}>
                {studentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
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
                Enrollment Number
              </Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>
                {studentUser.enrollment || 'PU-2024-1001'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Department
              </Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>
                {studentUser.department || 'Computer Science & Engineering'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Academic Year
              </Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>
                {studentUser.year || '2nd Year'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                Facility Pass Status
              </Text>
              <Text style={[styles.infoVal, { color: colors.success }]}>
                ✅ Registered Active
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

          {/* Security Helpdesk */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="call-outline" size={20} color={colors.info} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Security Helpdesk
                </Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                  {APP_CONFIG.EMERGENCY_SECURITY_PHONE}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* LOGOUT BUTTON */}
        <Button
          title="LOGOUT FROM ACCOUNT"
          variant="danger"
          size="lg"
          icon="log-out-outline"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />

        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          {APP_CONFIG.APP_NAME} v1.0.0 • {APP_CONFIG.UNIVERSITY_NAME}
        </Text>
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

          <Button
            title="Save Profile Updates"
            variant="primary"
            icon="save-outline"
            onPress={handleSaveProfile}
            style={{ marginTop: 8 }}
          />
        </View>
      </Modal>
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
  logoutBtn: {
    marginTop: 8,
  },
  versionText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  modalContent: {
    gap: 10,
    paddingTop: 8,
  },
});

import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { User } from '../../types';

/**
 * Returns true only when every mandatory profile field is filled in.
 * A student cannot access any (student) screen until this is true.
 */
export function isStudentProfileComplete(user: User | null): boolean {
  if (!user) return false;
  return Boolean(
    user.name?.trim() &&
      user.enrollment?.trim() &&
      user.department?.trim() &&
      user.year?.trim() &&
      user.phone?.trim()
  );
}

/**
 * Blocking onboarding screen. Rendered INSTEAD of the student tabs whenever
 * the logged-in student's profile is missing any mandatory field.
 * No fake/demo values are ever pre-filled here — the student must type
 * their own real details before they can use the rest of the app.
 */
export function CompleteProfileGate() {
  const { colors, isDarkMode } = useThemeStore();
  const { user, updateUserProfile, logout } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const [name, setName] = useState(user?.name || '');
  const [enrollment, setEnrollment] = useState(user?.enrollment || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [year, setYear] = useState(user?.year || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!enrollment.trim()) next.enrollment = 'Registration number is required';
    if (!department.trim()) next.department = 'Department is required';
    if (!year.trim()) next.year = 'Academic year is required';
    if (!phone.trim()) next.phone = 'Phone number is required';
    else if (!/^[0-9+\-\s]{7,15}$/.test(phone.trim())) next.phone = 'Enter a valid phone number';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        enrollment: enrollment.trim(),
        department: department.trim(),
        year: year.trim(),
        phone: phone.trim(),
      });
    } catch (error: any) {
      Alert.alert(
        'Could Not Save',
        error?.message || 'Something went wrong while saving your profile. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleScrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={true}
        bounces={true}
      >
        <View style={styles.headerBlock}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.15)' : '#EFF6FF' },
            ]}
          >
            <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Complete Your Profile</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Please fill in your real details below. You won't be able to use Sportsforall
            until your profile is complete.
          </Text>
        </View>

        <Card variant="elevated" style={styles.formCard}>
          <Input
            label="Full Name"
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
            leftIcon="person-outline"
            error={errors.name}
          />
          <Input
            label="Registration Number"
            placeholder="e.g. PU-2024-XXXX"
            value={enrollment}
            onChangeText={setEnrollment}
            leftIcon="id-card-outline"
            autoCapitalize="characters"
            error={errors.enrollment}
          />
          <Input
            label="Department"
            placeholder="e.g. Computer Science & Engineering"
            value={department}
            onChangeText={setDepartment}
            leftIcon="school-outline"
            error={errors.department}
          />
          <Input
            label="Academic Year"
            placeholder="e.g. 2nd Year"
            value={year}
            onChangeText={setYear}
            leftIcon="calendar-outline"
            error={errors.year}
            onFocus={handleScrollToBottom}
          />
          <Input
            label="Phone Number"
            placeholder="Your contact number"
            value={phone}
            onChangeText={setPhone}
            leftIcon="call-outline"
            keyboardType="phone-pad"
            error={errors.phone}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            onFocus={handleScrollToBottom}
          />

          <Button
            title="Save & Continue"
            variant="primary"
            icon="checkmark-circle-outline"
            onPress={handleSubmit}
            loading={isSaving}
            disabled={isSaving}
            style={{ marginTop: 8 }}
          />
        </Card>

        <TouchableOpacity onPress={() => logout()} style={styles.logoutLink}>
          <Text style={[styles.logoutLinkText, { color: colors.textMuted }]}>
            Not you? Log out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 48,
    paddingBottom: 220,
    flexGrow: 1,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 22,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 320,
  },
  formCard: {
    padding: 20,
  },
  logoutLink: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 8,
  },
  logoutLinkText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

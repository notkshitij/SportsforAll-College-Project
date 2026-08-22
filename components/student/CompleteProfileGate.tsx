import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
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
import { parsePoornimaEmail, verifyStudentDetailsWithEmail } from '../../utils/emailParser';

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
 * No fake/demo values are pre-filled — the student must enter their own real details
 * which are strictly verified against their Poornima University student email credentials.
 */
export function CompleteProfileGate() {
  const router = useRouter();
  const { colors, isDarkMode } = useThemeStore();
  const { user, parsedEmail: storeParsedEmail, updateUserProfile, logout } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  // Compute parsed email directly from user.email or store
  const parsedEmail = useMemo(() => {
    if (user?.email) return parsePoornimaEmail(user.email);
    return storeParsedEmail;
  }, [storeParsedEmail, user?.email]);

  // Keep fields empty for new onboarding (no pre-fill, as requested)
  const [name, setName] = useState('');
  const [enrollment, setEnrollment] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mismatchList, setMismatchList] = useState<string[]>([]);

  const validate = (): boolean => {
    const verification = verifyStudentDetailsWithEmail(
      {
        name,
        enrollment,
        department,
        year,
        phone,
      },
      parsedEmail
    );

    setErrors(verification.errors);
    setMismatchList(verification.mismatches);

    if (!verification.isValid || verification.mismatches.length > 0) {
      if (verification.mismatches.length > 0) {
        Alert.alert(
          '⚠️ Verification Mismatch',
          `The credentials you entered do not match your university email (${user?.email}):\n\n• ` +
            verification.mismatches.join('\n• ') +
            '\n\nPlease correct the marked fields to continue.',
          [{ text: 'Review & Correct', style: 'default' }]
        );
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        enrollment: enrollment.trim().toUpperCase(),
        department: department.trim(),
        year: year.trim(),
        phone: phone.trim(),
      });
    } catch (error: any) {
      Alert.alert(
        'Could Not Save Profile',
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
            <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Student Identity Verification</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Please enter your official student credentials below. Details are cross-verified with your
            authenticated Poornima University email ID.
          </Text>
        </View>

        {/* Email Verification Banner */}
        <View
          style={[
            styles.emailBanner,
            {
              backgroundColor: isDarkMode ? 'rgba(30, 58, 138, 0.3)' : '#EFF6FF',
              borderColor: isDarkMode ? '#1E3A8A' : '#BFDBFE',
            },
          ]}
        >
          <View style={styles.emailBannerHeader}>
            <Ionicons name="mail-outline" size={16} color={colors.primary} />
            <Text style={[styles.emailBannerLabel, { color: colors.primary }]}>
              Authenticated University Account
            </Text>
          </View>
          <Text style={[styles.emailValue, { color: colors.text }]}>{user?.email}</Text>
          {parsedEmail?.isStudentEmail && (
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.parsedBadge,
                  { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' },
                ]}
              >
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text style={styles.parsedBadgeText}>Email Verified</Text>
              </View>
              <Text style={[styles.parsedHint, { color: colors.textMuted }]}>
                {parsedEmail.firstName} • {parsedEmail.course} {parsedEmail.specialization} • Batch {parsedEmail.year}
              </Text>
            </View>
          )}
        </View>

        {/* Mismatch Alert Box if any */}
        {mismatchList.length > 0 && (
          <View style={styles.mismatchAlertBox}>
            <View style={styles.mismatchHeader}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.mismatchTitle}>Detail Mismatch Red-Flag</Text>
            </View>
            {mismatchList.map((m, idx) => (
              <Text key={idx} style={styles.mismatchItem}>
                • {m}
              </Text>
            ))}
          </View>
        )}

        <Card variant="elevated" style={styles.formCard}>
          <Input
            label="Full Name"
            placeholder="e.g. Manveer Singh"
            value={name}
            onChangeText={(val) => {
              setName(val);
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: '' }));
              }
            }}
            leftIcon="person-outline"
            error={errors.name}
          />
          <Input
            label="Registration / Roll Number"
            placeholder="e.g. PU-2024-1234 or 1234"
            value={enrollment}
            onChangeText={(val) => {
              setEnrollment(val);
              if (errors.enrollment) {
                setErrors((prev) => ({ ...prev, enrollment: '' }));
              }
            }}
            leftIcon="id-card-outline"
            autoCapitalize="characters"
            error={errors.enrollment}
          />
          <Input
            label="Department / Course"
            placeholder="e.g. Computer Science & Engineering"
            value={department}
            onChangeText={(val) => {
              setDepartment(val);
              if (errors.department) {
                setErrors((prev) => ({ ...prev, department: '' }));
              }
            }}
            leftIcon="school-outline"
            error={errors.department}
          />
          <Input
            label="Academic Year"
            placeholder="e.g. 2nd Year (2024) or 2024"
            value={year}
            onChangeText={(val) => {
              setYear(val);
              if (errors.year) {
                setErrors((prev) => ({ ...prev, year: '' }));
              }
            }}
            leftIcon="calendar-outline"
            error={errors.year}
            onFocus={handleScrollToBottom}
          />
          <Input
            label="Phone Number"
            placeholder="10-digit mobile number"
            value={phone}
            onChangeText={(val) => {
              setPhone(val);
              if (errors.phone) {
                setErrors((prev) => ({ ...prev, phone: '' }));
              }
            }}
            leftIcon="call-outline"
            keyboardType="phone-pad"
            error={errors.phone}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            onFocus={handleScrollToBottom}
          />

          <Button
            title="Verify & Save Profile"
            variant="primary"
            icon="shield-checkmark-outline"
            onPress={handleSubmit}
            loading={isSaving}
            disabled={isSaving}
            style={{ marginTop: 12 }}
          />
        </Card>

        <TouchableOpacity 
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }} 
          style={styles.logoutLink}
        >
          <Text style={[styles.logoutLinkText, { color: colors.textMuted }]}>
            Not you? Log out of this account
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
    marginBottom: 18,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  emailBanner: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    gap: 4,
  },
  emailBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emailBannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emailValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  parsedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  parsedBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  parsedHint: {
    fontSize: 12,
    fontWeight: '500',
  },
  mismatchAlertBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 4,
  },
  mismatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  mismatchTitle: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
  mismatchItem: {
    color: '#DC2626',
    fontSize: 12,
    lineHeight: 16,
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

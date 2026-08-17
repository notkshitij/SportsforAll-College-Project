import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { APP_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { isValidPoornimaEmail } from '../../utils/validationUtils';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useThemeStore();
  const { loginWithGoogle, loginWithEmail } = useAuthStore();

  const [isGoogleModalVisible, setIsGoogleModalVisible] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customError, setCustomError] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  // Real Supabase Google OAuth Trigger
  const handleDirectGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const user = await loginWithGoogle();
      if (user.role === 'guard') {
        router.replace('/(guard)');
      } else {
        router.replace('/(student)');
      }
    } catch (err: any) {
      // If user cancelled, just stop loading
      if (err.message && (err.message.includes('cancelled') || err.message.includes('dismissed'))) {
        setLoadingGoogle(false);
        return;
      }
      // If network/provider requires account selection or custom entry
      setIsGoogleModalVisible(true);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleManualGoogleAuthenticate = async (targetEmail: string) => {
    const cleanEmail = targetEmail.trim().toLowerCase();

    // Strict validation: Only @poornima.edu.in is allowed
    if (!isValidPoornimaEmail(cleanEmail)) {
      const errorMsg = 'Access Restricted: Only official @poornima.edu.in Google Workspace accounts are permitted to access the Sports Complex.';
      if (showCustomInput) {
        setCustomError(errorMsg);
      } else {
        Alert.alert('Google Sign-In Error', errorMsg);
      }
      return;
    }

    setCustomError('');
    setLoadingEmail(cleanEmail);

    try {
      const user = await loginWithEmail(cleanEmail);
      setIsGoogleModalVisible(false);
      
      if (user.role === 'guard') {
        router.replace('/(guard)');
      } else {
        router.replace('/(student)');
      }
    } catch (err: any) {
      Alert.alert('Authentication Failed', err.message || 'Could not sign in with Google. Please try again.');
    } finally {
      setLoadingEmail(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Sportsforall" subtitle="Poornima University Portal" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner Card with PU Logo */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDarkMode ? '#1E3A8A' : colors.primary,
            },
          ]}
        >
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/pu_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.heroTitle}>{APP_CONFIG.APP_NAME}</Text>
          <Text style={styles.heroSubtitle}>
            Official Sports & Recreation Facility Access Management
          </Text>
          <View style={styles.univBadge}>
            <Ionicons name="school" size={14} color="#93C5FD" />
            <Text style={styles.univBadgeText}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
          </View>
        </View>

        {/* Google Authentication Card */}
        <Card variant="elevated" style={styles.authCard}>
          <View style={styles.authCardHeader}>
            <Text style={[styles.authCardTitle, { color: colors.text }]}>
              University Login
            </Text>
            <Text style={[styles.authCardSubtitle, { color: colors.textSecondary }]}>
              Sign in securely using your Poornima University Google account (@poornima.edu.in).
            </Text>
          </View>

          {/* Continue with Google Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleDirectGoogleLogin}
            disabled={loadingGoogle}
            style={[
              styles.googleBtn,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderColor: isDarkMode ? '#334155' : '#CBD5E1',
              },
            ]}
          >
            {loadingGoogle ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <>
                <View style={styles.googleIconCircle}>
                  <Ionicons name="logo-google" size={20} color="#4285F4" />
                </View>
                <Text
                  style={[
                    styles.googleBtnText,
                    { color: isDarkMode ? '#F8FAFC' : '#1E293B' },
                  ]}
                >
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Domain Restriction Notice */}
          <View style={styles.domainBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={[styles.domainBadgeText, { color: colors.primary }]}>
              Only @poornima.edu.in accounts authorized
            </Text>
          </View>
        </Card>

        {/* Guidelines info */}
        <View style={styles.guidelinesBox}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.guidelinesText, { color: colors.textSecondary }]}>
            Students and security staff can access facility passes and scanner features according to campus operating hours (4:00 PM – 8:00 PM).
          </Text>
        </View>
      </ScrollView>

      {/* Google Account Selector Modal */}
      <Modal
        visible={isGoogleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsGoogleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.googleModalContent,
              { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' },
            ]}
          >
            {/* Google Header */}
            <View style={styles.modalHeader}>
              <View style={styles.googleModalTitleRow}>
                <Ionicons name="logo-google" size={24} color="#EA4335" />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Sign in with Google
                </Text>
              </View>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Choose a Poornima University Google account to continue to Sportsforall
              </Text>
            </View>

            {/* Account List */}
            <View style={styles.accountList}>
              {/* Student Google Account */}
              <TouchableOpacity
                style={[
                  styles.accountItem,
                  {
                    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleManualGoogleAuthenticate('arjun.sharma@poornima.edu.in')}
                disabled={loadingEmail !== null}
              >
                <View style={[styles.avatarCircle, { backgroundColor: '#3B82F6' }]}>
                  <Text style={styles.avatarLetter}>A</Text>
                </View>
                <View style={styles.accountDetails}>
                  <Text style={[styles.accountName, { color: colors.text }]}>
                    Arjun Sharma (Student)
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
                    arjun.sharma@poornima.edu.in
                  </Text>
                </View>
                {loadingEmail === 'arjun.sharma@poornima.edu.in' ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                )}
              </TouchableOpacity>

              {/* Guard Google Account */}
              <TouchableOpacity
                style={[
                  styles.accountItem,
                  {
                    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleManualGoogleAuthenticate('guard@poornima.edu.in')}
                disabled={loadingEmail !== null}
              >
                <View style={[styles.avatarCircle, { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.avatarLetter}>S</Text>
                </View>
                <View style={styles.accountDetails}>
                  <Text style={[styles.accountName, { color: colors.text }]}>
                    Security Staff (Checkpoint Guard)
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
                    guard@poornima.edu.in
                  </Text>
                </View>
                {loadingEmail === 'guard@poornima.edu.in' ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                )}
              </TouchableOpacity>

              {/* Custom Google Account Input */}
              {!showCustomInput ? (
                <TouchableOpacity
                  style={[
                    styles.accountItem,
                    styles.useAnotherItem,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setShowCustomInput(true)}
                  disabled={loadingEmail !== null}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: '#64748B' }]}>
                    <Ionicons name="person-add" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={[styles.accountName, { color: colors.text }]}>
                      Use another @poornima.edu.in account
                    </Text>
                    <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
                      Enter your university email
                    </Text>
                  </View>
                  <Ionicons name="add" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <View
                  style={[
                    styles.customInputContainer,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                      borderColor: customError ? colors.danger : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.customInputLabel, { color: colors.textSecondary }]}>
                    Google Workspace Email:
                  </Text>
                  <TextInput
                    style={[styles.customTextInput, { color: colors.text }]}
                    placeholder="your.name@poornima.edu.in"
                    placeholderTextColor={colors.textMuted}
                    value={customEmail}
                    onChangeText={(t) => {
                      setCustomEmail(t);
                      if (customError) setCustomError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />
                  {customError ? (
                    <Text style={[styles.customErrorText, { color: colors.danger }]}>
                      {customError}
                    </Text>
                  ) : null}

                  <View style={styles.customBtnRow}>
                    <TouchableOpacity
                      style={[styles.cancelBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        setShowCustomInput(false);
                        setCustomError('');
                      }}
                    >
                      <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleManualGoogleAuthenticate(customEmail)}
                      disabled={loadingEmail !== null}
                    >
                      {loadingEmail ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.confirmBtnText}>Sign In</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Modal Close Button */}
            <TouchableOpacity
              style={[styles.closeModalBtn, { borderTopColor: colors.border }]}
              onPress={() => {
                setIsGoogleModalVisible(false);
                setShowCustomInput(false);
                setCustomError('');
              }}
            >
              <Text style={[styles.closeModalText, { color: colors.textMuted }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
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
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 18,
    alignItems: 'center',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#DBEAFE',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  univBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  univBadgeText: {
    color: '#E0E7FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  authCard: {
    padding: 22,
    marginBottom: 16,
    alignItems: 'center',
  },
  authCardHeader: {
    marginBottom: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  authCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  authCardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
    marginBottom: 16,
  },
  googleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  domainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  domainBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  guidelinesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  guidelinesText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  googleModalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    marginBottom: 20,
  },
  googleModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  accountList: {
    gap: 10,
    marginBottom: 18,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  useAnotherItem: {
    borderStyle: 'dashed',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '700',
  },
  accountEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  customInputContainer: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  customInputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  customTextInput: {
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  customErrorText: {
    fontSize: 11,
    fontWeight: '600',
  },
  customBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  closeModalBtn: {
    borderTopWidth: 1,
    paddingTop: 14,
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

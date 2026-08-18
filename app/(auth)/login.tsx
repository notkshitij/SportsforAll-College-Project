import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { APP_CONFIG } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useThemeStore();
  const { loginWithGoogle } = useAuthStore();

  const [loadingGoogle, setLoadingGoogle] = useState(false);

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
      // If user cancelled, just stop loading silently
      if (err.message && (err.message.includes('cancelled') || err.message.includes('dismissed'))) {
        setLoadingGoogle(false);
        return;
      }
      Alert.alert('Google Sign-In Failed', err.message || 'Could not sign in with Google. Please try again.');
    } finally {
      setLoadingGoogle(false);
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
});


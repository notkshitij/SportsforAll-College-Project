import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { APP_CONFIG } from '../../constants/config';
import { ProfileService } from '../../services/profileService';
import { formatSupabaseUser, supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { isValidPoornimaEmail } from '../../utils/validationUtils';

// Intercept browser auth session if open
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  const router = useRouter();
  const searchParams = useGlobalSearchParams();
  const { colors, isDarkMode } = useThemeStore();
  const { setUser } = useAuthStore();

  const [statusText, setStatusText] = useState('Verifying your credentials...');
  const [hasError, setHasError] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const processedRef = useRef(false);

  useEffect(() => {
    // Gentle pulse animation for the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    async function handleAuthRedirect() {
      try {
        setStatusText('Completing sign-in...');

        // 1. Check tokens/code from searchParams or full initial URL
        let accessToken = (searchParams.access_token as string) || '';
        let refreshToken = (searchParams.refresh_token as string) || '';
        let code = (searchParams.code as string) || '';
        const errorDesc = (searchParams.error_description as string) || (searchParams.error as string);

        if (errorDesc) {
          throw new Error(decodeURIComponent(errorDesc));
        }

        // Parse hash fragments if params weren't automatically unpacked
        if (!accessToken || !code) {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            try {
              const urlObj = new URL(initialUrl);
              const hashParams = new URLSearchParams(urlObj.hash.replace(/^#/, ''));
              const queryParams = urlObj.searchParams;

              accessToken = accessToken || hashParams.get('access_token') || queryParams.get('access_token') || '';
              refreshToken = refreshToken || hashParams.get('refresh_token') || queryParams.get('refresh_token') || '';
              code = code || hashParams.get('code') || queryParams.get('code') || '';
            } catch (_) {}
          }
        }

        // 2. Hydrate session in Supabase client
        if (accessToken && refreshToken) {
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionErr) throw sessionErr;
        } else if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) throw exchangeErr;
        }

        // 3. Fetch active user from Supabase session
        setStatusText('Validating university account...');
        const { data: userData, error: userErr } = await supabase.auth.getUser();

        if (userErr || !userData?.user?.email) {
          // If no direct session user found, wait briefly and retry once
          await new Promise((r) => setTimeout(r, 600));
          const retry = await supabase.auth.getUser();
          if (retry.error || !retry.data?.user?.email) {
            throw new Error('Could not establish an authenticated session. Please try logging in again.');
          }
          userData.user = retry.data.user;
        }

        const sbUser = userData.user;
        const email = sbUser.email!.toLowerCase();

        // 4. Strict Domain Check for @poornima.edu.in
        if (!isValidPoornimaEmail(email)) {
          await supabase.auth.signOut();
          setHasError(true);
          Alert.alert(
            'Access Restricted',
            'Only official @poornima.edu.in Google Workspace accounts are permitted to enter the Sports Complex.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(auth)/login'),
              },
            ]
          );
          return;
        }

        // 5. Build user profile and update auth state
        const freshUser = formatSupabaseUser(sbUser);
        let finalUser = freshUser;

        try {
          const savedProfile = await ProfileService.getProfile(freshUser.id);
          if (savedProfile) {
            finalUser = { ...freshUser, ...savedProfile, id: freshUser.id, email: freshUser.email, role: freshUser.role };
          }
        } catch (_) {}

        setUser(finalUser);

        // Background profile upsert
        ProfileService.upsertProfile(finalUser).catch(() => {});

        setStatusText('Welcome! Redirecting...');
        setTimeout(() => {
          if (finalUser.role === 'guard') {
            router.replace('/(student)');
          } else {
            router.replace('/(student)');
          }
        }, 400);
      } catch (err: any) {
        console.warn('Auth callback resolution error:', err?.message);
        setHasError(true);
        setStatusText('Authentication failed');

        if (err.message && (err.message.includes('cancelled') || err.message.includes('dismissed'))) {
          router.replace('/(auth)/login');
          return;
        }

        Alert.alert(
          'Sign-In Failed',
          err.message || 'Could not complete Google sign-in. Please try again.',
          [
            {
              text: 'Return to Login',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      }
    }

    handleAuthRedirect();
  }, [searchParams, router, setUser]);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#0F172A' : '#1E3A8A' }]}>
      <View style={styles.circleBg1} />
      <View style={styles.circleBg2} />

      <View style={styles.content}>
        {/* Animated Logo Badge */}
        <Animated.View style={[styles.logoBadge, { transform: [{ scale: pulseAnim }] }]}>
          <Image
            source={require('../../assets/pu_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Text style={styles.appTitle}>{APP_CONFIG.APP_NAME}</Text>

        <View style={styles.univBadge}>
          <Ionicons name="school" size={14} color="#93C5FD" />
          <Text style={styles.univName}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
        </View>

        <View style={styles.statusBox}>
          {!hasError ? (
            <ActivityIndicator size="small" color="#93C5FD" style={styles.spinner} />
          ) : (
            <Ionicons name="alert-circle" size={20} color="#F87171" style={styles.spinner} />
          )}
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        <View style={styles.domainPill}>
          <Ionicons name="shield-checkmark" size={12} color="#93C5FD" />
          <Text style={styles.domainText}>Official Poornima Portal</Text>
        </View>
      </View>

      <Text style={styles.copyright}>
        © 2026 Poornima University • Security & Sports Portal
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  circleBg1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  circleBg2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  univBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 24,
  },
  univName: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  spinner: {
    marginRight: 2,
  },
  statusText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  domainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(147, 197, 253, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  domainText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '600',
  },
  copyright: {
    color: '#94A3B8',
    fontSize: 11,
  },
});

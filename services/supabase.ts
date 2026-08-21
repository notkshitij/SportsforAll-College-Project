import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import { User } from '../types';
import { isValidPoornimaEmail } from '../utils/validationUtils';

WebBrowser.maybeCompleteAuthSession();

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://ktjfylevvydjvfycpjqm.supabase.co';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_lyO1Pi6oid4lgFOxgBmShA_eip8L8Ng';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

function getGoogleSignin() {
  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    return GoogleSignin;
  } catch (e) {
    return null;
  }
}

/**
 * Native Google Sign-In (Android) -> exchanges idToken with Supabase.
 * No browser, no redirect URL needed.
 */
export async function signInWithGoogleNative(): Promise<{ user: User }> {
  const GoogleSignin = getGoogleSignin();
  if (!GoogleSignin) {
    if (Platform.OS === 'web') {
      return signInWithGoogleOAuth();
    }
    throw new Error('Native Google Sign-In module (@react-native-google-signin/google-signin) is not available in runtime binary.');
  }

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  if (!webClientId) {
    throw new Error('EXPO_PUBLIC_GOOGLE_CLIENT_ID is not configured.');
  }

  try {
    GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
    });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  } catch (e: any) {
    console.error('[GoogleSignin] Configure or Play Services check failed:', e?.message || e);
    throw new Error(`Google Play Services error: ${e?.message || 'Configuration failed'}`);
  }

  let signInResult: any;
  try {
    signInResult = await GoogleSignin.signIn();
  } catch (e: any) {
    // User cancelled / dismissed the account picker
    if (
      e?.code === '12501' ||
      e?.code === 'SIGN_IN_CANCELLED' ||
      e?.message?.toLowerCase().includes('cancel') ||
      e?.message?.toLowerCase().includes('dismiss')
    ) {
      throw new Error('Google Sign-In was cancelled.');
    }

    // Keystore / SHA-1 mismatch error (DEVELOPER_ERROR / Code 10 / Code 12500)
    if (e?.code === '10' || e?.code === 'DEVELOPER_ERROR' || e?.code === '12500') {
      const errMsg = `Google Sign-In configuration error (Code ${e?.code}): SHA-1 certificate fingerprint of this build's keystore is not registered in Google Cloud Console OAuth Client for package com.sportsforall.app.`;
      console.error('[GoogleSignin]', errMsg, e);
      throw new Error(errMsg);
    }

    console.error('[GoogleSignin] signIn() failed:', e?.code, e?.message || e);
    throw new Error(e?.message || `Google Sign-In failed (code: ${e?.code || 'UNKNOWN'}).`);
  }

  if (signInResult?.type === 'cancelled') {
    throw new Error('Google Sign-In was cancelled.');
  }

  // Newer versions nest payload under `.data`
  const idToken: string | undefined =
    signInResult?.data?.idToken || signInResult?.idToken;

  if (!idToken) {
    console.error('[GoogleSignin] No ID token received from native GoogleSignin:', signInResult);
    throw new Error('No ID token received from Google Play Services.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) {
    console.error('[GoogleSignin] Supabase signInWithIdToken failed:', error);
    throw new Error(error.message || 'Google sign-in authentication with Supabase failed.');
  }

  const sbUser = data.user;
  if (!sbUser || !sbUser.email) {
    throw new Error('No user email returned by Google.');
  }

  const email = sbUser.email.toLowerCase();

  if (!isValidPoornimaEmail(email)) {
    await supabase.auth.signOut();
    try {
      await GoogleSignin.signOut();
    } catch (_) {}
    throw new Error(
      'Access Restricted: Only official @poornima.edu.in Google Workspace accounts are permitted to enter the Sports Complex.'
    );
  }

  return { user: formatSupabaseUser(sbUser) };
}

export let authExchangeInFlight: Promise<{ user: User } | null> | null = null;

export function setAuthExchangeInFlight(promise: Promise<{ user: User } | null> | null) {
  authExchangeInFlight = promise;
}

/**
 * Coordinate exchange of OAuth code or tokens with a single-flight promise lock.
 * Prevents race-condition / duplicate code exchange when openAuthSessionAsync and callback.tsx race.
 */
export async function executeAuthExchange(params: {
  code?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  caller: string;
}): Promise<{ user: User }> {
  // If an exchange is already in flight, await the existing promise
  if (authExchangeInFlight) {
    console.log(`[AuthLock] ${params.caller}: Exchange already in flight, waiting for existing promise...`);
    const result = await authExchangeInFlight;
    if (result?.user) {
      return result;
    }
    throw new Error('Could not establish an authenticated session.');
  }

  const { code, accessToken, refreshToken, caller } = params;
  if (!code && (!accessToken || !refreshToken)) {
    throw new Error('No authentication credentials (code or tokens) provided for exchange.');
  }

  console.log(`[AuthLock] ${caller}: Initiating single-source OAuth credentials exchange...`);

  authExchangeInFlight = (async () => {
    try {
      let sessionDataUser = null;

      if (code) {
        console.log(`[AuthLock] ${caller}: Calling supabase.auth.exchangeCodeForSession(code)...`);
        const { data: sessionData, error: sessionErr } = await supabase.auth.exchangeCodeForSession(code);
        if (sessionErr) throw sessionErr;
        sessionDataUser = sessionData.user;
      } else if (accessToken && refreshToken) {
        console.log(`[AuthLock] ${caller}: Calling supabase.auth.setSession(tokens)...`);
        const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionErr) throw sessionErr;
        sessionDataUser = sessionData.user;
      }

      if (!sessionDataUser) {
        const { data: userData } = await supabase.auth.getUser();
        sessionDataUser = userData?.user;
      }

      if (!sessionDataUser || !sessionDataUser.email) {
        throw new Error('No user email returned by authentication provider.');
      }

      const email = sessionDataUser.email.toLowerCase();

      // Strict Domain Check
      if (!isValidPoornimaEmail(email)) {
        await supabase.auth.signOut();
        throw new Error(
          'Access Restricted: Only official @poornima.edu.in Google Workspace accounts are permitted to enter the Sports Complex.'
        );
      }

      return { user: formatSupabaseUser(sessionDataUser) };
    } finally {
      // Keep promise available briefly (5s) for trailing deep-link mounts, then reset
      setTimeout(() => {
        authExchangeInFlight = null;
      }, 5000);
    }
  })();

  return (await authExchangeInFlight) as { user: User };
}

/**
 * Perform Google OAuth through Supabase (Browser-based flow)
 */
export async function signInWithGoogleOAuth(): Promise<{ user: User }> {
  const redirectUrl = makeRedirectUri({
    scheme: 'sportsforall',
    path: 'auth/callback',
  });
  console.log('SUPABASE REDIRECT URL:', redirectUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: Platform.OS !== 'web',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        hd: 'poornima.edu.in', // Request Google to prioritize poornima.edu.in accounts
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Google sign-in initialization failed.');
  }

  // On Mobile: Open in-app browser session
  if (Platform.OS !== 'web' && data?.url) {
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (res.type === 'success' && res.url) {
      // Extract tokens / code from callback URL
      const parsedUrl = new URL(res.url);
      const params = new URLSearchParams(parsedUrl.hash.replace(/^#/, '') || parsedUrl.search);
      
      const code = params.get('code');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (code || (accessToken && refreshToken)) {
        return await executeAuthExchange({
          code,
          accessToken,
          refreshToken,
          caller: 'signInWithGoogleOAuth',
        });
      }
    } else if (res.type === 'cancel' || res.type === 'dismiss') {
      throw new Error('Google Sign-In was cancelled.');
    }
  }

  // If exchange was handled by callback screen in parallel, await it
  if (authExchangeInFlight) {
    console.log('[AuthLock] signInWithGoogleOAuth: Awaiting in-flight exchange from callback screen...');
    const result = await authExchangeInFlight;
    if (result?.user) return result;
  }

  // Check current session
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user?.email) {
    throw new Error('Could not establish an authenticated session. Please try logging in again.');
  }

  const email = userData.user.email.toLowerCase();
  if (!isValidPoornimaEmail(email)) {
    await supabase.auth.signOut();
    throw new Error(
      'Access Restricted: Only official @poornima.edu.in Google Workspace accounts are permitted to enter the Sports Complex.'
    );
  }

  return { user: formatSupabaseUser(userData.user) };
}

export function formatSupabaseUser(sbUser: any): User {
  const email = sbUser.email.toLowerCase();
  const isGuard = email.startsWith('guard') || email.includes('security');
  const metadata = sbUser.user_metadata || {};

  const name =
    metadata.full_name ||
    metadata.name ||
    email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  return {
    id: sbUser.id || (isGuard ? `guard_${Date.now()}` : `stu_${Date.now()}`),
    email,
    name: isGuard ? (name || 'Security Officer') : (name || ''),
    enrollment: isGuard ? 'SEC-STAFF' : '',
    department: isGuard ? 'Campus Security Department' : '',
    year: isGuard ? undefined : '',
    role: isGuard ? 'guard' : 'student',
    phone: metadata.phone || undefined,
    createdAt: sbUser.created_at || new Date().toISOString(),
  };
}

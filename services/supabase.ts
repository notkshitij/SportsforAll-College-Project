import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
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

// Configure native Google Sign-In (Android/iOS) once, on module load
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  offlineAccess: false,
});

/**
 * Native Google Sign-In (Android) -> exchanges idToken with Supabase.
 * No browser, no redirect URL needed.
 */
export async function signInWithGoogleNative(): Promise<{ user: User }> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const signInResult: any = await GoogleSignin.signIn();

  // Newer versions of the library nest the payload under `.data`
  const idToken: string | undefined =
    signInResult?.data?.idToken || signInResult?.idToken;

  if (!idToken) {
    throw new Error('No ID token received from Google.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) {
    throw new Error(error.message || 'Google sign-in failed.');
  }

  const sbUser = data.user;
  if (!sbUser || !sbUser.email) {
    throw new Error('No user email returned by Google.');
  }

  const email = sbUser.email.toLowerCase();

  if (!isValidPoornimaEmail(email)) {
    await supabase.auth.signOut();
    await GoogleSignin.signOut();
    throw new Error(
      'Access Restricted: Only official @poornima.edu.in Google Workspace accounts are permitted to enter the Sports Complex.'
    );
  }

  return { user: formatSupabaseUser(sbUser) };
}

/**
 * Perform Google OAuth through Supabase
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
      // Extract tokens from callback URL (hash or query params)
      const parsedUrl = new URL(res.url);
      const params = new URLSearchParams(parsedUrl.hash.replace(/^#/, '') || parsedUrl.search);
      
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionErr) throw sessionErr;
        
        const sbUser = sessionData.user;
        if (!sbUser || !sbUser.email) {
          throw new Error('No user email returned by Google.');
        }

        const email = sbUser.email.toLowerCase();

        // Strict Domain Check
        if (!isValidPoornimaEmail(email)) {
          await supabase.auth.signOut();
          throw new Error(
            'Access Restricted: Only official @poornima.edu.in Google Workspace accounts are permitted to enter the Sports Complex.'
          );
        }

        return { user: formatSupabaseUser(sbUser) };
      }
    } else if (res.type === 'cancel' || res.type === 'dismiss') {
      throw new Error('Google Sign-In was cancelled.');
    }
  }

  // Check current session
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user?.email) {
    throw new Error('Could not retrieve authenticated user profile.');
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

function formatSupabaseUser(sbUser: any): User {
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

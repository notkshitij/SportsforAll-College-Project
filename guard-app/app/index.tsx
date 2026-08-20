import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { APP_CONFIG } from '../src/constants/config';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const isNavigating = useRef(false);

  const navigateToScanner = useCallback(() => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    router.replace('/scanner');
  }, [router]);

  useEffect(() => {
    // Smooth Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Automatic smooth transition after 1.8s
    const navTimeout = setTimeout(() => {
      navigateToScanner();
    }, 1800);

    return () => {
      clearTimeout(navTimeout);
    };
  }, [navigateToScanner, fadeAnim, scaleAnim]);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={navigateToScanner}
    >
      <StatusBar style="light" />

      {/* Background radial glow elements */}
      <View style={styles.circleBg1} />
      <View style={styles.circleBg2} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Official Poornima University Logo */}
        <View style={styles.logoBadge}>
          <Image
            source={require('../assets/pu_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* App Title */}
        <Text style={styles.appTitle}>{APP_CONFIG.APP_NAME}</Text>

        {/* University Subheading */}
        <View style={styles.univBadge}>
          <Ionicons name="school" size={14} color="#93C5FD" />
          <Text style={styles.univName}>{APP_CONFIG.UNIVERSITY_NAME}</Text>
        </View>

        <Text style={styles.tagline}>
          Official Security Gate Checkpoint & Pass Verification Portal
        </Text>

        {/* Live Sports Status Pill */}
        <View style={styles.sportsRow}>
          <View style={styles.sportPill}>
            <Ionicons name="shield-checkmark" size={14} color="#38BDF8" />
            <Text style={styles.sportText}>Gate Checkpoint • Main Sports Complex</Text>
          </View>
        </View>
      </Animated.View>

      {/* Footer loading indicator */}
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#93C5FD" style={styles.loader} />
        <Text style={styles.copyright}>
          © 2026 Poornima University • Security & Gate Checkpoint
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A', // Deep Poornima Royal Navy
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
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 24,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  univBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 14,
  },
  univName: {
    color: '#E0E7FF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tagline: {
    color: '#93C5FD',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
    marginBottom: 28,
  },
  sportsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  sportText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  loader: {
    marginBottom: 4,
  },
  copyright: {
    color: '#94A3B8',
    fontSize: 11,
  },
});

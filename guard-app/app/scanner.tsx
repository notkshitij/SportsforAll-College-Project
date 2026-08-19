import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraScannerModal } from '../src/components/CameraScannerModal';
import { Header } from '../src/components/Header';
import { StudentPassVerificationCard } from '../src/components/StudentPassVerificationCard';
import { Toast } from '../src/components/Toast';
import { audioFeedback } from '../src/services/audioFeedback';
import { VerificationService } from '../src/services/verificationService';
import { useThemeStore } from '../src/store/themeStore';
import { StayExtension, ToastMessage, VerificationResult } from '../src/types';

export default function GateScannerScreen() {
  const insets = useSafeAreaInsets();
  const { colors, guardName } = useThemeStore();

  const [scannerVisible, setScannerVisible] = useState(false);
  const [activeResult, setActiveResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      const id = `toast_${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleVerify = async (rawInput: string) => {
    setIsLoading(true);
    try {
      let queryInput = rawInput.trim();
      if (queryInput.includes('?pass=') || queryInput.includes('&pass=')) {
        try {
          const parsed = Linking.parse(queryInput);
          if (parsed.queryParams?.pass) {
            queryInput = parsed.queryParams.pass as string;
          }
        } catch {}
      }

      const res = await VerificationService.verifyCodeOrId(queryInput);
      setActiveResult(res);

      if (res.scanResult === 'valid') {
        audioFeedback.playSuccessChime();
        addToast(`✅ Valid Pass: ${res.pass.studentName}`, 'success');
      } else if (res.scanResult === 'expired') {
        audioFeedback.playWarningBuzzer();
        addToast(`⚠️ Expired Pass: ${res.pass.studentName}`, 'warning');
      } else {
        audioFeedback.playWarningBuzzer();
        addToast(`❌ Invalid / Flagged: ${res.errorReason || 'Access Denied'}`, 'error');
      }
    } catch (err: any) {
      audioFeedback.playWarningBuzzer();
      addToast(err.message || 'Pass not found in records.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Deep link URL listener
  useEffect(() => {
    async function checkInitialUrl() {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && (initialUrl.includes('booking_id=') || initialUrl.includes('pass='))) {
        handleVerify(initialUrl);
      }
    }
    checkInitialUrl();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url && (url.includes('booking_id=') || url.includes('pass='))) {
        handleVerify(url);
      }
    });

    return () => subscription.remove();
  }, []);

  const handleApprove = async (pass: StayExtension) => {
    try {
      const type = activeResult?.qrType || 'entry';
      await VerificationService.approvePass(pass.id, guardName, type);
      audioFeedback.playSuccessChime();
      const isExit = type === 'exit';
      addToast(
        isExit
          ? `🎉 Exit Approved for ${pass.studentName}! Check-out recorded.`
          : `🎉 Entry Approved for ${pass.studentName}! Gate Opened.`,
        'success'
      );
    } catch (err: any) {
      addToast('Error confirming pass: ' + err.message, 'error');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6, paddingHorizontal: 16 }]}>
      <Header currentRoute="scanner" />

      <View style={styles.mainContent}>
        {isLoading ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingTitle, { color: colors.text }]}>
              Verifying Student Pass...
            </Text>
            <Text style={[styles.loadingDesc, { color: colors.textSecondary }]}>
              Fetching official payment and stay records from Poornima University server
            </Text>
          </View>
        ) : activeResult ? (
          <StudentPassVerificationCard
            result={activeResult}
            onApprove={handleApprove}
            onReset={() => {
              setActiveResult(null);
              setScannerVisible(true);
            }}
          />
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="qr-code" size={48} color={colors.primary} />
            </View>

            <Text style={[styles.standbyTitle, { color: colors.text }]}>
              Scan Student QR Code
            </Text>
            <Text style={[styles.standbyDesc, { color: colors.textSecondary }]}>
              Scan the student's <Text style={{ fontWeight: '700' }}>Sportsforall Digital QR Pass</Text> using your camera to view complete fee receipt details & approve facility access.
            </Text>

            {/* Launch Camera Button */}
            <TouchableOpacity
              style={[styles.cameraLaunchBtn, { backgroundColor: colors.primary }]}
              onPress={() => setScannerVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.cameraLaunchText}>Open Camera Scanner</Text>
            </TouchableOpacity>

            {/* Info Chips */}
            <View style={styles.chipRow}>
              <View style={[styles.chip, { backgroundColor: colors.backgroundSubtle, borderColor: colors.border }]}>
                <Ionicons name="time-outline" size={14} color={colors.primary} />
                <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                  Hours: 4:00 PM – 8:00 PM
                </Text>
              </View>

              <View style={[styles.chip, { backgroundColor: colors.backgroundSubtle, borderColor: colors.border }]}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.success} />
                <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                  Live Database Verification
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Camera Scanner Modal */}
      <CameraScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleVerify}
      />

      {/* Floating Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 16,
  },
  iconBox: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  standbyTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  standbyDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  cameraLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 4,
  },
  cameraLaunchText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  chipRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  loadingDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
});

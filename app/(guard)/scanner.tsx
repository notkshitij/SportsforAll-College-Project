import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ManualEntryModal } from '../../components/ManualEntryModal';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { APP_CONFIG } from '../../constants/config';
import { INITIAL_EXTENSIONS } from '../../services/mockDb';
import { useAuthStore } from '../../store/authStore';
import { useStayExtensionStore } from '../../store/stayExtensionStore';
import { useThemeStore } from '../../store/themeStore';
import { encodeQRPayload } from '../../utils/qrUtils';

const { width } = Dimensions.get('window');
const SCAN_FRAME_SIZE = Math.min(width * 0.72, 280);

export default function ScannerScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const { verifyCodeAndLog, extensions } = useStayExtensionStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);

  const guardUser = user || APP_CONFIG.DEMO_GUARD;

  // Animated laser scan bar
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: SCAN_FRAME_SIZE - 4,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    verifyCodeAndLog(data, guardUser);
    router.push('/(guard)/scan-result');
  };

  const handleManualSubmit = (code: string) => {
    setManualModalVisible(false);
    verifyCodeAndLog(code, guardUser);
    router.push('/(guard)/scan-result');
  };

  const handleSimulateScan = (type: 'valid' | 'expired' | 'invalid') => {
    if (type === 'valid') {
      const validPass = extensions.find((e) => e.status === 'valid') || INITIAL_EXTENSIONS[0];
      const payload = encodeQRPayload(validPass);
      verifyCodeAndLog(payload, guardUser);
    } else if (type === 'expired') {
      const expiredPass = extensions.find((e) => e.status === 'expired') || INITIAL_EXTENSIONS[1];
      const payload = encodeQRPayload(expiredPass);
      verifyCodeAndLog(payload, guardUser);
    } else {
      verifyCodeAndLog('MALFORMED-FORGED-TOKEN-999', guardUser);
    }
    router.push('/(guard)/scan-result');
  };

  return (
    <View style={styles.container}>
      <Header
        title="Student QR Scanner"
        subtitle="Security Checkpoint Viewfinder"
        showBack
      />

      <View style={styles.cameraContainer}>
        {permission?.granted ? (
          <CameraView
            style={styles.cameraView}
            facing={facing}
            enableTorch={torchOn}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          >
            {/* Viewfinder Overlay with Darkened Cutout */}
            <View style={styles.overlayTop} />

            <View style={styles.overlayCenterRow}>
              <View style={styles.overlaySide} />

              <View style={[styles.scanFrame, { width: SCAN_FRAME_SIZE, height: SCAN_FRAME_SIZE }]}>
                {/* Corner Guides */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />

                {/* Animated Laser Bar */}
                <Animated.View
                  style={[
                    styles.laser,
                    {
                      width: SCAN_FRAME_SIZE - 8,
                      transform: [{ translateY: laserAnim }],
                    },
                  ]}
                />
              </View>

              <View style={styles.overlaySide} />
            </View>

            <View style={styles.overlayBottom}>
              <Text style={styles.scanInstruction}>
                Point camera directly at the student's digital QR pass
              </Text>
              <Text style={styles.scanSubInstruction}>
                (Auto-scan on detection)
              </Text>

              {/* Camera Controls */}
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  onPress={() => setTorchOn(!torchOn)}
                  style={[styles.controlBtn, torchOn && styles.controlBtnActive]}
                >
                  <Ionicons
                    name={torchOn ? 'flash' : 'flash-off'}
                    size={22}
                    color="#FFFFFF"
                  />
                  <Text style={styles.controlLabel}>{torchOn ? 'Torch On' : 'Torch Off'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
                  style={styles.controlBtn}
                >
                  <Ionicons name="camera-reverse" size={22} color="#FFFFFF" />
                  <Text style={styles.controlLabel}>Flip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setManualModalVisible(true)}
                  style={styles.controlBtn}
                >
                  <Ionicons name="keypad" size={22} color="#FFFFFF" />
                  <Text style={styles.controlLabel}>Manual</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        ) : (
          /* Permission Request / Fallback UI for Web/No-camera */
          <View style={styles.noCameraView}>
            <View style={styles.noCameraIconBox}>
              <Ionicons name="camera" size={48} color="#2563EB" />
            </View>
            <Text style={styles.noCameraTitle}>Camera Access Required</Text>
            <Text style={styles.noCameraText}>
              {permission?.status === 'denied'
                ? 'Camera access was denied. Please enable camera permission in device settings to scan passes.'
                : 'Sportsforall requires camera access to scan and verify student stay extension passes.'}
            </Text>

            <View style={styles.permissionBtnRow}>
              <Button
                title="Grant Camera Access"
                variant="primary"
                icon="camera-outline"
                onPress={requestPermission}
                style={styles.permBtn}
              />
              <Button
                title="Manual Pass Code Entry"
                variant="outline"
                icon="keypad-outline"
                onPress={() => setManualModalVisible(true)}
                style={styles.permBtn}
              />
            </View>
          </View>
        )}
      </View>

      {/* QUICK TESTING BAR (Instant QR simulation for full testing) */}
      <View style={styles.testBar}>
        <Text style={styles.testBarLabel}>⚡ SIMULATE PASS SCAN (TESTING):</Text>
        <View style={styles.testBtnRow}>
          <TouchableOpacity
            onPress={() => handleSimulateScan('valid')}
            style={[styles.testBtn, { backgroundColor: '#10B981' }]}
          >
            <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
            <Text style={styles.testBtnText}>Valid Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSimulateScan('expired')}
            style={[styles.testBtn, { backgroundColor: '#EF4444' }]}
          >
            <Ionicons name="close-circle" size={14} color="#FFFFFF" />
            <Text style={styles.testBtnText}>Expired Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSimulateScan('invalid')}
            style={[styles.testBtn, { backgroundColor: '#F59E0B' }]}
          >
            <Ionicons name="alert-circle" size={14} color="#FFFFFF" />
            <Text style={styles.testBtnText}>Corrupt / Fake</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Manual Entry Modal */}
      <ManualEntryModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        onSubmit={handleManualSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  cameraView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  overlayCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    height: SCAN_FRAME_SIZE,
  },
  scanFrame: {
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#60A5FA',
  },
  cornerTL: {
    top: 4,
    left: 4,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 4,
    right: 4,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 4,
    left: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 4,
    right: 4,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  laser: {
    height: 3,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
    marginHorizontal: 4,
  },
  overlayBottom: {
    flex: 1.4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  scanInstruction: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  scanSubInstruction: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    minWidth: 70,
    gap: 4,
  },
  controlBtnActive: {
    backgroundColor: '#2563EB',
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  noCameraView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0F172A',
    gap: 12,
  },
  noCameraIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  noCameraTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  noCameraText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  permissionBtnRow: {
    width: '100%',
    maxWidth: 320,
    gap: 10,
    marginTop: 12,
  },
  permBtn: {
    width: '100%',
  },
  testBar: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 8,
  },
  testBarLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  testBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  testBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

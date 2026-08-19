import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CameraScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (scannedData: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCANNER_SIZE = Math.min(SCREEN_WIDTH * 0.72, 280);

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  visible,
  onClose,
  onScan,
}) => {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(true);

  // Animated laser bar
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsScanningActive(true);

      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!isScanningActive || !data) return;
    setIsScanningActive(false);
    onScan(data);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Scan Student Pass</Text>

          <TouchableOpacity
            style={[styles.headerBtn, torchEnabled && styles.headerBtnActive]}
            onPress={() => setTorchEnabled(!torchEnabled)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={torchEnabled ? 'flash' : 'flash-off'}
              size={20}
              color={torchEnabled ? '#FBBF24' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Camera Scanner View */}
        {!permission ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.statusText}>Requesting camera permission...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionBox}>
            <Ionicons name="camera-outline" size={48} color="#EF4444" />
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionDesc}>
              Sportsforall Guard requires camera access to scan and verify student QR passes.
            </Text>
            <TouchableOpacity
              style={styles.grantBtn}
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              enableTorch={torchEnabled}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={isScanningActive ? handleBarcodeScanned : undefined}
            />

            {/* Target Reticle Overlay */}
            <View style={styles.overlayContainer}>
              <View style={styles.overlayTop} />

              <View style={styles.overlayCenterRow}>
                <View style={styles.overlaySide} />

                <View style={styles.scannerTarget}>
                  {/* Corner Borders */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />

                  {/* Animated Laser Line */}
                  <Animated.View
                    style={[
                      styles.laserLine,
                      {
                        transform: [
                          {
                            translateY: scanAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, SCANNER_SIZE - 4],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </View>

                <View style={styles.overlaySide} />
              </View>

              <View style={styles.overlayBottom}>
                <Text style={styles.instructionText}>
                  Align student QR code inside the box to verify
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statusText: {
    color: '#CBD5E1',
    fontSize: 14,
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  permissionDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  grantBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  overlayContainer: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  overlayCenterRow: {
    flexDirection: 'row',
    height: SCANNER_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  scannerTarget: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    position: 'relative',
    overflow: 'hidden',
  },
  overlayBottom: {
    flex: 1.2,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    paddingTop: 24,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#3B82F6',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  laserLine: {
    height: 3,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

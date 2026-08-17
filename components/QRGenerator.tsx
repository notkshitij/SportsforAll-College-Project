import React from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRGeneratorProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
  logo?: any;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({
  value,
  size = 220,
  backgroundColor = '#FFFFFF',
  color = '#0F172A',
}) => {
  return (
    <View style={[styles.container, { width: size + 20, height: size + 20, backgroundColor }]}>
      <QRCode
        value={value || 'POORNIMA-SPORTS-PASS-NULL'}
        size={size}
        color={color}
        backgroundColor={backgroundColor}
        ecl="H" // High error correction
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
});

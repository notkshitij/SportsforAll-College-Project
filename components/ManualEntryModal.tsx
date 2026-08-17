import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';

interface ManualEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { colors } = useThemeStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!code.trim()) {
      setError('Please enter a Transaction ID or Enrollment No.');
      return;
    }
    setError('');
    const query = code.trim();
    setCode('');
    onSubmit(query);
  };

  const handleDemoFill = (sample: string) => {
    setCode(sample);
    setError('');
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Manual Pass Verification">
      <View style={styles.container}>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Enter Student Enrollment Number or Transaction ID (e.g., TXN12345678) to verify sports stay pass:
        </Text>

        <Input
          label="Pass Identifier / TXN ID / Enrollment"
          placeholder="e.g. TXN12345678 or PU-2024-1001"
          value={code}
          onChangeText={(txt) => {
            setCode(txt);
            if (error) setError('');
          }}
          leftIcon="barcode-outline"
          autoCapitalize="characters"
          error={error}
        />

        {/* Demo Quick Paste chips */}
        <View style={styles.chipsRow}>
          <Text style={[styles.chipLabel, { color: colors.textMuted }]}>Demo Codes:</Text>
          <Button
            title="TXN12345678 (Valid)"
            size="sm"
            variant="outline"
            onPress={() => handleDemoFill('TXN12345678')}
            style={styles.chipBtn}
          />
          <Button
            title="TXN87654321 (Expired)"
            size="sm"
            variant="outline"
            onPress={() => handleDemoFill('TXN87654321')}
            style={styles.chipBtn}
          />
        </View>

        <View style={styles.btnRow}>
          <Button
            title="Verify Pass"
            variant="primary"
            icon="checkmark-circle-outline"
            onPress={handleSubmit}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    gap: 12,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  btnRow: {
    marginTop: 8,
  },
});

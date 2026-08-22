import React from 'react';
import { StyleSheet, View } from 'react-native';
import { formatCurrencyINR } from '../utils/formatUtils';
import { Button } from './ui/Button';

interface PaymentButtonProps {
  amount: number;
  onPayPress: (selectedApp: string) => Promise<void>;
  loading?: boolean;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  onPayPress,
  loading = false,
}) => {
  const handlePress = async () => {
    try {
      await onPayPress('UPI');
    } catch (e) {
      console.warn('[PaymentButton] Error on payment press:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={`Pay ${formatCurrencyINR(amount)} with UPI`}
        variant="primary"
        size="lg"
        icon="card"
        onPress={handlePress}
        loading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

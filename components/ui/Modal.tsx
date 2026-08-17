import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
}) => {
  const { colors, isDarkMode } = useThemeStore();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardAvoid}
            >
              <View
                style={[
                  styles.modalCard,
                  {
                    backgroundColor: isDarkMode ? colors.surfaceCard : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {(title || showCloseButton) && (
                  <View style={styles.headerRow}>
                    <Text
                      style={[styles.modalTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {title}
                    </Text>

                    {showCloseButton && (
                      <TouchableOpacity
                        onPress={onClose}
                        style={[
                          styles.closeButton,
                          { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' },
                        ]}
                      >
                        <Ionicons name="close" size={18} color={colors.text} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <View style={styles.contentContainer}>{children}</View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardAvoid: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  contentContainer: {
    width: '100%',
  },
});

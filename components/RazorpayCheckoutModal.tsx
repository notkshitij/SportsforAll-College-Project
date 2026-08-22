import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useThemeStore } from '../store/themeStore';
import { RazorpayOrder, RazorpayPaymentPayload, User } from '../types';

interface RazorpayCheckoutModalProps {
  visible: boolean;
  order: RazorpayOrder | null;
  student: User;
  upiApp?: string;
  onSuccess: (payload: RazorpayPaymentPayload) => void;
  onFailure: (error: any) => void;
  onClose: () => void;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  visible,
  order,
  student,
  upiApp = 'UPI',
  onSuccess,
  onFailure,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useThemeStore();

  // Safely construct prefill fields without empty strings (which causes Razorpay checkout validation errors)
  const prefillData = useMemo(() => {
    const prefill: Record<string, string> = {};
    if (student.name && student.name.trim()) {
      prefill.name = student.name.trim();
    }
    if (student.email && student.email.trim()) {
      prefill.email = student.email.trim();
    }
    if (student.phone && student.phone.trim()) {
      prefill.contact = student.phone.trim();
    }
    return prefill;
  }, [student]);

  // Web fallback (direct DOM checkout.js integration)
  useEffect(() => {
    if (Platform.OS === 'web' && visible && order) {
      const loadWebScript = () => {
        if ((window as any).Razorpay) {
          openWebRazorpay();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => openWebRazorpay();
        script.onerror = () => onFailure(new Error('Failed to load Razorpay SDK on web.'));
        document.body.appendChild(script);
      };

      const openWebRazorpay = () => {
        try {
          const options = {
            key: order.key_id,
            amount: order.amount,
            currency: order.currency || 'INR',
            name: 'SportsForAll - Poornima University',
            description: 'Sports Complex Stay Pass (4 PM - 8 PM)',
            order_id: order.order_id,
            prefill: prefillData,
            notes: {
              student_id: student.id,
              enrollment: student.enrollment,
              upi_app: upiApp,
            },
            theme: {
              color: '#2563EB',
            },
            handler: function (response: any) {
              onSuccess({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
            },
            modal: {
              ondismiss: function () {
                onClose();
              },
            },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (response: any) {
            onFailure(response.error || 'Payment failed');
          });
          rzp.open();
        } catch (e) {
          onFailure(e);
        }
      };

      loadWebScript();
    }
  }, [visible, order, prefillData]);

  if (!visible || !order) return null;

  // On Web platform, standard Razorpay popup runs over the DOM
  if (Platform.OS === 'web') {
    return null;
  }

  // Native HTML payload for WebView Standard Checkout
  const checkoutHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { box-sizing: border-box; }
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: ${isDarkMode ? '#0F172A' : '#F8FAFC'};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: ${isDarkMode ? '#F8FAFC' : '#0F172A'};
          }
          .loader {
            text-align: center;
            padding: 24px;
          }
          .spinner {
            width: 44px;
            height: 44px;
            border: 3px solid rgba(59, 130, 246, 0.2);
            border-top-color: #2563EB;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        <div class="loader" id="loader">
          <div class="spinner"></div>
          <div style="font-size: 16px; font-weight: 700;">Launching Razorpay Gateway...</div>
          <div style="font-size: 13px; opacity: 0.7; margin-top: 6px;">Poornima University Sports Stay Pass</div>
        </div>

        <script>
          function postRN(msg) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify(msg));
            }
          }

          function launch() {
            try {
              var options = {
                key: ${JSON.stringify(order.key_id)},
                amount: ${JSON.stringify(order.amount)},
                currency: ${JSON.stringify(order.currency || 'INR')},
                name: "SportsForAll",
                description: "Sports Complex Stay Pass (4 PM - 8 PM)",
                order_id: ${JSON.stringify(order.order_id)},
                prefill: ${JSON.stringify(prefillData)},
                notes: {
                  student_id: ${JSON.stringify(student.id || '')},
                  enrollment: ${JSON.stringify(student.enrollment || '')},
                  upi_app: ${JSON.stringify(upiApp || 'UPI')}
                },
                theme: {
                  color: "#2563EB"
                },
                handler: function (response) {
                  document.getElementById('loader').innerHTML = '<div class="spinner"></div><div style="font-size: 16px; font-weight: 700; color: #10B981;">Payment Success! Verifying...</div>';
                  postRN({
                    type: 'PAYMENT_SUCCESS',
                    payload: {
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_signature: response.razorpay_signature
                    }
                  });
                },
                modal: {
                  ondismiss: function () {
                    postRN({ type: 'PAYMENT_CANCELLED' });
                  },
                  backdropclose: false,
                  escape: false
                }
              };

              var rzp = new Razorpay(options);
              rzp.on('payment.failed', function (resp) {
                postRN({
                  type: 'PAYMENT_FAILED',
                  error: resp.error
                });
              });
              rzp.open();
            } catch (err) {
              postRN({ type: 'PAYMENT_ERROR', message: err.message || 'Razorpay initialization failed' });
            }
          }

          if (typeof Razorpay !== 'undefined') {
            launch();
          } else {
            window.onload = launch;
          }
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PAYMENT_SUCCESS') {
        onSuccess(data.payload);
      } else if (data.type === 'PAYMENT_CANCELLED') {
        onClose();
      } else if (data.type === 'PAYMENT_FAILED') {
        onFailure(data.error || 'Payment failed in Razorpay.');
      } else if (data.type === 'PAYMENT_ERROR') {
        onFailure(new Error(data.message || 'Checkout error'));
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header with Safe Area Insets Padding to prevent status bar overlap */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 12) + 6,
              backgroundColor: isDarkMode ? colors.surfaceCard : '#FFFFFF',
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.rzpIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Razorpay Checkout
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                Secured 256-Bit Test Mode
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
            onPress={onClose}
          >
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* WebView */}
        <View style={styles.webViewContainer}>
          <WebView
            originWhitelist={['*']}
            source={{ html: checkoutHtml, baseUrl: 'https://checkout.razorpay.com' }}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                  Loading Payment Gateway...
                </Text>
              </View>
            )}
            style={styles.webView}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rzpIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

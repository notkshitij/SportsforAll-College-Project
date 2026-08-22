import { APP_CONFIG } from '../constants/config';
import {
  PaymentResult,
  RazorpayOrder,
  RazorpayPaymentPayload,
  RazorpayVerificationResult,
  StayExtension,
  User,
} from '../types';
import { getTodayStayWindow } from '../utils/dateUtils';
import { encodeQRPayload } from '../utils/qrUtils';
import { supabase } from './supabase';

export class PaymentService {
  /**
   * Request server-side Razorpay order creation via Supabase Edge Function.
   */
  static async createOrder(params: {
    student: User;
    amount?: number;
  }): Promise<RazorpayOrder> {
    const { student, amount = APP_CONFIG.EXTENSION_PRICE_INR } = params;

    const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
      body: {
        amount,
        student: {
          id: student.id,
          name: student.name,
          enrollment: student.enrollment,
          email: student.email,
          department: student.department,
        },
      },
    });

    if (error || !data?.order_id) {
      console.error('[PaymentService] createOrder failed:', error || data);
      throw new Error(
        data?.error || error?.message || 'Failed to create payment order with Razorpay.'
      );
    }

    return {
      order_id: data.order_id,
      amount: data.amount,
      currency: data.currency || 'INR',
      key_id: data.key_id || APP_CONFIG.RAZORPAY_KEY_ID,
    };
  }

  /**
   * Request server-side HMAC-SHA256 signature verification via Supabase Edge Function.
   */
  static async verifyPayment(
    payload: RazorpayPaymentPayload
  ): Promise<RazorpayVerificationResult> {
    const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
      body: {
        order_id: payload.razorpay_order_id,
        razorpay_payment_id: payload.razorpay_payment_id,
        razorpay_signature: payload.razorpay_signature,
      },
    });

    if (error) {
      console.error('[PaymentService] verifyPayment error:', error);
      return {
        verified: false,
        error: error.message || 'Payment verification request failed.',
      };
    }

    if (!data?.verified) {
      console.warn('[PaymentService] Server rejected payment signature:', data);
      return {
        verified: false,
        error: data?.error || 'Payment signature verification failed.',
      };
    }

    return {
      verified: true,
      order_id: data.order_id,
      payment_id: data.payment_id,
    };
  }

  /**
   * Construct and seal the verified StayExtension pass after confirmed signature verification.
   * NEVER called prior to verified payment status.
   */
  static createVerifiedStayPass(params: {
    student: User;
    orderId: string;
    razorpayPaymentId: string;
    upiApp?: string;
    amount?: number;
  }): {
    paymentResult: PaymentResult;
    extension: StayExtension;
  } {
    const {
      student,
      orderId,
      razorpayPaymentId,
      upiApp = 'UPI Gateway',
      amount = APP_CONFIG.EXTENSION_PRICE_INR,
    } = params;

    const now = new Date();
    const { validFrom, validUntil } = getTodayStayWindow();

    const paymentResult: PaymentResult = {
      success: true,
      transactionId: razorpayPaymentId,
      orderId,
      razorpayPaymentId,
      amount,
      paidAt: now.toISOString(),
      paymentMethod: `Razorpay UPI (${upiApp})`,
    };

    const newExtension: StayExtension = {
      id: `ext_${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      studentEnrollment: student.enrollment,
      studentYear: student.year,
      email: student.email,
      department: student.department,
      duration: 4,
      reason: 'Sports Complex Stay (Today, 4:00 PM - 8:00 PM)',
      amount,
      transactionId: razorpayPaymentId,
      paymentMethod: 'UPI',
      upiApp: upiApp as any,
      qrCode: '',
      createdAt: now.toISOString(),
      validFrom,
      validUntil,
      status: 'valid',
    };

    // Generate secure QR payload for gate scanner validation
    newExtension.qrCode = encodeQRPayload(newExtension);

    return {
      paymentResult,
      extension: newExtension,
    };
  }
}

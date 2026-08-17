import { APP_CONFIG } from '../constants/config';
import { PaymentInitiationParams, PaymentResult, StayExtension } from '../types';
import { getTodayStayWindow } from '../utils/dateUtils';
import { generateTransactionId } from '../utils/formatUtils';
import { encodeQRPayload } from '../utils/qrUtils';

export class PaymentService {
  /**
   * Process Razorpay Mock UPI Payment for today's fixed 4 PM - 8 PM stay window.
   */
  static async processUpiPayment(params: PaymentInitiationParams): Promise<{
    paymentResult: PaymentResult;
    extension: StayExtension;
  }> {
    const { student, upiApp = 'Google Pay' } = params;

    // Simulate UPI Intent / Razorpay modal processing time (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, APP_CONFIG.PAYMENT_MOCK_DELAY_MS));

    const transactionId = generateTransactionId();
    const now = new Date();
    const { validFrom, validUntil } = getTodayStayWindow();

    const paymentResult: PaymentResult = {
      success: true,
      transactionId,
      amount: APP_CONFIG.EXTENSION_PRICE_INR,
      paidAt: now.toISOString(),
      paymentMethod: `UPI (${upiApp})`,
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
      amount: APP_CONFIG.EXTENSION_PRICE_INR,
      transactionId,
      paymentMethod: 'UPI',
      upiApp: upiApp as any,
      qrCode: '',
      createdAt: now.toISOString(),
      validFrom,
      validUntil,
      status: 'valid',
    };

    // Generate secure QR payload
    newExtension.qrCode = encodeQRPayload(newExtension);

    return {
      paymentResult,
      extension: newExtension,
    };
  }
}

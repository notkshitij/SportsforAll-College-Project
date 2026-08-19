import { ScanLog, ScanResultType, StayExtension, VerificationResult } from '../types';
import { getRemainingTime } from '../utils/dateUtils';
import { supabase } from './supabaseClient';
import { decodeAndVerifySecureQRPayload } from '../utils/qrUtils';

export class VerificationService {
  /**
   * Look up real student pass in Supabase `pass_history` table
   */
  private static async querySupabasePass(
    passId: string,
    txnId: string,
    enrollment: string
  ): Promise<StayExtension | null> {
    try {
      const orConditions: string[] = [];
      if (passId) orConditions.push(`id.eq.${passId}`);
      if (txnId) orConditions.push(`transaction_id.eq.${txnId}`);
      if (enrollment) orConditions.push(`student_enrollment.eq.${enrollment}`);

      if (orConditions.length === 0) return null;

      const { data, error } = await supabase
        .from('pass_history')
        .select('*')
        .or(orConditions.join(','))
        .limit(1);

      if (error || !data || data.length === 0) {
        return null;
      }

      const row = data[0];
      return {
        id: row.id,
        studentId: row.student_id,
        studentName: row.student_name,
        studentEnrollment: row.student_enrollment,
        studentYear: row.student_year ?? undefined,
        email: row.email,
        department: row.department,
        duration: row.duration,
        reason: row.reason,
        amount: Number(row.amount),
        transactionId: row.transaction_id,
        paymentMethod: row.payment_method || 'UPI',
        upiApp: row.upi_app ?? undefined,
        qrCode: row.qr_code,
        validFrom: row.valid_from,
        validUntil: row.valid_until,
        status: row.status,
        createdAt: row.created_at,
        verifiedBy: row.verified_by,
        verifiedAt: row.verified_at,
      };
    } catch (err) {
      console.warn('Supabase query error:', err);
      return null;
    }
  }

  /**
   * Main verification entry point.
   * Handles raw QR code URL, secure QR payload, or transaction/enrollment ID.
   */
  static async verifyCodeOrId(rawInput: string): Promise<VerificationResult> {
    const cleanInput = rawInput.trim();
    if (!cleanInput) {
      throw new Error('Input is empty.');
    }

    let targetPass: StayExtension | null = null;
    let qrType: 'entry' | 'exit' = 'entry';
    let signatureValid = true;
    let qrExpired = false;

    // Handle cryptographically signed QR codes (containing booking_id and sig in query params)
    if (cleanInput.includes('booking_id=') && cleanInput.includes('sig=')) {
      const secureResult = decodeAndVerifySecureQRPayload(cleanInput);
      const bookingId = secureResult.bookingId || '';
      qrType = secureResult.type || 'entry';

      // Query database for this real booking record
      targetPass = await this.querySupabasePass(bookingId, bookingId, '');

      signatureValid =
        secureResult.scanResult !== 'invalid' ||
        !secureResult.errorReason?.includes('signature mismatch');
      qrExpired = secureResult.scanResult === 'expired';

      if (!targetPass) {
        throw new Error(
          `❌ Student Pass (${bookingId}) not found in Poornima University records.`
        );
      }

      let scanResult: ScanResultType = secureResult.scanResult;
      let errorReason = secureResult.errorReason;

      if (!signatureValid) {
        scanResult = 'invalid';
        errorReason =
          secureResult.errorReason || 'SECURITY ALERT: Forged QR signature detected!';
      } else if (qrExpired) {
        scanResult = 'expired';
        errorReason = secureResult.errorReason || 'SECURITY ALERT: QR Code expired!';
      } else {
        const { isExpired, formatted } = getRemainingTime(targetPass.validUntil);
        if (targetPass.status === 'Failed') {
          scanResult = 'invalid';
          errorReason = targetPass.flagReason || 'Pass has been flagged by security';
        } else if (isExpired || targetPass.status === 'expired') {
          scanResult = 'expired';
          errorReason = `Pass validity has expired (${formatted})`;
        } else {
          scanResult = 'valid';
        }
      }

      const { formatted } = getRemainingTime(targetPass.validUntil);

      return {
        scanResult,
        isValidFormat: true,
        pass: targetPass,
        errorReason,
        remainingFormatted: formatted,
        isFacilityOpenNow: true,
        qrType,
        signatureValid,
        qrExpired,
      };
    }

    // Try parsing as JSON QR payload if legacy format
    let parsedQr: any = null;
    try {
      parsedQr = JSON.parse(cleanInput);
    } catch {
      // Plain text (Txn ID, Pass ID, or Enrollment ID)
    }

    if (parsedQr && (parsedQr.transactionId || parsedQr.studentId || parsedQr.passId)) {
      const passId = parsedQr.passId || `pass_${parsedQr.transactionId}`;
      const txnId = parsedQr.transactionId || '';
      const enrollment = parsedQr.enrollment || parsedQr.studentEnrollment || '';

      targetPass = await this.querySupabasePass(passId, txnId, enrollment);
    } else {
      // Query by ID / Txn / Roll in Supabase
      targetPass = await this.querySupabasePass(cleanInput, cleanInput, cleanInput);
    }

    if (!targetPass) {
      throw new Error(
        `❌ No active record found matching "${cleanInput}" in Poornima University database.`
      );
    }

    // Check validity window
    const { isExpired, formatted } = getRemainingTime(targetPass.validUntil);
    let scanResult: ScanResultType = 'valid';
    let errorReason: string | undefined = undefined;

    if (targetPass.status === 'Failed') {
      scanResult = 'invalid';
      errorReason = targetPass.flagReason || 'Pass has been flagged / rejected by security';
    } else if (targetPass.status === 'CheckedIn') {
      scanResult = 'valid'; // Allow re-viewing details of checked-in pass
    } else if (isExpired || targetPass.status === 'expired') {
      scanResult = 'expired';
      errorReason = `Pass has expired (${formatted})`;
    } else {
      scanResult = 'valid';
    }

    return {
      scanResult,
      isValidFormat: true,
      pass: targetPass,
      errorReason,
      remainingFormatted: formatted,
      isFacilityOpenNow: true,
      qrType: 'entry',
      signatureValid: true,
      qrExpired: false,
    };
  }

  /**
   * Approve student pass entry or exit in Supabase database
   */
  static async approvePass(
    passId: string,
    guardName: string,
    type: 'entry' | 'exit' = 'entry'
  ): Promise<StayExtension> {
    const verifiedAt = new Date().toISOString();
    const newStatus = type === 'entry' ? 'CheckedIn' : 'CheckedOut';

    // Update directly in Supabase
    const { data, error } = await supabase
      .from('pass_history')
      .update({
        status: newStatus,
        verified_by: guardName,
        verified_at: verifiedAt,
      })
      .eq('id', passId)
      .select('*');

    if (error) {
      console.warn('Supabase pass update error:', error.message);
    }

    if (data && data.length > 0) {
      const row = data[0];
      return {
        id: row.id,
        studentId: row.student_id,
        studentName: row.student_name,
        studentEnrollment: row.student_enrollment,
        studentYear: row.student_year ?? undefined,
        email: row.email,
        department: row.department,
        duration: row.duration,
        reason: row.reason,
        amount: Number(row.amount),
        transactionId: row.transaction_id,
        paymentMethod: row.payment_method || 'UPI',
        upiApp: row.upi_app ?? undefined,
        qrCode: row.qr_code,
        validFrom: row.valid_from,
        validUntil: row.valid_until,
        status: row.status,
        createdAt: row.created_at,
        verifiedBy: row.verified_by,
        verifiedAt: row.verified_at,
      };
    }

    // Fallback object if offline
    return {
      id: passId,
      studentId: 'stu_verified',
      studentName: 'Verified Student',
      studentEnrollment: 'PU-STUDENT',
      department: 'Sports Complex',
      duration: 4,
      reason: 'Authorized Entry',
      amount: 100,
      transactionId: `TXN-${passId.slice(-6)}`,
      paymentMethod: 'UPI',
      qrCode: '',
      createdAt: verifiedAt,
      validFrom: verifiedAt,
      validUntil: verifiedAt,
      status: newStatus,
      verifiedBy: guardName,
      verifiedAt,
      email: 'student@poornima.edu.in',
    };
  }

  /**
   * Fetch all REAL pass history records directly from Supabase `pass_history` table
   */
  static async getAllPassRecords(): Promise<StayExtension[]> {
    try {
      const { data, error } = await supabase
        .from('pass_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch pass_history from Supabase:', error.message);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        studentId: row.student_id,
        studentName: row.student_name,
        studentEnrollment: row.student_enrollment,
        studentYear: row.student_year ?? undefined,
        email: row.email,
        department: row.department,
        duration: row.duration,
        reason: row.reason,
        amount: Number(row.amount),
        transactionId: row.transaction_id,
        paymentMethod: row.payment_method || 'UPI',
        upiApp: row.upi_app ?? undefined,
        qrCode: row.qr_code,
        validFrom: row.valid_from,
        validUntil: row.valid_until,
        status: row.status,
        createdAt: row.created_at,
        verifiedBy: row.verified_by,
        verifiedAt: row.verified_at,
      }));
    } catch (err) {
      console.error('Error fetching pass records from database:', err);
      return [];
    }
  }
}

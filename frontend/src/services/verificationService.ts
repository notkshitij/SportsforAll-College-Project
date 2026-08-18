import { INITIAL_MOCK_PASSES, getTodayWindowDates } from '../constants/mockData';
import { ScanLog, ScanResultType, StayExtension, VerificationResult } from '../types';
import { getRemainingTime } from '../utils/dateUtils';
import { supabase } from './supabaseClient';

const LOCAL_STORAGE_SCANS_KEY = 'poornima_guard_recent_scans_v2';
const LOCAL_STORAGE_PASSES_KEY = 'poornima_guard_local_passes_v2';

export class VerificationService {
  /**
   * Load local passes (seed with INITIAL_MOCK_PASSES if empty)
   */
  static getLocalPasses(): StayExtension[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PASSES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed reading local passes:', e);
    }
    // Seed initial
    localStorage.setItem(LOCAL_STORAGE_PASSES_KEY, JSON.stringify(INITIAL_MOCK_PASSES));
    return INITIAL_MOCK_PASSES;
  }

  static saveLocalPasses(passes: StayExtension[]) {
    try {
      localStorage.setItem(LOCAL_STORAGE_PASSES_KEY, JSON.stringify(passes));
    } catch (e) {
      console.warn('Failed saving local passes:', e);
    }
  }

  /**
   * Load recent scan logs from local storage
   */
  static getRecentScans(): ScanLog[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SCANS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed reading recent scans:', e);
    }
    return [];
  }

  static saveScanLog(scan: ScanLog) {
    try {
      const existing = this.getRecentScans();
      const updated = [scan, ...existing.filter((s) => s.id !== scan.id)].slice(0, 50);
      localStorage.setItem(LOCAL_STORAGE_SCANS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed saving scan log:', e);
    }
  }

  /**
   * Main verification entry point.
   * Handles raw QR code string, JSON QR payload, or manual input (Txn ID, Roll No, Pass ID).
   */
  static async verifyCodeOrId(rawInput: string): Promise<VerificationResult> {
    const cleanInput = rawInput.trim();
    if (!cleanInput) {
      throw new Error('Input is empty.');
    }

    // Try parsing as JSON QR payload first
    let parsedQr: any = null;
    try {
      parsedQr = JSON.parse(cleanInput);
    } catch {
      // Not JSON, could be a Txn ID, Pass ID, or Enrollment ID
    }

    let targetPass: StayExtension | null = null;

    // 1. If parsed JSON has valid student info:
    if (parsedQr && (parsedQr.transactionId || parsedQr.studentId || parsedQr.passId)) {
      const passId = parsedQr.passId || `pass_${parsedQr.transactionId}`;
      const txnId = parsedQr.transactionId || '';
      const enrollment = parsedQr.enrollment || parsedQr.studentEnrollment || '';

      // Try fetching from Supabase first
      targetPass = await this.querySupabasePass(passId, txnId, enrollment);

      // If not in Supabase, construct from QR payload
      if (!targetPass) {
        const { validFrom, validUntil } = getTodayWindowDates();
        targetPass = {
          id: passId,
          studentId: parsedQr.studentId || 'stu_scanned',
          studentName: parsedQr.studentName || 'Poornima Student',
          studentEnrollment: enrollment || 'PU-2024-XXXX',
          studentYear: parsedQr.studentYear || 'Registered Student',
          email: parsedQr.email || 'student@poornima.edu.in',
          department: parsedQr.department || 'Poornima University',
          duration: parsedQr.duration || 4,
          reason: 'Sports Complex Stay (Evening Session)',
          amount: parsedQr.amount || 100,
          transactionId: txnId || `TXN-${Date.now()}`,
          paymentMethod: 'UPI',
          upiApp: 'Google Pay',
          qrCode: cleanInput,
          createdAt: parsedQr.createdAt || new Date().toISOString(),
          validFrom: parsedQr.validFrom || validFrom,
          validUntil: parsedQr.validUntil || validUntil,
          status: 'valid',
        };
      }
    } else {
      // 2. Query by ID/Roll/TXN in Supabase
      targetPass = await this.querySupabasePass(cleanInput, cleanInput, cleanInput);

      // 3. If still not found, check local mock passes
      if (!targetPass) {
        const localPasses = this.getLocalPasses();
        const foundLocal = localPasses.find(
          (p) =>
            p.id.toLowerCase() === cleanInput.toLowerCase() ||
            p.transactionId.toLowerCase() === cleanInput.toLowerCase() ||
            p.studentEnrollment.toLowerCase() === cleanInput.toLowerCase() ||
            p.studentName.toLowerCase().includes(cleanInput.toLowerCase())
        );
        if (foundLocal) {
          targetPass = { ...foundLocal };
        }
      }
    }

    if (!targetPass) {
      throw new Error(`❌ No pass found matching "${cleanInput}". Please check the ID or scan a valid QR code.`);
    }

    // Check validity window
    const { isExpired, formatted } = getRemainingTime(targetPass.validUntil);
    let scanResult: ScanResultType = 'valid';
    let errorReason: string | undefined = undefined;

    if (targetPass.status === 'Failed') {
      scanResult = 'invalid';
      errorReason = targetPass.flagReason || 'Pass has been flagged / rejected by security';
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
    };
  }

  /**
   * Look up pass in Supabase `pass_history` table
   */
  private static async querySupabasePass(
    passId: string,
    txnId: string,
    enrollment: string
  ): Promise<StayExtension | null> {
    try {
      const { data, error } = await supabase
        .from('pass_history')
        .select('*')
        .or(`id.eq.${passId},transaction_id.eq.${txnId},student_enrollment.eq.${enrollment}`)
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
      console.warn('Supabase query exception, fallback to local data:', err);
      return null;
    }
  }

  /**
   * Approve student pass entry
   */
  static async approvePass(passId: string, guardName: string): Promise<StayExtension> {
    const verifiedAt = new Date().toISOString();

    // 1. Update in local passes
    const passes = this.getLocalPasses();
    const index = passes.findIndex((p) => p.id === passId);
    let updatedPass: StayExtension;

    if (index !== -1) {
      passes[index] = {
        ...passes[index],
        status: 'valid',
        verifiedBy: guardName,
        verifiedAt,
      };
      this.saveLocalPasses(passes);
      updatedPass = passes[index];
    } else {
      updatedPass = {
        id: passId,
        studentId: 'stu_approved',
        studentName: 'Verified Student',
        studentEnrollment: 'PU-PASS',
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
        status: 'valid',
        verifiedBy: guardName,
        verifiedAt,
        email: 'student@poornima.edu.in',
      };
    }

    // 2. Fire-and-forget update to Supabase
    supabase
      .from('pass_history')
      .update({
        status: 'valid',
        verified_by: guardName,
        verified_at: verifiedAt,
      })
      .eq('id', passId)
      .then(({ error }) => {
        if (error) console.warn('Supabase pass status update failed:', error.message);
      });

    return updatedPass;
  }

  /**
   * Flag pass for review / deny entry
   */
  static async flagPass(passId: string, guardName: string, reason: string): Promise<StayExtension> {
    const verifiedAt = new Date().toISOString();

    // 1. Update in local passes
    const passes = this.getLocalPasses();
    const index = passes.findIndex((p) => p.id === passId);
    let updatedPass: StayExtension;

    if (index !== -1) {
      passes[index] = {
        ...passes[index],
        status: 'Failed',
        verifiedBy: `${guardName} (Flagged)`,
        verifiedAt,
        flagReason: reason,
      };
      this.saveLocalPasses(passes);
      updatedPass = passes[index];
    } else {
      updatedPass = {
        id: passId,
        studentId: 'stu_flagged',
        studentName: 'Flagged Student',
        studentEnrollment: 'PU-FLAG',
        department: 'Campus Security Review',
        duration: 4,
        reason: 'Flagged Entry',
        amount: 100,
        transactionId: `TXN-${passId.slice(-6)}`,
        paymentMethod: 'UPI',
        qrCode: '',
        createdAt: verifiedAt,
        validFrom: verifiedAt,
        validUntil: verifiedAt,
        status: 'Failed',
        verifiedBy: `${guardName} (Flagged)`,
        verifiedAt,
        flagReason: reason,
        email: 'security@poornima.edu.in',
      };
    }

    // 2. Update Supabase
    supabase
      .from('pass_history')
      .update({
        status: 'Failed',
        verified_by: `${guardName} (Flagged: ${reason})`,
        verified_at: verifiedAt,
      })
      .eq('id', passId)
      .then(({ error }) => {
        if (error) console.warn('Supabase pass flag update failed:', error.message);
      });

    return updatedPass;
  }
}

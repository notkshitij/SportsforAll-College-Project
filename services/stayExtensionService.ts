import { ScanLog, ScanResultType, StayExtension, User } from '../types';
import { getRemainingTime } from '../utils/dateUtils';
import { decodeAndVerifyQRPayload } from '../utils/qrUtils';

export class StayExtensionService {
  /**
   * Check and update status of extensions based on current timestamp
   */
  static refreshExtensionStatuses(extensions: StayExtension[]): StayExtension[] {
    let hasChanged = false;
    const updated = extensions.map((ext) => {
      const { isExpired } = getRemainingTime(ext.validUntil);
      let newStatus = ext.status;
      
      if (isExpired) {
        newStatus = 'expired';
      } else if (ext.status !== 'CheckedIn' && ext.status !== 'CheckedOut') {
        newStatus = 'valid';
      }

      if (ext.status !== newStatus) {
        hasChanged = true;
        return {
          ...ext,
          status: newStatus,
        };
      }
      return ext;
    });

    return hasChanged ? updated : extensions;
  }

  /**
   * Keep only passes created within the last N days (default 7) for local,
   * on-device display. This does NOT touch Supabase — Supabase keeps every
   * pass forever via PassHistoryService. This purely trims what the student
   * sees/what lives in local AsyncStorage.
   */
  static pruneOldExtensions(extensions: StayExtension[], days: number = 7): StayExtension[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const kept = extensions.filter((ext) => new Date(ext.createdAt).getTime() >= cutoff);
    return kept.length === extensions.length ? extensions : kept;
  }

  /**
   * Find current active pass for a student (if any)
   */
  static getActiveStudentPass(extensions: StayExtension[], studentId: string): StayExtension | null {
    const studentPasses = extensions.filter((e) => e.studentId === studentId);
    // Find the pass with status 'valid' and future validUntil
    const validPass = studentPasses.find((e) => {
      const { isExpired } = getRemainingTime(e.validUntil);
      return !isExpired;
    });
    return validPass || null;
  }

  /**
   * Validate a scanned QR payload or pass ID from Guard scanner
   */
  static verifyScannedCode(
    rawText: string,
    guard: User,
    existingExtensions: StayExtension[]
  ): {
    scanLog: ScanLog;
    scanResult: ScanResultType;
    studentName: string;
    enrollment: string;
    studentYear?: string;
    validFrom?: string;
    validUntil: string;
    reason?: string;
    remainingFormatted?: string;
  } {
    const now = new Date();
    const verification = decodeAndVerifyQRPayload(rawText);

    // If decoded as valid JSON QR
    if (verification.qrData) {
      const { qrData, scanResult, errorReason } = verification;
      const { formatted } = getRemainingTime(qrData.validUntil);

      const scanLog: ScanLog = {
        id: `scan_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        guardId: guard.id,
        guardName: guard.name,
        studentId: qrData.studentId,
        studentName: qrData.studentName,
        enrollment: qrData.enrollment,
        studentYear: qrData.studentYear,
        transactionId: qrData.transactionId,
        validFrom: qrData.validFrom,
        validUntil: qrData.validUntil,
        scanResult,
        reason: errorReason,
        scannedAt: now.toISOString(),
      };

      return {
        scanLog,
        scanResult,
        studentName: qrData.studentName,
        enrollment: qrData.enrollment,
        studentYear: qrData.studentYear,
        validFrom: qrData.validFrom,
        validUntil: qrData.validUntil,
        reason: errorReason,
        remainingFormatted: formatted,
      };
    }

    // Fallback: Check if rawText is a manual transaction ID (e.g. TXN12345678)
    const cleanQuery = rawText.trim().toUpperCase();
    const matched = existingExtensions.find(
      (e) =>
        e.transactionId.toUpperCase() === cleanQuery ||
        e.id.toUpperCase() === cleanQuery ||
        e.studentEnrollment.toUpperCase() === cleanQuery
    );

    if (matched) {
      const { isExpired, formatted } = getRemainingTime(matched.validUntil);
      const scanResult: ScanResultType = isExpired ? 'expired' : 'valid';
      const scanLog: ScanLog = {
        id: `scan_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        guardId: guard.id,
        guardName: guard.name,
        studentId: matched.studentId,
        studentName: matched.studentName,
        enrollment: matched.studentEnrollment,
        studentYear: matched.studentYear,
        transactionId: matched.transactionId,
        validFrom: matched.validFrom,
        validUntil: matched.validUntil,
        scanResult,
        reason: isExpired ? `Pass expired (${formatted})` : undefined,
        scannedAt: now.toISOString(),
      };

      return {
        scanLog,
        scanResult,
        studentName: matched.studentName,
        enrollment: matched.studentEnrollment,
        studentYear: matched.studentYear,
        validFrom: matched.validFrom,
        validUntil: matched.validUntil,
        reason: isExpired ? `Pass expired (${formatted})` : undefined,
        remainingFormatted: formatted,
      };
    }

    // Invalid / Unrecognized
    const scanLog: ScanLog = {
      id: `scan_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      guardId: guard.id,
      guardName: guard.name,
      studentId: 'unknown',
      studentName: 'Unrecognized Pass / Unknown Student',
      enrollment: cleanQuery.slice(0, 16),
      transactionId: cleanQuery,
      validUntil: '',
      scanResult: 'invalid',
      reason: verification.errorReason || 'No active sports extension found for this pass identifier',
      scannedAt: now.toISOString(),
    };

    return {
      scanLog,
      scanResult: 'invalid',
      studentName: 'Unknown Student',
      enrollment: 'N/A',
      validUntil: '',
      reason: scanLog.reason,
    };
  }
}

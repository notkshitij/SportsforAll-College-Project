import { supabase } from './supabase';
import { StayExtension } from '../types';

/**
 * Permanent storage for stay-extension passes.
 * IMPORTANT: this service only ever INSERTS/UPSERTS. It never deletes rows.
 * The 7-day "disappears from the app" behaviour lives entirely on the
 * client (see stayExtensionStore.pruneOldExtensions) — Supabase always
 * keeps the full history.
 */
function toRow(extension: StayExtension) {
  return {
    id: extension.id,
    student_id: extension.studentId,
    student_name: extension.studentName,
    student_enrollment: extension.studentEnrollment,
    student_year: extension.studentYear ?? null,
    email: extension.email,
    department: extension.department,
    duration: extension.duration,
    reason: extension.reason,
    amount: extension.amount,
    transaction_id: extension.transactionId,
    payment_method: extension.paymentMethod,
    upi_app: extension.upiApp ?? null,
    qr_code: extension.qrCode,
    valid_from: extension.validFrom,
    valid_until: extension.validUntil,
    status: extension.status,
    created_at: extension.createdAt,
  };
}

export class PassHistoryService {
  /**
   * Permanently store (or update) a pass in Supabase. Fire-and-forget
   * friendly — callers should .catch() this rather than await/block on it.
   */
  static async upsertPass(extension: StayExtension): Promise<void> {
    const { error } = await supabase
      .from('pass_history')
      .upsert(toRow(extension), { onConflict: 'id' });

    if (error) {
      console.error('PassHistoryService.upsertPass error:', error.message);
      throw new Error(error.message);
    }
  }

  /**
   * Fetch the student's FULL permanent history from Supabase (not just the
   * last 7 days). Useful for admin/export tools — the in-app history list
   * itself never calls this, it only reads the locally pruned store.
   */
  static async getFullHistoryForStudent(studentId: string): Promise<StayExtension[]> {
    const { data, error } = await supabase
      .from('pass_history')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('PassHistoryService.getFullHistoryForStudent error:', error.message);
      throw new Error(error.message);
    }

    return (data || []).map((row: any) => ({
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
      paymentMethod: row.payment_method,
      upiApp: row.upi_app ?? undefined,
      qrCode: row.qr_code,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      status: row.status,
      createdAt: row.created_at,
    }));
  }
}

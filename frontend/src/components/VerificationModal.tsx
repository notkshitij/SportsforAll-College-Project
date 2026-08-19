import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  User,
  CreditCard,
  Clock,
  ShieldCheck,
  Printer,
  Flag,
  Share2,
  IndianRupee,
} from './icons';
import confetti from 'canvas-confetti';
import { VerificationResult, StayExtension } from '../types';
import { formatDateTimeNice, formatTime12h } from '../utils/dateUtils';
import './VerificationModal.css';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: VerificationResult | null;
  onApprove: (pass: StayExtension) => void;
  onFlag: (pass: StayExtension, reason: string) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  result,
  onApprove,
  onFlag,
}) => {
  const [flagInputVisible, setFlagInputVisible] = useState(false);
  const [flagReason, setFlagReason] = useState('Suspicious QR / Student Mismatch');

  if (!isOpen || !result) return null;

  const { pass, scanResult, remainingFormatted, errorReason } = result;
  const isValid = scanResult === 'valid';
  const isExpired = scanResult === 'expired';
  const isInvalid = scanResult === 'invalid';

  const handleApproveClick = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (_) {}
    onApprove(pass);
  };

  const handleFlagSubmit = () => {
    onFlag(pass, flagReason);
    setFlagInputVisible(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="verification-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} title="Close Modal">
          <X size={20} />
        </button>

        {/* Status Header Banner */}
        <div
          className={`modal-status-banner ${
            !result.signatureValid ? 'invalid' : result.qrExpired ? 'expired' : isValid ? 'valid' : 'invalid'
          }`}
        >
          <div className="modal-status-icon-box">
            {!result.signatureValid ? (
              <XCircle size={32} />
            ) : result.qrExpired ? (
              <Clock size={32} />
            ) : isValid ? (
              <CheckCircle2 size={32} />
            ) : (
              <XCircle size={32} />
            )}
          </div>
          <div className="modal-status-title">
            {!result.signatureValid
              ? 'SECURITY ALERT: FORGED QR CODE'
              : result.qrExpired
              ? 'SECURITY ALERT: EXPIRED DYNAMIC QR'
              : isValid
              ? result.qrType === 'exit'
                ? 'VALID SPORTS EXIT PASS'
                : 'VALID SPORTS ENTRY PASS'
              : 'INVALID ACCESS PASS'}
          </div>
          <div className="modal-status-subtitle">
            {!result.signatureValid
              ? 'Cryptographic signature mismatch! This QR code has been forged or tampered.'
              : result.qrExpired
              ? 'This dynamic QR code has expired. Screenshots are rejected. Ask the student for a fresh QR code.'
              : isValid
              ? result.qrType === 'exit'
                ? 'Student is authorized to EXIT the sports complex'
                : 'Student is authorized to ENTER the sports complex'
              : errorReason || 'Access to Sports Facility is Denied'}
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Student Profile Overview */}
          <div className="student-hero-profile">
            <div className="student-big-avatar">
              {pass.studentName.charAt(0).toUpperCase()}
            </div>
            <div className="student-hero-info">
              <h3>{pass.studentName}</h3>
              <div className="student-roll">🆔 {pass.studentEnrollment}</div>
              <div className="student-dept">
                🏛️ {pass.department} • {pass.studentYear || 'Registered Student'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                ✉️ {pass.email}
              </div>
            </div>
          </div>

          {/* Stay & Validity Box */}
          <div className="details-section-box">
            <h4>
              <Clock size={16} />
              <span>Sports Complex Stay Window</span>
            </h4>
            <div className="info-rows-list">
              {result.qrType && (
                <div className="info-row-item">
                  <span className="info-row-label">Checkpoint Check Type</span>
                  <span className="info-row-value" style={{ color: '#2563eb', fontWeight: '800', textTransform: 'uppercase' }}>
                    {result.qrType} PASS
                  </span>
                </div>
              )}
              <div className="info-row-item">
                <span className="info-row-label">Operating Window</span>
                <span className="info-row-value">
                  {formatTime12h(pass.validFrom)} – {formatTime12h(pass.validUntil)} (Today)
                </span>
              </div>
              <div className="info-row-item">
                <span className="info-row-label">Stay Duration</span>
                <span className="info-row-value">
                  {pass.duration} Hours (Evening Complex Session)
                </span>
              </div>
              <div className="info-row-item">
                <span className="info-row-label">Current Validity Status</span>
                <span
                  className={`info-row-value ${
                    isValid && !result.qrExpired ? 'highlight-green' : result.qrExpired ? 'highlight-amber' : 'highlight-red'
                  }`}
                >
                  {isValid && !result.qrExpired ? `Active (${remainingFormatted})` : result.qrExpired ? 'QR Code Expired' : remainingFormatted || 'Invalid'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Security Box */}
          <div className="details-section-box">
            <h4>
              <CreditCard size={16} />
              <span>Payment & Security Attributes</span>
            </h4>
            <div className="info-rows-list">
              <div className="info-row-item">
                <span className="info-row-label">Amount Paid</span>
                <span className="info-row-value highlight-green">₹{pass.amount || 100} INR (Paid)</span>
              </div>
              <div className="info-row-item">
                <span className="info-row-label">Payment Method</span>
                <span className="info-row-value">
                  {pass.paymentMethod} {pass.upiApp ? `(${pass.upiApp})` : ''}
                </span>
              </div>
              <div className="info-row-item">
                <span className="info-row-label">Transaction ID</span>
                <span className="info-row-value" style={{ fontFamily: 'monospace' }}>
                  {pass.transactionId}
                </span>
              </div>
              <div className="info-row-item">
                <span className="info-row-label">Digital Pass Signature</span>
                <span className="info-row-value" style={{ fontFamily: 'monospace', color: result.signatureValid ? '#16a34a' : '#dc2626' }}>
                  {result.signatureValid ? '✓ VERIFIED SIGNATURE' : '✗ INVALID SIGNATURE'}
                </span>
              </div>
            </div>
          </div>

          {/* Flag Input (if toggled) */}
          {flagInputVisible && (
            <div
              className="details-section-box"
              style={{ borderColor: 'var(--danger)', background: 'var(--danger-light)' }}
            >
              <h4 style={{ color: 'var(--danger-dark)' }}>⚠️ Enter Reason to Flag Pass:</h4>
              <input
                type="text"
                className="manual-text-input"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                style={{ marginBottom: '10px' }}
                placeholder="Reason for flagging..."
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-danger btn-sm" onClick={handleFlagSubmit}>
                  Confirm Flag & Reject Entry
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setFlagInputVisible(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="modal-actions-bar">
            {isValid ? (
              <button className="btn btn-success btn-lg" onClick={handleApproveClick}>
                <CheckCircle2 size={20} />
                <span>✓ Confirm {result.qrType === 'exit' ? 'Exit' : 'Entry'} & Use Ticket</span>
              </button>
            ) : (
              <button
                className="btn btn-danger btn-lg"
                onClick={() => setFlagInputVisible(true)}
              >
                <XCircle size={20} />
                <span>Deny Gate Access & Alert</span>
              </button>
            )}

            {!flagInputVisible && (
              <button
                className="btn btn-warning"
                onClick={() => setFlagInputVisible(true)}
                title="Flag for discrepancies"
              >
                <Flag size={18} />
                <span>Flag Issue</span>
              </button>
            )}

            <button className="btn btn-secondary" onClick={handlePrint}>
              <Printer size={18} />
              <span>Print Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

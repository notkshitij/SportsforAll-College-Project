import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  User,
  CreditCard,
  QrCode,
  Check,
} from './icons';
import confetti from 'canvas-confetti';
import { VerificationResult, StayExtension } from '../types';
import { formatDateTimeNice, formatTime12h } from '../utils/dateUtils';
import { APP_CONFIG } from '../constants/config';
import './StudentPassVerificationCard.css';

interface StudentPassVerificationCardProps {
  result: VerificationResult;
  onApprove: (pass: StayExtension) => Promise<void> | void;
}

export const StudentPassVerificationCard: React.FC<StudentPassVerificationCardProps> = ({
  result,
  onApprove,
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(
    result.pass.status === 'CheckedIn' || result.pass.status === 'CheckedOut'
  );

  const { pass, scanResult, remainingFormatted, errorReason, signatureValid, qrExpired } = result;

  const isValid = scanResult === 'valid' && signatureValid && !qrExpired;
  const isExpiredState = scanResult === 'expired' || qrExpired;
  const isInvalidState = !signatureValid || scanResult === 'invalid' || pass.status === 'Failed';

  const handleApproveClick = async () => {
    if (isApproved || !isValid) return;
    setIsApproving(true);
    try {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (_) {}
      await onApprove(pass);
      setIsApproved(true);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="receipt-page-container">
      <div className="receipt-card-wrapper">
        {/* Top University Header */}
        <div className="receipt-header">
          <div className="receipt-univ-row">
            <img src="/pu_logo.png" alt="Poornima University Logo" className="receipt-logo" />
            <div className="receipt-univ-info">
              <h2>{APP_CONFIG.UNIVERSITY_NAME}</h2>
              <p>DIRECTORATE OF SPORTS & RECREATION • GATE CHECKPOINT</p>
            </div>
          </div>
          <div className="receipt-doc-title">
            <span>OFFICIAL SPORTS STAY PASS & E-RECEIPT</span>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div
          className={`status-banner ${
            isInvalidState ? 'status-invalid' : isExpiredState ? 'status-expired' : 'status-valid'
          }`}
        >
          <div className="status-icon-wrap">
            {isInvalidState ? (
              <XCircle size={28} />
            ) : isExpiredState ? (
              <Clock size={28} />
            ) : (
              <CheckCircle2 size={28} />
            )}
          </div>
          <div className="status-text-wrap">
            <h3>
              {isInvalidState
                ? 'INVALID / FLAGGED PASS'
                : isExpiredState
                ? 'EXPIRED SPORTS PASS'
                : isApproved
                ? 'ENTRY APPROVED & GATE OPENED'
                : 'PAYMENT VERIFIED & VALID PASS'}
            </h3>
            <p>
              {errorReason
                ? errorReason
                : isValid
                ? `Valid Stay Window: ${remainingFormatted || 'Active'}`
                : 'Access Denied'}
            </p>
          </div>
        </div>

        {/* Receipt No Bar */}
        <div className="receipt-no-bar">
          <span className="receipt-no-label">RECEIPT / PASS NO:</span>
          <span className="receipt-no-value">PU-REC-{pass.transactionId || pass.id}</span>
        </div>

        {/* Student & Fee Details Table */}
        <div className="receipt-details-table">
          <div className="receipt-row">
            <span className="receipt-label">Student Name</span>
            <span className="receipt-value highlight-name">{pass.studentName}</span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Registration No. (Roll No)</span>
            <span className="receipt-value highlight-roll">{pass.studentEnrollment}</span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Department</span>
            <span className="receipt-value">{pass.department || 'Poornima University'}</span>
          </div>

          {pass.studentYear ? (
            <div className="receipt-row">
              <span className="receipt-label">Academic Year</span>
              <span className="receipt-value">{pass.studentYear}</span>
            </div>
          ) : null}

          <div className="receipt-row">
            <span className="receipt-label">Stay Window</span>
            <span className="receipt-value">
              {formatTime12h(pass.validFrom || pass.createdAt)} – {formatTime12h(pass.validUntil)}
            </span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Issue Date & Time</span>
            <span className="receipt-value">{formatDateTimeNice(pass.createdAt)}</span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Valid Until</span>
            <span
              className={`receipt-value ${
                isExpiredState ? 'expiry-red' : 'expiry-green'
              }`}
            >
              {formatTime12h(pass.validUntil)} ({remainingFormatted})
            </span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Payment Method</span>
            <span className="receipt-value">UPI ({pass.upiApp || 'Online Verified'})</span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Transaction ID</span>
            <span className="receipt-value txn-id">{pass.transactionId}</span>
          </div>

          {pass.reason ? (
            <div className="receipt-row">
              <span className="receipt-label">Purpose</span>
              <span className="receipt-value">{pass.reason}</span>
            </div>
          ) : null}
        </div>

        {/* Total Amount Paid Box */}
        <div className="receipt-amount-box">
          <div className="amount-label">TOTAL AMOUNT PAID</div>
          <div className="amount-val">₹{pass.amount || 100}.00</div>
          <div className="amount-sub">
            <ShieldCheck size={14} color="var(--success)" />
            <span>Verified via Razorpay UPI • Instant Gateway</span>
          </div>
        </div>

        {/* Action Button Section */}
        <div className="receipt-actions">
          {isValid ? (
            <button
              className={`approve-btn ${isApproved ? 'approved' : ''}`}
              onClick={handleApproveClick}
              disabled={isApproving || isApproved}
            >
              {isApproved ? (
                <>
                  <Check size={24} />
                  <span>ENTRY APPROVED • GATE OPENED</span>
                </>
              ) : isApproving ? (
                <span>Confirming Entry...</span>
              ) : (
                <>
                  <CheckCircle2 size={24} />
                  <span>APPROVE ENTRY</span>
                </>
              )}
            </button>
          ) : (
            <button className="approve-btn access-denied-btn" disabled>
              <XCircle size={22} />
              <span>ACCESS DENIED (PASS EXPIRED / INVALID)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

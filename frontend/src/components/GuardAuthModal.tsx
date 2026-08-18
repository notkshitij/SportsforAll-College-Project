import React, { useState } from 'react';
import { ShieldCheck, UserCheck, X, Check, Lock } from './icons';
import './GuardAuthModal.css';

interface GuardAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGuardName: string;
  onSelectGuard: (name: string, badge: string) => void;
}

const GUARD_OFFICERS = [
  {
    name: 'Rahul Kumar (Officer)',
    badge: 'SEC-804',
    email: 'guard@poornima.edu.in',
    post: 'Main Complex Gate Checkpoint',
  },
  {
    name: 'Vikram Singh (Head Guard)',
    badge: 'SEC-912',
    email: 'security.lead@poornima.edu.in',
    post: 'Sports Ground Patrol & Evening Gate',
  },
  {
    name: 'Manoj Sharma (Security)',
    badge: 'SEC-703',
    email: 'guard.manoj@poornima.edu.in',
    post: 'Gymnasium & Indoor Badminton Court',
  },
];

export const GuardAuthModal: React.FC<GuardAuthModalProps> = ({
  isOpen,
  onClose,
  currentGuardName,
  onSelectGuard,
}) => {
  const [customName, setCustomName] = useState('');
  const [customBadge, setCustomBadge] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim()) {
      onSelectGuard(customName.trim(), customBadge.trim() || 'SEC-STAFF');
      onClose();
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <h2>
          <ShieldCheck size={22} color="var(--primary)" />
          <span>Active Guard Officer Profile</span>
        </h2>
        <p className="auth-subtitle">
          Select or authenticate the security officer currently on gate duty
        </p>

        <div className="officer-presets-list">
          {GUARD_OFFICERS.map((officer) => {
            const isSelected = currentGuardName === officer.name;
            return (
              <div
                key={officer.badge}
                className={`officer-preset-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelectGuard(officer.name, officer.badge);
                  onClose();
                }}
              >
                <div className="officer-preset-info">
                  <h4>{officer.name}</h4>
                  <p>
                    🆔 {officer.badge} • {officer.post}
                  </p>
                </div>
                {isSelected && <Check size={20} color="var(--primary)" />}
              </div>
            );
          })}
        </div>

        {/* Custom Officer Form */}
        <form onSubmit={handleCustomSubmit} style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Or Enter Custom Officer Name:
          </p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              className="manual-text-input"
              style={{ padding: '10px 14px' }}
              placeholder="Officer Name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
            <input
              type="text"
              className="manual-text-input"
              style={{ padding: '10px 14px', width: '130px' }}
              placeholder="Badge (SEC-)"
              value={customBadge}
              onChange={(e) => setCustomBadge(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={!customName.trim()}
          >
            Switch Active Officer
          </button>
        </form>
      </div>
    </div>
  );
};

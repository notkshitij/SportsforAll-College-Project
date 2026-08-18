import React, { useState } from 'react';
import { Search, Sparkles, CheckCircle, ArrowRight } from './icons';
import './ManualLookup.css';

interface ManualLookupProps {
  onVerify: (input: string) => void;
  isLoading?: boolean;
}

export const ManualLookup: React.FC<ManualLookupProps> = ({ onVerify, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onVerify(query.trim());
    }
  };

  const handleQuickDemoClick = (demoValue: string) => {
    setQuery(demoValue);
    onVerify(demoValue);
  };

  return (
    <div className="manual-lookup-card">
      <h2>
        <Search size={20} color="var(--primary)" />
        <span>Manual Pass Verification</span>
      </h2>
      <p className="subtitle">
        Enter Transaction ID, Student Roll Number, Pass ID, or Name
      </p>

      <form onSubmit={handleSubmit}>
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon-inside" />
          <input
            type="text"
            className="manual-text-input"
            placeholder="e.g. PU-2024-1001, TXN-PU-98214532, or Arjun Sharma"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? (
            <span>Verifying with Database...</span>
          ) : (
            <>
              <CheckCircle size={18} />
              <span>Verify Student Pass</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Quick Test Demo Chips */}
      <div className="demo-chips-container">
        <div className="demo-chips-title">⚡ Quick Test Demo Passes:</div>
        <div className="demo-chips-list">
          <button
            type="button"
            className="demo-chip"
            onClick={() => handleQuickDemoClick('PU-2024-1001')}
          >
            <span>🟢 Arjun Sharma (PU-2024-1001)</span>
          </button>
          <button
            type="button"
            className="demo-chip"
            onClick={() => handleQuickDemoClick('PAY-2024-001-JOHN')}
          >
            <span>🟢 John Doe (Card Pay)</span>
          </button>
          <button
            type="button"
            className="demo-chip"
            onClick={() => handleQuickDemoClick('PAY-2024-002-JANE')}
          >
            <span>🟡 Jane Smith (Expired)</span>
          </button>
          <button
            type="button"
            className="demo-chip"
            onClick={() => handleQuickDemoClick('PAY-2024-003-MIKE')}
          >
            <span>🟢 Mike Johnson (Cricket)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

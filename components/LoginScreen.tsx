'use client';

import { useState, useRef, useEffect } from 'react';

interface LoginScreenProps {
  isSetupMode: boolean;
  onSetup: (password: string, confirm: string) => Promise<string | null>;
  onLogin: (password: string) => Promise<string | null>;
}

export default function LoginScreen({ isSetupMode, onSetup, onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const passRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    passRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (isSetupMode) {
      const err = await onSetup(password, confirm);
      if (err) {
        setError(err);
      }
    } else {
      const err = await onLogin(password);
      if (err) {
        setError(err);
        setPassword('');
        passRef.current?.focus();
      }
    }
  };

  const handlePassKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isSetupMode) {
        confirmRef.current?.focus();
      } else {
        handleSubmit();
      }
    }
  };

  const handleConfirmKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-box">
        <h2>Isaac&apos;s <span>CGPA</span> Tracker</h2>

        {isSetupMode ? (
          <>
            <p className="login-sub">Set up a password to protect your data</p>
            <input
              ref={passRef}
              type="password"
              className="login-input"
              placeholder="Create your password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handlePassKeyDown}
            />
            <div className="login-confirm-row">
              <input
                ref={confirmRef}
                type="password"
                className="login-input"
                placeholder="Confirm password"
                autoComplete="off"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={handleConfirmKeyDown}
              />
            </div>
            <button className="login-btn" onClick={handleSubmit}>
              Set Password &amp; Enter
            </button>
          </>
        ) : (
          <>
            <p className="login-sub">Enter your password to continue</p>
            <input
              ref={passRef}
              type="password"
              className="login-input"
              placeholder="Enter password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handlePassKeyDown}
            />
            <button className="login-btn" onClick={handleSubmit}>
              Unlock
            </button>
          </>
        )}

        <div className="login-error">{error}</div>
      </div>
    </div>
  );
}

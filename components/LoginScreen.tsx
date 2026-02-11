'use client';

import { useState, useRef, useEffect } from 'react';

interface LoginScreenProps {
  rememberedMatric: string;
  onRegister: (matric: string, password: string, confirm: string, rememberMe: boolean) => Promise<string | null>;
  onLogin: (matric: string, password: string, rememberMe: boolean) => Promise<string | null>;
}

export default function LoginScreen({ rememberedMatric, onRegister, onLogin }: LoginScreenProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [matric, setMatric] = useState(rememberedMatric);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [rememberMe, setRememberMe] = useState(!!rememberedMatric);
  const [error, setError] = useState('');
  const matricRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (rememberedMatric) {
      passRef.current?.focus();
    } else {
      matricRef.current?.focus();
    }
  }, [rememberedMatric]);

  const handleSubmit = async () => {
    setError('');
    if (isRegisterMode) {
      const err = await onRegister(matric, password, confirm, rememberMe);
      if (err) {
        setError(err);
      }
    } else {
      const err = await onLogin(matric, password, rememberMe);
      if (err) {
        setError(err);
        setPassword('');
        passRef.current?.focus();
      }
    }
  };

  const handleMatricKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') passRef.current?.focus();
  };

  const handlePassKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isRegisterMode) {
        confirmRef.current?.focus();
      } else {
        handleSubmit();
      }
    }
  };

  const handleConfirmKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setPassword('');
    setConfirm('');
  };

  return (
    <div className="login-overlay">
      <div className="login-box">
        <h2><span>CGPA</span> Tracker</h2>
        <p className="login-sub">
          {isRegisterMode ? 'Create an account to track your CGPA' : 'Login to continue'}
        </p>

        {/* Matric Number */}
        <input
          ref={matricRef}
          type="text"
          className="login-input"
          placeholder="Matric Number (e.g. 2022/1/12345GP)"
          autoComplete="off"
          value={matric}
          onChange={(e) => setMatric(e.target.value)}
          onKeyDown={handleMatricKeyDown}
          style={{ textTransform: 'uppercase' }}
        />

        {/* Password */}
        <input
          ref={passRef}
          type="password"
          className="login-input"
          placeholder={isRegisterMode ? 'Create your password' : 'Enter password'}
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handlePassKeyDown}
        />

        {/* Confirm password (register only) */}
        {isRegisterMode && (
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
        )}

        {/* Remember Me */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          margin: '8px 0 16px', fontSize: '0.85rem', color: 'var(--muted)',
          cursor: 'pointer', userSelect: 'none',
        }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ accentColor: 'var(--accent)', width: '16px', height: '16px', cursor: 'pointer' }}
          />
          Remember my Matric Number
        </label>

        <button className="login-btn" onClick={handleSubmit}>
          {isRegisterMode ? 'Register & Enter' : 'Login'}
        </button>

        <div className="login-error">{error}</div>

        {/* Toggle register/login */}
        <p style={{
          textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--muted)',
        }}>
          {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={toggleMode}
            style={{
              background: 'none', border: 'none', color: 'var(--accent)',
              cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline',
              padding: 0,
            }}
          >
            {isRegisterMode ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}

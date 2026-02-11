'use client';

import { useState, useCallback, useEffect } from 'react';
import { REMEMBER_MATRIC_KEY } from '@/lib/constants';

function getRememberedMatric(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(REMEMBER_MATRIC_KEY) || '';
}

function setRememberedMatric(matric: string): void {
  localStorage.setItem(REMEMBER_MATRIC_KEY, matric.toUpperCase().trim());
}

function clearRememberedMatric(): void {
  localStorage.removeItem(REMEMBER_MATRIC_KEY);
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matricNumber, setMatricNumber] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [checking, setChecking] = useState(true);

  // Check session on mount (cookie-based JWT)
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setMatricNumber(data.matricNumber);
          setRole(data.role);
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleRegister = useCallback(async (
    matric: string, password: string, confirm: string, rememberMe: boolean
  ): Promise<string | null> => {
    const trimmedMatric = matric.toUpperCase().trim();
    if (!trimmedMatric) return 'Please enter your matric number.';
    if (!password) return 'Please enter a password.';
    if (password.length < 3) return 'Password must be at least 3 characters.';
    if (password !== confirm) return 'Passwords do not match.';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricNumber: trimmedMatric, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || 'Registration failed.';

      if (rememberMe) {
        setRememberedMatric(trimmedMatric);
      } else {
        clearRememberedMatric();
      }

      setMatricNumber(data.matricNumber);
      setRole(data.role);
      setIsAuthenticated(true);
      return null;
    } catch {
      return 'Network error. Please try again.';
    }
  }, []);

  const handleLogin = useCallback(async (
    matric: string, password: string, rememberMe: boolean
  ): Promise<string | null> => {
    const trimmedMatric = matric.toUpperCase().trim();
    if (!trimmedMatric) return 'Please enter your matric number.';
    if (!password) return 'Please enter your password.';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricNumber: trimmedMatric, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || 'Login failed.';

      if (rememberMe) {
        setRememberedMatric(trimmedMatric);
      } else {
        clearRememberedMatric();
      }

      setMatricNumber(data.matricNumber);
      setRole(data.role);
      setIsAuthenticated(true);
      return null;
    } catch {
      return 'Network error. Please try again.';
    }
  }, []);

  const lock = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
    setMatricNumber('');
    setRole('student');
  }, []);

  return {
    isAuthenticated,
    matricNumber,
    role,
    checking,
    handleRegister,
    handleLogin,
    lock,
    getRememberedMatric,
  };
}

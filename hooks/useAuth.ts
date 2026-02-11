'use client';

import { useState, useCallback } from 'react';
import {
  sha256, getStoredHash, setStoredHash, isRegistered,
  setRememberedMatric, getRememberedMatric, clearRememberedMatric,
} from '@/lib/auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matricNumber, setMatricNumber] = useState('');

  // Register a new user with matric number + password
  const handleRegister = useCallback(async (
    matric: string, password: string, confirm: string, rememberMe: boolean
  ): Promise<string | null> => {
    const trimmedMatric = matric.toUpperCase().trim();
    if (!trimmedMatric) return 'Please enter your matric number.';
    if (!password) return 'Please enter a password.';
    if (password.length < 3) return 'Password must be at least 3 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    if (isRegistered(trimmedMatric)) return 'This matric number is already registered. Please login instead.';

    const hash = await sha256(password);
    setStoredHash(trimmedMatric, hash);

    if (rememberMe) {
      setRememberedMatric(trimmedMatric);
    } else {
      clearRememberedMatric();
    }

    setMatricNumber(trimmedMatric);
    setIsAuthenticated(true);
    return null;
  }, []);

  // Login an existing user
  const handleLogin = useCallback(async (
    matric: string, password: string, rememberMe: boolean
  ): Promise<string | null> => {
    const trimmedMatric = matric.toUpperCase().trim();
    if (!trimmedMatric) return 'Please enter your matric number.';
    if (!password) return 'Please enter your password.';

    const storedHash = getStoredHash(trimmedMatric);
    if (!storedHash) return 'Matric number not found. Please register first.';

    const hash = await sha256(password);
    if (hash !== storedHash) return 'Incorrect password. Try again.';

    if (rememberMe) {
      setRememberedMatric(trimmedMatric);
    } else {
      clearRememberedMatric();
    }

    setMatricNumber(trimmedMatric);
    setIsAuthenticated(true);
    return null;
  }, []);

  const lock = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    matricNumber,
    handleRegister,
    handleLogin,
    lock,
    getRememberedMatric,
  };
}

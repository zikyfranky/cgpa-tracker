'use client';

import { useState, useCallback } from 'react';
import { sha256, getStoredHash, setStoredHash } from '@/lib/auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isSetup = useCallback((): boolean => {
    return !getStoredHash();
  }, []);

  const handleSetup = useCallback(async (password: string, confirm: string): Promise<string | null> => {
    if (!password) return 'Please enter a password.';
    if (password.length < 3) return 'Password must be at least 3 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    const hash = await sha256(password);
    setStoredHash(hash);
    setIsAuthenticated(true);
    return null; // no error
  }, []);

  const handleLogin = useCallback(async (password: string): Promise<string | null> => {
    if (!password) return 'Please enter your password.';
    const hash = await sha256(password);
    const storedHash = getStoredHash();
    if (hash === storedHash) {
      setIsAuthenticated(true);
      return null;
    }
    return 'Incorrect password. Try again.';
  }, []);

  const lock = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    isSetup,
    handleSetup,
    handleLogin,
    lock,
  };
}

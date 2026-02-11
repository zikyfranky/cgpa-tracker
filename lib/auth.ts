import { AUTH_STORAGE_KEY_PREFIX, REMEMBER_MATRIC_KEY } from "./constants";

export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Get stored password hash for a specific matric number
export function getStoredHash(matricNumber: string): string | null {
  if (typeof window === "undefined") return null;
  const key = AUTH_STORAGE_KEY_PREFIX + matricNumber.toUpperCase().trim();
  return localStorage.getItem(key);
}

// Store password hash for a specific matric number
export function setStoredHash(matricNumber: string, hash: string): void {
  const key = AUTH_STORAGE_KEY_PREFIX + matricNumber.toUpperCase().trim();
  localStorage.setItem(key, hash);
}

// Check if a matric number is already registered
export function isRegistered(matricNumber: string): boolean {
  return getStoredHash(matricNumber) !== null;
}

// Remember Me: save matric number
export function setRememberedMatric(matricNumber: string): void {
  localStorage.setItem(REMEMBER_MATRIC_KEY, matricNumber.toUpperCase().trim());
}

// Remember Me: get saved matric number
export function getRememberedMatric(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(REMEMBER_MATRIC_KEY) || "";
}

// Remember Me: clear saved matric number
export function clearRememberedMatric(): void {
  localStorage.removeItem(REMEMBER_MATRIC_KEY);
}

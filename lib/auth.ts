import { AUTH_STORAGE_KEY } from "./constants";

export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getStoredHash(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

export function setStoredHash(hash: string): void {
  localStorage.setItem(AUTH_STORAGE_KEY, hash);
}

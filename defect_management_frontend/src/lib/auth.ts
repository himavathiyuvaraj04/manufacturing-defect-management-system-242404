const TOKEN_KEY = "dms_token";

// PUBLIC_INTERFACE
export function getToken(): string | null {
  /** Get stored JWT token (client-side). */
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// PUBLIC_INTERFACE
export function setToken(token: string): void {
  /** Store JWT token (client-side). */
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

// PUBLIC_INTERFACE
export function clearToken(): void {
  /** Clear JWT token (client-side). */
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Injast SSO authentication utilities.
 * Handles session code detection, extraction, and callback processing.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Check if a URL contains an Injast session code.
 * Session codes are typically passed as query parameters.
 */
export function isInjastSessionCode(url: string): boolean {
  try {
    const urlObj = new URL(url, window.location.origin);
    const sessionCode = urlObj.searchParams.get('session_code');
    return !!sessionCode;
  } catch {
    return false;
  }
}

/**
 * Extract session code from URL query parameters.
 * Returns null if no session code is found.
 */
export function extractSessionCode(url: string): string | null {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.searchParams.get('session_code');
  } catch {
    return null;
  }
}

/**
 * Extract session code from current window location.
 */
export function getSessionCodeFromLocation(): string | null {
  return extractSessionCode(window.location.href);
}

/**
 * Remove session code from URL without reloading the page.
 */
export function removeSessionCodeFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('session_code');
  window.history.replaceState({}, '', url.toString());
}

/**
 * Handle Injast SSO callback by exchanging session code for tokens.
 * Returns the login response with access token, refresh token, and user data.
 */
export async function handleInjastCallback(sessionCode: string): Promise<{
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/api/auth/injast/callback/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_code: sessionCode }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      error: 'خطا در احراز هویت Injast',
      message: 'خطا در احراز هویت Injast'
    }));
    throw new Error(error.message || error.error || 'خطا در احراز هویت Injast');
  }

  const data = await response.json();
  return data;
}


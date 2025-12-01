import type { User } from "@/lib/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6000';

const ADMIN_TOKEN_KEY = 'admin_access_token';

export interface AdminLoginResponse {
  access: string;
  refresh: string;
  admin_access: string;
  user: User;
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function clearAdminAuth(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

/**
 * Login for Admin panel using the separate admin JWT endpoint.
 * This only stores the separate admin token.
 *
 * It intentionally does NOT touch the normal app JWT tokens or global user,
 * so logging into the admin panel does not create a normal user session.
 */
export async function adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/admin-login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در ورود به پنل ادمین' }));
    throw new Error(error.error || 'خطا در ورود به پنل ادمین');
  }

  const data: AdminLoginResponse = await response.json();
  // Store only the separate admin token; ignore normal access/refresh here
  setAdminToken(data.admin_access);
  return data;
}



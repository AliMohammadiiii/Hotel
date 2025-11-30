const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff?: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface SignupRequest {
  username: string;
  password: string;
  password_confirm: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Store tokens in localStorage
 */
export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Store user info in localStorage
 */
export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get user info from localStorage
 */
export function getUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Clear all auth data from localStorage
 */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Login with username and password
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در ورود به سیستم' }));
    throw new Error(error.error || 'خطا در ورود به سیستم');
  }

  const data: LoginResponse = await response.json();
  setTokens(data.access, data.refresh);
  setUser(data.user);
  return data;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error('Refresh token not found');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearAuth();
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  setTokens(data.access, refresh);
  return data.access;
}

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<User> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
      throw new Error('Session expired');
    }
    throw new Error('Failed to get user info');
  }

  const user: User = await response.json();
  setUser(user);
  return user;
}

/**
 * Signup with username, password, and email
 */
export async function signup(data: SignupRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در ثبت نام' }));
    
    // Handle validation errors
    if (error.errors) {
      const errorMessages = Object.values(error.errors).flat();
      throw new Error(errorMessages.join('\n') || error.error || 'خطا در ثبت نام');
    }
    
    throw new Error(error.error || 'خطا در ثبت نام');
  }

  const responseData: LoginResponse = await response.json();
  setTokens(responseData.access, responseData.refresh);
  setUser(responseData.user);
  return responseData;
}

/**
 * Login with Injast SSO using session code
 */
export async function loginWithInjast(sessionCode: string): Promise<LoginResponse> {
  const { handleInjastCallback } = await import('./injastAuth');
  const data = await handleInjastCallback(sessionCode);
  setTokens(data.access, data.refresh);
  setUser(data.user);
  return data;
}

/**
 * Logout - clear all auth data
 */
export function logout(): void {
  clearAuth();
}


import type { Accommodation, AccommodationDetail, AccommodationListResponse } from '@shared/api';
import { getAccessToken, refreshToken, clearAuth } from './auth';

/**
 * API Base URL
 * Can be overridden with environment variable VITE_API_BASE_URL
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6000';

/**
 * Fetch wrapper that automatically adds JWT token and handles 401 errors
 */
async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  let response = await fetch(url, {
    ...options,
    headers,
  });
  
  // If 401, try to refresh token and retry
  if (response.status === 401 && token) {
    try {
      const newToken = await refreshToken();
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (error) {
      // Refresh failed, clear auth and redirect to login
      clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw error;
    }
  }
  
  return response;
}

/**
 * Fetch accommodations list
 */
export async function getAccommodations(): Promise<Accommodation[]> {
  const response = await fetch(`${API_BASE_URL}/api/accommodations/`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch accommodations: ${response.statusText}`);
  }
  
  const data: AccommodationListResponse = await response.json();
  return data.results;
}

/**
 * Fetch accommodation detail by ID
 */
export async function getAccommodationDetail(id: number): Promise<AccommodationDetail> {
  const response = await fetch(`${API_BASE_URL}/api/accommodations/${id}/`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch accommodation detail: ${response.statusText}`);
  }
  
  const data: AccommodationDetail = await response.json();
  return data;
}

/**
 * Fetch unavailable dates for an accommodation
 */
export async function getUnavailableDates(id: number): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/accommodations/${id}/unavailable-dates/`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch unavailable dates: ${response.statusText}`);
  }
  
  const data: { unavailable_dates: string[] } = await response.json();
  return data.unavailable_dates || [];
}

/**
 * Export authenticated fetch for use in other modules
 */
export { authenticatedFetch };



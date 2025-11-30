import type { Reservation, CreateReservationRequest, UpdateReservationRequest, ReservationListResponse } from '@shared/api';
import { authenticatedFetch } from './api';
import { persianToGregorian } from './dateUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Get all reservations for the current user
 */
export async function getReservations(): Promise<Reservation[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/reservations/`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch reservations: ${response.statusText}`);
  }
  
  const data: ReservationListResponse = await response.json();
  return data.results;
}

/**
 * Get a single reservation by ID
 */
export async function getReservation(id: number): Promise<Reservation> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/reservations/${id}/`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch reservation: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Create a new reservation
 * Note: Dates should be in Gregorian format (YYYY-MM-DD) for the API
 */
export async function createReservation(data: CreateReservationRequest): Promise<Reservation> {
  console.log('createReservation called with:', data);
  console.log('API URL:', `${API_BASE_URL}/api/reservations/`);
  
  const response = await authenticatedFetch(`${API_BASE_URL}/api/reservations/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  console.log('API Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'خطا در ایجاد رزرو' }));
    console.error('API Error response:', errorData);
    const errorMessage = errorData.error || errorData.detail || errorData.message || JSON.stringify(errorData) || 'خطا در ایجاد رزرو';
    throw new Error(errorMessage);
  }
  
  const result = await response.json();
  console.log('Reservation created:', result);
  return result;
}

/**
 * Update an existing reservation
 */
export async function updateReservation(
  id: number,
  data: UpdateReservationRequest
): Promise<Reservation> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/reservations/${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در بروزرسانی رزرو' }));
    throw new Error(error.error || error.detail || 'خطا در بروزرسانی رزرو');
  }
  
  return await response.json();
}

/**
 * Delete a reservation
 */
export async function deleteReservation(id: number): Promise<void> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/reservations/${id}/`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در حذف رزرو' }));
    throw new Error(error.error || error.detail || 'خطا در حذف رزرو');
  }
}

/**
 * Helper function to convert Persian date to Gregorian for API
 */
export function convertPersianDateToGregorian(year: number, month: number, day: number): string {
  const gregorian = persianToGregorian(year, month, day);
  if (!gregorian) {
    throw new Error('تاریخ نامعتبر است');
  }
  return gregorian;
}



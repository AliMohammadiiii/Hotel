import { authenticatedFetch } from "@/lib/api";
import type {
  Accommodation,
  AccommodationDetail,
  Reservation,
  Amenity,
} from "@shared/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6000';

// Admin Accommodation APIs
export async function getAdminAccommodations(search?: string): Promise<Accommodation[]> {
  const url = new URL(`${API_BASE_URL}/api/admin/accommodations/`);
  if (search) {
    url.searchParams.append('search', search);
  }
  const response = await authenticatedFetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch accommodations: ${response.statusText}`);
  }
  const data = await response.json();
  // Handle paginated response
  return Array.isArray(data) ? data : (data.results || []);
}

export async function getAdminAccommodation(id: number): Promise<AccommodationDetail> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/accommodations/${id}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch accommodation: ${response.statusText}`);
  }
  return response.json();
}

export async function createAccommodation(data: FormData): Promise<AccommodationDetail> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/accommodations/`, {
    method: 'POST',
    // Don't set Content-Type header - browser will set it automatically with boundary for FormData
    body: data,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در ایجاد اقامتگاه' }));
    throw new Error(error.error || error.detail || 'خطا در ایجاد اقامتگاه');
  }
  return response.json();
}

export async function updateAccommodation(id: number, data: FormData): Promise<AccommodationDetail> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/accommodations/${id}/`, {
    method: 'PATCH',
    // Don't set Content-Type header - browser will set it automatically with boundary for FormData
    body: data,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در بروزرسانی اقامتگاه' }));
    throw new Error(error.error || error.detail || 'خطا در بروزرسانی اقامتگاه');
  }
  return response.json();
}

export async function deleteAccommodation(id: number): Promise<void> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/accommodations/${id}/`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete accommodation: ${response.statusText}`);
  }
}

export async function addAccommodationImage(accommodationId: number, image: File): Promise<any> {
  const formData = new FormData();
  formData.append('image', image);
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/admin/accommodations/${accommodationId}/images/`,
    {
      method: 'POST',
      body: formData,
    }
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در آپلود تصویر' }));
    throw new Error(error.error || error.detail || 'خطا در آپلود تصویر');
  }
  return response.json();
}

export async function deleteAccommodationImage(accommodationId: number, imageId: number): Promise<void> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/admin/accommodations/${accommodationId}/images/${imageId}/`,
    {
      method: 'DELETE',
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to delete image: ${response.statusText}`);
  }
}

// Admin Amenity APIs
export async function getAdminAmenities(search?: string): Promise<Amenity[]> {
  const url = new URL(`${API_BASE_URL}/api/admin/amenities/`);
  if (search) {
    url.searchParams.append('search', search);
  }
  const response = await authenticatedFetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch amenities: ${response.statusText}`);
  }
  const data = await response.json();
  // Handle paginated response
  return Array.isArray(data) ? data : (data.results || []);
}

export async function getAdminAmenity(id: number): Promise<Amenity> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/amenities/${id}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch amenity: ${response.statusText}`);
  }
  return response.json();
}

export async function createAmenity(data: FormData): Promise<Amenity> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/amenities/`, {
    method: 'POST',
    // Don't set Content-Type header - browser will set it automatically with boundary for FormData
    body: data,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در ایجاد امکانات' }));
    throw new Error(error.error || error.detail || 'خطا در ایجاد امکانات');
  }
  return response.json();
}

export async function updateAmenity(id: number, data: FormData): Promise<Amenity> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/amenities/${id}/`, {
    method: 'PATCH',
    // Don't set Content-Type header - browser will set it automatically with boundary for FormData
    body: data,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در بروزرسانی امکانات' }));
    throw new Error(error.error || error.detail || 'خطا در بروزرسانی امکانات');
  }
  return response.json();
}

export async function deleteAmenity(id: number): Promise<void> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/amenities/${id}/`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete amenity: ${response.statusText}`);
  }
}

// Admin Reservation APIs
export interface AdminReservationFilters {
  status?: string;
  accommodation?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export async function getAdminReservations(filters?: AdminReservationFilters): Promise<Reservation[]> {
  const url = new URL(`${API_BASE_URL}/api/admin/reservations/`);
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }
  const response = await authenticatedFetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch reservations: ${response.statusText}`);
  }
  const data = await response.json();
  // Handle paginated response
  return Array.isArray(data) ? data : (data.results || []);
}

export async function getAdminReservation(id: number): Promise<Reservation> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/reservations/${id}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch reservation: ${response.statusText}`);
  }
  return response.json();
}

export async function updateReservationStatus(id: number, status: string): Promise<Reservation> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/admin/reservations/${id}/update-status/`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    }
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در بروزرسانی وضعیت' }));
    throw new Error(error.error || error.detail || 'خطا در بروزرسانی وضعیت');
  }
  return response.json();
}

export async function updateReservation(id: number, data: Partial<Reservation>): Promise<Reservation> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/reservations/${id}/update/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در بروزرسانی رزرو' }));
    throw new Error(error.error || error.detail || 'خطا در بروزرسانی رزرو');
  }
  return response.json();
}

// Admin Room Availability APIs
export interface RoomAvailability {
  id: number;
  accommodation: number;
  accommodation_title: string;
  date: string;
  price: string | null;
  status: string;
  effective_price: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomAvailabilityFilters {
  accommodation?: number;
  start_date?: string;
  end_date?: string;
}

export async function getAdminRoomAvailability(filters?: RoomAvailabilityFilters): Promise<RoomAvailability[]> {
  const url = new URL(`${API_BASE_URL}/api/admin/room-availability/`);
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }
  const response = await authenticatedFetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch room availability: ${response.statusText}`);
  }
  const data = await response.json();
  // Handle paginated response
  return Array.isArray(data) ? data : (data.results || []);
}

export async function createRoomAvailability(data: {
  accommodation: number;
  date: string;
  price?: string | null;
  status: string;
}): Promise<RoomAvailability> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/room-availability/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در ایجاد وضعیت' }));
    throw new Error(error.error || error.detail || 'خطا در ایجاد وضعیت');
  }
  return response.json();
}

export async function updateRoomAvailability(
  id: number,
  data: Partial<RoomAvailability>
): Promise<RoomAvailability> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/room-availability/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در بروزرسانی وضعیت' }));
    throw new Error(error.error || error.detail || 'خطا در بروزرسانی وضعیت');
  }
  return response.json();
}

export async function deleteRoomAvailability(id: number): Promise<void> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/room-availability/${id}/`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete room availability: ${response.statusText}`);
  }
}

export interface BulkCreateAvailabilityRequest {
  accommodation: number;
  start_date: string;
  end_date: string;
  status?: string;
  price?: string | null;
}

export async function bulkCreateRoomAvailability(
  data: BulkCreateAvailabilityRequest
): Promise<{ message: string; count: number }> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/room-availability/bulk-create/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'خطا در ایجاد دسته‌ای وضعیت' }));
    throw new Error(error.error || error.detail || 'خطا در ایجاد دسته‌ای وضعیت');
  }
  return response.json();
}


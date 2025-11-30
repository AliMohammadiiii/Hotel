/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Accommodation API Types
 */

export interface Accommodation {
  id: number;
  title: string;
  city: string;
  province: string;
  capacity: number;
  beds: string;
  area: number;
  rating: number; // Backend now serializes as number (coerce_to_string=False)
  price_per_night: string;
  main_image: string | null;
  images: string[]; // All images including main_image and additional images
}

export interface Amenity {
  id: number;
  name: string;
  icon: string | null;
  category: string | null;
}

export interface AccommodationDetail {
  id: number;
  title: string;
  city: string;
  province: string;
  address: string;
  capacity: number;
  beds: string;
  area: number;
  bathroom: string | null;
  rating: number; // Backend now serializes as number (coerce_to_string=False)
  price_per_night: string;
  description: string;
  amenities: Amenity[]; // Now returns full amenity objects with icon URLs
  images: string[]; // Includes main_image as fallback if no additional images
  main_image: string | null;
}

export interface AccommodationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Accommodation[];
}

/**
 * Reservation API Types
 */
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Reservation {
  id: number;
  accommodation: number | Accommodation; // accommodation ID or full object (in list responses)
  accommodation_title?: string;
  accommodation_detail?: Accommodation;
  check_in_date: string; // ISO date string
  check_out_date: string; // ISO date string
  number_of_guests: number;
  nights?: number;
  total_price: string;
  status: ReservationStatus;
  contact_phone: string;
  contact_email: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateReservationRequest {
  accommodation: number;
  check_in_date: string; // ISO date string (Gregorian)
  check_out_date: string; // ISO date string (Gregorian)
  number_of_guests: number;
  contact_phone: string;
  contact_email: string;
}

export interface UpdateReservationRequest {
  check_in_date?: string;
  check_out_date?: string;
  number_of_guests?: number;
  contact_phone?: string;
  contact_email?: string;
  status?: ReservationStatus;
}

export interface ReservationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Reservation[];
}

/**
 * Admin API Types
 */
export interface CreateAccommodationRequest {
  title: string;
  city: string;
  province: string;
  address: string;
  description: string;
  capacity: number;
  beds_description: string;
  area: number;
  price_per_night: number;
  rating?: number;
  main_image?: File;
  amenities?: number[];
}

export interface UpdateAccommodationRequest extends Partial<CreateAccommodationRequest> {
  id: number;
}

export interface CreateAmenityRequest {
  name: string;
  category?: string;
  icon?: File;
}

export interface UpdateAmenityRequest extends Partial<CreateAmenityRequest> {
  id: number;
}

export interface RoomAvailabilityResponse {
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

export interface CreateRoomAvailabilityRequest {
  accommodation: number;
  date: string;
  price?: string | null;
  status: string;
}

export interface AdminReservationResponse extends Reservation {
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

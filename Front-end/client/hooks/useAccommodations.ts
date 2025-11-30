import { useQuery } from '@tanstack/react-query';
import { getAccommodations, getAccommodationDetail } from '@/lib/api';

/**
 * Hook to fetch accommodations list
 */
export function useAccommodations() {
  return useQuery({
    queryKey: ['accommodations'],
    queryFn: getAccommodations,
  });
}

/**
 * Hook to fetch accommodation detail by ID
 */
export function useAccommodationDetail(id: number) {
  return useQuery({
    queryKey: ['accommodation', id],
    queryFn: () => getAccommodationDetail(id),
    enabled: !!id,
  });
}



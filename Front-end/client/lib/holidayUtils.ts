/**
 * Utility functions for checking holidays and Fridays
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface HolidayResponse {
  is_holiday: boolean;
  holiday_name: string;
  year: number;
  month: number;
  day: number;
}

// Cache for holiday checks to avoid repeated API calls
const holidayCache = new Map<string, boolean>();

/**
 * Check if a Persian date is a holiday using the backend API
 */
export async function isHoliday(year: number, month: number, day: number): Promise<boolean> {
  const cacheKey = `${year}-${month}-${day}`;
  
  // Check cache first
  if (holidayCache.has(cacheKey)) {
    return holidayCache.get(cacheKey)!;
  }
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/accommodations/holiday/check/?year=${year}&month=${month}&day=${day}`
    );
    
    if (!response.ok) {
      // If API fails, assume not a holiday (don't break the calendar)
      return false;
    }
    
    const data: HolidayResponse = await response.json();
    const isHolidayDate = data.is_holiday || false;
    
    // Cache the result
    holidayCache.set(cacheKey, isHolidayDate);
    
    return isHolidayDate;
  } catch (error) {
    // If request fails, assume not a holiday
    console.warn('Failed to check holiday:', error);
    return false;
  }
}

/**
 * Check if a Gregorian date is a Friday
 */
export function isFriday(gregorianDate: string): boolean {
  try {
    const date = new Date(gregorianDate);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    // In Persian calendar, Friday is represented as Saturday in Gregorian (since week starts on Saturday)
    // But we need to check if the actual Gregorian date is Friday
    return dayOfWeek === 5; // Friday in JavaScript Date (0-indexed, Sunday = 0)
  } catch {
    return false;
  }
}

/**
 * Check if a Persian date corresponds to a Friday (using Gregorian date)
 * This is a helper that takes a Gregorian date string for convenience
 */
export function isFridayFromGregorian(gregorianDate: string | null): boolean {
  if (!gregorianDate) return false;
  return isFriday(gregorianDate);
}

/**
 * Batch check multiple dates for holidays (optimized)
 */
export async function checkHolidays(
  dates: Array<{ year: number; month: number; day: number }>
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  // Check cache first and filter out cached dates
  const uncachedDates = dates.filter(date => {
    const cacheKey = `${date.year}-${date.month}-${date.day}`;
    if (holidayCache.has(cacheKey)) {
      results.set(cacheKey, holidayCache.get(cacheKey)!);
      return false;
    }
    return true;
  });
  
  // Check remaining dates in parallel
  const promises = uncachedDates.map(async (date) => {
    const cacheKey = `${date.year}-${date.month}-${date.day}`;
    const isHolidayDate = await isHoliday(date.year, date.month, date.day);
    results.set(cacheKey, isHolidayDate);
  });
  
  await Promise.all(promises);
  
  return results;
}

/**
 * Clear the holiday cache (useful for testing or refreshing)
 */
export function clearHolidayCache(): void {
  holidayCache.clear();
}


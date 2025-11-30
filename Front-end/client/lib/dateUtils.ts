import { toJalaali, toGregorian, jalaaliToDateObject } from 'jalaali-js';

/**
 * Convert Gregorian date string (YYYY-MM-DD) to Persian date object
 */
export function gregorianToPersian(dateString: string): { year: number; month: number; day: number } | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    const jalaali = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return {
      year: jalaali.jy,
      month: jalaali.jm,
      day: jalaali.jd,
    };
  } catch {
    return null;
  }
}

/**
 * Convert Persian date object to Gregorian date string (YYYY-MM-DD)
 */
export function persianToGregorian(year: number, month: number, day: number): string | null {
  try {
    const gregorian = toGregorian(year, month, day);
    const date = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
    
    if (isNaN(date.getTime())) return null;
    
    const yearStr = date.getFullYear().toString().padStart(4, '0');
    const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = date.getDate().toString().padStart(2, '0');
    
    return `${yearStr}-${monthStr}-${dayStr}`;
  } catch {
    return null;
  }
}

/**
 * Format Persian date for display
 */
export function formatPersianDate(year: number, month: number, day: number): string {
  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  
  return `${day} ${monthNames[month - 1]} ${year}`;
}

/**
 * Format date string for display (converts to Persian)
 */
export function formatDateForDisplay(dateString: string): string {
  const persian = gregorianToPersian(dateString);
  if (!persian) return dateString;
  return formatPersianDate(persian.year, persian.month, persian.day);
}

/**
 * Get today's date in Persian
 */
export function getTodayPersian(): { year: number; month: number; day: number } {
  const today = new Date();
  const jalaali = toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
  return {
    year: jalaali.jy,
    month: jalaali.jm,
    day: jalaali.jd,
  };
}

/**
 * Get today's date in Gregorian (YYYY-MM-DD)
 */
export function getTodayGregorian(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}





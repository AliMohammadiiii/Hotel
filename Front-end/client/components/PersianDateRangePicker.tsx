import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReservation } from "@/lib/reservations";
import { getCurrentUser } from "@/lib/auth";
import { gregorianToPersian, persianToGregorian, formatPersianDate, getTodayPersian } from "@/lib/dateUtils";
import { isHoliday, isFridayFromGregorian } from "@/lib/holidayUtils";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { X, Minus, Plus, Users, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { AccommodationDetail, CreateReservationRequest } from "@shared/api";

interface DatePrice {
  date: string; // Gregorian date string (YYYY-MM-DD)
  price: number;
}

interface PersianDateRangePickerProps {
  checkInDate?: string; // Gregorian date string (YYYY-MM-DD)
  checkOutDate?: string; // Gregorian date string (YYYY-MM-DD)
  onCheckInChange: (date: string | null) => void;
  onCheckOutChange: (date: string | null) => void;
  pricePerNight: number; // Base price per night
  datePrices?: DatePrice[]; // Optional: date-specific prices (for future use)
  minDate?: string; // Gregorian date string
  accommodation?: AccommodationDetail; // Accommodation details for reservation
  unavailableDates?: string[]; // Dates that are already reserved or pending
  onClose?: () => void;
  onConfirm?: () => void;
  onClear?: () => void;
  onReservationComplete?: () => void; // Callback after successful reservation
}

export function PersianDateRangePicker({
  checkInDate,
  checkOutDate,
  onCheckInChange,
  onCheckOutChange,
  pricePerNight,
  datePrices = [],
  minDate,
  accommodation,
  unavailableDates = [],
  onClose,
  onConfirm,
  onClear,
  onReservationComplete,
}: PersianDateRangePickerProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const today = getTodayPersian();
  const [currentYear1, setCurrentYear1] = useState(today.year);
  const [currentMonth1, setCurrentMonth1] = useState(today.month);
  const [currentYear2, setCurrentYear2] = useState(today.year);
  const [currentMonth2, setCurrentMonth2] = useState(today.month === 12 ? 1 : today.month + 1);
  const [numberOfGuests, setNumberOfGuests] = useState(0);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [showReservationSection, setShowReservationSection] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [holidayCache, setHolidayCache] = useState<Map<string, boolean>>(new Map());
  const holidayCacheRef = useRef<Map<string, boolean>>(new Map());

  // Initialize email from user if available
  useEffect(() => {
    if (user?.email && !contactEmail) {
      setContactEmail(user.email);
    }
  }, [user, contactEmail]);

  // Check holidays for visible months when months change
  useEffect(() => {
    const checkHolidaysForVisibleMonths = async () => {
      const newCache = new Map(holidayCacheRef.current); // Start with existing cache
      const datesToCheck: Array<{ year: number; month: number; day: number }> = [];

      // Collect all dates from both visible months
      for (const { year, month } of [
        { year: currentYear1, month: currentMonth1 },
        { year: currentYear2, month: currentMonth2 },
      ]) {
        const days = getDaysInMonth(year, month);
        for (let day = 1; day <= days; day++) {
          const cacheKey = `${year}-${month}-${day}`;
          // Only check dates we don't have in cache
          if (!newCache.has(cacheKey)) {
            datesToCheck.push({ year, month, day });
          }
        }
      }

      // Check holidays in parallel for new dates
      const holidayPromises = datesToCheck.map(async ({ year, month, day }) => {
        const cacheKey = `${year}-${month}-${day}`;
        const isHolidayDate = await isHoliday(year, month, day);
        newCache.set(cacheKey, isHolidayDate);
      });

      await Promise.all(holidayPromises);
      holidayCacheRef.current = newCache;
      setHolidayCache(newCache);
    };

    checkHolidaysForVisibleMonths();
  }, [currentYear1, currentMonth1, currentYear2, currentMonth2]);
  
  // Adjust year for second month
  useEffect(() => {
    if (currentMonth1 === 12) {
      setCurrentYear2(currentYear1 + 1);
      setCurrentMonth2(1);
    } else {
      setCurrentYear2(currentYear1);
      setCurrentMonth2(currentMonth1 + 1);
    }
  }, [currentYear1, currentMonth1]);

  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
  const weekDaysFull = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

  const daysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  
  const isLeapYear = (year: number) => {
    const p = [1, 5, 9, 13, 17, 22, 26, 30];
    return p.includes(year % 33);
  };

  const getDaysInMonth = (year: number, month: number) => {
    if (month === 12 && !isLeapYear(year)) return 29;
    return daysInMonth[month - 1];
  };

  const getFirstDayOfWeek = (year: number, month: number) => {
    // Get the first day of the month in Gregorian
    const gregorian = persianToGregorian(year, month, 1);
    if (!gregorian) return 0;
    const date = new Date(gregorian);
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    // Convert to Persian week: Saturday = 0, Sunday = 1, etc.
    return (day + 1) % 7;
  };

  const getPriceForDate = (gregorianDate: string): number => {
    const datePrice = datePrices.find(dp => dp.date === gregorianDate);
    return datePrice ? datePrice.price : pricePerNight;
  };

  const formatPrice = (price: number): string => {
    // Remove last 3 zeros (divide by 1000)
    const priceInThousands = Math.floor(price / 1000);
    return priceInThousands.toLocaleString('fa-IR');
  };

  const isDateInRange = (year: number, month: number, day: number): boolean => {
    if (!checkInDate || !checkOutDate) return false;
    const gregorian = persianToGregorian(year, month, day);
    if (!gregorian) return false;
    return gregorian >= checkInDate && gregorian < checkOutDate;
  };

  const isDateSelected = (year: number, month: number, day: number, type: 'checkin' | 'checkout'): boolean => {
    const gregorian = persianToGregorian(year, month, day);
    if (!gregorian) return false;
    if (type === 'checkin') return gregorian === checkInDate;
    return gregorian === checkOutDate;
  };

  const isDateDisabled = (year: number, month: number, day: number): boolean => {
    const gregorian = persianToGregorian(year, month, day);
    if (!gregorian) return true;
    if (minDate && gregorian < minDate) return true;
    // Don't disable reserved dates - we'll show them differently
    return false;
  };

  const isDateReserved = (year: number, month: number, day: number): boolean => {
    const gregorian = persianToGregorian(year, month, day);
    if (!gregorian) return false;
    // Check if date is in unavailable dates (reserved or pending)
    return unavailableDates.includes(gregorian);
  };

  const handleDateClick = (year: number, month: number, day: number) => {
    const gregorian = persianToGregorian(year, month, day);
    if (!gregorian || isDateDisabled(year, month, day)) return;

    if (!checkInDate || (checkInDate && checkOutDate)) {
      // Start new selection
      onCheckInChange(gregorian);
      onCheckOutChange(null);
    } else if (checkInDate && !checkOutDate) {
      // Select checkout date
      if (gregorian <= checkInDate) {
        // If clicked date is before or equal to check-in, make it the new check-in
        onCheckInChange(gregorian);
        onCheckOutChange(null);
      } else {
        // Valid checkout date
        onCheckOutChange(gregorian);
      }
    }
  };

  const renderCalendar = (year: number, month: number) => {
    const days = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfWeek(year, month);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);
    
    // Get previous month's last days for padding
    const prevMonthDays = [];
    if (firstDay > 0) {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevMonthDaysCount = getDaysInMonth(prevYear, prevMonth);
      for (let i = prevMonthDaysCount - firstDay + 1; i <= prevMonthDaysCount; i++) {
        prevMonthDays.push({ day: i, month: prevMonth, year: prevYear, isPrevMonth: true });
      }
    }

    // Find which date in this month should show the tooltip (middle of range)
    let tooltipDay: number | null = null;
    if (checkInDate && checkOutDate && tooltipDate) {
      const tooltipPersian = gregorianToPersian(tooltipDate);
      if (tooltipPersian && tooltipPersian.year === year && tooltipPersian.month === month) {
        tooltipDay = tooltipPersian.day;
      }
    }

    return (
      <div className="w-full relative">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-bold text-gray-600 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 relative">
          {/* Previous month days (grayed out) */}
          {prevMonthDays.map(({ day, month: m, year: y }) => {
            const gregorian = persianToGregorian(y, m, day);
            const price = gregorian ? getPriceForDate(gregorian) : pricePerNight;
            return (
              <div
                key={`prev-${day}`}
                className="aspect-square p-1 flex flex-col items-center justify-center opacity-30 cursor-not-allowed"
              >
                <div className="text-xs text-gray-400">{day}</div>
                <div className="text-[10px] text-gray-400">—</div>
              </div>
            );
          })}

          {/* Current month days */}
          {daysArray.map((day, index) => {
            const gregorian = persianToGregorian(year, month, day);
            const disabled = !gregorian || isDateDisabled(year, month, day);
            const reserved = isDateReserved(year, month, day);
            const inRange = isDateInRange(year, month, day);
            const isCheckIn = isDateSelected(year, month, day, 'checkin');
            const isCheckOut = isDateSelected(year, month, day, 'checkout');
            const price = gregorian ? getPriceForDate(gregorian) : pricePerNight;
            const cacheKey = `${year}-${month}-${day}`;
            const isHolidayDate = holidayCache.get(cacheKey) || false;
            const isFridayDate = gregorian ? isFridayFromGregorian(gregorian) : false;
            const isSpecial = isHolidayDate || isFridayDate; // Holiday or Friday should be red
            const showTooltip = tooltipDay === day && nights > 0;

            // Calculate position in grid (accounting for prev month days)
            const gridPosition = firstDay + index;

            return (
              <div key={day} className="relative">
                {showTooltip && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {nights} شب اقامت
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                )}
                {reserved && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 bg-gray-700 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">
                    رزرو شده
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleDateClick(year, month, day)}
                  disabled={disabled || reserved}
                  className={cn(
                    "aspect-square p-1 flex flex-col items-center justify-center rounded transition-colors w-full relative",
                    disabled && "opacity-30 cursor-not-allowed",
                    reserved && "opacity-70 cursor-not-allowed bg-gray-100 border border-gray-300",
                    !disabled && !reserved && "hover:bg-gray-100 cursor-pointer",
                    inRange && !reserved && "bg-primary-100",
                    isCheckIn && "bg-primary text-white rounded-r-none",
                    isCheckOut && "bg-primary text-white rounded-l-none",
                    (isCheckIn || isCheckOut) && "font-bold"
                  )}
                >
                  <div className={cn(
                    "text-xs",
                    isSpecial && !inRange && !isCheckIn && !isCheckOut && "text-red-600",
                    (isCheckIn || isCheckOut) && "text-white",
                    reserved && !isCheckIn && !isCheckOut && "text-gray-600 line-through"
                  )}>
                    {day}
                  </div>
                  <div className={cn(
                    "text-[10px] mt-0.5",
                    disabled ? "text-gray-400" : reserved ? "text-gray-500" : (isCheckIn || isCheckOut) ? "text-white" : "text-gray-600"
                  )}>
                    {disabled ? "—" : reserved ? "رزرو" : formatPrice(price)}
                  </div>
                </button>
              </div>
            );
          })}

          {/* Next month days padding (if needed) */}
          {Array.from({ length: 42 - firstDay - days }).map((_, i) => (
            <div key={`next-${i}`} className="aspect-square p-1 opacity-0" />
          ))}
        </div>
      </div>
    );
  };

  // Calculate nights
  const nights = checkInDate && checkOutDate
    ? Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Format dates for display
  const formatCheckInDisplay = () => {
    if (!checkInDate) return "—";
    const persian = gregorianToPersian(checkInDate);
    if (!persian) return "—";
    const gregorian = new Date(checkInDate);
    const dayOfWeek = weekDaysFull[gregorian.getDay() === 6 ? 0 : gregorian.getDay() + 1];
    return `${dayOfWeek}، ${persian.day} ${monthNames[persian.month - 1]}`;
  };

  const formatCheckOutDisplay = () => {
    if (!checkOutDate) return "—";
    const persian = gregorianToPersian(checkOutDate);
    if (!persian) return "—";
    const gregorian = new Date(checkOutDate);
    const dayOfWeek = weekDaysFull[gregorian.getDay() === 6 ? 0 : gregorian.getDay() + 1];
    return `${dayOfWeek}، ${persian.day} ${monthNames[persian.month - 1]}`;
  };

  const handleClear = () => {
    onCheckInChange(null);
    onCheckOutChange(null);
    if (onClear) onClear();
  };

  const handleConfirm = () => {
    if (checkInDate && checkOutDate) {
      if (accommodation) {
        // Show reservation section instead of closing
        setShowReservationSection(true);
      } else if (onConfirm) {
        onConfirm();
      }
    }
  };

  // Calculate total price (full amount for summary, not divided)
  const calculateTotalPrice = (): number => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights <= 0) return 0;
    return nights * pricePerNight;
  };

  const totalPrice = calculateTotalPrice();

  const createMutation = useMutation({
    mutationFn: (data: CreateReservationRequest) => createReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      // Invalidate unavailable dates so calendar updates
      if (accommodation) {
        queryClient.invalidateQueries({ queryKey: ['unavailableDates', accommodation.id] });
      }
      toast.success('درخواست رزرو با موفقیت ثبت شد');
      if (onReservationComplete) {
        onReservationComplete();
      } else if (onClose) {
        onClose();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ثبت رزرو');
    },
  });

  const handleReservation = async () => {
    console.log('=== PersianDateRangePicker handleReservation START ===');
    console.log('handleReservation called', { 
      checkInDate, 
      checkOutDate, 
      numberOfGuests, 
      user,
      userEmail: user?.email,
      accommodation: accommodation?.id 
    });
    
    if (!checkInDate || !checkOutDate) {
      console.log('Validation failed: Missing dates');
      toast.error('لطفا تاریخ ورود و خروج را انتخاب کنید');
      return;
    }

    if (numberOfGuests === 0) {
      console.log('Validation failed: No guests');
      toast.error('لطفا تعداد مسافران را مشخص کنید');
      return;
    }

    if (!accommodation) {
      console.log('Validation failed: No accommodation');
      toast.error('اطلاعات اقامتگاه یافت نشد');
      return;
    }

    if (numberOfGuests > accommodation.capacity) {
      console.log('Validation failed: Too many guests');
      toast.error(`حداکثر ${accommodation.capacity} نفر می‌توانید انتخاب کنید`);
      return;
    }

    if (!user) {
      console.log('Validation failed: No user');
      // Redirect to login, preserving accommodation and dates
      if (accommodation) {
        const redirectParams = new URLSearchParams({
          accommodation: accommodation.id.toString(),
        });
        if (checkInDate) redirectParams.set('check_in', checkInDate);
        if (checkOutDate) redirectParams.set('check_out', checkOutDate);
        navigate(`/login?redirect=${encodeURIComponent(`/accommodations/${accommodation.id}?${redirectParams.toString()}`)}`);
      } else {
        navigate('/login');
      }
      return;
    }

    // Validate email format if provided (optional)
    if (contactEmail && contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail.trim())) {
        console.log('Validation failed: Invalid email format');
        toast.error('لطفا یک ایمیل معتبر وارد کنید');
        return;
      }
    }

    // Validate phone format if provided (optional)
    if (contactPhone && contactPhone.trim()) {
      const phoneRegex = /^[0-9+\-\s()]{10,}$/;
      if (!phoneRegex.test(contactPhone.trim().replace(/\s/g, ''))) {
        console.log('Validation failed: Invalid phone format');
        toast.error('لطفا یک شماره تماس معتبر وارد کنید');
        return;
      }
    }

    // Use user email as fallback if contact email not provided
    const finalEmail = contactEmail.trim() || user?.email || '';
    // Use placeholder phone if not provided (backend requires it)
    const finalPhone = contactPhone.trim() || '0000000000';

    const reservationData = {
      accommodation: accommodation.id,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      number_of_guests: numberOfGuests,
      contact_phone: finalPhone,
      contact_email: finalEmail,
    };

    console.log('All validations passed. Submitting reservation:', reservationData);
    console.log('Calling createMutation.mutate...');
    
    // Submit reservation directly using backend user data
    try {
      createMutation.mutate(reservationData);
      console.log('createMutation.mutate called successfully');
    } catch (error) {
      console.error('Error calling createMutation.mutate:', error);
    }
    
    console.log('=== PersianDateRangePicker handleReservation END ===');
  };

  const handleIncrementGuests = () => {
    if (accommodation && numberOfGuests < accommodation.capacity) {
      setNumberOfGuests(numberOfGuests + 1);
    }
  };

  const handleDecrementGuests = () => {
    if (numberOfGuests > 0) {
      setNumberOfGuests(numberOfGuests - 1);
    }
  };

  // Format price for summary (full amount)
  const formatPriceFull = (price: number): string => {
    return price.toLocaleString('fa-IR');
  };

  // Calculate which date to show tooltip above (middle of range)
  const getTooltipDate = () => {
    if (!checkInDate || !checkOutDate) return null;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const midTime = checkIn.getTime() + (checkOut.getTime() - checkIn.getTime()) / 2;
    const midDate = new Date(midTime);
    return midDate.toISOString().split('T')[0];
  };

  const tooltipDate = getTooltipDate();

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Handle Escape key to close
  useEffect(() => {
    if (!onClose) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b max-w-[550px] w-full mx-auto">
        <h2 className="text-lg font-bold flex-1 text-center">تاریخ سفر</h2>
        {onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Calendars - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 max-w-[550px] w-full mx-auto">
        {/* First Month */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => {
                if (currentMonth1 === 1) {
                  setCurrentYear1(currentYear1 - 1);
                  setCurrentMonth1(12);
                } else {
                  setCurrentMonth1(currentMonth1 - 1);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ‹
            </button>
            <h3 className="text-base font-semibold">
              {monthNames[currentMonth1 - 1]} {currentYear1}
            </h3>
            <button
              type="button"
              onClick={() => {
                if (currentMonth1 === 12) {
                  setCurrentYear1(currentYear1 + 1);
                  setCurrentMonth1(1);
                } else {
                  setCurrentMonth1(currentMonth1 + 1);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ›
            </button>
          </div>
          {renderCalendar(currentYear1, currentMonth1)}
        </div>

        {/* Second Month */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => {
                // Navigate first month back, second will follow via useEffect
                if (currentMonth1 === 1) {
                  setCurrentYear1(currentYear1 - 1);
                  setCurrentMonth1(12);
                } else {
                  setCurrentMonth1(currentMonth1 - 1);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ‹
            </button>
            <h3 className="text-base font-semibold">
              {monthNames[currentMonth2 - 1]} {currentYear2}
            </h3>
            <button
              type="button"
              onClick={() => {
                // Navigate first month forward, second will follow via useEffect
                if (currentMonth1 === 12) {
                  setCurrentYear1(currentYear1 + 1);
                  setCurrentMonth1(1);
                } else {
                  setCurrentMonth1(currentMonth1 + 1);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ›
            </button>
          </div>
          {renderCalendar(currentYear2, currentMonth2)}
        </div>
      </div>

      {/* Fixed Bottom Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg max-h-[60vh] overflow-y-auto">
        <div className="max-w-[550px] mx-auto p-4">
          {!showReservationSection ? (
            <>
              {/* Date Summary */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 text-right">
                  <div className="text-xs text-gray-600 mb-1 text-right">تاریخ ورود</div>
                  <div className="text-sm font-medium text-right">{formatCheckInDisplay()}</div>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xs text-gray-600 mb-1 text-right">تاریخ خروج</div>
                  <div className="text-sm font-medium text-right">{formatCheckOutDisplay()}</div>
                </div>

              </div>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!checkInDate || !checkOutDate}
                className={cn(
                  "w-full px-4 py-3 rounded-lg font-medium transition-colors text-center",
                  checkInDate && checkOutDate
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                {nights > 0 ? `انتخاب تاریخ (${nights} شب)` : "انتخاب تاریخ"}
              </button>
            </>
          ) : (
            <>
              {/* Traveler Count Section */}
              <div className="mb-4 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="text-xs text-gray-600 mb-1">تعداد مسافران</div>
                      <div className="text-sm font-medium">
                        {numberOfGuests > 0 ? `${numberOfGuests} نفر` : "۰ نفر"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDecrementGuests}
                      disabled={numberOfGuests === 0}
                      className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{numberOfGuests}</span>
                    <button
                      onClick={handleIncrementGuests}
                      disabled={accommodation ? numberOfGuests >= accommodation.capacity : false}
                      className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Info banner about children */}
                {showInfoBanner && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800 text-right flex-1">
                      کودک زیر دو سال جزو نفرات حساب نمی‌شود.
                    </div>
                    <button
                      onClick={() => setShowInfoBanner(false)}
                      className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="mb-4 pb-4 border-b">
                <h3 className="text-base font-semibold mb-3">اطلاعات تماس (اختیاری)</h3>
                
                {/* Email Input */}
                <div className="mb-3">
                  <Label htmlFor="contact_email" className="text-right text-sm mb-1 block">
                    ایمیل
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={user?.email || "example@email.com"}
                    className="text-right"
                  />
                </div>

                {/* Phone Input */}
                <div className="mb-3">
                  <Label htmlFor="contact_phone" className="text-right text-sm mb-1 block">
                    شماره تماس
                  </Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="09123456789"
                    className="text-right"
                  />
                </div>
              </div>

              {/* Payment Summary */}
              {accommodation && (
                <div className="mb-4 pb-4 border-b">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold">خلاصه پرداخت</h3>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                      برای {accommodation.capacity} نفر ظرفیت پایه
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{nights} شب اقامت</span>
                    </div>
                    <div className="border-t border-dashed border-gray-300 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">جمع مبلغ قابل پرداخت</span>
                        <span className="text-lg font-bold">
                          {totalPrice > 0 ? `${formatPriceFull(totalPrice)} تومان` : "۰ تومان"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info banner about chat */}
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800 text-right flex-1">
                      امکان چت آنلاین بعد از ثبت رایگان رزرو
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('PersianDateRangePicker Button clicked!', { 
                      checkInDate, 
                      checkOutDate, 
                      numberOfGuests,
                      contactEmail,
                      contactPhone,
                      disabled: !checkInDate || !checkOutDate || numberOfGuests === 0 || createMutation.isPending
                    });
                    handleReservation();
                  }}
                  disabled={!checkInDate || !checkOutDate || numberOfGuests === 0 || createMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  type="button"
                >
                  {createMutation.isPending ? 'در حال ثبت...' : 'درخواست رایگان رزرو'}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowReservationSection(false);
                    handleClose();
                  }}
                  className="flex-1"
                >
                  بستن
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


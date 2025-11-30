import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gregorianToPersian, persianToGregorian, formatPersianDate, getTodayPersian } from "@/lib/dateUtils";
import { isHoliday, isFridayFromGregorian } from "@/lib/holidayUtils";
import { cn } from "@/lib/utils";

interface PersianDatePickerProps {
  value?: string; // Gregorian date string (YYYY-MM-DD)
  onChange: (date: string) => void; // Returns Gregorian date string
  label?: string;
  error?: string;
  disabled?: boolean;
  minDate?: string; // Gregorian date string
  className?: string;
}

export function PersianDatePicker({
  value,
  onChange,
  label,
  error,
  disabled,
  minDate,
  className,
}: PersianDatePickerProps) {
  const [persianDate, setPersianDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const [displayValue, setDisplayValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [holidayCache, setHolidayCache] = useState<Map<string, boolean>>(new Map());
  const holidayCacheRef = useRef<Map<string, boolean>>(new Map());

  const today = getTodayPersian();
  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  const currentYear = persianDate?.year || today.year;
  const currentMonth = persianDate?.month || today.month;

  const daysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  const isLeapYear = (year: number) => {
    const p = [1, 5, 9, 13, 17, 22, 26, 30];
    return p.includes(year % 33);
  };

  const getDaysInMonth = (year: number, month: number) => {
    if (month === 12 && !isLeapYear(year)) return 29;
    return daysInMonth[month - 1];
  };

  // Convert Gregorian to Persian on mount and when value changes
  useEffect(() => {
    if (value) {
      const persian = gregorianToPersian(value);
      if (persian) {
        setPersianDate(persian);
        setDisplayValue(formatPersianDate(persian.year, persian.month, persian.day));
      }
    } else {
      setPersianDate(null);
      setDisplayValue("");
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Check holidays for visible month when month/year changes
  useEffect(() => {
    if (!isOpen) return; // Only check when calendar is open

    const checkHolidaysForVisibleMonth = async () => {
      const newCache = new Map(holidayCacheRef.current); // Start with existing cache
      const datesToCheck: Array<{ year: number; month: number; day: number }> = [];

      const days = getDaysInMonth(currentYear, currentMonth);
      for (let day = 1; day <= days; day++) {
        const cacheKey = `${currentYear}-${currentMonth}-${day}`;
        // Only check dates we don't have in cache
        if (!newCache.has(cacheKey)) {
          datesToCheck.push({ year: currentYear, month: currentMonth, day });
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

    checkHolidaysForVisibleMonth();
  }, [currentYear, currentMonth, isOpen]);

  const handleDateChange = (year: number, month: number, day: number) => {
    const gregorian = persianToGregorian(year, month, day);
    if (gregorian) {
      // Check min date if provided
      if (minDate && gregorian < minDate) {
        return;
      }
      setPersianDate({ year, month, day });
      setDisplayValue(formatPersianDate(year, month, day));
      onChange(gregorian);
      setIsOpen(false);
    }
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentYear, currentMonth);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);
    
    return (
      <div className="grid grid-cols-7 gap-1 p-2 bg-white border rounded-lg shadow-lg">
        {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day) => (
          <div key={day} className="text-center text-xs font-bold text-gray-600 p-1">
            {day}
          </div>
        ))}
        {daysArray.map((day) => {
          const isSelected = persianDate?.year === currentYear && 
                           persianDate?.month === currentMonth && 
                           persianDate?.day === day;
          const gregorian = persianToGregorian(currentYear, currentMonth, day);
          const isDisabled = minDate && gregorian && gregorian < minDate;
          const cacheKey = `${currentYear}-${currentMonth}-${day}`;
          const isHolidayDate = holidayCache.get(cacheKey) || false;
          const isFridayDate = gregorian ? isFridayFromGregorian(gregorian) : false;
          const isSpecial = isHolidayDate || isFridayDate; // Holiday or Friday should be red
          
          return (
            <button
              key={day}
              type="button"
              onClick={() => !isDisabled && handleDateChange(currentYear, currentMonth, day)}
              disabled={isDisabled}
              className={cn(
                "p-2 text-sm rounded hover:bg-gray-100",
                isSelected && "bg-primary text-white hover:bg-primary/90",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className={cn(
                isSpecial && !isSelected && "text-red-600",
                isSelected && "text-white"
              )}>
                {day}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && <Label className="text-right mb-2 block">{label}</Label>}
      <Input
        type="text"
        value={displayValue}
        readOnly
        onClick={() => !disabled && setIsOpen(!isOpen)}
        placeholder="انتخاب تاریخ"
        disabled={disabled}
        className="text-right cursor-pointer"
      />
      {error && <p className="text-sm text-destructive text-right mt-1">{error}</p>}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-64">
          <div className="bg-white border rounded-lg shadow-lg p-2">
            <div className="flex justify-between items-center mb-2">
              <button
                type="button"
                onClick={() => {
                  const newMonth = currentMonth === 1 ? 12 : currentMonth - 1;
                  const newYear = currentMonth === 1 ? currentYear - 1 : currentYear;
                  setPersianDate({ year: newYear, month: newMonth, day: 1 });
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ‹
              </button>
              <span className="font-bold">
                {monthNames[currentMonth - 1]} {currentYear}
              </span>
              <button
                type="button"
                onClick={() => {
                  const newMonth = currentMonth === 12 ? 1 : currentMonth + 1;
                  const newYear = currentMonth === 12 ? currentYear + 1 : currentYear;
                  setPersianDate({ year: newYear, month: newMonth, day: 1 });
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ›
              </button>
            </div>
            {renderCalendar()}
          </div>
        </div>
      )}
    </div>
  );
}





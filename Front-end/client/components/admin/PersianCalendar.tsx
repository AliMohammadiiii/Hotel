import { useState, useEffect } from "react";
import { gregorianToPersian, persianToGregorian, getTodayPersian } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

interface PersianCalendarProps {
  selectedDate?: Date | string | null;
  onDateSelect?: (date: Date) => void;
  markedDates?: string[]; // Array of Gregorian date strings (YYYY-MM-DD) to mark
  dateColors?: Record<string, string>; // Map of date strings to color classes
  className?: string;
}

export function PersianCalendar({
  selectedDate,
  onDateSelect,
  markedDates = [],
  dateColors = {},
  className,
}: PersianCalendarProps) {
  const today = getTodayPersian();
  const [currentYear, setCurrentYear] = useState(today.year);
  const [currentMonth, setCurrentMonth] = useState(today.month);

  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

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
    const gregorian = persianToGregorian(year, month, 1);
    if (!gregorian) return 0;
    const date = new Date(gregorian);
    const day = date.getDay();
    return (day + 1) % 7;
  };

  // Convert selected date to Persian
  const selectedPersian = selectedDate
    ? gregorianToPersian(
        typeof selectedDate === "string"
          ? selectedDate
          : selectedDate.toISOString().split("T")[0]
      )
    : null;

  const handleDateClick = (year: number, month: number, day: number) => {
    const gregorian = persianToGregorian(year, month, day);
    if (gregorian && onDateSelect) {
      const date = new Date(gregorian);
      onDateSelect(date);
    }
  };

  const isDateMarked = (year: number, month: number, day: number): boolean => {
    const gregorian = persianToGregorian(year, month, day);
    if (!gregorian) return false;
    return markedDates.includes(gregorian);
  };

  const getDateColor = (year: number, month: number, day: number): string => {
    const gregorian = persianToGregorian(year, month, day);
    if (!gregorian) return "";
    return dateColors[gregorian] || "";
  };

  const isDateSelected = (year: number, month: number, day: number): boolean => {
    if (!selectedPersian) return false;
    return (
      selectedPersian.year === year &&
      selectedPersian.month === month &&
      selectedPersian.day === day
    );
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);

    // Get previous month's last days for padding
    const prevMonthDays = [];
    if (firstDay > 0) {
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevMonthDaysCount = getDaysInMonth(prevYear, prevMonth);
      for (let i = prevMonthDaysCount - firstDay + 1; i <= prevMonthDaysCount; i++) {
        prevMonthDays.push({ day: i, month: prevMonth, year: prevYear });
      }
    }

    return (
      <div className="w-full">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-bold text-gray-600 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Previous month days (grayed out) */}
          {prevMonthDays.map(({ day, month, year }) => (
            <div
              key={`prev-${day}`}
              className="aspect-square p-1 flex items-center justify-center opacity-30 cursor-not-allowed"
            >
              <div className="text-xs text-gray-400">{day}</div>
            </div>
          ))}

          {/* Current month days */}
          {daysArray.map((day) => {
            const marked = isDateMarked(currentYear, currentMonth, day);
            const selected = isDateSelected(currentYear, currentMonth, day);
            const colorClass = getDateColor(currentYear, currentMonth, day);

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDateClick(currentYear, currentMonth, day)}
                className={cn(
                  "aspect-square p-1 flex items-center justify-center rounded transition-colors text-sm",
                  selected && "bg-blue-600 text-white",
                  !selected && marked && colorClass && colorClass,
                  !selected && !marked && "hover:bg-gray-100",
                  !selected && marked && !colorClass && "bg-gray-200"
                )}
              >
                {day}
              </button>
            );
          })}

          {/* Next month days padding */}
          {Array.from({ length: 42 - firstDay - days }).map((_, i) => (
            <div key={`next-${i}`} className="aspect-square p-1 opacity-0" />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("bg-white rounded-lg border p-4", className)}>
      {/* Month/Year Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => {
            if (currentMonth === 1) {
              setCurrentYear(currentYear - 1);
              setCurrentMonth(12);
            } else {
              setCurrentMonth(currentMonth - 1);
            }
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          ‹
        </button>
        <span className="font-bold text-lg">
          {monthNames[currentMonth - 1]} {currentYear}
        </span>
        <button
          type="button"
          onClick={() => {
            if (currentMonth === 12) {
              setCurrentYear(currentYear + 1);
              setCurrentMonth(1);
            } else {
              setCurrentMonth(currentMonth + 1);
            }
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          ›
        </button>
      </div>

      {/* Calendar */}
      {renderCalendar()}
    </div>
  );
}





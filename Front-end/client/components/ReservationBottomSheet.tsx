import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReservation } from "@/lib/reservations";
import { gregorianToPersian } from "@/lib/dateUtils";
import { useAuth } from "@/hooks/useAuth";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { AccommodationDetail, CreateReservationRequest } from "@shared/api";
import { Minus, Plus, Calendar, Users, Info, X, ChevronLeft } from "lucide-react";

interface ReservationBottomSheetProps {
  accommodation: AccommodationDetail;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  checkInDate: string | null;
  checkOutDate: string | null;
  onCheckInChange: (date: string | null) => void;
  onCheckOutChange: (date: string | null) => void;
  onEditDates: () => void; // Callback to show calendar
}

export function ReservationBottomSheet({
  accommodation,
  isOpen,
  onOpenChange,
  checkInDate,
  checkOutDate,
  onCheckInChange,
  onCheckOutChange,
  onEditDates,
}: ReservationBottomSheetProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [numberOfGuests, setNumberOfGuests] = useState(0);
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  // Debug: Log component state
  console.log('ReservationBottomSheet render:', {
    isOpen,
    checkInDate,
    checkOutDate,
    numberOfGuests,
    hasUser: !!user,
    userEmail: user?.email,
    accommodationId: accommodation?.id
  });

  const pricePerNight = parseFloat(accommodation.price_per_night.replace(/,/g, ''));

  // Calculate total price
  const calculateTotalPrice = (): number => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights <= 0) return 0;
    return nights * pricePerNight;
  };

  const totalPrice = calculateTotalPrice();
  const nights = checkInDate && checkOutDate
    ? Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const createMutation = useMutation({
    mutationFn: async (data: CreateReservationRequest) => {
      console.log('Mutation function called with data:', data);
      try {
        const result = await createReservation(data);
        console.log('Reservation created successfully:', result);
        return result;
      } catch (error) {
        console.error('Error in createReservation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Mutation onSuccess called');
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('درخواست رزرو با موفقیت ثبت شد');
      onOpenChange(false);
      // Redirect to accommodation detail page with query parameters
      const params = new URLSearchParams({
        accommodation: accommodation.id.toString(),
        check_in: checkInDate || '',
        check_out: checkOutDate || '',
      });
      navigate(`/accommodations/${accommodation.id}?${params.toString()}`);
    },
    onError: (error: Error) => {
      console.error('Mutation onError called:', error);
      toast.error(error.message || 'خطا در ثبت رزرو');
    },
  });

  const handleReservation = () => {
    console.log('=== handleReservation START ===');
    console.log('handleReservation called', { 
      checkInDate, 
      checkOutDate, 
      numberOfGuests, 
      user,
      accommodationId: accommodation?.id,
      userEmail: user?.email 
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

    if (numberOfGuests > accommodation.capacity) {
      console.log('Validation failed: Too many guests');
      toast.error(`حداکثر ${accommodation.capacity} نفر می‌توانید انتخاب کنید`);
      return;
    }

    if (!user?.email) {
      console.log('Validation failed: No user email');
      toast.error('لطفا ابتدا وارد حساب کاربری خود شوید');
      return;
    }

    const reservationData = {
      accommodation: accommodation.id,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      number_of_guests: numberOfGuests,
      contact_phone: '0000000000', // Placeholder since phone is required but not in user model
      contact_email: user.email, // From backend
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
    
    console.log('=== handleReservation END ===');
  };

  const formatDateRange = () => {
    if (!checkInDate || !checkOutDate) return "—";
    const checkIn = gregorianToPersian(checkInDate);
    const checkOut = gregorianToPersian(checkOutDate);
    if (!checkIn || !checkOut) return "—";
    const monthNames = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    return `${checkIn.day} ${monthNames[checkIn.month - 1]} - ${checkOut.day} ${monthNames[checkOut.month - 1]}`;
  };

  const handleIncrementGuests = () => {
    if (numberOfGuests < accommodation.capacity) {
      setNumberOfGuests(numberOfGuests + 1);
    }
  };

  const handleDecrementGuests = () => {
    if (numberOfGuests > 0) {
      setNumberOfGuests(numberOfGuests - 1);
    }
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] rounded-t-2xl">
          <div className="w-full max-w-[550px] mx-auto bg-white">
            {/* Travel Date Section */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-600 mb-1">تاریخ سفر</div>
                    <div className="text-sm font-medium text-right">
                      {formatDateRange()}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onEditDates();
                  }}
                  className="text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  ویرایش
                </Button>
              </div>
            </div>

            {/* Number of Travelers Section */}
            <div className="p-4 border-b">
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
                    disabled={numberOfGuests >= accommodation.capacity}
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

            {/* Payment Summary */}
            <div className="p-4 border-b bg-gray-50">
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
                      {totalPrice > 0 ? `${totalPrice.toLocaleString('fa-IR')} تومان` : "۰ تومان"}
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

            {/* Action Buttons */}
            <div className="p-4 flex gap-2">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Button clicked!', { checkInDate, checkOutDate, numberOfGuests, disabled: !checkInDate || !checkOutDate || numberOfGuests === 0 || createMutation.isPending });
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
                onClick={() => onOpenChange(false)}
                className="flex-1"
                type="button"
              >
                بستن
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}


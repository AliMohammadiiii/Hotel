import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccommodations, getAccommodationDetail } from "@/lib/api";
import { createReservation } from "@/lib/reservations";
import { useAuth } from "@/hooks/useAuth";
import { PersianDatePicker } from "@/components/PersianDatePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getTodayGregorian } from "@/lib/dateUtils";
import type { CreateReservationRequest } from "@shared/api";

interface ReservationFormData {
  accommodation: number;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  contact_phone: string;
  contact_email: string;
}

export default function CreateReservation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const accommodationIdParam = searchParams.get('accommodation');
  const checkInParam = searchParams.get('check_in');
  const checkOutParam = searchParams.get('check_out');
  const numberOfGuestsParam = searchParams.get('number_of_guests');
  
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(
    accommodationIdParam ? parseInt(accommodationIdParam, 10) : null
  );

  const { data: accommodations } = useQuery({
    queryKey: ['accommodations'],
    queryFn: getAccommodations,
  });

  const { data: accommodation } = useQuery({
    queryKey: ['accommodation', selectedAccommodationId],
    queryFn: () => getAccommodationDetail(selectedAccommodationId!),
    enabled: !!selectedAccommodationId,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReservationFormData>({
    defaultValues: {
      accommodation: selectedAccommodationId || undefined,
      number_of_guests: numberOfGuestsParam ? parseInt(numberOfGuestsParam, 10) : 1,
      check_in_date: checkInParam || undefined,
      check_out_date: checkOutParam || undefined,
      contact_email: user?.email || '',
      contact_phone: '', // Will be filled from backend user profile if available
    },
  });

  // Set values from URL params and user data if available
  useEffect(() => {
    if (checkInParam) {
      setValue('check_in_date', checkInParam);
    }
    if (checkOutParam) {
      setValue('check_out_date', checkOutParam);
    }
    if (numberOfGuestsParam) {
      setValue('number_of_guests', parseInt(numberOfGuestsParam, 10));
    }
    if (user?.email) {
      setValue('contact_email', user.email);
    }
  }, [checkInParam, checkOutParam, numberOfGuestsParam, user, setValue]);

  const checkInDate = watch('check_in_date');
  const checkOutDate = watch('check_out_date');
  const numberOfGuests = watch('number_of_guests');

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!accommodation || !checkInDate || !checkOutDate) return 0;
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return 0;
    
    const pricePerNight = parseFloat(accommodation.price_per_night.replace(/,/g, ''));
    return nights * pricePerNight;
  };

  const totalPrice = calculateTotalPrice();

  const createMutation = useMutation({
    mutationFn: (data: CreateReservationRequest) => createReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('رزرو با موفقیت ایجاد شد');
      navigate('/account/history');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ایجاد رزرو');
    },
  });

  const onSubmit = (data: ReservationFormData) => {
    if (!data.accommodation) {
      toast.error('لطفا اقامتگاه را انتخاب کنید');
      return;
    }

    if (!data.check_in_date || !data.check_out_date) {
      toast.error('لطفا تاریخ ورود و خروج را انتخاب کنید');
      return;
    }

    const checkIn = new Date(data.check_in_date);
    const checkOut = new Date(data.check_out_date);
    
    if (checkOut <= checkIn) {
      toast.error('تاریخ خروج باید بعد از تاریخ ورود باشد');
      return;
    }

    createMutation.mutate({
      accommodation: data.accommodation,
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      number_of_guests: data.number_of_guests,
      contact_phone: data.contact_phone,
      contact_email: data.contact_email,
    });
  };

  const today = getTodayGregorian();

  return (
    <div className="min-h-screen bg-bg-secondary pb-20">
      <div className="w-full min-w-[320px] max-w-[550px] mx-auto bg-bg-secondary p-4">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-right">
            ← بازگشت
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-right">رزرو اقامتگاه</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Accommodation Selection */}
              <div className="space-y-2">
                <Label htmlFor="accommodation" className="text-right">اقامتگاه</Label>
                <select
                  id="accommodation"
                  {...register('accommodation', { required: 'انتخاب اقامتگاه الزامی است' })}
                  value={selectedAccommodationId || ''}
                  onChange={(e) => {
                    const id = parseInt(e.target.value, 10);
                    setSelectedAccommodationId(id);
                    setValue('accommodation', id);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-right"
                >
                  <option value="">انتخاب اقامتگاه</option>
                  {accommodations?.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.title}
                    </option>
                  ))}
                </select>
                {errors.accommodation && (
                  <p className="text-sm text-destructive text-right">{errors.accommodation.message}</p>
                )}
              </div>

              {/* Check-in Date */}
              <div className="space-y-2">
                <PersianDatePicker
                  value={checkInDate}
                  onChange={(date) => setValue('check_in_date', date)}
                  label="تاریخ ورود"
                  error={errors.check_in_date?.message}
                  minDate={today}
                />
              </div>

              {/* Check-out Date */}
              <div className="space-y-2">
                <PersianDatePicker
                  value={checkOutDate}
                  onChange={(date) => setValue('check_out_date', date)}
                  label="تاریخ خروج"
                  error={errors.check_out_date?.message}
                  minDate={checkInDate || today}
                />
              </div>

              {/* Number of Guests */}
              <div className="space-y-2">
                <Label htmlFor="number_of_guests" className="text-right">تعداد مهمان</Label>
                <Input
                  id="number_of_guests"
                  type="number"
                  min={1}
                  max={accommodation?.capacity || 10}
                  {...register('number_of_guests', {
                    required: 'تعداد مهمان الزامی است',
                    min: { value: 1, message: 'حداقل یک مهمان' },
                    max: {
                      value: accommodation?.capacity || 10,
                      message: `حداکثر ${accommodation?.capacity || 10} مهمان`,
                    },
                  })}
                  className="text-right"
                />
                {errors.number_of_guests && (
                  <p className="text-sm text-destructive text-right">{errors.number_of_guests.message}</p>
                )}
              </div>

              {/* Contact Phone */}
              <div className="space-y-2">
                <Label htmlFor="contact_phone" className="text-right">شماره تماس</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  {...register('contact_phone', {
                    required: 'شماره تماس الزامی است',
                    pattern: {
                      value: /^[0-9+\-\s()]+$/,
                      message: 'شماره تماس نامعتبر است',
                    },
                  })}
                  className="text-right"
                  placeholder="شماره تماس خود را وارد کنید"
                />
                {errors.contact_phone && (
                  <p className="text-sm text-destructive text-right">{errors.contact_phone.message}</p>
                )}
              </div>

              {/* Contact Email */}
              <div className="space-y-2">
                <Label htmlFor="contact_email" className="text-right">ایمیل</Label>
                <Input
                  id="contact_email"
                  type="email"
                  {...register('contact_email', {
                    required: 'ایمیل الزامی است',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'ایمیل نامعتبر است',
                    },
                  })}
                  className="text-right"
                />
                {errors.contact_email && (
                  <p className="text-sm text-destructive text-right">{errors.contact_email.message}</p>
                )}
              </div>

              {/* Total Price Display */}
              {totalPrice > 0 && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-right font-bold">قیمت کل:</span>
                    <span className="text-left font-bold">
                      {totalPrice.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'در حال ایجاد...' : 'ثبت رزرو'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


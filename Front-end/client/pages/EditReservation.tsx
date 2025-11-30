import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReservation, updateReservation } from "@/lib/reservations";
import { PersianDatePicker } from "@/components/PersianDatePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getTodayGregorian } from "@/lib/dateUtils";
import type { UpdateReservationRequest } from "@shared/api";

interface ReservationFormData {
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  contact_phone: string;
  contact_email: string;
}

export default function EditReservation() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const reservationId = id ? parseInt(id, 10) : 0;
  const queryClient = useQueryClient();

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: () => getReservation(reservationId),
    enabled: !!reservationId,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReservationFormData>({
    values: reservation
      ? {
          check_in_date: reservation.check_in_date,
          check_out_date: reservation.check_out_date,
          number_of_guests: reservation.number_of_guests,
          contact_phone: reservation.contact_phone,
          contact_email: reservation.contact_email,
        }
      : undefined,
  });

  const checkInDate = watch('check_in_date');
  const checkOutDate = watch('check_out_date');

  const updateMutation = useMutation({
    mutationFn: (data: UpdateReservationRequest) => updateReservation(reservationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservation', reservationId] });
      toast.success('رزرو با موفقیت بروزرسانی شد');
      navigate('/reservations');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در بروزرسانی رزرو');
    },
  });

  const onSubmit = (data: ReservationFormData) => {
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

    updateMutation.mutate({
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      number_of_guests: data.number_of_guests,
      contact_phone: data.contact_phone,
      contact_email: data.contact_email,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-text-tertiary text-sm">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-text-tertiary text-sm">رزرو یافت نشد</div>
      </div>
    );
  }

  const today = getTodayGregorian();

  return (
    <div className="min-h-screen bg-bg-secondary pb-20">
      <div className="w-full min-w-[320px] max-w-[550px] mx-auto bg-bg-secondary p-4">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate('/reservations')} className="text-right">
            ← بازگشت
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-right">ویرایش رزرو</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-right">
                <strong>اقامتگاه:</strong> {reservation.accommodation_title || `#${reservation.accommodation}`}
              </p>
              <p className="text-sm text-right mt-1">
                <strong>وضعیت:</strong> {reservation.status === 'pending' ? 'در انتظار' : 
                                        reservation.status === 'confirmed' ? 'تایید شده' : 'لغو شده'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  {...register('number_of_guests', {
                    required: 'تعداد مهمان الزامی است',
                    min: { value: 1, message: 'حداقل یک مهمان' },
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

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/reservations')}
                >
                  انصراف
                </Button>
                <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'در حال بروزرسانی...' : 'ذخیره تغییرات'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






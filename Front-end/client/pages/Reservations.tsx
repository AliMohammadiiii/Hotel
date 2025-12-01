import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReservations, deleteReservation } from "@/lib/reservations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDateForDisplay } from "@/lib/dateUtils";
import type { ReservationStatus } from "@shared/api";

const statusLabels: Record<ReservationStatus, string> = {
  pending: 'در انتظار',
  confirmed: 'تایید شده',
  cancelled: 'لغو شده',
};

const statusColors: Record<ReservationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function Reservations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: getReservations,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('رزرو با موفقیت حذف شد');
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در حذف رزرو');
    },
  });

  const filteredReservations = reservations?.filter((res) => {
    if (statusFilter === 'all') return true;
    return res.status === statusFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-text-tertiary text-sm">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary pb-20">
      <div className="w-full min-w-[320px] max-w-[550px] mx-auto bg-bg-secondary p-4">
        <div className="mb-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-right">
            ← بازگشت
          </Button>
          <Button onClick={() => navigate('/reservations/new')}>
            رزرو جدید
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-right">رزروهای من</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Status Filter */}
            <div className="mb-4 flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                همه
              </Button>
              {(Object.keys(statusLabels) as ReservationStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {statusLabels[status]}
                </Button>
              ))}
            </div>

            {/* Reservations List */}
            {!filteredReservations || filteredReservations.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary">
                <p>رزروی یافت نشد</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/reservations/new')}
                >
                  ایجاد رزرو جدید
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReservations.map((reservation) => (
                  <Card key={reservation.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-right">
                            {reservation.accommodation_title || `اقامتگاه #${reservation.accommodation}`}
                          </h3>
                          <Badge className={statusColors[reservation.status]}>
                            {statusLabels[reservation.status]}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-tertiary">تاریخ ورود:</span>
                            <span className="text-right">{formatDateForDisplay(reservation.check_in_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-tertiary">تاریخ خروج:</span>
                            <span className="text-right">{formatDateForDisplay(reservation.check_out_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-tertiary">تعداد شب:</span>
                            <span className="text-right">{reservation.nights || 0} شب</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-tertiary">تعداد مهمان:</span>
                            <span className="text-right">{reservation.number_of_guests} نفر</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-tertiary">قیمت کل:</span>
                            <span className="text-right font-bold">
                              {parseFloat(reservation.total_price).toLocaleString('fa-IR')} تومان
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/reservations/${reservation.id}/edit`)}
                            className="flex-1"
                          >
                            ویرایش
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteId(reservation.id)}
                            className="flex-1"
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف رزرو</AlertDialogTitle>
              <AlertDialogDescription>
                آیا از حذف این رزرو اطمینان دارید؟ این عمل قابل بازگشت نیست.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}








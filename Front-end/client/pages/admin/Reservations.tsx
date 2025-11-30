import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getAdminReservations,
  updateReservationStatus,
  getAdminAccommodations,
} from "@/lib/admin/api";
import { ReservationStatusBadge } from "@/components/admin/ReservationStatusBadge";
import { formatDateForDisplay } from "@/lib/dateUtils";
import type { Reservation, ReservationStatus } from "@shared/api";

export default function Reservations() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filters: any = {};
  if (statusFilter !== "all") {
    filters.status = statusFilter;
  }
  if (searchQuery) {
    filters.search = searchQuery;
  }

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["admin-reservations", filters],
    queryFn: () => getAdminReservations(filters),
  });

  const { data: accommodations } = useQuery({
    queryKey: ["admin-accommodations"],
    queryFn: () => getAdminAccommodations(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReservationStatus }) =>
      updateReservationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      toast.success("وضعیت رزرو با موفقیت بروزرسانی شد");
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در بروزرسانی وضعیت");
    },
  });

  const handleStatusChange = (id: number, newStatus: ReservationStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const handleViewDetail = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailDialog(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">مدیریت رزروها</h1>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="جستجوی رزرو..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="فیلتر وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="pending">در انتظار</SelectItem>
            <SelectItem value="confirmed">تایید شده</SelectItem>
            <SelectItem value="cancelled">لغو شده</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>شناسه</TableHead>
              <TableHead>اقامتگاه</TableHead>
              <TableHead>تاریخ ورود</TableHead>
              <TableHead>تاریخ خروج</TableHead>
              <TableHead>تعداد مهمان</TableHead>
              <TableHead>قیمت کل</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  در حال بارگذاری...
                </TableCell>
              </TableRow>
            ) : reservations && reservations.length > 0 ? (
              reservations.map((reservation: Reservation) => {
                const accommodation = typeof reservation.accommodation === "object"
                  ? reservation.accommodation
                  : accommodations?.find((a) => a.id === reservation.accommodation);

                return (
                  <TableRow key={reservation.id}>
                    <TableCell>#{reservation.id}</TableCell>
                    <TableCell>
                      {accommodation?.title || reservation.accommodation_title || "نامشخص"}
                    </TableCell>
                    <TableCell>
                      {formatDateForDisplay(reservation.check_in_date)}
                    </TableCell>
                    <TableCell>
                      {formatDateForDisplay(reservation.check_out_date)}
                    </TableCell>
                    <TableCell>{reservation.number_of_guests}</TableCell>
                    <TableCell>
                      {parseInt(reservation.total_price).toLocaleString("fa-IR")} تومان
                    </TableCell>
                    <TableCell>
                      <ReservationStatusBadge status={reservation.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(reservation)}
                        >
                          مشاهده
                        </Button>
                        <Select
                          value={reservation.status}
                          onValueChange={(value) =>
                            handleStatusChange(reservation.id, value as ReservationStatus)
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">در انتظار</SelectItem>
                            <SelectItem value="confirmed">تایید شده</SelectItem>
                            <SelectItem value="cancelled">لغو شده</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  رزروی یافت نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>جزئیات رزرو #{selectedReservation?.id}</DialogTitle>
            <DialogDescription>اطلاعات کامل رزرو</DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">اقامتگاه</p>
                  <p className="font-medium">
                    {selectedReservation.accommodation_title || "نامشخص"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">وضعیت</p>
                  <ReservationStatusBadge status={selectedReservation.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">تاریخ ورود</p>
                  <p className="font-medium">
                    {formatDateForDisplay(selectedReservation.check_in_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">تاریخ خروج</p>
                  <p className="font-medium">
                    {formatDateForDisplay(selectedReservation.check_out_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">تعداد مهمان</p>
                  <p className="font-medium">{selectedReservation.number_of_guests}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">قیمت کل</p>
                  <p className="font-medium">
                    {parseInt(selectedReservation.total_price).toLocaleString("fa-IR")} تومان
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ایمیل</p>
                  <p className="font-medium">{selectedReservation.contact_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">شماره تماس</p>
                  <p className="font-medium">{selectedReservation.contact_phone}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


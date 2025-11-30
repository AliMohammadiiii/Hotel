import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getAdminAccommodations,
  getAdminRoomAvailability,
  createRoomAvailability,
  updateRoomAvailability,
  bulkCreateRoomAvailability,
} from "@/lib/admin/api";
import { PersianCalendar } from "@/components/admin/PersianCalendar";
import { format } from "date-fns";
import { gregorianToPersian, persianToGregorian } from "@/lib/dateUtils";

const STATUS_OPTIONS = [
  { value: "available", label: "موجود" },
  { value: "unavailable", label: "غیرموجود" },
  { value: "full", label: "پر" },
  { value: "under_maintenance", label: "در حال تعمیر" },
  { value: "blocked", label: "مسدود" },
  { value: "reserved", label: "رزرو شده" },
];

export default function RoomAvailability() {
  const queryClient = useQueryClient();
  const [selectedAccommodation, setSelectedAccommodation] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<any>(null);
  const [bulkStartDate, setBulkStartDate] = useState<Date | undefined>(undefined);
  const [bulkEndDate, setBulkEndDate] = useState<Date | undefined>(undefined);
  const [bulkStatus, setBulkStatus] = useState("available");
  const [bulkPrice, setBulkPrice] = useState("");

  const { data: accommodations } = useQuery({
    queryKey: ["admin-accommodations"],
    queryFn: () => getAdminAccommodations(),
  });

  const { data: availability, isLoading } = useQuery({
    queryKey: ["admin-room-availability", selectedAccommodation],
    queryFn: () =>
      getAdminRoomAvailability({
        accommodation: selectedAccommodation!,
      }),
    enabled: !!selectedAccommodation,
  });

  const createMutation = useMutation({
    mutationFn: createRoomAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-room-availability"] });
      toast.success("وضعیت با موفقیت ایجاد شد");
      setShowEditDialog(false);
      setEditingAvailability(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در ایجاد وضعیت");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateRoomAvailability(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-room-availability"] });
      toast.success("وضعیت با موفقیت بروزرسانی شد");
      setShowEditDialog(false);
      setEditingAvailability(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در بروزرسانی وضعیت");
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: bulkCreateRoomAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-room-availability"] });
      toast.success("وضعیت‌ها با موفقیت ایجاد شدند");
      setShowBulkDialog(false);
      setBulkStartDate(undefined);
      setBulkEndDate(undefined);
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در ایجاد وضعیت‌ها");
    },
  });

  const handleDateClick = (date: Date) => {
    if (!selectedAccommodation) {
      toast.error("لطفا ابتدا اقامتگاه را انتخاب کنید");
      return;
    }

    const dateStr = format(date, "yyyy-MM-dd");
    const existing = availability?.find((a) => a.date === dateStr);

    if (existing) {
      setEditingAvailability(existing);
    } else {
      setEditingAvailability({
        accommodation: selectedAccommodation,
        date: dateStr,
        price: null,
        status: "available",
      });
    }
    setSelectedDate(date);
    setShowEditDialog(true);
  };

  // Convert availability dates to marked dates and color mapping
  const getMarkedDates = (): string[] => {
    if (!availability) return [];
    return availability.map((a) => a.date);
  };

  const getDateColorMap = (): Record<string, string> => {
    if (!availability) return {};
    const colorMap: Record<string, string> = {};
    availability.forEach((a) => {
      switch (a.status) {
        case "available":
          colorMap[a.date] = "bg-green-100 border-2 border-green-500";
          break;
        case "unavailable":
          colorMap[a.date] = "bg-red-100 border-2 border-red-500";
          break;
        case "full":
          colorMap[a.date] = "bg-gray-100 border-2 border-gray-500";
          break;
        case "under_maintenance":
          colorMap[a.date] = "bg-yellow-100 border-2 border-yellow-500";
          break;
        case "blocked":
          colorMap[a.date] = "bg-orange-100 border-2 border-orange-500";
          break;
        case "reserved":
          colorMap[a.date] = "bg-blue-100 border-2 border-blue-500";
          break;
        default:
          colorMap[a.date] = "bg-gray-100";
      }
    });
    return colorMap;
  };

  const handleSave = () => {
    if (!editingAvailability) return;

    const data = {
      accommodation: editingAvailability.accommodation,
      date: editingAvailability.date,
      price: editingAvailability.price || null,
      status: editingAvailability.status,
    };

    if (editingAvailability.id) {
      updateMutation.mutate({ id: editingAvailability.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleBulkCreate = () => {
    if (!selectedAccommodation || !bulkStartDate || !bulkEndDate) {
      toast.error("لطفا همه فیلدها را پر کنید");
      return;
    }

    bulkCreateMutation.mutate({
      accommodation: selectedAccommodation,
      start_date: format(bulkStartDate, "yyyy-MM-dd"),
      end_date: format(bulkEndDate, "yyyy-MM-dd"),
      status: bulkStatus,
      price: bulkPrice || null,
    });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت وضعیت اتاق‌ها</h1>
        <Button onClick={() => setShowBulkDialog(true)}>
          <Plus className="w-4 h-4 ml-2" />
          ایجاد دسته‌ای
        </Button>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Label>انتخاب اقامتگاه</Label>
          <Select
            value={selectedAccommodation?.toString() || ""}
            onValueChange={(value) => setSelectedAccommodation(Number(value))}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="اقامتگاه را انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {accommodations?.map((acc) => (
                <SelectItem key={acc.id} value={acc.id.toString()}>
                  {acc.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAccommodation && (
          <div className="mt-6">
            <PersianCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateClick}
              markedDates={getMarkedDates()}
              dateColors={getDateColorMap()}
            />
          </div>
        )}

        {!selectedAccommodation && (
          <div className="text-center py-12 text-gray-500">
            لطفا ابتدا اقامتگاه را انتخاب کنید
          </div>
        )}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ویرایش وضعیت</DialogTitle>
            <DialogDescription>
              {editingAvailability?.date && editingAvailability.date}
            </DialogDescription>
          </DialogHeader>
          {editingAvailability && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>وضعیت</Label>
                <Select
                  value={editingAvailability.status}
                  onValueChange={(value) =>
                    setEditingAvailability({ ...editingAvailability, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>قیمت (اختیاری)</Label>
                <Input
                  type="number"
                  value={editingAvailability.price || ""}
                  onChange={(e) =>
                    setEditingAvailability({
                      ...editingAvailability,
                      price: e.target.value || null,
                    })
                  }
                  placeholder="قیمت اختصاصی برای این روز"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSave} className="flex-1">
                  ذخیره
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingAvailability(null);
                  }}
                  className="flex-1"
                >
                  انصراف
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ایجاد دسته‌ای وضعیت</DialogTitle>
            <DialogDescription>
              ایجاد وضعیت برای بازه زمانی مشخص
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>تاریخ شروع</Label>
              <PersianCalendar
                selectedDate={bulkStartDate}
                onDateSelect={(date) => setBulkStartDate(date)}
              />
            </div>
            <div className="space-y-2">
              <Label>تاریخ پایان</Label>
              <PersianCalendar
                selectedDate={bulkEndDate}
                onDateSelect={(date) => setBulkEndDate(date)}
              />
            </div>
            <div className="space-y-2">
              <Label>وضعیت</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>قیمت (اختیاری)</Label>
              <Input
                type="number"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="قیمت اختصاصی"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleBulkCreate} className="flex-1">
                ایجاد
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBulkDialog(false)}
                className="flex-1"
              >
                انصراف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


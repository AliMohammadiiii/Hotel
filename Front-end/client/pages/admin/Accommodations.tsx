import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  getAdminAccommodations,
  deleteAccommodation,
} from "@/lib/admin/api";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { Accommodation } from "@shared/api";

export default function Accommodations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: accommodations, isLoading } = useQuery({
    queryKey: ["admin-accommodations", searchQuery],
    queryFn: () => getAdminAccommodations(searchQuery),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccommodation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accommodations"] });
      toast.success("اقامتگاه با موفقیت حذف شد");
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در حذف اقامتگاه");
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت اقامتگاه‌ها</h1>
        <Button onClick={() => navigate("/admin/accommodations/new")}>
          <Plus className="w-4 h-4 ml-2" />
          افزودن اقامتگاه
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="جستجوی اقامتگاه..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>عنوان</TableHead>
              <TableHead>شهر</TableHead>
              <TableHead>استان</TableHead>
              <TableHead>ظرفیت</TableHead>
              <TableHead>قیمت</TableHead>
              <TableHead>امتیاز</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  در حال بارگذاری...
                </TableCell>
              </TableRow>
            ) : accommodations && accommodations.length > 0 ? (
              accommodations.map((accommodation: Accommodation) => (
                <TableRow key={accommodation.id}>
                  <TableCell className="font-medium">{accommodation.title}</TableCell>
                  <TableCell>{accommodation.city}</TableCell>
                  <TableCell>{accommodation.province}</TableCell>
                  <TableCell>{accommodation.capacity}</TableCell>
                  <TableCell>
                    {parseInt(accommodation.price_per_night).toLocaleString("fa-IR")} تومان
                  </TableCell>
                  <TableCell>{accommodation.rating}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/accommodations/${accommodation.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/accommodations/${accommodation.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(accommodation.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  اقامتگاهی یافت نشد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="حذف اقامتگاه"
        description="آیا از حذف این اقامتگاه اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmText="حذف"
        cancelText="انصراف"
      />
    </div>
  );
}


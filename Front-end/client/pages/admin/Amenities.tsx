import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
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
  getAdminAmenities,
  deleteAmenity,
} from "@/lib/admin/api";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { Amenity } from "@shared/api";

export default function Amenities() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: amenities, isLoading } = useQuery({
    queryKey: ["admin-amenities", searchQuery],
    queryFn: () => getAdminAmenities(searchQuery),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAmenity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-amenities"] });
      toast.success("امکانات با موفقیت حذف شد");
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در حذف امکانات");
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت امکانات</h1>
        <Button onClick={() => navigate("/admin/amenities/new")}>
          <Plus className="w-4 h-4 ml-2" />
          افزودن امکانات
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="جستجوی امکانات..."
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
              <TableHead>نام</TableHead>
              <TableHead>دسته‌بندی</TableHead>
              <TableHead>آیکون</TableHead>
              <TableHead className="text-left">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  در حال بارگذاری...
                </TableCell>
              </TableRow>
            ) : amenities && amenities.length > 0 ? (
              amenities.map((amenity: Amenity) => (
                <TableRow key={amenity.id}>
                  <TableCell className="font-medium">{amenity.name}</TableCell>
                  <TableCell>{amenity.category || "-"}</TableCell>
                  <TableCell>
                    {amenity.icon ? (
                      <img
                        src={amenity.icon}
                        alt={amenity.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/amenities/${amenity.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(amenity.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  امکاناتی یافت نشد
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
        title="حذف امکانات"
        description="آیا از حذف این امکانات اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmText="حذف"
        cancelText="انصراف"
      />
    </div>
  );
}





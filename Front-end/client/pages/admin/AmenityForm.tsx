import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getAdminAmenity,
  createAmenity,
  updateAmenity,
} from "@/lib/admin/api";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useState } from "react";

const amenitySchema = z.object({
  name: z.string().min(1, "نام الزامی است"),
  category: z.string().optional(),
});

type AmenityFormData = z.infer<typeof amenitySchema>;

export default function AmenityForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const [icon, setIcon] = useState<File | null>(null);

  const { data: amenity, isLoading: isLoadingAmenity } = useQuery({
    queryKey: ["admin-amenity", id],
    queryFn: () => getAdminAmenity(Number(id!)),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AmenityFormData>({
    resolver: zodResolver(amenitySchema),
    defaultValues: isEdit && amenity
      ? {
          name: amenity.name,
          category: amenity.category || "",
        }
      : {},
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => createAmenity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-amenities"] });
      toast.success("امکانات با موفقیت ایجاد شد");
      navigate("/admin/amenities");
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در ایجاد امکانات");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => updateAmenity(Number(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-amenities"] });
      queryClient.invalidateQueries({ queryKey: ["admin-amenity", id] });
      toast.success("امکانات با موفقیت بروزرسانی شد");
      navigate("/admin/amenities");
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در بروزرسانی امکانات");
    },
  });

  const onSubmit = async (data: AmenityFormData) => {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.category) {
      formData.append("category", data.category);
    }
    if (icon) {
      formData.append("icon", icon);
    }

    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isEdit && isLoadingAmenity) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin/amenities")}>
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? "ویرایش امکانات" : "افزودن امکانات جدید"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">نام *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">دسته‌بندی</Label>
            <Input id="category" {...register("category")} />
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>آیکون</Label>
          <ImageUpload
            value={isEdit && amenity?.icon ? amenity.icon : icon}
            onChange={setIcon}
            accept="image/*,.svg"
          />
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              "ذخیره"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/amenities")}
          >
            انصراف
          </Button>
        </div>
      </form>
    </div>
  );
}


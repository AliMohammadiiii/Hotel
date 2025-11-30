import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getAdminAccommodation,
  createAccommodation,
  updateAccommodation,
  getAdminAmenities,
} from "@/lib/admin/api";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useState } from "react";

const accommodationSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است"),
  city: z.string().min(1, "شهر الزامی است"),
  province: z.string().min(1, "استان الزامی است"),
  address: z.string().min(1, "آدرس الزامی است"),
  description: z.string().min(1, "توضیحات الزامی است"),
  capacity: z.number().min(1, "ظرفیت باید بیشتر از 0 باشد"),
  beds_description: z.string().min(1, "توضیحات تخت الزامی است"),
  area: z.number().min(1, "متراژ باید بیشتر از 0 باشد"),
  price_per_night: z.number().min(0, "قیمت باید بیشتر یا مساوی 0 باشد"),
  rating: z.number().min(0).max(5).optional(),
  amenities: z.array(z.number()).optional(),
});

type AccommodationFormData = z.infer<typeof accommodationSchema>;

export default function AccommodationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const [mainImage, setMainImage] = useState<File | null>(null);

  const { data: accommodation, isLoading: isLoadingAccommodation } = useQuery({
    queryKey: ["admin-accommodation", id],
    queryFn: () => getAdminAccommodation(Number(id!)),
    enabled: isEdit,
  });

  const { data: amenities } = useQuery({
    queryKey: ["admin-amenities"],
    queryFn: () => getAdminAmenities(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<AccommodationFormData>({
    resolver: zodResolver(accommodationSchema),
    defaultValues: isEdit && accommodation
      ? {
          title: accommodation.title,
          city: accommodation.city,
          province: accommodation.province,
          address: accommodation.address || "",
          description: accommodation.description,
          capacity: accommodation.capacity,
          beds_description: accommodation.beds || "",
          area: accommodation.area,
          price_per_night: parseFloat(accommodation.price_per_night),
          rating: accommodation.rating,
          amenities: accommodation.amenities?.map((a) => a.id) || [],
        }
      : {
          amenities: [],
        },
  });

  const selectedAmenities = watch("amenities") || [];

  const createMutation = useMutation({
    mutationFn: (data: FormData) => createAccommodation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accommodations"] });
      toast.success("اقامتگاه با موفقیت ایجاد شد");
      navigate("/admin/accommodations");
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در ایجاد اقامتگاه");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => updateAccommodation(Number(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accommodations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-accommodation", id] });
      toast.success("اقامتگاه با موفقیت بروزرسانی شد");
      navigate("/admin/accommodations");
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در بروزرسانی اقامتگاه");
    },
  });

  const onSubmit = async (data: AccommodationFormData) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("city", data.city);
    formData.append("province", data.province);
    formData.append("address", data.address);
    formData.append("description", data.description);
    formData.append("capacity", data.capacity.toString());
    formData.append("beds_description", data.beds_description);
    formData.append("area", data.area.toString());
    formData.append("price_per_night", data.price_per_night.toString());
    if (data.rating !== undefined) {
      formData.append("rating", data.rating.toString());
    }
    if (mainImage) {
      formData.append("main_image", mainImage);
    }
    if (data.amenities && data.amenities.length > 0) {
      data.amenities.forEach((amenityId) => {
        formData.append("amenities", amenityId.toString());
      });
    }

    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isEdit && isLoadingAccommodation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin/accommodations")}>
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? "ویرایش اقامتگاه" : "افزودن اقامتگاه جدید"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان *</Label>
            <Input id="title" {...register("title")} />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">شهر *</Label>
            <Input id="city" {...register("city")} />
            {errors.city && (
              <p className="text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="province">استان *</Label>
            <Input id="province" {...register("province")} />
            {errors.province && (
              <p className="text-sm text-red-600">{errors.province.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">ظرفیت *</Label>
            <Input
              id="capacity"
              type="number"
              {...register("capacity", { valueAsNumber: true })}
            />
            {errors.capacity && (
              <p className="text-sm text-red-600">{errors.capacity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="beds_description">توضیحات تخت *</Label>
            <Input id="beds_description" {...register("beds_description")} />
            {errors.beds_description && (
              <p className="text-sm text-red-600">{errors.beds_description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">متراژ (متر) *</Label>
            <Input
              id="area"
              type="number"
              {...register("area", { valueAsNumber: true })}
            />
            {errors.area && (
              <p className="text-sm text-red-600">{errors.area.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_per_night">قیمت هر شب (تومان) *</Label>
            <Input
              id="price_per_night"
              type="number"
              {...register("price_per_night", { valueAsNumber: true })}
            />
            {errors.price_per_night && (
              <p className="text-sm text-red-600">{errors.price_per_night.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">امتیاز (0-5)</Label>
            <Input
              id="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              {...register("rating", { valueAsNumber: true })}
            />
            {errors.rating && (
              <p className="text-sm text-red-600">{errors.rating.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">آدرس *</Label>
          <Textarea id="address" {...register("address")} rows={3} />
          {errors.address && (
            <p className="text-sm text-red-600">{errors.address.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">توضیحات *</Label>
          <Textarea id="description" {...register("description")} rows={5} />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>تصویر اصلی</Label>
          <ImageUpload
            value={isEdit && accommodation?.main_image ? accommodation.main_image : mainImage}
            onChange={setMainImage}
          />
        </div>

        <div className="space-y-2">
          <Label>امکانات</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {amenities?.map((amenity) => (
              <div key={amenity.id} className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  id={`amenity-${amenity.id}`}
                  checked={selectedAmenities.includes(amenity.id)}
                  onChange={(e) => {
                    const current = selectedAmenities;
                    if (e.target.checked) {
                      setValue("amenities", [...current, amenity.id]);
                    } else {
                      setValue(
                        "amenities",
                        current.filter((id) => id !== amenity.id)
                      );
                    }
                  }}
                  className="rounded"
                />
                <label htmlFor={`amenity-${amenity.id}`} className="text-sm">
                  {amenity.name}
                </label>
              </div>
            ))}
          </div>
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
            onClick={() => navigate("/admin/accommodations")}
          >
            انصراف
          </Button>
        </div>
      </form>
    </div>
  );
}



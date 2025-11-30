import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Edit, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  getAdminAccommodation,
  deleteAccommodation,
  addAccommodationImage,
  deleteAccommodationImage,
} from "@/lib/admin/api";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ImageSliderUploader } from "@/components/admin/ImageSliderUploader";
import { Loader2 } from "lucide-react";

export default function AccommodationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<Set<number>>(new Set());

  const { data: accommodation, isLoading } = useQuery({
    queryKey: ["admin-accommodation", id],
    queryFn: () => getAdminAccommodation(Number(id!)),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAccommodation(Number(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accommodations"] });
      toast.success("اقامتگاه با موفقیت حذف شد");
      navigate("/admin/accommodations");
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در حذف اقامتگاه");
    },
  });

  const addImageMutation = useMutation({
    mutationFn: (file: File) => addAccommodationImage(Number(id!), file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accommodation", id] });
      toast.success("تصویر با موفقیت افزوده شد");
      setUploadingImages(new Set());
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در افزودن تصویر");
      setUploadingImages(new Set());
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) => deleteAccommodationImage(Number(id!), imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accommodation", id] });
      toast.success("تصویر با موفقیت حذف شد");
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در حذف تصویر");
    },
  });

  const handleAddImage = (file: File) => {
    const tempId = Date.now();
    setUploadingImages((prev) => new Set(prev).add(tempId));
    addImageMutation.mutate(file, {
      onSettled: () => {
        setUploadingImages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tempId);
          return newSet;
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!accommodation) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">اقامتگاه یافت نشد</p>
        <Button onClick={() => navigate("/admin/accommodations")} className="mt-4">
          بازگشت به لیست
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin/accommodations")}>
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت
          </Button>
          <h1 className="text-2xl font-bold">{accommodation.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/accommodations/${id}/edit`)}
          >
            <Edit className="w-4 h-4 ml-2" />
            ویرایش
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-4 h-4 ml-2" />
            حذف
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">اطلاعات اصلی</TabsTrigger>
          <TabsTrigger value="images">تصاویر</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">عنوان</p>
                <p className="font-medium">{accommodation.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">شهر</p>
                <p className="font-medium">{accommodation.city}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">استان</p>
                <p className="font-medium">{accommodation.province}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ظرفیت</p>
                <p className="font-medium">{accommodation.capacity} نفر</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">متراژ</p>
                <p className="font-medium">{accommodation.area} متر</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">قیمت هر شب</p>
                <p className="font-medium">
                  {parseInt(accommodation.price_per_night).toLocaleString("fa-IR")} تومان
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">امتیاز</p>
                <p className="font-medium">{accommodation.rating}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">آدرس</p>
              <p className="font-medium">{accommodation.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">توضیحات</p>
              <p className="font-medium whitespace-pre-wrap">{accommodation.description}</p>
            </div>
            {accommodation.amenities && accommodation.amenities.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">امکانات</p>
                <div className="flex flex-wrap gap-2">
                  {accommodation.amenities.map((amenity) => (
                    <span
                      key={amenity.id}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {amenity.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">تصویر اصلی</h3>
            {accommodation.main_image && (
              <div className="mb-6">
                <img
                  src={accommodation.main_image}
                  alt="Main"
                  className="max-w-md rounded-lg"
                />
              </div>
            )}

            <h3 className="text-lg font-semibold mb-4">تصاویر اسلایدر</h3>
            <ImageSliderUploader
              images={
                (accommodation as any).images?.map((img: any, index: number) => ({
                  id: img.id,
                  url: img.image_url || img,
                  isUploading: uploadingImages.has(img.id || index),
                })) || []
              }
              onImageAdd={handleAddImage}
              onImageDelete={(imageId) => {
                deleteImageMutation.mutate(imageId);
              }}
              label=""
              maxImages={20}
              isUploading={addImageMutation.isPending}
            />
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => deleteMutation.mutate()}
        title="حذف اقامتگاه"
        description="آیا از حذف این اقامتگاه اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmText="حذف"
        cancelText="انصراف"
      />
    </div>
  );
}


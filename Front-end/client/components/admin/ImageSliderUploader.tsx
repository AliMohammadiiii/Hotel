import { useState, useRef, useEffect } from "react";
import { Upload, X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ImageItem {
  id?: number;
  url: string;
  file?: File;
  isNew?: boolean;
  isUploading?: boolean;
}

interface ImageSliderUploaderProps {
  images: ImageItem[];
  onImageAdd?: (file: File) => void;
  onImageDelete?: (imageId: number) => void;
  label?: string;
  accept?: string;
  className?: string;
  maxImages?: number;
  isUploading?: boolean;
}

export function ImageSliderUploader({
  images = [],
  onImageAdd,
  onImageDelete,
  label = "تصاویر اسلایدر",
  accept = "image/*",
  className,
  maxImages = 20,
  isUploading = false,
}: ImageSliderUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !onImageAdd) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/") && images.length < maxImages) {
        onImageAdd(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemove = (image: ImageItem) => {
    if (image.id && onImageDelete) {
      onImageDelete(image.id);
    }
  };

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.isNew && img.url.startsWith("blob:")) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [images]);

  return (
    <div className={cn("space-y-4", className)}>
      {label && <label className="text-sm font-medium block">{label}</label>}

      {/* Image Carousel/Slider */}
      {images.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <Carousel className="w-full">
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={image.id || `new-${index}`} className="basis-full md:basis-1/2 lg:basis-1/3">
                  <div className="relative group border-2 rounded-lg overflow-hidden border-gray-200">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                      {image.isUploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                          <Loader2 className="w-8 h-8 animate-spin text-white" />
                        </div>
                      ) : (
                        <img
                          src={image.url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    {!image.isUploading && (
                      <>
                        <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {image.id && onImageDelete && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemove(image)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {index + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
              </>
            )}
          </Carousel>
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-12 h-12 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                برای آپلود کلیک کنید یا فایل را بکشید
              </p>
              <p className="text-xs text-gray-500 mt-1">
                می‌توانید چند تصویر را همزمان آپلود کنید ({images.length} / {maxImages})
              </p>
            </div>
          </div>
        </div>
      )}

      {images.length >= maxImages && (
        <div className="text-center text-sm text-gray-500 py-4">
          حداکثر {maxImages} تصویر می‌توانید آپلود کنید
        </div>
      )}
    </div>
  );
}


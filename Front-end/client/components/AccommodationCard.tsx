import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

interface AccommodationCardProps {
  id: string;
  image?: string;
  images?: string[];
  title: string;
  capacity: string;
  rating: number;
  location: string;
  pricePerNight: string;
}

export default function AccommodationCard({
  id,
  image,
  images,
  title,
  capacity,
  rating,
  location,
  pricePerNight,
}: AccommodationCardProps) {
  // Support both single image (backward compatible) and images array
  const imageArray = images || (image ? [image] : []);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: 'start',
    startIndex: 0,
    skipSnaps: false,
    dragFree: false
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("init", () => {
      setTimeout(() => {
        emblaApi.scrollTo(0, false);
      }, 0);
    });

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("init", () => {});
    };
  }, [emblaApi, onSelect]);

  // Reset images loaded counter when images change
  useEffect(() => {
    setImagesLoaded(0);
  }, [imageArray]);

  // Reinitialize carousel when images change or all images are loaded
  useEffect(() => {
    if (!emblaApi || imageArray.length === 0) return;
    const frameId1 = requestAnimationFrame(() => {
      const frameId2 = requestAnimationFrame(() => {
        setTimeout(() => {
          if (emblaApi) {
            emblaApi.reInit();
            setTimeout(() => {
              const currentIndex = emblaApi.selectedScrollSnap();
              if (currentIndex !== 0) {
                emblaApi.scrollTo(0, false);
              }
            }, 100);
          }
        }, 300);
      });
      return () => cancelAnimationFrame(frameId2);
    });
    return () => cancelAnimationFrame(frameId1);
  }, [emblaApi, imageArray, imagesLoaded]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi && index >= 0 && index < imageArray.length) {
        emblaApi.scrollTo(index, true);
      }
    },
    [emblaApi, imageArray.length]
  );

  return (
    <div className="flex flex-col items-stretch gap-2 p-4 rounded-xl bg-white shadow-sm">
      <div className="relative w-full h-[180px]">
        <div 
          className="w-full h-full rounded-xl overflow-hidden bg-gray-200" 
          ref={emblaRef}
          style={{ 
            overflow: 'hidden',
            position: 'relative',
            width: '100%',
            height: '100%',
            direction: 'ltr'
          }}
        >
          <div 
            className="flex h-full"
            style={{ 
              touchAction: 'pan-y pinch-zoom',
              marginLeft: 0,
              display: 'flex',
              direction: 'ltr'
            }}
          >
            {imageArray.map((img, index) => (
              <div 
                key={index} 
                className="flex-[0_0_100%]"
                style={{ 
                  flexShrink: 0, 
                  flexGrow: 0,
                  minWidth: 0,
                  width: '100%',
                  height: '100%',
                  position: 'relative'
                }}
              >
                <img 
                  src={img} 
                  alt={`${title} - تصویر ${index + 1}`} 
                  className="w-full h-full object-cover"
                  loading="eager"
                  draggable={false}
                  style={{ 
                    display: 'block', 
                    width: '100%', 
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'none',
                    imageOrientation: 'from-image'
                  }}
                  onError={(e) => {
                    // Show placeholder instead of hiding
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial"%3Eتصویر موجود نیست%3C/text%3E%3C/svg%3E';
                    e.currentTarget.onerror = null; // Prevent infinite loop
                  }}
                  onLoad={() => {
                    // Track loaded images and reinit when all are loaded
                    setImagesLoaded(prev => {
                      const newCount = prev + 1;
                      if (newCount === imageArray.length && emblaApi) {
                        setTimeout(() => {
                          emblaApi.reInit();
                        }, 100);
                      }
                      return newCount;
                    });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        {imageArray.length > 1 && (
          <div 
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex justify-center items-center gap-1 px-1 py-1 rounded-lg bg-white/50 backdrop-blur-sm"
            style={{ direction: 'ltr' }}
          >
            {imageArray.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`transition-all ${
                  index === selectedIndex
                    ? "w-3 h-3 rounded-full bg-primary"
                    : "w-2 h-2 rounded-full bg-stroke-tertiary"
                }`}
                aria-label={`رفتن به تصویر ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="self-stretch text-right" style={{ color: '#000', fontFamily: 'IRANYekanXFaNum', fontSize: '16px', fontWeight: 500, lineHeight: '22px' }}>
        {title}
      </div>

      <div className="flex items-center gap-2 self-start">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary-100">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.245 17.0027C12.8475 17.0027 12.3375 16.8752 11.7 16.5002L9.45747 15.1727C9.22497 15.0377 8.77497 15.0377 8.54997 15.1727L6.29997 16.5002C4.97247 17.2877 4.19247 16.9727 3.83997 16.7177C3.49497 16.4627 2.95497 15.8102 3.30747 14.3102L3.83997 12.0077C3.89997 11.7677 3.77997 11.3552 3.59997 11.1752L1.73997 9.31524C0.809966 8.38523 0.884966 7.59023 1.01247 7.20023C1.13997 6.81024 1.54497 6.12023 2.83497 5.90273L5.22747 5.50523C5.45247 5.46773 5.77497 5.22773 5.87247 5.02523L7.19997 2.37773C7.79997 1.17023 8.58747 0.990234 8.99997 0.990234C9.41247 0.990234 10.2 1.17023 10.8 2.37773L12.12 5.01773C12.225 5.22023 12.5475 5.46023 12.7725 5.49773L15.165 5.89523C16.4625 6.11273 16.8675 6.80273 16.9875 7.19273C17.1075 7.58273 17.1825 8.37773 16.26 9.30773L14.4 11.1752C14.22 11.3552 14.1075 11.7602 14.16 12.0077L14.6925 14.3102C15.0375 15.8102 14.505 16.4627 14.16 16.7177C13.9725 16.8527 13.6725 17.0027 13.245 17.0027ZM8.99997 13.9427C9.36747 13.9427 9.73497 14.0327 10.0275 14.2052L12.27 15.5327C12.9225 15.9227 13.335 15.9227 13.4925 15.8102C13.65 15.6977 13.7625 15.3002 13.5975 14.5652L13.065 12.2627C12.9225 11.6402 13.155 10.8377 13.605 10.3802L15.465 8.52023C15.8325 8.15273 15.9975 7.79274 15.9225 7.54523C15.84 7.29773 15.495 7.09523 14.985 7.01273L12.5925 6.61523C12.015 6.51773 11.385 6.05273 11.1225 5.52773L9.80247 2.88773C9.56247 2.40773 9.26247 2.12273 8.99997 2.12273C8.73747 2.12273 8.43747 2.40773 8.20497 2.88773L6.87747 5.52773C6.61497 6.05273 5.98497 6.51773 5.40747 6.61523L3.02247 7.01273C2.51247 7.09523 2.16747 7.29773 2.08497 7.54523C2.00247 7.79274 2.17497 8.16023 2.54247 8.52023L4.40247 10.3802C4.85247 10.8302 5.08497 11.6402 4.94247 12.2627L4.40997 14.5652C4.23747 15.3077 4.35747 15.6977 4.51497 15.8102C4.67247 15.9227 5.07747 15.9152 5.73747 15.5327L7.97997 14.2052C8.26497 14.0327 8.63247 13.9427 8.99997 13.9427Z" fill="#1DBF98"/>
          </svg>
          <div className="text-primary text-left text-xs font-normal leading-5">
            {rating.toFixed(1)}
          </div>
        </div>

        <div className="w-px h-4 bg-[#D9D9D9]"></div>

        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.75 1.5C4.785 1.5 3.1875 3.0975 3.1875 5.0625C3.1875 6.99 4.695 8.55 6.66 8.6175C6.72 8.61 6.78 8.61 6.825 8.6175C6.84 8.6175 6.8475 8.6175 6.8625 8.6175C6.87 8.6175 6.87 8.6175 6.8775 8.6175C8.7975 8.55 10.305 6.99 10.3125 5.0625C10.3125 3.0975 8.715 1.5 6.75 1.5Z" fill="#4F545E"/>
            <path d="M10.56 10.6127C8.46747 9.21766 5.05497 9.21766 2.94747 10.6127C1.99497 11.2502 1.46997 12.1127 1.46997 13.0352C1.46997 13.9577 1.99497 14.8127 2.93997 15.4427C3.98997 16.1477 5.36997 16.5002 6.74997 16.5002C8.12997 16.5002 9.50997 16.1477 10.56 15.4427C11.505 14.8052 12.03 13.9502 12.03 13.0202C12.0225 12.0977 11.505 11.2427 10.56 10.6127Z" fill="#4F545E"/>
            <path d="M14.9928 5.50507C15.1128 6.96007 14.0778 8.23507 12.6453 8.40757C12.6378 8.40757 12.6378 8.40757 12.6303 8.40757H12.6078C12.5628 8.40757 12.5178 8.40757 12.4803 8.42257C11.7528 8.46007 11.0853 8.22757 10.5828 7.80007C11.3553 7.11007 11.7978 6.07507 11.7078 4.95007C11.6553 4.34257 11.4453 3.78757 11.1303 3.31507C11.4153 3.17257 11.7453 3.08257 12.0828 3.05257C13.5528 2.92507 14.8653 4.02007 14.9928 5.50507Z" fill="#4F545E"/>
            <path d="M16.4927 12.4428C16.4327 13.1703 15.9677 13.8003 15.1877 14.2278C14.4377 14.6403 13.4927 14.8353 12.5552 14.8128C13.0952 14.3253 13.4102 13.7178 13.4702 13.0728C13.5452 12.1428 13.1027 11.2503 12.2177 10.5378C11.7152 10.1403 11.1302 9.8253 10.4927 9.5928C12.1502 9.1128 14.2352 9.4353 15.5177 10.4703C16.2077 11.0253 16.5602 11.7228 16.4927 12.4428Z" fill="#4F545E"/>
          </svg>
          <div className="text-left" style={{ color: 'var(--Text-Primary, #242933)', fontFamily: 'IRANYekanXFaNum', fontSize: '12px', fontWeight: 400, lineHeight: '20px' }}>
            {capacity}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.00003 10.0726C10.2924 10.0726 11.34 9.02492 11.34 7.73258C11.34 6.44023 10.2924 5.39258 9.00003 5.39258C7.70769 5.39258 6.66003 6.44023 6.66003 7.73258C6.66003 9.02492 7.70769 10.0726 9.00003 10.0726Z" stroke="#4F545E" strokeWidth="1.5"/>
          <path d="M2.71478 6.3675C4.19228 -0.127498 13.8148 -0.119998 15.2848 6.375C16.1473 10.185 13.7773 13.41 11.6998 15.405C10.1923 16.86 7.80728 16.86 6.29228 15.405C4.22228 13.41 1.85228 10.1775 2.71478 6.3675Z" stroke="#4F545E" strokeWidth="1.5"/>
        </svg>
        <div className="text-left" style={{ color: 'var(--Text-Primary, #242933)', fontFamily: 'IRANYekanXFaNum', fontSize: '12px', fontWeight: 400, lineHeight: '20px' }}>
          {location}
        </div>
      </div>

      <div className="w-full h-px bg-[#D9D9D9]"></div>

      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex flex-col items-start">
          <div className="text-black text-left text-xs font-normal leading-5" style={{ textAlign: 'left' }}>
            هر شب
          </div>
          <div className="text-left" style={{ color: 'var(--Text-Primary, #242933)', fontFamily: 'IRANYekanXFaNum', fontSize: '16px', fontWeight: 500, lineHeight: '22px', textAlign: 'left' }}>
            {pricePerNight}
          </div>
        </div>

        <Link 
          to={`/accommodation/${id}`}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-md bg-primary text-white min-w-[120px]"
        >
          <div className="text-white text-left text-sm font-bold leading-5" style={{ fontFamily: 'IRANYekanXFaNum', fontSize: '14px', fontWeight: 700, lineHeight: '20px' }}>
            مشاهده
          </div>
        </Link>
      </div>
    </div>
  );
}

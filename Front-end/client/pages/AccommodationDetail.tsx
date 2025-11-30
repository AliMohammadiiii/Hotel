import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useQuery } from "@tanstack/react-query";
import { useAccommodationDetail } from "@/hooks/useAccommodations";
import { useAuth } from "@/hooks/useAuth";
import { getUnavailableDates } from "@/lib/api";
import { PersianDateRangePicker } from "@/components/PersianDateRangePicker";
import { ReservationBottomSheet } from "@/components/ReservationBottomSheet";

export default function AccommodationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const accommodationId = id ? parseInt(id, 10) : 0;
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [checkInDate, setCheckInDate] = useState<string | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(null);
  const [hasProcessedUrlParams, setHasProcessedUrlParams] = useState(false);
  
  const { data: accommodation, isLoading, error } = useAccommodationDetail(accommodationId);
  
  // Fetch unavailable dates for this accommodation
  const { data: unavailableDates = [] } = useQuery({
    queryKey: ['unavailableDates', accommodationId],
    queryFn: () => getUnavailableDates(accommodationId),
    enabled: !!accommodationId,
  });

  // Restore dates from URL parameters and auto-open calendar (only once)
  useEffect(() => {
    if (hasProcessedUrlParams) return; // Already processed
    
    const checkInParam = searchParams.get('check_in');
    const checkOutParam = searchParams.get('check_out');
    
    // If we have URL params, restore dates and open calendar
    if (checkInParam && checkOutParam) {
      setCheckInDate(checkInParam);
      setCheckOutDate(checkOutParam);
      setHasProcessedUrlParams(true);
      
      // Only auto-open if authenticated
      if (isAuthenticated && accommodation) {
        setShowCalendarDialog(true);
        // Clean up URL parameters after restoring state
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('check_in');
        newSearchParams.delete('check_out');
        if (newSearchParams.has('accommodation')) {
          newSearchParams.delete('accommodation');
        }
        setSearchParams(newSearchParams, { replace: true });
      }
    }
  }, [searchParams, isAuthenticated, accommodation, hasProcessedUrlParams, setSearchParams]);
  
  const handleBookNow = () => {
    if (isAuthenticated) {
      setShowCalendarDialog(true);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(`/accommodations/${accommodationId}`)}`);
    }
  };

  const handleDateConfirm = () => {
    if (checkInDate && checkOutDate) {
      setShowCalendarDialog(false);
      // Show booking bottom sheet
      setShowBookingSheet(true);
    }
  };

  // Use images from API, fallback to main_image if no images array
  const images = useMemo(() => {
    if (!accommodation) return [];
    if (accommodation.images && accommodation.images.length > 0) {
      return accommodation.images;
    }
    if (accommodation.main_image) {
      return [accommodation.main_image];
    }
    return [];
  }, [accommodation]);

  // Transform amenities from API to component format
  const amenities = useMemo(() => {
    if (!accommodation || !accommodation.amenities) return [];
    return accommodation.amenities.map((amenity) => ({
      icon: amenity.icon, // Use uploaded SVG icon URL from API
      label: amenity.name,
    }));
  }, [accommodation]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: 'start',
    startIndex: 0,
    skipSnaps: false,
    dragFree: false
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenStartIndex, setFullScreenStartIndex] = useState(0);
  const [fullScreenImagesLoaded, setFullScreenImagesLoaded] = useState(0);
  
  // Full-screen carousel
  const [fullScreenEmblaRef, fullScreenEmblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: 'center'
  });
  const [fullScreenSelectedIndex, setFullScreenSelectedIndex] = useState(0);

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
      // Ensure we start at slide 0 when initialized
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
  }, [images]);

  // Reinitialize carousel when images change or all images are loaded
  useEffect(() => {
    if (!emblaApi || images.length === 0) return;
    // Use multiple requestAnimationFrames to ensure layout is complete
    const frameId1 = requestAnimationFrame(() => {
      const frameId2 = requestAnimationFrame(() => {
        setTimeout(() => {
          // Force a reflow to ensure dimensions are calculated
          if (emblaApi) {
            emblaApi.reInit();
            
            // Wait for reinit to complete, then scroll to 0
            setTimeout(() => {
              // Check if we need to reset position
              const currentIndex = emblaApi.selectedScrollSnap();
              if (currentIndex !== 0) {
                emblaApi.scrollTo(0, false); // Use instant scroll for reset
              }
            }, 100);
          }
        }, 300);
      });
      return () => cancelAnimationFrame(frameId2);
    });
    return () => cancelAnimationFrame(frameId1);
  }, [emblaApi, images, imagesLoaded]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi && index >= 0 && index < images.length) {
        emblaApi.scrollTo(index, true); // Use smooth scroll
      }
    },
    [emblaApi, images.length]
  );

  // Full-screen carousel handlers
  const onFullScreenSelect = useCallback(() => {
    if (!fullScreenEmblaApi) return;
    setFullScreenSelectedIndex(fullScreenEmblaApi.selectedScrollSnap());
  }, [fullScreenEmblaApi]);

  useEffect(() => {
    if (!fullScreenEmblaApi) return;
    onFullScreenSelect();
    fullScreenEmblaApi.on("select", onFullScreenSelect);
    fullScreenEmblaApi.on("reInit", onFullScreenSelect);

    return () => {
      fullScreenEmblaApi.off("select", onFullScreenSelect);
    };
  }, [fullScreenEmblaApi, onFullScreenSelect]);

  // Open full-screen viewer
  const openFullScreen = useCallback((index: number) => {
    setFullScreenStartIndex(index);
    setFullScreenImagesLoaded(0); // Reset loaded images counter
    setIsFullScreen(true);
  }, []);

  // Reinitialize and scroll to the clicked image when full-screen opens
  useEffect(() => {
    if (isFullScreen && fullScreenEmblaApi && fullScreenStartIndex >= 0) {
      // Use requestAnimationFrame to ensure DOM is ready
      const frameId = requestAnimationFrame(() => {
        setTimeout(() => {
          fullScreenEmblaApi.reInit();
          // Then scroll to the clicked image
          setTimeout(() => {
            fullScreenEmblaApi.scrollTo(fullScreenStartIndex);
          }, 50);
        }, 150);
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [isFullScreen, fullScreenEmblaApi, fullScreenStartIndex, images, fullScreenImagesLoaded]);

  // Close full-screen viewer
  const closeFullScreen = useCallback(() => {
    setIsFullScreen(false);
  }, []);

  // Handle escape key to close full-screen and prevent body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        closeFullScreen();
      }
    };
    
    if (isFullScreen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = '';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isFullScreen, closeFullScreen]);

  // Scroll full-screen carousel
  const scrollFullScreenTo = useCallback(
    (index: number) => fullScreenEmblaApi?.scrollTo(index),
    [fullScreenEmblaApi]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-secondary pb-20">
        <div className="w-full min-w-[320px] max-w-[550px] mx-auto bg-bg-secondary">
          <div className="flex items-center justify-center py-20">
            <div className="text-text-tertiary text-sm">در حال بارگذاری...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !accommodation) {
    return (
      <div className="min-h-screen bg-bg-secondary pb-20">
        <div className="w-full min-w-[320px] max-w-[550px] mx-auto bg-bg-secondary">
          <div className="flex items-center justify-center py-20">
            <div className="text-red-500 text-sm">خطا در بارگذاری اطلاعات</div>
          </div>
        </div>
      </div>
    );
  }

  // Format price
  const formattedPrice = `${parseFloat(accommodation.price_per_night).toLocaleString('fa-IR')} تومان`;

  return (
    <div className="min-h-screen bg-bg-secondary pb-20">
      <div className="w-full min-w-[320px] max-w-[550px] mx-auto bg-bg-secondary">
        {/* Status Bar */}
        

        {/* Top App Bar */}
        <div className="flex items-center w-full h-14 px-4 py-2 pb-3">
          <div className="flex flex-row-reverse items-center justify-between w-full h-9">
            <button className="inline-flex items-center gap-1 p-2 rounded-xl bg-neutral-200">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M15.8333 14.1668H15C14.54 14.1668 14.1666 13.7935 14.1666 13.3335V9.16683C14.1666 8.70683 14.54 8.3335 15 8.3335H15.8333C16.7541 8.3335 17.5 9.07933 17.5 10.0002V12.5002C17.5 13.421 16.7541 14.1668 15.8333 14.1668Z" stroke="#4F545E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M5 14.1668H4.16667C3.24583 14.1668 2.5 13.421 2.5 12.5002V10.0002C2.5 9.07933 3.24583 8.3335 4.16667 8.3335H5C5.46 8.3335 5.83333 8.70683 5.83333 9.16683V13.3335C5.83333 13.7935 5.46 14.1668 5 14.1668Z" stroke="#4F545E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.4167 8.33333V7.91667C15.4167 4.925 12.9917 2.5 10 2.5V2.5C7.00837 2.5 4.58337 4.925 4.58337 7.91667V8.33333" stroke="#4F545E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M10.5208 17.7083H9.47917C8.90417 17.7083 8.4375 17.2417 8.4375 16.6667V16.6667C8.4375 16.0917 8.90417 15.625 9.47917 15.625H10.5208C11.0958 15.625 11.5625 16.0917 11.5625 16.6667V16.6667C11.5625 17.2417 11.0958 17.7083 10.5208 17.7083Z" stroke="#4F545E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.5625 16.6665H13.3333C14.2542 16.6665 15 15.9207 15 14.9998V14.1665" stroke="#4F545E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <Link to="/" className="inline-flex items-center gap-2.5 p-2 rounded-xl bg-neutral-200">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.0247 15.6834C12.183 15.6834 12.3413 15.6251 12.4663 15.5001L17.5247 10.4418C17.7663 10.2001 17.7663 9.8001 17.5247 9.55843L12.4663 4.5001C12.2247 4.25843 11.8247 4.25843 11.583 4.5001C11.3413 4.74176 11.3413 5.14176 11.583 5.38343L16.1997 10.0001L11.583 14.6168C11.3413 14.8584 11.3413 15.2584 11.583 15.5001C11.6997 15.6251 11.8663 15.6834 12.0247 15.6834Z" fill="#4F545E"/>
                <path d="M2.91665 10.625H16.9417C17.2833 10.625 17.5667 10.3417 17.5667 10C17.5667 9.65833 17.2833 9.375 16.9417 9.375H2.91665C2.57498 9.375 2.29165 9.65833 2.29165 10C2.29165 10.3417 2.57498 10.625 2.91665 10.625Z" fill="#4F545E"/>
              </svg>
            </Link>

            <div className="absolute left-1/2 -translate-x-1/2 text-text-primary text-right text-base font-bold leading-snug">
              {accommodation.title}
            </div>
          </div>
        </div>

        {/* Main Image Card */}
        <div className="px-4 mt-1">
          <div className="flex flex-col items-start gap-3 p-4 rounded-xl bg-white">
            <div className="relative w-full h-[143px]">
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
                  className="flex"
                  style={{ 
                    height: '100%',
                    touchAction: 'pan-y pinch-zoom',
                    marginLeft: 0,
                    display: 'flex',
                    direction: 'ltr'
                  }}
                >
                  {images.map((image, index) => (
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
                        src={image} 
                        alt={`${accommodation.title} - تصویر ${index + 1}`} 
                        className="w-full h-full object-cover cursor-pointer"
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
                        onClick={() => openFullScreen(index)}
                        onError={(e) => {
                          // Show placeholder instead of hiding
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial"%3Eتصویر موجود نیست%3C/text%3E%3C/svg%3E';
                          e.currentTarget.onerror = null; // Prevent infinite loop
                        }}
                        onLoad={() => {
                          // Track loaded images and reinit when all are loaded
                          setImagesLoaded(prev => {
                            const newCount = prev + 1;
                            if (newCount === images.length && emblaApi) {
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
              <div 
                className="absolute bottom-2 left-1/2 -translate-x-1/2 flex justify-center items-center gap-1 px-1 py-1 rounded-lg bg-white/50 backdrop-blur-sm"
                style={{ direction: 'ltr' }}
              >
                {images.map((_, index) => (
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
            </div>

            <div className="self-stretch text-black text-right text-base font-medium leading-snug">
              {accommodation.title}
            </div>
            
            <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-primary-100">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.245 17.0027C12.8475 17.0027 12.3375 16.8752 11.7 16.5002L9.45747 15.1727C9.22497 15.0377 8.77497 15.0377 8.54997 15.1727L6.29997 16.5002C4.97247 17.2877 4.19247 16.9727 3.83997 16.7177C3.49497 16.4627 2.95497 15.8102 3.30747 14.3102L3.83997 12.0077C3.89997 11.7677 3.77997 11.3552 3.59997 11.1752L1.73997 9.31524C0.809966 8.38523 0.884966 7.59023 1.01247 7.20023C1.13997 6.81024 1.54497 6.12023 2.83497 5.90273L5.22747 5.50523C5.45247 5.46773 5.77497 5.22773 5.87247 5.02523L7.19997 2.37773C7.79997 1.17023 8.58747 0.990234 8.99997 0.990234C9.41247 0.990234 10.2 1.17023 10.8 2.37773L12.12 5.01773C12.225 5.22023 12.5475 5.46023 12.7725 5.49773L15.165 5.89523C16.4625 6.11273 16.8675 6.80273 16.9875 7.19273C17.1075 7.58273 17.1825 8.37773 16.26 9.30773L14.4 11.1752C14.22 11.3552 14.1075 11.7602 14.16 12.0077L14.6925 14.3102C15.0375 15.8102 14.505 16.4627 14.16 16.7177C13.9725 16.8527 13.6725 17.0027 13.245 17.0027ZM8.99997 13.9427C9.36747 13.9427 9.73497 14.0327 10.0275 14.2052L12.27 15.5327C12.9225 15.9227 13.335 15.9227 13.4925 15.8102C13.65 15.6977 13.7625 15.3002 13.5975 14.5652L13.065 12.2627C12.9225 11.6402 13.155 10.8377 13.605 10.3802L15.465 8.52023C15.8325 8.15273 15.9975 7.79274 15.9225 7.54523C15.84 7.29773 15.495 7.09523 14.985 7.01273L12.5925 6.61523C12.015 6.51773 11.385 6.05273 11.1225 5.52773L9.80247 2.88773C9.56247 2.40773 9.26247 2.12273 8.99997 2.12273C8.73747 2.12273 8.43747 2.40773 8.20497 2.88773L6.87747 5.52773C6.61497 6.05273 5.98497 6.51773 5.40747 6.61523L3.02247 7.01273C2.51247 7.09523 2.16747 7.29773 2.08497 7.54523C2.00247 7.79274 2.17497 8.16023 2.54247 8.52023L4.40247 10.3802C4.85247 10.8302 5.08497 11.6402 4.94247 12.2627L4.40997 14.5652C4.23747 15.3077 4.35747 15.6977 4.51497 15.8102C4.67247 15.9227 5.07747 15.9152 5.73747 15.5327L7.97997 14.2052C8.26497 14.0327 8.63247 13.9427 8.99997 13.9427Z" fill="#1DBF98"/>
                </svg>
                <div className="text-primary text-left text-xs font-normal leading-5">
                  {accommodation.rating.toFixed(1)}
                </div>
              </div>
              
              <div className="w-px h-4 bg-[#D9D9D9]"></div>
              
              <div className="flex items-center gap-1.5">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.75 1.5C4.785 1.5 3.1875 3.0975 3.1875 5.0625C3.1875 6.99 4.695 8.55 6.66 8.6175C6.72 8.61 6.78 8.61 6.825 8.6175C6.84 8.6175 6.8475 8.6175 6.8625 8.6175C6.87 8.6175 6.87 8.6175 6.8775 8.6175C8.7975 8.55 10.305 6.99 10.3125 5.0625C10.3125 3.0975 8.715 1.5 6.75 1.5Z" fill="#4F545E"/>
                  <path d="M10.56 10.6127C8.46747 9.21766 5.05497 9.21766 2.94747 10.6127C1.99497 11.2502 1.46997 12.1127 1.46997 13.0352C1.46997 13.9577 1.99497 14.8127 2.93997 15.4427C3.98997 16.1477 5.36997 16.5002 6.74997 16.5002C8.12997 16.5002 9.50997 16.1477 10.56 15.4427C11.505 14.8052 12.03 13.9502 12.03 13.0202C12.0225 12.0977 11.505 11.2427 10.56 10.6127Z" fill="#4F545E"/>
                  <path d="M14.9928 5.50507C15.1128 6.96007 14.0778 8.23507 12.6453 8.40757C12.6378 8.40757 12.6378 8.40757 12.6303 8.40757H12.6078C12.5628 8.40757 12.5178 8.40757 12.4803 8.42257C11.7528 8.46007 11.0853 8.22757 10.5828 7.80007C11.3553 7.11007 11.7978 6.07507 11.7078 4.95007C11.6553 4.34257 11.4453 3.78757 11.1303 3.31507C11.4153 3.17257 11.7453 3.08257 12.0828 3.05257C13.5528 2.92507 14.8653 4.02007 14.9928 5.50507Z" fill="#4F545E"/>
                  <path d="M16.4927 12.4428C16.4327 13.1703 15.9677 13.8003 15.1877 14.2278C14.4377 14.6403 13.4927 14.8353 12.5552 14.8128C13.0952 14.3253 13.4102 13.7178 13.4702 13.0728C13.5452 12.1428 13.1027 11.2503 12.2177 10.5378C11.7152 10.1403 11.1302 9.8253 10.4927 9.5928C12.1502 9.1128 14.2352 9.4353 15.5177 10.4703C16.2077 11.0253 16.5602 11.7228 16.4927 12.4428Z" fill="#4F545E"/>
                </svg>
                <div className="text-text-primary text-left text-xs font-normal leading-5">
                  {accommodation.capacity} نفر - بدون نفر اضافه
                </div>
              </div>
              
            </div>

            <div className="flex items-center gap-0.5">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.00003 10.0726C10.2924 10.0726 11.34 9.02492 11.34 7.73258C11.34 6.44023 10.2924 5.39258 9.00003 5.39258C7.70769 5.39258 6.66003 6.44023 6.66003 7.73258C6.66003 9.02492 7.70769 10.0726 9.00003 10.0726Z" stroke="#4F545E" strokeWidth="1.5"/>
                <path d="M2.71478 6.3675C4.19228 -0.127498 13.8148 -0.119998 15.2848 6.375C16.1473 10.185 13.7773 13.41 11.6998 15.405C10.1923 16.86 7.80728 16.86 6.29228 15.405C4.22228 13.41 1.85228 10.1775 2.71478 6.3675Z" stroke="#4F545E" strokeWidth="1.5"/>
              </svg>
              <div className="text-text-primary text-left text-xs font-normal leading-5">
                {accommodation.province} ، {accommodation.city}، {accommodation.address}
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="px-4 mt-3">
          <div className="flex flex-col items-start gap-2.5 p-4 px-3 rounded-xl bg-white">
            <div className="flex flex-col justify-center items-start gap-4 self-stretch">
              <div className="self-stretch text-black text-right text-base font-medium leading-snug">
                مشخصات اقامتگاه
              </div>
              <div className="flex flex-col items-start gap-4 self-stretch">
                <div className="flex flex-col items-center gap-2 self-stretch">
                  <div className="flex items-center justify-between w-full">
                    <div className="text-text-tertiary text-left text-sm font-normal leading-6">
                      ظرفیت
                    </div>
                    <div className="text-text-secondary text-sm font-medium leading-6 text-right">
                      {accommodation.capacity} نفر - بدون نفر اضافه
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <div className="text-text-tertiary text-left text-sm font-normal leading-6">
                      سرویس‌های خواب
                    </div>
                    <div className="text-text-secondary text-sm font-medium leading-6 text-right">
                      {accommodation.beds}
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <div className="text-text-tertiary text-left text-sm font-normal leading-6">
                      متراژ
                    </div>
                    <div className="text-text-secondary text-sm font-medium leading-6 text-right">
                      {accommodation.area} متر
                    </div>
                  </div>
                  {accommodation.bathroom && (
                    <div className="flex items-center justify-between w-full">
                      <div className="text-text-tertiary text-left text-sm font-normal leading-6">
                        سرویس بهداشتی
                      </div>
                      <div className="text-text-secondary text-sm font-medium leading-6 text-right">
                        {accommodation.bathroom}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="px-4 mt-3">
          <div className="flex flex-col justify-center items-start gap-2.5 p-4 px-3 rounded-xl bg-white">
            <div className="flex flex-col justify-center items-start gap-4 self-stretch">
              <div className="self-stretch text-black text-right text-base font-medium leading-snug">
                امکانات اقامتگاه
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center items-center">
              {amenities.map((amenity, index) => (
                  <div key={index} className="flex justify-center items-center gap-2">
                    {index > 0 && index % 2 === 0 && (
                      <div className="w-px h-4 bg-[#D9D9D9]"></div>
                    )}
                    <div className="flex justify-center items-center gap-2">
                      {amenity.icon ? (
                        <img 
                          src={amenity.icon} 
                          alt={amenity.label}
                          className="w-[18px] h-[18px] object-contain"
                          onError={(e) => {
                            // Fallback to default icon if image fails to load
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        // Fallback icon if no icon uploaded
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3.85365 13.5378L2.68942 13.1497C1.97722 12.9123 1.49683 12.2458 1.49683 11.4951V11.2516C1.49683 10.4228 2.16868 9.75098 2.99745 9.75098H4.49808" stroke="#91969F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path fillRule="evenodd" clipRule="evenodd" d="M10.5006 10.5013V12.7522C10.5006 14.4098 9.15691 15.7535 7.49937 15.7535H6.74905C5.09151 15.7535 3.7478 14.4098 3.7478 12.7522V10.5013C3.7478 10.0869 4.08373 9.75098 4.49812 9.75098H9.7503C10.1647 9.75098 10.5006 10.0869 10.5006 10.5013Z" stroke="#91969F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5.99878 7.49926V4.10195C5.99878 3.86898 6.05302 3.63922 6.15721 3.43085L6.33433 3.07659C6.58852 2.56821 7.10813 2.24707 7.67653 2.24707H14.8254C15.3938 2.24707 15.9134 2.56821 16.1676 3.07659L16.3447 3.43085C16.4489 3.63922 16.5032 3.86898 16.5032 4.10195V12.3972C16.5032 12.6302 16.4489 12.8599 16.3447 13.0683L16.1676 13.4225C15.9134 13.9309 15.3938 14.2521 14.8254 14.2521H12.7516" stroke="#91969F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5.99878 4.4982H16.5032" stroke="#91969F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16.5031 12.0016H12.7516" stroke="#91969F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <div className="text-text-tertiary text-left text-sm font-normal leading-6">
                        {amenity.label}
                      </div>
                    </div>
                    {index % 2 === 0 && index < amenities.length - 1 && (
                      <div className="w-px h-4 bg-[#D9D9D9]"></div>
                    )}
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="px-4 mt-3">
          <div className="flex justify-start items-center gap-2.5 p-4 px-3 rounded-xl bg-white">
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="flex flex-col items-start gap-4 self-stretch">
                <div className="flex flex-col justify-center items-start gap-4 self-stretch">
                  <div className="self-stretch text-black text-right text-base font-medium leading-snug">
                    درباره اقامتگاه
                  </div>
                </div>
                <div className="flex flex-col items-start gap-4 self-stretch">
                  <div className="flex flex-col justify-center items-start gap-2 self-stretch">
                    <div className="self-stretch text-text-secondary text-justify text-sm font-normal leading-6 whitespace-pre-line">
                      {accommodation.description}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none">
          <div className="w-full min-w-[320px] max-w-[550px] px-4 pointer-events-auto">
            <div className="mt-3">
              <div className="bg-white h-[75px] flex items-center justify-center shadow-lg rounded-xl">
                <div className="w-full px-4 flex items-center justify-between h-[42px]">
                  <div className="flex flex-col items-start">
                    <div className="text-black text-right text-xs font-normal leading-5">
                      هر شب
                    </div>
                    <div className="text-black text-left text-base font-medium leading-snug">
                      {formattedPrice}
                    </div>
                  </div>

                  <button 
                    onClick={handleBookNow}
                    className="flex items-center justify-center px-0 py-2.5 w-[122px] h-10"
                    style={{
                      borderRadius: '8px',
                      background: '#1DBF98',
                      cursor: 'pointer',
                    }}
                  >
                    <div 
                      className="text-center"
                      style={{
                        color: '#FFFFFF',
                        textAlign: 'center',
                        fontFamily: 'IRANYekanXFaNum',
                        fontSize: '14px',
                        fontWeight: 700,
                        lineHeight: '20px',
                      }}
                    >
                      رزرو
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Image Viewer Modal */}
      {isFullScreen && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={closeFullScreen}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)', direction: 'ltr' }}
        >
          {/* Close Button */}
          <button
            onClick={closeFullScreen}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
            aria-label="بستن"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm">
            {fullScreenSelectedIndex + 1} / {images.length}
          </div>

          {/* Carousel Container */}
          <div 
            className="w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            style={{ direction: 'ltr' }}
          >
            <div 
              className="w-full h-full max-w-7xl mx-auto"
              ref={fullScreenEmblaRef}
              style={{ 
                overflow: 'hidden', 
                direction: 'ltr', 
                height: '100vh',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div className="flex h-full w-full" style={{ willChange: 'transform', direction: 'ltr' }}>
                {images.map((image, index) => (
                  <div 
                    key={index} 
                    className="flex-[0_0_100%]"
                    style={{ 
                      flexShrink: 0, 
                      flexGrow: 0,
                      width: '100%',
                      minWidth: '100%',
                      height: '100vh',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '40px'
                    }}
                  >
                    <img 
                      src={image} 
                      alt={`${accommodation.title} - تصویر ${index + 1}`} 
                      loading="eager"
                      draggable={false}
                      style={{ 
                        maxWidth: 'calc(100% - 80px)', 
                        maxHeight: 'calc(100vh - 80px)',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        transform: 'none',
                        imageOrientation: 'from-image',
                        margin: '0 auto'
                      }}
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial"%3Eتصویر موجود نیست%3C/text%3E%3C/svg%3E';
                        e.currentTarget.onerror = null;
                      }}
                      onLoad={() => {
                        // Track loaded images and reinit when all are loaded
                        setFullScreenImagesLoaded(prev => {
                          const newCount = prev + 1;
                          if (newCount === images.length && fullScreenEmblaApi) {
                            setTimeout(() => {
                              fullScreenEmblaApi.reInit();
                              // Scroll to the start index after all images are loaded
                              if (fullScreenStartIndex >= 0) {
                                setTimeout(() => {
                                  fullScreenEmblaApi.scrollTo(fullScreenStartIndex);
                                }, 50);
                              }
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
          </div>

          {/* Navigation Dots */}
          {images.length > 1 && (
            <div 
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center items-center gap-2 px-3 py-2 rounded-full bg-white/20 backdrop-blur-sm"
              style={{ direction: 'ltr' }}
            >
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollFullScreenTo(index);
                  }}
                  className={`transition-all ${
                    index === fullScreenSelectedIndex
                      ? "w-2.5 h-2.5 rounded-full bg-white"
                      : "w-2 h-2 rounded-full bg-white/50"
                  }`}
                  aria-label={`رفتن به تصویر ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Previous/Next Buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fullScreenEmblaApi?.scrollPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
                aria-label="تصویر قبلی"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fullScreenEmblaApi?.scrollNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
                aria-label="تصویر بعدی"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {/* Calendar Full Page */}
      {accommodation && showCalendarDialog && (
        <PersianDateRangePicker
          checkInDate={checkInDate || undefined}
          checkOutDate={checkOutDate || undefined}
          onCheckInChange={setCheckInDate}
          onCheckOutChange={setCheckOutDate}
          pricePerNight={parseFloat(accommodation.price_per_night.replace(/,/g, ''))}
          accommodation={accommodation}
          unavailableDates={unavailableDates}
          minDate={new Date().toISOString().split('T')[0]}
          onClose={() => setShowCalendarDialog(false)}
          onConfirm={handleDateConfirm}
          onClear={() => {
            setCheckInDate(null);
            setCheckOutDate(null);
          }}
          onReservationComplete={() => {
            setShowCalendarDialog(false);
            navigate('/account/history');
          }}
        />
      )}

      {/* Reservation Bottom Sheet */}
      {accommodation && (
        <ReservationBottomSheet
          accommodation={accommodation}
          isOpen={showBookingSheet}
          onOpenChange={setShowBookingSheet}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          onCheckInChange={setCheckInDate}
          onCheckOutChange={setCheckOutDate}
          onEditDates={() => setShowCalendarDialog(true)}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import type { Reservation, ReservationStatus, Accommodation } from "@shared/api";
import { formatDateForDisplay, gregorianToPersian } from "@/lib/dateUtils";
import { ReservationInvoiceModal } from "@/components/ReservationInvoiceModal";

const statusLabels: Record<ReservationStatus, string> = {
  pending: 'در انتظار تایید',
  confirmed: 'تایید شده',
  cancelled: 'رد شده',
};

const statusColors: Record<ReservationStatus, string> = {
  pending: 'bg-[#24adc2]',
  confirmed: 'bg-[#18ab33]',
  cancelled: 'bg-[#ed2c3a]',
};

interface BookingCardProps {
  reservation: Reservation;
}

export default function BookingCard({ reservation }: BookingCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get accommodation data (could be accommodation_detail or accommodation depending on API)
  const accommodation: Accommodation | undefined = 
    reservation.accommodation_detail || 
    (typeof reservation.accommodation === 'object' ? reservation.accommodation : undefined);

  // Get accommodation image
  const imageUrl = accommodation?.main_image || 
                   accommodation?.images?.[0] || 
                   '/placeholder.svg';

  // Get location
  const location = accommodation 
    ? `${accommodation.province} ، ${accommodation.city}`
    : 'موقعیت نامشخص';

  // Format date range
  const checkInPersian = gregorianToPersian(reservation.check_in_date);
  const checkOutPersian = gregorianToPersian(reservation.check_out_date);
  
  const formatDateRange = () => {
    if (!checkInPersian || !checkOutPersian) {
      return formatDateForDisplay(reservation.check_in_date) + ' - ' + formatDateForDisplay(reservation.check_out_date);
    }
    
    const monthNames = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    
    const startDate = `${checkInPersian.day} ${monthNames[checkInPersian.month - 1]}`;
    const endDate = `${checkOutPersian.day} ${monthNames[checkOutPersian.month - 1]}`;
    
    // If same month, show: "29 اردیبهشت - 29 اردیبهشت"
    if (checkInPersian.month === checkOutPersian.month) {
      return `${checkInPersian.day} ${monthNames[checkInPersian.month - 1]} - ${checkOutPersian.day} ${monthNames[checkOutPersian.month - 1]}`;
    }
    
    return `${startDate} - ${endDate}`;
  };

  const title = reservation.accommodation_title || 
                reservation.accommodation_detail?.title || 
                `اقامتگاه #${reservation.accommodation}`;

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  return (
    <div 
      className="flex flex-col items-stretch gap-2 p-4 rounded-xl bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <div className="flex gap-2.5 items-center">
        {/* Image with Status Badge */}
        <div className="relative rounded-lg w-[120px] h-[120px] flex-shrink-0">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          <div className={`absolute top-0 right-0 ${statusColors[reservation.status]} px-2.5 py-1.5 rounded-xl`}>
            <span className="text-xs font-medium text-white whitespace-nowrap">
              {statusLabels[reservation.status]}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Title */}
          <h3 className="font-bold text-base leading-6 text-right text-text-primary overflow-hidden text-ellipsis whitespace-nowrap mb-2">
            {title}
          </h3>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 mb-2 justify-start">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path d="M9 4.5V9L11.25 11.25" stroke="#242933" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#242933" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-normal text-text-primary">
              {formatDateRange()}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 justify-start">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path d="M9.00003 10.0726C10.2924 10.0726 11.34 9.02492 11.34 7.73258C11.34 6.44023 10.2924 5.39258 9.00003 5.39258C7.70769 5.39258 6.66003 6.44023 6.66003 7.73258C6.66003 9.02492 7.70769 10.0726 9.00003 10.0726Z" stroke="#4F545E" strokeWidth="1.5"/>
              <path d="M2.71478 6.3675C4.19228 -0.127498 13.8148 -0.119998 15.2848 6.375C16.1473 10.185 13.7773 13.41 11.6998 15.405C10.1923 16.86 7.80728 16.86 6.29228 15.405C4.22228 13.41 1.85228 10.1775 2.71478 6.3675Z" stroke="#4F545E" strokeWidth="1.5"/>
            </svg>
            <span className="text-sm font-normal text-text-primary">
              {location}
            </span>
          </div>
        </div>

        {/* Navigation Arrow Button */}
        <div className="bg-bg-secondary p-3 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.25 4.5L6.75 9L11.25 13.5" stroke="#1DBF98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <ReservationInvoiceModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        reservation={reservation}
      />
    </div>
  );
}


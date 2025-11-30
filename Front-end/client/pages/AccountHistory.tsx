import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getReservations } from "@/lib/reservations";
import { formatDateForDisplay, gregorianToPersian } from "@/lib/dateUtils";
import { UserMenu } from "@/components/UserMenu";
import BookingCard from "@/components/BookingCard";
import type { Reservation, ReservationStatus } from "@shared/api";

// Status labels matching the Figma design
const statusLabels: Record<ReservationStatus | 'all', string> = {
  all: 'همه',
  pending: 'در انتظار تایید',
  confirmed: 'نهایی شده',
  cancelled: 'لغو شده',
};

export default function AccountHistory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"trips" | "accommodations">("trips");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');

  const { data: reservations, isLoading, error } = useQuery({
    queryKey: ['reservations'],
    queryFn: getReservations,
  });

  const filteredReservations = reservations?.filter((res) => {
    if (statusFilter === 'all') return true;
    return res.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-bg-secondary">
      <div className="w-full min-w-[320px] max-w-[550px] mx-auto bg-bg-secondary">
        {/* Status Bar */}
        

        {/* Top App Bar */}
        <div className="flex items-center w-full h-14 px-4 py-2 pb-3">
          <div className="flex items-center justify-between w-full h-9">
            <button 
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2.5 p-2 rounded-xl bg-neutral-200"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-180">
                <path d="M12.0247 15.6834C12.183 15.6834 12.3413 15.6251 12.4663 15.5001L17.5247 10.4418C17.7663 10.2001 17.7663 9.8001 17.5247 9.55843L12.4663 4.5001C12.2247 4.25843 11.8247 4.25843 11.583 4.5001C11.3413 4.74176 11.3413 5.14176 11.583 5.38343L16.1997 10.0001L11.583 14.6168C11.3413 14.8584 11.3413 15.2584 11.583 15.5001C11.6997 15.6251 11.8663 15.6834 12.0247 15.6834Z" fill="#4F545E"/>
                <path d="M2.91665 10.625H16.9417C17.2833 10.625 17.5667 10.3417 17.5667 10C17.5667 9.65833 17.2833 9.375 16.9417 9.375H2.91665C2.57498 9.375 2.29165 9.65833 2.29165 10C2.29165 10.3417 2.57498 10.625 2.91665 10.625Z" fill="#4F545E"/>
              </svg>
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 text-text-primary text-left text-base font-bold leading-snug">
              گردشگری
            </div>

            <UserMenu />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center items-center gap-px rounded-xl bg-white mx-4 mt-3 h-12">
          <button
            onClick={() => navigate("/")}
            className={`flex-1 flex flex-col justify-end items-center gap-3 py-3 px-11 ${
              false ? "pb-px" : ""
            }`}
          >
            <div 
              className="text-left tab-text-responsive"
              style={{
                color: 'var(--Text-Tertiary, #91969F)',
                fontFamily: 'IRANYekanXFaNum',
                fontStyle: 'normal',
                fontWeight: 500
              }}
            >
              اقامتگاه‌ها
            </div>
          </button>

          <div className="w-px h-5 bg-stroke-tertiary"></div>

          <button
            onClick={() => setActiveTab("trips")}
            className={`flex-1 flex flex-col justify-end items-center gap-3 py-3 px-10 ${
              activeTab === "trips" ? "pb-px" : ""
            }`}
          >
            <div 
              className="text-left tab-text-responsive"
              style={{
                color: activeTab === "trips" ? 'var(--Text-Secondary, #4F545E)' : 'var(--Text-Tertiary, #91969F)',
                fontFamily: 'IRANYekanXFaNum',
                fontStyle: 'normal',
                fontWeight: activeTab === "trips" ? 700 : 500
              }}
            >
              سفرهای من
            </div>
            {activeTab === "trips" && (
              <div className="w-6 h-0.5 bg-text-secondary rounded-full"></div>
            )}
          </button>
        </div>

        {/* Filter Chips */}
        {activeTab === "trips" && (
          <div className="px-4 pt-4 flex gap-2 justify-start flex-wrap">
            {(['all', 'pending', 'confirmed', 'cancelled'] as Array<ReservationStatus | 'all'>).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`h-[42px] px-[10px] py-2 rounded-lg border text-sm font-normal whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-[rgba(29,191,152,0.1)] border-primary-500 text-text-secondary'
                    : 'border-stroke-tertiary text-text-tertiary bg-white'
                }`}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="px-4 mt-3 pb-4">
          {activeTab === "trips" && (
            <div className="flex flex-col gap-2">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-text-tertiary text-sm">در حال بارگذاری...</div>
                </div>
              )}
              {error && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-red-500 text-sm">خطا در بارگذاری اطلاعات</div>
                </div>
              )}
              {!isLoading && !error && (!filteredReservations || filteredReservations.length === 0) && (
                <div className="flex flex-col items-center justify-center bg-white rounded-xl h-[454px]">
                  <div className="flex flex-col items-center gap-5 w-[167px]">
                    <svg width="118" height="95" viewBox="0 0 118 95" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M96.7906 0C97.2836 0 97.7593 0.182101 98.1262 0.511345L107.612 9.02167C108.977 10.2468 108.11 12.5103 106.276 12.5103H51.861C51.3108 12.5103 50.785 12.2837 50.4072 11.8838L42.3669 3.3735C41.1619 2.09812 42.0661 0 43.8207 0H96.7906Z" fill="#91969F"/>
                      <path d="M93.5857 0H43.1797C40.9705 0 39.1797 1.79086 39.1797 4V54.406C39.1797 56.6152 40.9705 58.406 43.1797 58.406H93.5857C95.7948 58.406 97.5857 56.6152 97.5857 54.406V4C97.5857 1.79086 95.7948 0 93.5857 0Z" fill="#B1B7C2"/>
                      <path d="M74.8202 0H24.4142C22.205 0 20.4142 1.79086 20.4142 4V54.406C20.4142 56.6152 22.205 58.406 24.4142 58.406H74.8202C77.0293 58.406 78.8202 56.6152 78.8202 54.406V4C78.8202 1.79086 77.0293 0 74.8202 0Z" fill="#D6D9DF"/>
                      <path d="M20.8265 0C20.58 0 20.3422 0.0910504 20.1587 0.255673L8.44418 10.766C7.76145 11.3785 8.19475 12.5103 9.11199 12.5103H66.5699C66.845 12.5103 67.1079 12.397 67.2968 12.1971L77.2267 1.68675C77.8291 1.04906 77.3771 0 76.4998 0H20.8265Z" fill="#B1B7C2"/>
                      <path d="M50.4346 19.9532C55.8345 19.9532 59.5 23.1729 59.5 28.4631C59.5 34.2027 55.4701 36.7298 50.0775 36.7298L49.9172 39.9496H45.9311L45.727 33.5543H47.0533C51.6079 33.5543 55.1131 32.7438 55.1131 28.4631C55.1131 25.6117 53.3787 23.8581 50.4783 23.8581C47.578 23.8581 45.8072 25.4864 45.8072 28.3378H41.5004C41.4567 23.4087 44.9619 19.9458 50.4419 19.9458L50.4346 19.9532ZM47.8549 48.9458C46.2007 48.9458 44.9109 47.6417 44.9109 45.9765C44.9109 44.3114 46.2007 42.9999 47.8549 42.9999C49.5091 42.9999 50.7553 44.304 50.7553 45.9765C50.7553 47.6491 49.4654 48.9458 47.8549 48.9458Z" fill="#1DBF98"/>
                    </svg>
                    <div className="text-text-secondary text-left text-sm font-medium leading-6">
                      رزروی موجود نیست
                    </div>
                  </div>
                </div>
              )}
              {!isLoading && !error && filteredReservations && filteredReservations.length > 0 && (
                filteredReservations.map((reservation) => (
                  <BookingCard key={reservation.id} reservation={reservation} />
                ))
              )}
            </div>
          )}

          {activeTab === "accommodations" && (
            <div className="flex flex-col items-center justify-center bg-white rounded-xl h-[454px]">
              <div className="flex flex-col items-center gap-5 w-[167px]">
                <svg width="118" height="95" viewBox="0 0 118 95" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M96.7906 0C97.2836 0 97.7593 0.182101 98.1262 0.511345L107.612 9.02167C108.977 10.2468 108.11 12.5103 106.276 12.5103H51.861C51.3108 12.5103 50.785 12.2837 50.4072 11.8838L42.3669 3.3735C41.1619 2.09812 42.0661 0 43.8207 0H96.7906Z" fill="#91969F"/>
                  <path d="M93.5857 0H43.1797C40.9705 0 39.1797 1.79086 39.1797 4V54.406C39.1797 56.6152 40.9705 58.406 43.1797 58.406H93.5857C95.7948 58.406 97.5857 56.6152 97.5857 54.406V4C97.5857 1.79086 95.7948 0 93.5857 0Z" fill="#B1B7C2"/>
                  <path d="M74.8202 0H24.4142C22.205 0 20.4142 1.79086 20.4142 4V54.406C20.4142 56.6152 22.205 58.406 24.4142 58.406H74.8202C77.0293 58.406 78.8202 56.6152 78.8202 54.406V4C78.8202 1.79086 77.0293 0 74.8202 0Z" fill="#D6D9DF"/>
                  <path d="M20.8265 0C20.58 0 20.3422 0.0910504 20.1587 0.255673L8.44418 10.766C7.76145 11.3785 8.19475 12.5103 9.11199 12.5103H66.5699C66.845 12.5103 67.1079 12.397 67.2968 12.1971L77.2267 1.68675C77.8291 1.04906 77.3771 0 76.4998 0H20.8265Z" fill="#B1B7C2"/>
                  <path d="M50.4346 19.9532C55.8345 19.9532 59.5 23.1729 59.5 28.4631C59.5 34.2027 55.4701 36.7298 50.0775 36.7298L49.9172 39.9496H45.9311L45.727 33.5543H47.0533C51.6079 33.5543 55.1131 32.7438 55.1131 28.4631C55.1131 25.6117 53.3787 23.8581 50.4783 23.8581C47.578 23.8581 45.8072 25.4864 45.8072 28.3378H41.5004C41.4567 23.4087 44.9619 19.9458 50.4419 19.9458L50.4346 19.9532ZM47.8549 48.9458C46.2007 48.9458 44.9109 47.6417 44.9109 45.9765C44.9109 44.3114 46.2007 42.9999 47.8549 42.9999C49.5091 42.9999 50.7553 44.304 50.7553 45.9765C50.7553 47.6491 49.4654 48.9458 47.8549 48.9458Z" fill="#1DBF98"/>
                </svg>
                <div className="text-text-secondary text-left text-sm font-medium leading-6">
                  این بخش به زودی اضافه خواهد شد
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Reservation, Accommodation } from "@shared/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDateForDisplay, gregorianToPersian } from "@/lib/dateUtils";
import jsPDF from "jspdf";
// @ts-ignore - types are declared globally in vite-env.d.ts
import html2canvas from "html2canvas";

interface ReservationInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation;
}

export function ReservationInvoiceModal({
  open,
  onOpenChange,
  reservation,
}: ReservationInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  // Get accommodation data - prefer accommodation_detail which has full info including address
  const accommodationDetail = reservation.accommodation_detail;
  const accommodation: Accommodation | undefined =
    accommodationDetail ||
    (typeof reservation.accommodation === "object"
      ? reservation.accommodation
      : undefined);

  const accommodationTitle =
    reservation.accommodation_title ||
    accommodation?.title ||
    `اقامتگاه #${reservation.accommodation}`;

  // Format total price with Persian numbers
  const formattedTotalPrice = reservation.total_price
    ? `${parseInt(reservation.total_price).toLocaleString("fa-IR")} تومان`
    : "۰ تومان";

  // Get user name
  const userName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.username || "نامشخص";

  // Get phone number
  const phoneNumber = reservation.contact_phone || "نامشخص";

  // Format number of guests
  const guestsText = `${reservation.number_of_guests} نفر`;

  // Nights (fallback to 1 if not provided)
  const nights =
    reservation.nights ??
    Math.max(
      1,
      Math.round(
        (new Date(reservation.check_out_date).getTime() -
          new Date(reservation.check_in_date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

  // Persian dates
  const checkInPersian = gregorianToPersian(reservation.check_in_date);
  const checkOutPersian = gregorianToPersian(reservation.check_out_date);

  // Calculate price breakdown from backend data
  const totalPriceNum = parseInt(reservation.total_price || "0");
  const accommodationPricePerNight = accommodation?.price_per_night
    ? parseInt(accommodation.price_per_night)
    : 0;

  // Calculate platform fee: total - (nights * price_per_night)
  const accommodationTotal = nights * accommodationPricePerNight;
  const platformFee =
    totalPriceNum > accommodationTotal
      ? totalPriceNum - accommodationTotal
      : 0;

  // Use accommodation price per night from backend, or calculate average
  const pricePerNight =
    accommodationPricePerNight > 0
      ? accommodationPricePerNight
      : nights > 0
        ? Math.round(totalPriceNum / nights)
        : 0;

  // Format prices with Persian numbers
  const formatPrice = (price: number) =>
    `${price.toLocaleString("fa-IR")} تومان`;

  // Get location and address from backend
  const location =
    accommodation?.province && accommodation?.city
      ? `${accommodation.province}، ${accommodation.city}`
      : "";
  
  // Get address from accommodation_detail (which has the address field)
  const address = accommodationDetail && "address" in accommodationDetail
    ? (accommodationDetail as any).address
    : null;

  // Generate PDF
  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;

    const element = pdfRef.current;

    // Use html2canvas to capture the simplified PDF layout
    const canvas = await html2canvas(element, {
      scale: 2, // better quality
      useCORS: true,
      backgroundColor: "#F5F6F8",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // On mobile, opening the PDF in a new tab gives a much better UX
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      const blobUrl = pdf.output("bloburl");
      window.open(blobUrl, "_blank");
    } else {
      pdf.save(`فاکتور-${reservation.id}.pdf`);
    }
  };

  return (
    <>
      {/* Hidden PDF layout - matches the detailed invoice design */}
      <div
        ref={pdfRef}
        className="fixed -left-[9999px] top-0 w-[900px] bg-[#F5F6F8] p-8"
        dir="rtl"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl bg-white p-8 shadow-sm">
          {/* Logo placeholder at top */}
          <div className="mb-4 text-center">
            <div className="inline-block rounded-lg bg-primary-500/10 px-6 py-2 text-xl font-bold text-primary-500">
              اینجاست
            </div>
          </div>

          {/* Reservation code header */}
          <div className="mb-4 flex items-center justify-between border-b border-bg-secondary pb-3">
            <div className="text-sm text-right text-text-secondary">
              کد رزرو آنلاین:{" "}
              <span className="font-semibold text-text-primary">
                {reservation.id}
              </span>
            </div>
          </div>

          {/* Main content: Accommodation, Guest */}
          <div className="grid grid-cols-2 gap-4">
            {/* Right Column: Accommodation Details */}
            <div className="flex flex-col gap-3 rounded-2xl border border-bg-secondary bg-bg-secondary/30 p-4">
              <div className="mb-2 text-xs font-semibold text-text-secondary text-right">
                نام اقامتگاه:
              </div>
              <div className="text-sm font-medium text-text-primary text-right">
                {accommodationTitle}
              </div>
              {location && (
                <div className="mt-2 text-xs font-medium text-text-primary text-right">
                  {location}
                </div>
              )}
              {address && (
                <div className="mt-1 text-xs text-text-secondary text-right">
                  {address}
                </div>
              )}
              <div className="mt-3 space-y-2 border-t border-bg-secondary pt-3">
                <div className="flex justify-between text-xs text-right">
                  <span className="text-text-secondary text-right">تاریخ ورود:</span>
                  <span className="font-medium text-text-primary text-right">
                    {checkInPersian
                      ? `${checkInPersian.year}/${checkInPersian.month}/${checkInPersian.day}`
                      : formatDateForDisplay(reservation.check_in_date)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-right">
                  <span className="text-text-secondary text-right">تاریخ خروج:</span>
                  <span className="font-medium text-text-primary text-right">
                    {checkOutPersian
                      ? `${checkOutPersian.year}/${checkOutPersian.month}/${checkOutPersian.day}`
                      : formatDateForDisplay(reservation.check_out_date)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-right">
                  <span className="text-text-secondary text-right">شب اقامت:</span>
                  <span className="font-medium text-text-primary text-right">{nights}</span>
                </div>
              </div>
            </div>

            {/* Middle Column: Host Information - Hidden if no data available */}
            {/* Host information not available in current backend schema */}

            {/* Left Column: Guest Information */}
            <div className="flex flex-col gap-3 rounded-2xl border border-bg-secondary bg-bg-secondary/30 p-4">
              <div className="mb-2 text-xs font-semibold text-text-secondary text-right">
                مهمان:
              </div>
              <div className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-text-primary text-right">
                {userName}
              </div>
              <div className="rounded-lg bg-white px-3 py-2 text-xs text-text-secondary text-right">
                +{phoneNumber}
              </div>
              <div className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-right">
                <span className="text-text-secondary text-right">
                  {reservation.number_of_guests} نفر مهمان
                </span>
                <span className="text-text-secondary text-right">
                  {" "}
                  (۰ نفر اضافه)
                </span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="rounded-3xl bg-bg-secondary/60 p-6">
            <div className="mb-4 text-right text-lg font-semibold text-text-primary">
              جزئیات پرداخت
            </div>
            <div className="flex flex-col gap-3">
              {/* Individual nights - using actual price from backend */}
              {Array.from({ length: nights }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-row-reverse items-center justify-between rounded-2xl bg-white px-4 py-3"
                >
                  <span className="text-sm text-text-secondary text-right">
                    ۱ شب × {formatPrice(pricePerNight)}
                  </span>
                  <span className="text-sm font-medium text-text-primary">
                    {formatPrice(pricePerNight)}
                  </span>
                </div>
              ))}
              {/* Platform fee */}
              {platformFee > 0 && (
                <div className="flex flex-row-reverse items-center justify-between rounded-2xl bg-white px-4 py-3">
                  <span className="text-sm text-text-secondary text-right">
                    کارمزد خدمات پلتفرم
                  </span>
                  <span className="text-sm font-medium text-text-primary">
                    {formatPrice(platformFee)}
                  </span>
                </div>
              )}
              {/* Final amount */}
              <div className="flex flex-row-reverse items-center justify-between rounded-2xl bg-white px-4 py-3 border-2 border-primary-500/20">
                <span className="text-sm font-semibold text-text-secondary text-right text-primary-500">
                  مبلغ نهایی
                </span>
                <span className="text-base font-bold text-primary-500 text-right">
                  {formattedTotalPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Refund Policy - using generic rules based on check-in date */}
          {checkInPersian && (
            <div className="rounded-3xl bg-bg-secondary/40 p-6">
              <div className="mb-4 text-right text-base font-semibold text-text-primary">
                قوانین استرداد
              </div>
              <div className="space-y-3 text-right text-xs leading-relaxed text-text-secondary">
                <p className="text-right">
                  بیش از ۱۰ روز مانده به تاریخ ورود ({checkInPersian.year}/{checkInPersian.month}/{checkInPersian.day})، وجه به صورت کامل به میهمان عودت می‌شود.
                </p>
                <p className="text-right">
                  کمتر از ۱۰ روز مانده به تاریخ ورود تا روز ورود، ۱۰۰ درصد مبلغ شب اول و ۵۰ درصد مبلغ سایر شب‌ها کسر می‌شود.
                </p>
                <p className="text-right">
                  از روز ورود به بعد، کل مبلغ رزرو کسر می‌شود.
                </p>
                <p className="mt-2 text-right">
                  مسافران موظف‌اند در ساعت تحویل و تخلیه اعلام‌شده توسط اقامتگاه، اتاق را تحویل بگیرند و تحویل دهند.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex items-start justify-between border-t border-bg-secondary pt-6">
            <div className="flex flex-col gap-2 text-xs text-text-secondary">
              {/* Contact information - should come from backend settings/config */}
              <div className="font-semibold">تماس با پشتیبانی</div>
              {/* TODO: Fetch from backend API endpoint for site settings */}
            </div>
            <div className="text-right">
              <div className="mb-2 inline-block rounded-lg bg-primary-500/10 px-4 py-2 text-sm font-bold text-primary-500">
                اینجاست
              </div>
              <div className="mt-2 text-[10px] text-text-secondary">
                سامانه رزرو اقامتگاه
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl bg-[#F5F6F8]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="mb-4 text-right text-2xl font-bold text-text-primary">
              فاکتور رزرو
            </DialogTitle>
          </DialogHeader>

          <div
            ref={invoiceRef}
            className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl bg-white p-6 shadow-sm max-h-[90vh] overflow-y-auto"
          >
          {/* Top row: code + accommodation + dates */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            {/* Left side: accommodation & dates (mirrored) */}
            <div className="flex flex-col gap-3 md:items-start">
              <div className="flex flex-wrap items-center gap-2 md:justify-start">
                <span className="text-xs text-text-secondary">کد رزرو آنلاین:</span>
                <div className="rounded-full bg-bg-secondary px-3 py-1 text-sm font-medium text-text-primary">
                  {reservation.id}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-start">
                <div className="min-w-[140px] rounded-2xl bg-bg-secondary px-3 py-2 text-right text-xs">
                  <div className="mb-1 text-[11px] text-text-secondary">
                    نام اقامتگاه:
                  </div>
                  <div className="text-sm font-medium text-text-primary">
                    {accommodationTitle}
                  </div>
                </div>

                <div className="min-w-[140px] rounded-2xl bg-bg-secondary px-3 py-2 text-right text-xs">
                  <div className="mb-1 text-[11px] text-text-secondary">
                    تاریخ ورود:
                  </div>
                  <div className="text-sm font-medium text-text-primary">
                    {checkInPersian
                      ? `${checkInPersian.year}/${checkInPersian.month}/${checkInPersian.day}`
                      : formatDateForDisplay(reservation.check_in_date)}
                  </div>
                </div>

                <div className="min-w-[140px] rounded-2xl bg-bg-secondary px-3 py-2 text-right text-xs">
                  <div className="mb-1 text-[11px] text-text-secondary">
                    تاریخ خروج:
                  </div>
                  <div className="text-sm font-medium text-text-primary">
                    {checkOutPersian
                      ? `${checkOutPersian.year}/${checkOutPersian.month}/${checkOutPersian.day}`
                      : formatDateForDisplay(reservation.check_out_date)}
                  </div>
                </div>

                <div className="min-w-[120px] rounded-2xl bg-bg-secondary px-3 py-2 text-right text-xs">
                  <div className="mb-1 text-[11px] text-text-secondary">
                    شب‌ اقامت:
                  </div>
                  <div className="text-sm font-medium text-text-primary">
                    {nights}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: guest info (mirrored) */}
            <div className="flex flex-col gap-2 md:items-end">
              <div className="text-right text-xs text-text-secondary">میهمان:</div>
          <div className="flex flex-col gap-2">
                <div className="inline-flex max-w-xs flex-wrap items-center justify-between gap-2 rounded-2xl bg-bg-secondary px-3 py-2 text-right text-xs">
                  <span className="text-sm font-medium text-text-primary">
                    {userName}
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    {phoneNumber}
                  </span>
                </div>
                <div className="inline-flex max-w-xs flex-wrap items-center justify-between gap-2 rounded-2xl bg-bg-secondary px-3 py-2 text-right text-xs">
                  <span className="text-[11px] text-text-secondary">
                    تعداد میهمانان
                  </span>
                  <span className="text-sm font-medium text-text-primary">
                    {guestsText}
                </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment details block */}
          <div className="rounded-3xl bg-bg-secondary/60 p-5">
            <div className="mb-4 text-right text-base font-semibold text-text-primary">
              جزئیات پرداخت
            </div>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2">
                <span className="text-text-secondary">
                  {nights} شب اقامت
                </span>
                <span className="font-medium text-text-primary">
                  {formattedTotalPrice}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2">
                <span className="text-text-secondary">مبلغ نهایی</span>
                <span className="font-bold text-primary-500">
                  {formattedTotalPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Rules section (static text similar to sample) */}
          <div className="mt-2 rounded-3xl bg-bg-secondary/40 p-5 text-xs leading-relaxed text-text-secondary text-right">
            <div className="mb-2 text-sm font-semibold text-text-primary text-right">
              قوانین استرداد
            </div>
            <p className="mb-1 text-right">
              بیش از ۱۰ روز مانده به تاریخ ورود، وجه به‌صورت کامل به میهمان عودت
              می‌شود.
            </p>
            <p className="mb-1 text-right">
              کمتر از ۱۰ روز مانده به تاریخ ورود تا روز ورود، ۱۰۰٪ مبلغ شب اول و
              ۵۰٪ مبلغ سایر شب‌ها کسر می‌شود.
            </p>
            <p className="mb-3 text-right">
              از روز ورود به بعد، کل مبلغ رزرو به‌عنوان جریمه کنسلی کسر می‌شود.
            </p>
            <p  className="mb-3 text-right">
              مسافران موظف‌اند در ساعت تحویل و تخلیه اعلام‌شده توسط اقامتگاه،
              اتاق را تحویل بگیرند و تحویل دهند.
            </p>
          </div>

          {/* Download PDF Button */}
          <div className="mt-4 flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            {/* Close hint for mobile */}
            <span className="text-center text-xs text-text-secondary sm:text-right">
              برای بستن، روی دکمه ضربدر بالا یا بیرون از فاکتور بزنید.
            </span>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.5 12.5V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V12.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.83331 8.33333L9.99998 12.5L14.1666 8.33333"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 12.5V2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>دانلود فاکتور (PDF)</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}


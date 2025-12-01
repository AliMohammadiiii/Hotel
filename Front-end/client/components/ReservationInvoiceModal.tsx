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
  const { user } = useAuth();

  // Get accommodation data
  const accommodation: Accommodation | undefined =
    reservation.accommodation_detail ||
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
  const guestsText = `${reservation.number_of_guests} نفر پایه`;

  // Generate PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Set font for Persian text (using default font for now)
    // Note: For proper Persian support, you may need to add a Persian font
    doc.setFontSize(20);
    doc.text("فاکتور", pageWidth - margin, yPos, { align: "right" });
    yPos += 15;

    // Add separator
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Accommodation section
    doc.setFontSize(14);
    doc.text("اقامتگاه", pageWidth - margin, yPos, { align: "right" });
    yPos += 8;
    doc.setFontSize(12);
    doc.text(accommodationTitle, pageWidth - margin, yPos, { align: "right" });
    yPos += 15;

    // Add separator
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Number of passengers
    doc.setFontSize(14);
    doc.text("تعداد مسافران", pageWidth - margin, yPos, { align: "right" });
    yPos += 8;
    doc.setFontSize(12);
    doc.text(guestsText, pageWidth - margin, yPos, { align: "right" });
    yPos += 15;

    // Add separator
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Passenger information
    doc.setFontSize(14);
    doc.text("اطلاعات مسافر", pageWidth - margin, yPos, { align: "right" });
    yPos += 8;
    doc.setFontSize(12);
    doc.text(
      `${userName} - ${phoneNumber}`,
      pageWidth - margin,
      yPos,
      { align: "right" }
    );
    yPos += 15;

    // Add separator
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Total cost
    doc.setFontSize(14);
    doc.text("مجموع هزینه", pageWidth - margin, yPos, { align: "right" });
    yPos += 8;
    doc.setFontSize(12);
    doc.text(formattedTotalPrice, pageWidth - margin, yPos, { align: "right" });

    // Save PDF
    doc.save(`فاکتور-${reservation.id}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-2xl font-bold text-text-primary mb-6">
            فاکتور
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Accommodation Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-stroke-tertiary"></div>
              <div className="flex items-center gap-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                    stroke="#4F545E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 22V12H15V22"
                    stroke="#4F545E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm font-medium text-text-secondary">
                  اقامتگاه
                </span>
              </div>
            </div>
            <p className="text-right text-base text-text-primary">
              {accommodationTitle}
            </p>
          </div>

          {/* Number of Passengers Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-stroke-tertiary"></div>
              <div className="flex items-center gap-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                    stroke="#4F545E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                    stroke="#4F545E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
                    stroke="#4F545E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                    stroke="#4F545E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm font-medium text-text-secondary">
                  تعداد مسافران
                </span>
              </div>
            </div>
            <p className="text-right text-base text-text-primary">
              {guestsText}
            </p>
          </div>

          {/* Passenger Information Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-stroke-tertiary"></div>
              <div className="flex items-center gap-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                    stroke="#4F545E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                    stroke="#4F545E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm font-medium text-text-secondary">
                  اطلاعات مسافر
                </span>
              </div>
            </div>
            <p className="text-right text-base text-text-primary">
              {userName} - {phoneNumber}
            </p>
          </div>

          {/* Total Cost Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-stroke-tertiary"></div>
              <div className="flex items-center gap-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                    stroke="#4F545E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 2V8H20"
                    stroke="#4F545E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 13H8"
                    stroke="#4F545E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 17H8"
                    stroke="#4F545E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 9H9H8"
                    stroke="#4F545E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm font-medium text-text-secondary">
                  مجموع هزینه
                </span>
              </div>
            </div>
            <p className="text-right text-base text-text-primary">
              {formattedTotalPrice}
            </p>
          </div>

          {/* Download PDF Button */}
          <div className="mt-4 pt-4">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors"
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
              <span className="text-sm font-medium">دانلود فاکتور (PDF)</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


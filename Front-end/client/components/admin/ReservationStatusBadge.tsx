import { Badge } from "@/components/ui/badge";
import type { ReservationStatus } from "@shared/api";

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
}

const statusLabels: Record<ReservationStatus, string> = {
  pending: "در انتظار",
  confirmed: "تایید شده",
  cancelled: "لغو شده",
};

const statusColors: Record<ReservationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function ReservationStatusBadge({ status }: ReservationStatusBadgeProps) {
  return (
    <Badge className={statusColors[status]}>
      {statusLabels[status]}
    </Badge>
  );
}


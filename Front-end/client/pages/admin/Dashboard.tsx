import { useQuery } from "@tanstack/react-query";
import {
  getAdminAccommodations,
  getAdminReservations,
} from "@/lib/admin/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calendar, DollarSign, Users } from "lucide-react";

export default function Dashboard() {
  const { data: accommodations, isLoading: isLoadingAccommodations } = useQuery({
    queryKey: ["admin-accommodations"],
    queryFn: () => getAdminAccommodations(),
  });

  const { data: reservations, isLoading: isLoadingReservations } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: () => getAdminReservations(),
  });

  if (isLoadingAccommodations || isLoadingReservations) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">در حال بارگذاری...</div>
      </div>
    );
  }

  const stats = {
    totalAccommodations: accommodations?.length || 0,
    totalReservations: reservations?.length || 0,
    pendingReservations:
      reservations?.filter((r) => r.status === "pending").length || 0,
    confirmedReservations:
      reservations?.filter((r) => r.status === "confirmed").length || 0,
    totalRevenue: reservations
      ?.filter((r) => r.status === "confirmed")
      .reduce((sum, r) => sum + parseInt(r.total_price || "0"), 0) || 0,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">داشبورد</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل اقامتگاه‌ها</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAccommodations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل رزروها</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReservations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">رزروهای در انتظار</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReservations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">درآمد کل</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRevenue.toLocaleString("fa-IR")} تومان
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


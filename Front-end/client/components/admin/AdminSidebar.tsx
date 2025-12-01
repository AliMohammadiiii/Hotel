import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  BedDouble,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  {
    title: "داشبورد",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "اقامتگاه‌ها",
    icon: Building2,
    href: "/admin/accommodations",
  },
  {
    title: "رزروها",
    icon: Calendar,
    href: "/admin/reservations",
  },
  {
    title: "وضعیت اتاق‌ها",
    icon: BedDouble,
    href: "/admin/room-availability",
  },
  {
    title: "امکانات",
    icon: Settings,
    href: "/admin/amenities",
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">پنل مدیریت</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
            (item.href !== "/admin" && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
          onClick={() => {
            logout();
            navigate("/admin/login");
          }}
        >
          <LogOut className="w-5 h-5 ml-3" />
          <span>خروج</span>
        </Button>
      </div>
    </div>
  );
}





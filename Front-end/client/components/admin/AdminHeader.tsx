import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { formatDateForDisplay } from "@/lib/dateUtils";

export function AdminHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const getToday = () => {
    const today = new Date();
    const persianWeekday = today.toLocaleDateString('fa-IR', {
      weekday: 'long',
    });
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const d = formatDateForDisplay(dateString);
    return `${persianWeekday} ${d}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement global search if needed
    console.log("Search:", searchQuery);
  };

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center px-6">
      <div className="flex-1 flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="جستجو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </form>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
          <Calendar className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700">{getToday()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {user?.first_name?.[0] || user?.username?.[0] || "A"}
          </div>
        </div>
      </div>
    </header>
  );
}


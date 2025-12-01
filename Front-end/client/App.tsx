import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import AccommodationDetail from "./pages/AccommodationDetail";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Signup from "./pages/Signup";
import InjastCallback from "./pages/InjastCallback";
import Reservations from "./pages/Reservations";
import AccountHistory from "./pages/AccountHistory";
import CreateReservation from "./pages/CreateReservation";
import EditReservation from "./pages/EditReservation";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminAccommodations from "./pages/admin/Accommodations";
import AccommodationForm from "./pages/admin/AccommodationForm";
import AccommodationDetailAdmin from "./pages/admin/AccommodationDetail";
import AdminReservations from "./pages/admin/Reservations";
import RoomAvailability from "./pages/admin/RoomAvailability";
import AdminAmenities from "./pages/admin/Amenities";
import AmenityForm from "./pages/admin/AmenityForm";

// Create a stable QueryClient instance outside the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Retry failed requests 2 times
      refetchOnWindowFocus: false, // Don't refetch on window focus in production
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/accommodation/:id" element={<AccommodationDetail />} />
            <Route path="/accommodations/:id" element={<AccommodationDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/injast/callback" element={<InjastCallback />} />
            <Route
              path="/reservations"
              element={
                <ProtectedRoute>
                  <Reservations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/history"
              element={
                <ProtectedRoute>
                  <AccountHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations/new"
              element={
                <ProtectedRoute>
                  <CreateReservation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations/:id/edit"
              element={
                <ProtectedRoute>
                  <EditReservation />
                </ProtectedRoute>
              }
            />
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="accommodations" element={<AdminAccommodations />} />
              <Route path="accommodations/new" element={<AccommodationForm />} />
              <Route path="accommodations/:id" element={<AccommodationDetailAdmin />} />
              <Route path="accommodations/:id/edit" element={<AccommodationForm />} />
              <Route path="reservations" element={<AdminReservations />} />
              <Route path="room-availability" element={<RoomAvailability />} />
              <Route path="amenities" element={<AdminAmenities />} />
              <Route path="amenities/new" element={<AmenityForm />} />
              <Route path="amenities/:id/edit" element={<AmenityForm />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

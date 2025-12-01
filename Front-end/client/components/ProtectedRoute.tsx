import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getAdminToken } from "@/lib/adminAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Admin-protected routes: rely on the separate Admin JWT, not the normal user session.
  if (requireAdmin) {
    const adminToken = getAdminToken();

    if (!adminToken) {
      // No admin token – always go to admin login, regardless of normal auth status.
      const redirectTarget = location.pathname + location.search;
      return (
        <Navigate
          to={`/admin/login?redirect=${encodeURIComponent(redirectTarget)}`}
          replace
        />
      );
    }

    // Optional extra safety: if we do have a loaded user and they are explicitly non-staff,
    // keep them away from the admin UI. Backend still enforces staff-only access.
    if (user && user.is_staff !== true) {
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  }

  // Normal protected routes use the regular auth context.
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-text-tertiary text-sm">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectTarget = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}





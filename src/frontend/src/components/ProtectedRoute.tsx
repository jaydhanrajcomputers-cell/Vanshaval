import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const SESSION_KEY = "vatavriksha_user_email";
const ADMIN_EMAIL = "admin@vatavriksha.com";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({
  children,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  // Immediate check from localStorage to avoid any async timing issues
  const [localAdminCheck] = useState(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored?.toLowerCase() === ADMIN_EMAIL;
    } catch {
      return false;
    }
  });

  const [localLoggedIn] = useState(() => {
    try {
      return !!localStorage.getItem(SESSION_KEY);
    } catch {
      return false;
    }
  });

  const effectiveIsAdmin = isAdmin || localAdminCheck;
  const effectiveIsLoggedIn = isLoggedIn || localLoggedIn;

  useEffect(() => {
    if (isLoading) return;
    if (!effectiveIsLoggedIn) {
      navigate({ to: "/login" });
      return;
    }
    if (adminOnly && !effectiveIsAdmin) {
      navigate({ to: "/" });
    }
  }, [isLoading, effectiveIsLoggedIn, effectiveIsAdmin, adminOnly, navigate]);

  // If we know from localStorage that user is logged in, don't block with skeleton
  if (!effectiveIsLoggedIn) {
    if (isLoading) {
      return (
        <div className="min-h-screen heritage-bg flex items-center justify-center">
          <div className="space-y-4 w-64">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-8 w-3/4 mx-auto rounded-lg" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
          </div>
        </div>
      );
    }
    return null;
  }

  if (adminOnly && !effectiveIsAdmin) {
    return null;
  }

  return <>{children}</>;
}

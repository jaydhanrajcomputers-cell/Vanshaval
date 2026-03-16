import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

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

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      navigate({ to: "/login" });
      return;
    }
    if (adminOnly && !isAdmin) {
      navigate({ to: "/" });
    }
  }, [isLoading, isLoggedIn, isAdmin, adminOnly, navigate]);

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

  if (!isLoggedIn) {
    return null;
  }

  if (adminOnly && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}

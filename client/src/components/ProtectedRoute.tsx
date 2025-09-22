import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, userData, isAdmin } = useAuth();

  // Check if user is authenticated (either Firebase user or admin)
  if (!currentUser && !isAdmin) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
    return <Redirect to="/unauthorized" />;
  }

  return <>{children}</>;
}

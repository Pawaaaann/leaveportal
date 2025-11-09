import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazy load page components for code splitting
const Login = lazy(() => import("@/pages/login"));
const Register = lazy(() => import("@/pages/register"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const StudentDashboard = lazy(() => import("@/pages/student-dashboard"));
const MentorDashboard = lazy(() => import("@/pages/mentor-dashboard"));
const HODDashboard = lazy(() => import("@/pages/hod-dashboard"));
const PrincipalDashboard = lazy(() => import("@/pages/principal-dashboard"));
const WardenDashboard = lazy(() => import("@/pages/warden-dashboard"));
const Profile = lazy(() => import("@/pages/profile"));
const Applications = lazy(() => import("@/pages/applications"));
const Notifications = lazy(() => import("@/pages/notifications"));
const VerifyLeave = lazy(() => import("@/pages/verify-leave"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component for Suspense fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function DashboardRouter() {
  const { userData } = useAuth();

  if (!userData) return null;

  return (
    <Suspense fallback={<PageLoader />}>
      {userData.role === "Admin" && <AdminDashboard />}
      {userData.role === "Student" && <StudentDashboard />}
      {userData.role === "Mentor" && <MentorDashboard />}
      {userData.role === "HOD" && <HODDashboard />}
      {userData.role === "Principal" && <PrincipalDashboard />}
      {userData.role === "Warden" && <WardenDashboard />}
      {!["Admin", "Student", "Mentor", "HOD", "Principal", "Warden"].includes(userData.role) && <NotFound />}
    </Suspense>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/login">
          <Login />
        </Route>
        <Route path="/register">
          <Register />
        </Route>
        <Route path="/verify/:id">
          <VerifyLeave />
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>
        <Route path="/applications">
          <ProtectedRoute>
            <Applications />
          </ProtectedRoute>
        </Route>
        <Route path="/notifications">
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        </Route>
        <Route path="/">
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

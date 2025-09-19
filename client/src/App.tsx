import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/login";
import Register from "@/pages/register";
import AdminDashboard from "@/pages/admin-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import MentorDashboard from "@/pages/mentor-dashboard";
import HODDashboard from "@/pages/hod-dashboard";
import PrincipalDashboard from "@/pages/principal-dashboard";
import WardenDashboard from "@/pages/warden-dashboard";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function DashboardRouter() {
  const { userData } = useAuth();

  if (!userData) return null;

  switch (userData.role) {
    case "Admin":
      return <AdminDashboard />;
    case "Student":
      return <StudentDashboard />;
    case "Mentor":
      return <MentorDashboard />;
    case "HOD":
      return <HODDashboard />;
    case "Principal":
      return <PrincipalDashboard />;
    case "Warden":
      return <WardenDashboard />;
    default:
      return <NotFound />;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
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
      <Route path="/">
        <ProtectedRoute>
          <DashboardRouter />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
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

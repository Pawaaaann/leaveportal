import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import LeaveApplicationForm from "@/components/LeaveApplicationForm";
import ApplicationStatus from "@/components/ApplicationStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bell, User } from "lucide-react";
import { LeaveRequest } from "@shared/schema";

export default function StudentDashboard() {
  const { userData } = useAuth();

  const { data: applications = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests", "student", userData?.id],
    enabled: !!userData?.id,
  });

  const { data: stats } = useQuery<{total: number, approved: number, pending: number, rejected: number, daysUsed: number}>({
    queryKey: ["/api/leave-requests", "stats", userData?.id],
    enabled: !!userData?.id,
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your leave applications and view approval status</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-muted-foreground hover:text-foreground">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
              </button>
              <div className="text-right">
                <p className="text-sm font-medium" data-testid="text-header-name">
                  {userData?.name}
                </p>
                <p className="text-xs text-muted-foreground" data-testid="text-header-roll">
                  {userData?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Application Form */}
          <div className="lg:col-span-2 space-y-8">
            <LeaveApplicationForm />
            <ApplicationStatus />
          </div>

          {/* Right Column: Quick Info & QR Code */}
          <div className="space-y-8">
            {/* Student Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-medium text-foreground" data-testid="text-student-name">
                      {userData?.name}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-student-roll">
                      Email: {userData?.email}
                    </p>
                  </div>
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Department:</span>
                      <span className="text-sm font-medium" data-testid="text-student-department">
                        {userData?.dept}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Year:</span>
                      <span className="text-sm font-medium" data-testid="text-student-year">
                        {userData?.year}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Hostel:</span>
                      <span className="text-sm font-medium" data-testid="text-student-hostel">
                        {userData?.hostel_status || "Day Scholar"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Applications:</span>
                  <span className="font-medium text-foreground" data-testid="text-total-applications">
                    {stats?.total || applications.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Approved:</span>
                  <span className="font-medium text-green-600" data-testid="text-approved-count">
                    {stats?.approved || applications.filter(app => app.status === "approved").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending:</span>
                  <span className="font-medium text-yellow-600" data-testid="text-pending-count">
                    {stats?.pending || applications.filter(app => app.status === "pending").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rejected:</span>
                  <span className="font-medium text-red-600" data-testid="text-rejected-count">
                    {stats?.rejected || applications.filter(app => app.status === "rejected").length}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Days Used:</span>
                    <span className="font-medium text-foreground" data-testid="text-days-used">
                      {stats?.daysUsed || 0} / 30
                    </span>
                  </div>
                  <div className="mt-2">
                    <Progress value={(stats?.daysUsed || 0) / 30 * 100} className="w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Applications History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Application ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Reason</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date Range</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Current Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No applications found
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.id} className="border-b border-border hover:bg-muted/50" data-testid={`row-application-${app.id}`}>
                        <td className="py-3 px-4 text-sm font-medium text-foreground">#{app.id?.slice(-6)}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{app.reason}</td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {new Date(app.start_date).toLocaleDateString()} - {new Date(app.end_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusVariant(app.status)}>
                            {app.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">{app.approver_stage}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import ApprovalCard from "@/components/ApprovalCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaveRequest } from "@shared/schema";

export default function WardenDashboard() {
  const { userData } = useAuth();

  const { data: pendingApplications = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests", "pending", "warden"],
    enabled: !!userData?.id,
  });

  const { data: stats } = useQuery<{pending: number, approved: number, rejected: number, hostelStudents: number}>({
    queryKey: ["/api/leave-requests", "warden-stats"],
    enabled: !!userData?.id,
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Warden Dashboard</h1>
          <p className="text-muted-foreground mt-1">Review and approve hostel student leave applications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground" data-testid="text-pending-count">
                  {stats?.pending || pendingApplications.length}
                </h3>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-green-600" data-testid="text-approved-count">
                  {stats?.approved || 0}
                </h3>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-red-600" data-testid="text-rejected-count">
                  {stats?.rejected || 0}
                </h3>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground" data-testid="text-hostel-students">
                  {stats?.hostelStudents || 0}
                </h3>
                <p className="text-sm text-muted-foreground">Hostel Students</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Applications for Approval</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : pendingApplications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending applications</p>
            ) : (
              <div className="space-y-4">
                {pendingApplications.map((application) => (
                  <ApprovalCard key={application.id} application={application} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

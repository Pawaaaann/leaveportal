import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import ApprovalCard from "@/components/ApprovalCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeaveRequest } from "@shared/schema";

export default function MentorDashboard() {
  const { userData } = useAuth();
  const [showApproved, setShowApproved] = useState(false);
  const [showRejected, setShowRejected] = useState(false);

  const { data: pendingApplications = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: [`/api/leave-requests/mentor/${userData?.id}`],
    enabled: !!userData?.id,
  });

  const { data: stats } = useQuery<{pending: number, approved: number, rejected: number, totalStudents: number}>({
    queryKey: [`/api/leave-requests/mentor-stats/${userData?.id}`],
    enabled: !!userData?.id,
  });

  // Fetch approved requests filtered by mentor's department and year
  const { data: approvedApplications = [], isLoading: loadingApproved } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests/approved", userData?.dept, userData?.year],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userData?.dept) params.append("department", userData.dept);
      if (userData?.year) params.append("year", userData.year);
      const response = await fetch(`/api/leave-requests/approved?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch approved applications");
      return response.json();
    },
    enabled: !!userData?.dept,
  });

  // Fetch rejected requests filtered by mentor's department and year
  const { data: rejectedApplications = [], isLoading: loadingRejected } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests/rejected", userData?.dept, userData?.year],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userData?.dept) params.append("department", userData.dept);
      if (userData?.year) params.append("year", userData.year);
      const response = await fetch(`/api/leave-requests/rejected?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch rejected applications");
      return response.json();
    },
    enabled: !!userData?.dept,
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
      
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Mentor Dashboard</h1>
          <p className="text-muted-foreground mt-1">Review and approve student leave applications</p>
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
              <Button
                variant="ghost"
                className="w-full h-full p-0"
                onClick={() => {
                  setShowApproved(!showApproved);
                  setShowRejected(false);
                }}
                data-testid="button-approved-count"
              >
                <div className="text-center w-full">
                  <h3 className={`text-2xl font-bold ${showApproved ? 'text-green-700' : 'text-green-600'}`} data-testid="text-approved-count">
                    {stats?.approved || approvedApplications.length}
                  </h3>
                  <p className="text-sm text-muted-foreground">Approved {showApproved ? '(Click to hide)' : '(Click to view)'}</p>
                </div>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Button
                variant="ghost"
                className="w-full h-full p-0"
                onClick={() => {
                  setShowRejected(!showRejected);
                  setShowApproved(false);
                }}
                data-testid="button-rejected-count"
              >
                <div className="text-center w-full">
                  <h3 className={`text-2xl font-bold ${showRejected ? 'text-red-700' : 'text-red-600'}`} data-testid="text-rejected-count">
                    {stats?.rejected || rejectedApplications.length}
                  </h3>
                  <p className="text-sm text-muted-foreground">Rejected {showRejected ? '(Click to hide)' : '(Click to view)'}</p>
                </div>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground" data-testid="text-total-students">
                  {stats?.totalStudents || 0}
                </h3>
                <p className="text-sm text-muted-foreground">Total Students</p>
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

        {/* Approved Applications */}
        {showApproved && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Approved Applications ({userData?.dept} {userData?.year && `- ${userData.year}`})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Application ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Reason</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date Range</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingApproved ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : approvedApplications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No approved applications
                      </td>
                    </tr>
                  ) : (
                    approvedApplications.map((app) => (
                      <tr key={app.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm font-medium text-foreground">#{app.id?.slice(-6)}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{app.student_id}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{app.reason}</td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {new Date(app.start_date).toLocaleDateString()} - {new Date(app.end_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getStatusVariant(app.status)}>
                            {app.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Rejected Applications */}
        {showRejected && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Rejected Applications ({userData?.dept} {userData?.year && `- ${userData.year}`})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Application ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Reason</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date Range</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rejection Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRejected ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : rejectedApplications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No rejected applications
                      </td>
                    </tr>
                  ) : (
                    rejectedApplications.map((app) => (
                      <tr key={app.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm font-medium text-foreground">#{app.id?.slice(-6)}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{app.student_id}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{app.reason}</td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {new Date(app.start_date).toLocaleDateString()} - {new Date(app.end_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">{app.comments || "No reason provided"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import type { LeaveRequest } from "@shared/schema";

function getStatusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
      return "default" as const;
    case "rejected":
      return "destructive" as const;
    case "pending":
      return "secondary" as const;
    default:
      return "secondary" as const;
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
      return <CheckCircle className="h-4 w-4" />;
    case "rejected":
      return <XCircle className="h-4 w-4" />;
    case "pending":
      return <Clock className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
}

export default function Applications() {
  const { userData } = useAuth();

  const { data: applications = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests/student", userData?.id],
    enabled: !!userData?.id,
  });

  const { data: currentApplication } = useQuery<LeaveRequest | null>({
    queryKey: ["/api/leave-requests/current", userData?.id],
    enabled: !!userData?.id,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading applications...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="heading-applications">My Applications</h1>
              <p className="text-muted-foreground mt-2">View and track all your leave applications</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{applications.length} Total Applications</span>
            </div>
          </div>

          {/* Current Application Alert */}
          {currentApplication && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <span>Current Active Application</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Application ID</p>
                    <p className="font-medium">#{currentApplication.id?.slice(-6)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Leave Type</p>
                    <p className="font-medium">{currentApplication.leave_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={getStatusVariant(currentApplication.status)} className="mt-1">
                      {getStatusIcon(currentApplication.status)}
                      <span className="ml-1">{currentApplication.status}</span>
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Stage</p>
                    <p className="font-medium capitalize">{currentApplication.approver_stage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Applications List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>All Applications</span>
              </CardTitle>
              <CardDescription>Complete history of your leave applications</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Applications Yet</h3>
                  <p className="text-muted-foreground">You haven't submitted any leave applications.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <Card key={app.id} className="hover:shadow-md transition-shadow" data-testid={`card-application-${app.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">#{app.id?.slice(-6)}</h3>
                              <p className="text-sm text-muted-foreground capitalize">{app.leave_type} Leave</p>
                            </div>
                          </div>
                          <Badge variant={getStatusVariant(app.status)} className="flex items-center space-x-1">
                            {getStatusIcon(app.status)}
                            <span>{app.status}</span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Date Range</p>
                              <p className="font-medium text-sm">
                                {new Date(app.start_date).toLocaleDateString()} - {new Date(app.end_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Current Stage</p>
                              <p className="font-medium text-sm capitalize">{app.approver_stage}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Guardian Contact</p>
                              <p className="font-medium text-sm">{app.guardian_phone}</p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <p className="text-sm text-muted-foreground mb-2">Reason for Leave</p>
                          <p className="text-sm text-foreground">{app.reason}</p>
                        </div>

                        {app.comments && (
                          <div className="border-t pt-4 mt-4">
                            <p className="text-sm text-muted-foreground mb-2">Comments</p>
                            <p className="text-sm text-foreground">{app.comments}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
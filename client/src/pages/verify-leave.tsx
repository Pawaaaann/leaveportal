import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Calendar, User, FileText, Clock } from "lucide-react";

interface VerificationData {
  leaveRequest: {
    id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    approver_stage: string;
    comments?: string;
  };
  student: {
    name: string;
    register_number: string;
    dept: string;
    year: string;
    hostel_status?: string;
  };
}

export default function VerifyLeave() {
  const params = useParams();
  const leaveId = params.id;
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerificationData = async () => {
      try {
        const response = await fetch(`/api/leave-requests/${leaveId}/verify`);
        if (!response.ok) {
          throw new Error("Leave request not found");
        }
        const verificationData = await response.json();
        setData(verificationData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify leave request");
      } finally {
        setLoading(false);
      }
    };

    if (leaveId) {
      fetchVerificationData();
    }
  }, [leaveId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Verifying leave request...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <XCircle className="h-6 w-6" />
              <span>Verification Failed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || "Leave request not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { leaveRequest, student } = data;
  const isApproved = leaveRequest.status === "approved";

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Leave Pass Verification</h1>
          <p className="text-muted-foreground">Official leave authorization details</p>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-3">
              {isApproved ? (
                <CheckCircle className="h-12 w-12 text-green-600" />
              ) : (
                <XCircle className="h-12 w-12 text-destructive" />
              )}
              <div>
                <Badge 
                  variant={isApproved ? "default" : "destructive"}
                  className="text-lg px-4 py-2"
                >
                  {leaveRequest.status.toUpperCase()}
                </Badge>
                {!isApproved && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Current Stage: {leaveRequest.approver_stage}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Student Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium text-foreground" data-testid="text-student-name">
                  {student.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Register Number</p>
                <p className="font-medium text-foreground" data-testid="text-register-number">
                  {student.register_number}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium text-foreground" data-testid="text-department">
                  {student.dept}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="font-medium text-foreground" data-testid="text-year">
                  {student.year}
                </p>
              </div>
              {student.hostel_status && (
                <div>
                  <p className="text-sm text-muted-foreground">Hostel Status</p>
                  <p className="font-medium text-foreground" data-testid="text-hostel-status">
                    {student.hostel_status}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leave Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Leave Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Leave Type</p>
                <p className="font-medium text-foreground capitalize" data-testid="text-leave-type">
                  {leaveRequest.leave_type}
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Date Range</p>
                  <p className="font-medium text-foreground" data-testid="text-date-range">
                    {new Date(leaveRequest.start_date).toLocaleDateString()} - {new Date(leaveRequest.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reason</p>
                <p className="font-medium text-foreground" data-testid="text-reason">
                  {leaveRequest.reason}
                </p>
              </div>
              {leaveRequest.comments && (
                <div>
                  <p className="text-sm text-muted-foreground">Comments</p>
                  <p className="font-medium text-foreground" data-testid="text-comments">
                    {leaveRequest.comments}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Verification Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Application ID: #{leaveRequest.id.slice(-8)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This is an official leave verification document. Please verify all details carefully.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

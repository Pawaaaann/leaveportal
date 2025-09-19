import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Minus } from "lucide-react";
import { LeaveRequest, Approval } from "@shared/schema";

const getStageOrder = (isHostelStudent: boolean) => {
  const stages = ["mentor", "hod", "principal"];
  if (isHostelStudent) {
    stages.push("warden");
  }
  return stages;
};

const getStageDisplay = (stage: string) => {
  const displays = {
    mentor: "Mentor Approval",
    hod: "HOD Approval", 
    principal: "Principal Approval",
    warden: "Warden Approval",
  };
  return displays[stage as keyof typeof displays] || stage;
};

export default function ApplicationStatus() {
  const { userData } = useAuth();

  const { data: currentApplication, isLoading } = useQuery<LeaveRequest>({
    queryKey: ["/api/leave-requests", "current", userData?.id],
    enabled: !!userData?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Application Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentApplication) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Application Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No active application found</p>
        </CardContent>
      </Card>
    );
  }

  const stages = getStageOrder(currentApplication.isHostelStudent || false);
  const approvals = (currentApplication.approvals as Approval[]) || [];

  const getStageStatus = (stage: string) => {
    const approval = approvals.find(a => a.stage === stage);
    if (approval) {
      return approval.status === "approved" ? "approved" : "rejected";
    }
    if (stage === currentApplication.currentStage) {
      return "pending";
    }
    return "waiting";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-green-600";
      case "rejected": return "text-red-600";
      case "pending": return "text-yellow-600";
      default: return "text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <Check className="w-4 h-4 text-white" />;
      case "pending": return <Clock className="w-4 h-4 text-white" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Application Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Application Details */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <h3 className="font-medium text-foreground" data-testid="text-application-type">
              {currentApplication.leaveType} Leave Application
            </h3>
            <p className="text-sm text-muted-foreground" data-testid="text-submission-date">
              Submitted on {new Date(currentApplication.createdAt!).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(currentApplication.status)} data-testid="badge-application-status">
            {currentApplication.status === "pending" ? "Pending Approval" : currentApplication.status}
          </Badge>
        </div>

        {/* Approval Workflow */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Approval Progress</h4>
          
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const status = getStageStatus(stage);
              const approval = approvals.find(a => a.stage === stage);
              const bgColor = status === "approved" ? "bg-green-500" : 
                             status === "pending" ? "bg-yellow-500" : "bg-gray-300";

              return (
                <div key={stage} className="flex items-center space-x-4" data-testid={`status-${stage}`}>
                  <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center`}>
                    {getStatusIcon(status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{getStageDisplay(stage)}</p>
                    <p className="text-sm text-muted-foreground">
                      {approval ? 
                        `${approval.approverName} - ${status === "approved" ? "Approved" : "Rejected"} on ${new Date(approval.timestamp).toLocaleDateString()}` :
                        status === "pending" ? "Pending Review" : "Awaiting Previous Approval"
                      }
                    </p>
                    {approval?.comments && (
                      <p className="text-sm text-muted-foreground italic">"{approval.comments}"</p>
                    )}
                  </div>
                  <span className={`font-medium ${getStatusColor(status)}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Minus } from "lucide-react";
import { LeaveRequest } from "@shared/schema";

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

  const stages = getStageOrder(currentApplication.is_hostel_student || false);

  const getStageStatus = (stage: string) => {
    // Check if this stage has been passed (current stage is after this one)
    const stageIndex = stages.indexOf(stage);
    const currentStageIndex = stages.indexOf(currentApplication.approver_stage);
    
    if (currentApplication.status === "rejected") {
      // If rejected, check if rejection happened at or after this stage
      if (currentStageIndex >= stageIndex) {
        return "rejected";
      }
      return "waiting";
    }
    
    if (currentApplication.status === "approved") {
      // If approved, all stages up to the last one are approved
      if (stageIndex < stages.length - 1) {
        return "approved";
      }
      // Last stage is approved
      return "approved";
    }
    
    // Pending status
    if (stageIndex === currentStageIndex) {
      return "pending";
    } else if (stageIndex < currentStageIndex) {
      return "approved";
    } else {
      return "waiting";
    }
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
              {currentApplication.leave_type} Leave Application
            </h3>
            <p className="text-sm text-muted-foreground" data-testid="text-submission-date">
              Submitted on {new Date(currentApplication.start_date).toLocaleDateString()}
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
              const bgColor = status === "approved" ? "bg-green-500" : 
                             status === "pending" ? "bg-yellow-500" : 
                             status === "rejected" ? "bg-red-500" : "bg-gray-300";

              return (
                <div key={stage} className="flex items-center space-x-4" data-testid={`status-${stage}`}>
                  <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center`}>
                    {getStatusIcon(status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{getStageDisplay(stage)}</p>
                    <p className="text-sm text-muted-foreground">
                      {status === "pending" ? "Pending Review" : 
                       status === "approved" ? "Approved" : 
                       status === "rejected" ? "Rejected" : 
                       "Awaiting Previous Approval"}
                    </p>
                    {currentApplication.comments && status !== "waiting" && (
                      <p className="text-sm text-muted-foreground italic">"{currentApplication.comments}"</p>
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

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { LeaveRequest } from "@shared/schema";

interface ApprovalCardProps {
  application: LeaveRequest;
}

export default function ApprovalCard({ application }: ApprovalCardProps) {
  const [comments, setComments] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approvalMutation = useMutation({
    mutationFn: async ({ action, comments }: { action: "approve" | "reject"; comments: string }) => {
      const response = await apiRequest("POST", `/api/leave-requests/${application.id}/approve`, {
        action,
        comments,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Application updated successfully",
      });
      setComments("");
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    approvalMutation.mutate({ action: "approve", comments });
  };

  const handleReject = () => {
    approvalMutation.mutate({ action: "reject", comments });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-medium text-foreground" data-testid="text-applicant-name">
              {/* This would be populated with actual student data */}
              Student Name - {application.leaveType} Leave
            </h4>
            <p className="text-sm text-muted-foreground">
              {new Date(application.fromDate).toLocaleDateString()} - {new Date(application.toDate).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="secondary">Pending Review</Badge>
        </div>

        <div className="mb-4">
          <p className="text-sm text-foreground">
            <strong>Reason:</strong> {application.reason}
          </p>
        </div>

        <div className="space-y-3">
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add your comments..."
            rows={2}
            data-testid="textarea-approval-comments"
          />
          <div className="flex space-x-3">
            <Button
              onClick={handleApprove}
              disabled={approvalMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-approve"
            >
              <Check className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={handleReject}
              disabled={approvalMutation.isPending}
              variant="destructive"
              data-testid="button-reject"
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

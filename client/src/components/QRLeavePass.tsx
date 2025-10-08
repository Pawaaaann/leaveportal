import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download } from "lucide-react";
import { LeaveRequest } from "@shared/schema";

export default function QRLeavePass() {
  const { userData } = useAuth();

  const { data: applications = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests/student", userData?.id],
    enabled: !!userData?.id,
  });

  // Get all approved applications with QR codes
  const approvedApplications = applications.filter(
    app => app.status === "approved" && app.final_qr_url
  );

  const handleDownloadPDF = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/leave-requests/${applicationId}/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leave-pass-${applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Leave Pass</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {approvedApplications.length > 0 ? (
          <div className="space-y-6">
            {approvedApplications.map((application) => (
              <div key={application.id} className="border-b border-border pb-6 last:border-0 last:pb-0">
                {/* QR Code Display */}
                <div className="w-48 h-48 mx-auto mb-4 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                  <img 
                    src={application.final_qr_url!} 
                    alt="QR Leave Pass" 
                    className="w-full h-full object-contain p-2"
                    data-testid={`img-qr-code-${application.id}`}
                  />
                </div>

                {/* Application Info */}
                <div className="text-left space-y-2 mb-4">
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium">Leave Details:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>{application.leave_type}</li>
                      <li>{new Date(application.start_date).toLocaleDateString()} - {new Date(application.end_date).toLocaleDateString()}</li>
                      <li>Status: Approved</li>
                    </ul>
                  </div>
                </div>

                {/* Download Button */}
                <Button
                  onClick={() => handleDownloadPDF(application.id)}
                  className="w-full"
                  data-testid={`button-download-pdf-${application.id}`}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF Pass
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {/* QR Code Placeholder */}
            <div className="w-48 h-48 mx-auto mb-4 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  QR Code will appear<br />after final approval
                </p>
              </div>
            </div>

            {/* QR Code Info */}
            <div className="text-left space-y-2 mb-4">
              <div className="text-xs text-muted-foreground">
                <p>QR Code includes:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Student details</li>
                  <li>Leave dates</li>
                  <li>Approval status</li>
                  <li>Approver information</li>
                </ul>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Available after final approval
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

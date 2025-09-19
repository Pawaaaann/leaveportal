import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download } from "lucide-react";
import { LeaveRequest } from "@shared/schema";

export default function QRLeavePass() {
  const { userData } = useAuth();

  const { data: currentApplication } = useQuery<LeaveRequest>({
    queryKey: ["/api/leave-requests", "current", userData?.id],
    enabled: !!userData?.id,
  });

  const handleDownloadPDF = async () => {
    if (!currentApplication?.id) return;

    try {
      const response = await fetch(`/api/leave-requests/${currentApplication.id}/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leave-pass-${currentApplication.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const isApproved = currentApplication?.status === "approved";

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Leave Pass</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {/* QR Code Display */}
        <div className="w-48 h-48 mx-auto mb-4 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center">
          {isApproved && currentApplication?.finalQrUrl ? (
            <img 
              src={currentApplication.finalQrUrl} 
              alt="QR Leave Pass" 
              className="w-full h-full object-contain"
              data-testid="img-qr-code"
            />
          ) : (
            <div className="text-center">
              <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                QR Code will appear<br />after final approval
              </p>
            </div>
          )}
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

        {/* Download Button */}
        <Button
          onClick={handleDownloadPDF}
          className="w-full"
          disabled={!isApproved}
          data-testid="button-download-pdf"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF Pass
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          {isApproved ? "Available for download" : "Available after final approval"}
        </p>
      </CardContent>
    </Card>
  );
}

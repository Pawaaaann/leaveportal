import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, CheckCircle, XCircle, Info, AlertCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import type { Notification } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

function getNotificationIcon(message: string) {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("approved")) {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  } else if (lowerMessage.includes("rejected")) {
    return <XCircle className="h-5 w-5 text-red-500" />;
  } else if (lowerMessage.includes("error") || lowerMessage.includes("failed")) {
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  }
  return <Info className="h-5 w-5 text-blue-500" />;
}

function getNotificationVariant(message: string) {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("approved")) return "default" as const;
  if (lowerMessage.includes("rejected") || lowerMessage.includes("error")) return "destructive" as const;
  return "secondary" as const;
}

export default function Notifications() {
  const { userData } = useAuth();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", userData?.id],
    enabled: !!userData?.id,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading notifications...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3" data-testid="heading-notifications">
                <Bell className="h-8 w-8" />
                Notifications
              </h1>
              <p className="text-muted-foreground mt-2">Stay updated with your leave request status</p>
            </div>
            <Badge variant="secondary" data-testid="badge-notification-count">
              {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
            </Badge>
          </div>

          {/* Notifications List */}
          <Card data-testid="card-notifications-list">
            <CardHeader>
              <CardTitle>Recent Updates</CardTitle>
              <CardDescription>Your latest notifications and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">No notifications yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    You'll see updates about your leave requests here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.message)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground" data-testid={`text-notification-message-${notification.id}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1" data-testid={`text-notification-time-${notification.id}`}>
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge variant={getNotificationVariant(notification.message)} className="shrink-0">
                          {notification.message.toLowerCase().includes("approved") ? "Approved" :
                           notification.message.toLowerCase().includes("rejected") ? "Rejected" :
                           notification.message.toLowerCase().includes("forwarded") ? "In Progress" : "Info"}
                        </Badge>
                      </div>
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

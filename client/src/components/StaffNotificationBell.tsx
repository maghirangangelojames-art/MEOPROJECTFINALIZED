import { useState, useEffect } from "react";
import { Bell, X, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useStaffNotifications } from "@/hooks/useStaffNotifications";
import { useLocation } from "wouter";

interface StaffNotification {
  id: number;
  type: "submission_received" | "resubmission_received";
  message: string;
  applicantName: string;
  applicantEmail: string;
  applicationRef: string;
  applicationId: number;
  timestamp: Date;
  read: boolean;
  detailsCount?: number; // Number of files resubmitted
}

export function StaffNotificationBell() {
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { refetch: refetchApplications } = useStaffNotifications();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Check localStorage for staff notifications
    const stored = localStorage.getItem("staffNotifications");
    if (stored) {
      try {
        let parsed = JSON.parse(stored);
        // Migrate old notifications that don't have applicationId by clearing them
        // New notifications will be created with the applicationId
        parsed = parsed.filter((n: StaffNotification) => n.applicationId);
        setNotifications(parsed);
        if (parsed.length !== JSON.parse(stored).length) {
          localStorage.setItem("staffNotifications", JSON.stringify(parsed));
        }
      } catch (e) {
        // Invalid JSON, ignore
      }
    }

    // Sync with pending applications whenever popover opens
    const handleOpenChange = () => {
      if (isOpen) {
        refetchApplications();
      }
    };

    return () => {
      handleOpenChange();
    };
  }, [isOpen, refetchApplications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: number) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem("staffNotifications", JSON.stringify(updated));
  };

  const removeNotification = (id: number) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    localStorage.setItem("staffNotifications", JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem("staffNotifications");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "submission_received":
        return <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "resubmission_received":
        return <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case "submission_received":
        return "New Application Submitted";
      case "resubmission_received":
        return "Application Resubmitted";
      default:
        return "Notification";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "submission_received":
        return "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/40";
      case "resubmission_received":
        return "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/40";
      default:
        return "bg-background hover:bg-muted/30";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-orange-500 text-white animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950/20">
          <div>
            <h3 className="font-semibold text-sm">Submissions</h3>
            <p className="text-xs text-muted-foreground">Applications to Review</p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No pending submissions</p>
            </div>
          ) : (
            <div className="space-y-0">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-border last:border-0 cursor-pointer transition-all ${
                    !notification.read 
                      ? getNotificationColor(notification.type)
                      : "bg-background hover:bg-muted/30"
                  }`}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.applicationId) {
                      navigate(`/application/${notification.applicationId}`);
                    } else {
                      // Fallback to dashboard if applicationId is missing
                      navigate("/dashboard");
                    }
                    setIsOpen(false);
                  }}
                >
                  <div className="flex gap-3 items-start">
                    <div className="mt-0.5 flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">
                          {getNotificationTitle(notification.type)}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded p-2 mb-2">
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-200 mb-1">Applicant:</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">{notification.applicantName}</p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Email:</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">{notification.applicantEmail}</p>
                        {notification.detailsCount && (
                          <>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2">Files:</p>
                            <p className="text-xs text-slate-700 dark:text-slate-300">{notification.detailsCount} file(s) resubmitted</p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Ref: <span className="font-mono font-semibold text-foreground">{notification.applicationRef}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleDateString()} {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-3 border-t border-border text-center bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {unreadCount === 0
                ? "All reviewed! ✓"
                : `${unreadCount} unread submission${unreadCount !== 1 ? "s" : ""}`}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

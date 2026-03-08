import { useState, useEffect } from "react";
import { Bell, X, CheckCircle, AlertCircle, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface Notification {
  id: number;
  type: "approved" | "resubmission_requested" | "remarks" | "status_reminder";
  message: string;
  applicationRef: string;
  timestamp: Date;
  read: boolean;
  remarks?: string;
  status?: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Check localStorage for stored notifications
    const stored = localStorage.getItem("appNotifications");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      } catch (e) {
        // Invalid JSON, ignore
      }
    }

    // Set up 24-hour status reminder check
    const reminderInterval = setInterval(() => {
      checkForStatusReminders();
    }, 1000 * 60 * 60); // Check every hour

    return () => clearInterval(reminderInterval);
  }, []);

  const checkForStatusReminders = () => {
    const stored = localStorage.getItem("appNotifications");
    if (stored) {
      try {
        const notifications = JSON.parse(stored);
        const lastReminder = localStorage.getItem("lastStatusReminder");
        const lastReminderTime = lastReminder ? parseInt(lastReminder) : 0;
        const now = Date.now();

        // If more than 24 hours have passed since last reminder, add new reminders
        if (now - lastReminderTime > 1000 * 60 * 60 * 24) {
          const reminders = notifications.filter((n: Notification) => 
            !n.type.includes("status_reminder")
          );

          reminders.forEach((n: Notification) => {
            const statusReminder: Notification = {
              id: Date.now() + Math.random(),
              type: "status_reminder",
              message: `Status check: Your application is currently ${n.status || "pending"}. Check for any updates.`,
              applicationRef: n.applicationRef,
              timestamp: new Date(),
              read: false,
              status: n.status,
            };
            notifications.push(statusReminder);
          });

          localStorage.setItem("appNotifications", JSON.stringify(notifications));
          localStorage.setItem("lastStatusReminder", now.toString());
          setNotifications(notifications);
        }
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: number) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem("appNotifications", JSON.stringify(updated));
  };

  const removeNotification = (id: number) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    localStorage.setItem("appNotifications", JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem("appNotifications");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "resubmission_requested":
        return <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case "remarks":
        return <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "status_reminder":
        return <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case "approved":
        return "Application Approved ✓";
      case "resubmission_requested":
        return "Changes Required";
      case "remarks":
        return "Staff Remarks Added";
      case "status_reminder":
        return "Status Reminder";
      default:
        return "Notification";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20">
          <h3 className="font-semibold text-sm">Notifications</h3>
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
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-0">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-border last:border-0 cursor-pointer transition-all ${
                    !notification.read 
                      ? "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/40" 
                      : "bg-background hover:bg-muted/30"
                  }`}
                  onClick={() => {
                    markAsRead(notification.id);
                    navigate("/track-application");
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
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      {notification.remarks && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded p-2 mb-2">
                          <p className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">Staff Remarks:</p>
                          <p className="text-xs text-amber-800 dark:text-amber-300">{notification.remarks}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Ref: <span className="font-mono font-semibold text-foreground">{notification.applicationRef}</span>
                          </p>
                          {notification.status && (
                            <p className="text-xs text-muted-foreground">
                              Status: <span className="font-medium text-primary capitalize">{notification.status}</span>
                            </p>
                          )}
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
                ? "All caught up! ✓"
                : `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

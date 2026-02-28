import { useState } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Calendar, Mail, Phone, MapPin, AlertCircle, CheckCircle2, Clock, Lock, LockOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { toast } from "sonner";

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [action, setAction] = useState<"approve" | "resubmit" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null);
  const [fileRemarks, setFileRemarks] = useState<Record<number, string>>({});

  // Fetch application
  const applicationQuery = trpc.applications.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );

  // Fetch activity logs
  const activityLogsQuery = trpc.activityLogs.getByApplicationId.useQuery(
    { applicationId: parseInt(id || "0") },
    { enabled: !!id }
  );


  // File management mutations
  const updateFileLockMutation = trpc.applications.updateFileLockStatus.useMutation();
  const updateFileRemarksMutation = trpc.applications.updateFileRemarks.useMutation();
  const deleteFileRemarksMutation = trpc.applications.deleteFileRemarks.useMutation();
  // Update status mutation
  const updateStatusMutation = trpc.applications.updateStatus.useMutation();

  const app = applicationQuery.data as any;
  const activityLogs = activityLogsQuery.data || [];

  if (!user || (user.role !== "staff" && user.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </Card>
      </div>
    );
  }

  if (applicationQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Application Not Found</h1>
          <Button asChild className="mt-4">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const handleAction = async () => {
    if (!action) return;

    try {
      const result = await updateStatusMutation.mutateAsync({
        applicationId: app.id,
        status: action === "approve" ? "approved" : "for_resubmission",
        remarks: remarks || undefined,
      });

      // Create notification for applicant (stored in localStorage)
      const notifications = JSON.parse(localStorage.getItem("appNotifications") || "[]");
      const newNotification = {
        id: Date.now(),
        type: result.notificationType === "approved" ? "approved" : "resubmission_requested",
        message: result.notificationType === "approved" 
          ? "Your building permit application has been approved successfully!" 
          : "Your application requires modifications. Please review the details and resubmit.",
        applicationRef: result.referenceNumber,
        status: action === "approve" ? "approved" : "for_resubmission",
        remarks: remarks || undefined,
        timestamp: new Date(),
        read: false,
      };
      notifications.unshift(newNotification);
      localStorage.setItem("appNotifications", JSON.stringify(notifications.slice(0, 50))); // Keep only last 50

      if (action === "approve") {
        toast.success("✓ Application approved successfully! All remarks have been cleared.");
      } else {
        toast.success("✓ Resubmission requested. The applicant has been notified of the required modifications.");
      }
      
      setAction(null);
      setRemarks("");
      applicationQuery.refetch();
      activityLogsQuery.refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update application");
    }
  };

  const handleToggleFileLock = async (fileIndex: number, currentLocked: boolean) => {
    try {
      await updateFileLockMutation.mutateAsync({
        applicationId: app.id,
        fileIndex,
        isLocked: !currentLocked,
      });
      
      toast.success(`File ${currentLocked ? "unlocked" : "locked"} successfully!`);
      applicationQuery.refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update file lock status");
    }
  };

  const handleUpdateFileRemarks = async (fileIndex: number) => {
    const remark = fileRemarks[fileIndex] || "";
    
    try {
      await updateFileRemarksMutation.mutateAsync({
        applicationId: app.id,
        fileIndex,
        remarks: remark,
      });
      
      // Create notification for applicant about new remarks
      if (remark) {
        const notifications = JSON.parse(localStorage.getItem("appNotifications") || "[]");
        const newNotification = {
          id: Date.now(),
          type: "remarks",
          message: `Staff added remarks to document ${fileIndex + 1}. Please review and address any concerns.`,
          applicationRef: app.referenceNumber,
          remarks: remark,
          status: app.status,
          timestamp: new Date(),
          read: false,
        };
        notifications.unshift(newNotification);
        localStorage.setItem("appNotifications", JSON.stringify(notifications.slice(0, 50)));
      }
      
      toast.success("File remarks updated successfully! Applicant has been notified.");
      setEditingFileIndex(null);
      applicationQuery.refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update file remarks");
    }
  };

  const handleDeleteFileRemarks = async (fileIndex: number) => {
    try {
      await deleteFileRemarksMutation.mutateAsync({
        applicationId: app.id,
        fileIndex,
      });
      
      toast.success("File remarks deleted successfully!");
      setEditingFileIndex(null);
      applicationQuery.refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete file remarks");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
      case "approved":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "for_resubmission":
        return "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200";
      case "pending_resubmit":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
      case "on_hold":
        return "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200";
    }
  };

  const getProcessingIndicator = (statusIndicator: string) => {
    const colors = {
      green: "text-green-600",
      yellow: "text-yellow-600",
      red: "text-red-600",
    };

    const icons = {
      green: <CheckCircle2 className="h-5 w-5" />,
      yellow: <Clock className="h-5 w-5" />,
      red: <AlertCircle className="h-5 w-5" />,
    };

    return (
      <div className={`flex items-center gap-2 ${colors[statusIndicator as keyof typeof colors]}`}>
        {icons[statusIndicator as keyof typeof icons]}
        <span className="font-medium">
          {statusIndicator === "green" && "0-1 day"}
          {statusIndicator === "yellow" && "2 days"}
          {statusIndicator === "red" && "3+ days"}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Application Details</h1>
            <p className="text-sm text-muted-foreground">{app.referenceNumber}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card className="p-6 bg-gradient-meo dark:text-white text-slate-900">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Application Status</h2>
                <Badge className={`${getStatusColor(app.status)} text-xs`}>
                  {app.status.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm dark:opacity-90 opacity-75">Submitted</p>
                  <p className="text-lg font-semibold">
                    {new Date(app.submittedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm dark:opacity-90 opacity-75">Processing Time</p>
                  <div className="mt-1">
                    {getProcessingIndicator(app.statusIndicator)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Applicant Information */}
            <Card className="p-6 bg-white dark:bg-slate-800/50">
              <h3 className="text-lg font-bold mb-4 text-foreground">Applicant Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                  <p className="font-semibold text-foreground">{app.applicantName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                  <p className="font-semibold text-foreground">{app.applicantCapacity}</p>
                </div>
                {app.ownerName && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Property/Lot Owner Name</p>
                    <p className="font-semibold text-foreground">{app.ownerName}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${app.applicantEmail}`} className="text-primary hover:underline">
                    {app.applicantEmail}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${app.applicantPhone}`} className="text-primary hover:underline">
                    {app.applicantPhone}
                  </a>
                </div>
              </div>
            </Card>

            {/* Property Information */}
            <Card className="p-6 bg-white dark:bg-slate-800/50">
              <h3 className="text-lg font-bold mb-4 text-foreground">Property Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="font-semibold text-foreground">{app.propertyLocation}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Complete Address</p>
                  <p className="text-sm text-foreground">{app.propertyAddress}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Project Type</p>
                    <p className="font-semibold text-foreground">{app.projectType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Building Classification</p>
                    <p className="font-semibold text-foreground">
                      {app.buildingClassification || "Not provided"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Project Scope</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{app.projectScope}</p>
                </div>
              </div>
            </Card>

            {/* Attachments/Documents */}
            {app.attachments && (app.attachments as any[]).length > 0 && (
              <Card className="p-6 bg-white dark:bg-slate-800/50">
                <h3 className="text-lg font-bold mb-4 text-foreground">Attached Documents</h3>
                <div className="space-y-3">
                  {(app.attachments as any[]).map((attachment: any, index: number) => (
                    <div
                      key={index}
                      className="border border-border rounded-lg overflow-hidden bg-white dark:bg-slate-800"
                    >
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 border-b border-border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm truncate text-foreground">{attachment.name}</p>
                            {(attachment.isLocked !== false) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Lock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent>File is locked by staff</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {attachment.type === "application/pdf" ? "PDF" : "Image"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleFileLock(index, attachment.isLocked !== false)}
                            title={attachment.isLocked !== false ? "Unlock this file" : "Lock this file"}
                          >
                            {attachment.isLocked !== false ? (
                              <LockOpen className="h-4 w-4 mr-1" />
                            ) : (
                              <Lock className="h-4 w-4 mr-1" />
                            )}
                            {attachment.isLocked !== false ? "Unlock" : "Lock"}
                          </Button>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                          >
                            View
                          </a>
                        </div>
                      </div>
                      
                      {/* Remarks Section */}
                      <div className="p-4 bg-muted/50 dark:bg-slate-700/30 border-t border-border">
                        {editingFileIndex === index ? (
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Staff Remarks</label>
                            <Textarea
                              value={fileRemarks[index] || attachment.remarks || ""}
                              onChange={(e) => setFileRemarks({ ...fileRemarks, [index]: e.target.value })}
                              placeholder="Add remarks for this file (e.g., specific issues to fix)..."
                              className="min-h-20"
                              maxLength={500}
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingFileIndex(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateFileRemarks(index)}
                              >
                                Save Remarks
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {attachment.remarks ? (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Staff Remarks:</p>
                                <p className="text-sm text-foreground mb-2">{attachment.remarks}</p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setFileRemarks({ ...fileRemarks, [index]: attachment.remarks });
                                      setEditingFileIndex(index);
                                    }}
                                  >
                                    Edit Remarks
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteFileRemarks(index)}
                                  >
                                    Delete Remarks
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setFileRemarks({ ...fileRemarks, [index]: "" });
                                  setEditingFileIndex(index);
                                }}
                              >
                                Add Remarks
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Activity Log */}
            {activityLogs.length > 0 && (
              <Card className="p-6 bg-white dark:bg-slate-800/50">
                <h3 className="text-lg font-bold mb-4 text-foreground">Activity Log</h3>
                <div className="space-y-4">
                  {activityLogs.map((log: any) => (
                      <div className="flex gap-4 pb-4 border-b border-border last:border-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-meo flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-white font-bold">
                          {log.staffName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{log.staffName}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.action.replace(/_/g, " ").toUpperCase()}
                        </p>
                        {log.remarks && (
                          <p className="text-sm mt-1 text-foreground">{log.remarks}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            <Card className="p-6 bg-white dark:bg-slate-800/50">
              <h3 className="text-lg font-bold mb-4 text-foreground">Actions</h3>
              {app.status === "pending" || app.status === "for_resubmission" || app.status === "pending_resubmit" ? (
                <div className="space-y-3">
                  <Button
                    onClick={() => setAction("approve")}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => setAction("resubmit")}
                    variant="outline"
                    className="w-full"
                  >
                    Request Resubmission
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This application has already been processed.
                </p>
              )}
            </Card>

            {/* Remarks Section */}
            {action && (
              <Card className="p-6 border-2 border-primary/20 dark:border-primary/40 bg-white dark:bg-slate-800/50">
                <h3 className="text-lg font-bold mb-2 text-foreground">
                  {action === "approve" ? "Approval Notes" : "Modification Requirements"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {action === "approve" 
                    ? "Optional: Add any final notes or conditions for approval."
                    : "Specify the changes or documents required from the applicant."}
                </p>
                <Textarea
                  placeholder={action === "approve"
                    ? "E.g., Approved with conditions for safety inspection after construction..."
                    : "E.g., Please resubmit updated structural plans and engineering certification..."}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  className="mb-4"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAction}
                    disabled={updateStatusMutation.isPending}
                    className="btn-primary-meo flex-1"
                  >
                    {updateStatusMutation.isPending 
                      ? "Processing..." 
                      : action === "approve" 
                      ? "Approve Application" 
                      : "Request Modifications"}
                  </Button>
                  <Button
                    onClick={() => {
                      setAction(null);
                      setRemarks("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

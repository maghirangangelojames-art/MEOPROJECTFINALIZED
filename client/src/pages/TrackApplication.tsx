import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, FileText, Download, Home, Lock, Edit2 } from "lucide-react";
import { SkeletonPageHeader, SkeletonCard } from "@/components/SkeletonLoader";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import FileEditDialog from "@/components/FileEditDialog";
import { toast } from "sonner";

// Helper to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    for (let chunkIndex = 0; chunkIndex < chunk.length; chunkIndex++) {
      binary += String.fromCharCode(chunk[chunkIndex]);
    }
  }

  return btoa(binary);
}

export default function TrackApplication() {
  const { user } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });
  const [, navigate] = useLocation();
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null);
  const [editingFileName, setEditingFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applicationQuery = trpc.applications.getMyApplication.useQuery(undefined, {
    retry: false,
  });
  const uploadAttachmentMutation = trpc.applications.uploadAttachment.useMutation();
  const resubmitApplicationMutation = trpc.applications.resubmitApplication.useMutation();
  
  const app = applicationQuery.data;

  if (applicationQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 py-12 animate-fade-in">
          <SkeletonPageHeader />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    );
  }

  if (applicationQuery.isError) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Track Application</h1>
          </div>

          <Card className="p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-600 mx-auto" />
            <div>
              <h2 className="text-xl font-bold mb-2">No Application Found</h2>
              <p className="text-muted-foreground mb-4">
                You haven't submitted a building permit application yet.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Start by submitting your application, and you'll be able to track it here.
              </p>
            </div>
            <Button asChild className="btn-primary-meo">
              <Link href="/apply">
                Submit Application
              </Link>
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!app) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Track Application</h1>
          </div>

          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Application Found</h2>
            <p className="text-muted-foreground mb-4">
              You haven't submitted any applications yet.
            </p>
            <Button asChild>
              <Link href="/apply">Submit Application</Link>
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "for_resubmission":
        return "bg-orange-100 text-orange-800";
      case "on_hold":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleFileEdit = async (
    fileIndex: number,
    file: File,
    fileName: string
  ) => {
    if (!app) return;

    try {
      setIsSubmitting(true);

      // Upload the new file
      const fileBase64 = await fileToBase64(file);
      const uploaded = await uploadAttachmentMutation.mutateAsync({
        documentKey: `attachment_${fileIndex}`,
        fileName: file.name,
        mimeType: file.type === "application/pdf" ? "application/pdf" : "image/jpeg",
        fileBase64,
      });

      // Prepare the updated attachments array
      const updatedAttachments = [
        {
          fileIndex,
          name: file.name,
          url: uploaded.url,
          type: file.type,
        },
      ];

      // Resubmit the application with updated file
      await resubmitApplicationMutation.mutateAsync({
        applicationId: app.id,
        updatedAttachments,
      });

      setEditingFileIndex(null);
      toast.success("File updated and application resubmitted for review!");

      // Refresh the application data
      applicationQuery.refetch();
    } catch (error: any) {
      const message =
        error?.message || "Failed to update file. Please try again.";
      toast.error(message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "for_resubmission":
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case "on_hold":
        return <Clock className="h-5 w-5 text-gray-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return "Your application is being reviewed.";
      case "approved":
        return "Your application has been approved!";
      case "for_resubmission":
        return "Your application needs editing. Please review the remarks below.";
      case "on_hold":
        return "Your application is on hold.";
      default:
        return "Unknown status";
    }
  };

  const attachments = app.attachments as any[] || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Your Application</h1>
              <p className="text-sm text-muted-foreground">
                Submitted on {new Date(app.submittedAt).toLocaleDateString()} at {new Date(app.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <Card className="p-6 bg-gradient-to-r from-meo-600 to-meo-700 text-white">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(app.status)}
                <span className="text-lg font-medium">{getStatusMessage(app.status)}</span>
              </div>
              <Badge className={`${getStatusColor(app.status)}`}>
                {app.status.replace(/_/g, " ").toUpperCase()}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-white/70 text-xs uppercase">Reference Number</p>
                <p className="font-mono font-semibold text-sm">{app.referenceNumber}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs uppercase">Submitted Date & Time</p>
                <p className="font-semibold text-sm">
                  {new Date(app.submittedAt).toLocaleDateString()}<br />
                  {new Date(app.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-white/70 text-xs uppercase">Days In Review</p>
                <p className="font-semibold">{app.processingDays}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs uppercase">Processing</p>
                <p className="font-semibold">
                  {app.statusIndicator === "green" && "0-1 day"}
                  {app.statusIndicator === "yellow" && "2 days"}
                  {app.statusIndicator === "red" && "3+ days"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Application Details */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Applicant Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-muted-foreground font-medium">Full Name</label>
              <p className="font-semibold mt-1">{app.applicantName}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Capacity</label>
              <p className="font-semibold mt-1">{app.applicantCapacity}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Email</label>
              <p className="text-sm mt-1">{app.applicantEmail}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Phone</label>
              <p className="text-sm mt-1">{app.applicantPhone}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Barangay</label>
              <p className="font-semibold mt-1">{app.barangay}</p>
            </div>
          </div>
        </Card>

        {/* Property Information */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Property Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium">Location</label>
              <p className="font-semibold mt-1">{app.propertyLocation}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">Complete Address</label>
              <p className="text-sm mt-1">{app.propertyAddress}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Project Type</label>
                <p className="font-semibold mt-1">{app.projectType}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Building Classification</label>
                <p className="font-semibold mt-1">
                  {app.buildingClassification || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Project Scope */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Project Scope</h2>
          <p className="text-sm whitespace-pre-wrap text-gray-700">{app.projectScope}</p>
        </Card>

        {/* File Attachments */}
        {attachments.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Uploaded Documents</h2>
            <div className="space-y-3">
              {attachments.map((attachment: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">{attachment.type}</p>
                      {attachment.remarks && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                          <span className="font-medium">Staff Remarks:</span> {attachment.remarks}
                        </p>
                      )}
                    </div>
                    {(attachment.isLocked !== false) && (
                      <div className="flex items-center gap-1 ml-2" title="File is locked">
                        <Lock className="h-4 w-4 text-amber-600" />
                        <span className="text-xs text-amber-600 font-medium">Locked</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {app.status === "for_resubmission" && attachment.isLocked === false && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingFileIndex(idx);
                          setEditingFileName(attachment.name);
                        }}
                        title="Replace this file"
                      >
                        <Edit2 className="h-4 w-4 text-blue-600" />
                        <span className="sr-only">Edit file</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      title="Download document"
                    >
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* File Edit Dialog */}
        {app && editingFileIndex !== null && (
          <FileEditDialog
            open={editingFileIndex !== null}
            onOpenChange={(open) => {
              if (!open) {
                setEditingFileIndex(null);
                setEditingFileName("");
              }
            }}
            fileName={editingFileName}
            fileIndex={editingFileIndex}
            onSubmit={handleFileEdit}
            isLoading={isSubmitting}
          />
        )}

        {/* Staff Remarks */}
        {app.staffRemarks && (
          <Card className="p-6 border-amber-200 bg-amber-50">
            <h2 className="text-xl font-bold mb-2 text-amber-900">Staff Remarks</h2>
            <p className="text-sm text-amber-800 whitespace-pre-wrap">{app.staffRemarks}</p>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

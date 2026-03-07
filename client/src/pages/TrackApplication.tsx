import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, FileText, Download, Home, Lock, Edit2, Edit3 } from "lucide-react";
import { SkeletonPageHeader, SkeletonCard } from "@/components/SkeletonLoader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import FileEditDialog from "@/components/FileEditDialog";
import { toast } from "sonner";
import { getFormattedDocumentLabel } from "@/lib/documentLabels";

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

const barangays = [
  "Antipolo",
  "Balubal",
  "Barangay 1 (Pob.)",
  "Barangay 2 (Pob.)",
  "Barangay 3 (Pob.)",
  "Barangay 4 (Pob.)",
  "Barangay 5 (Pob.)",
  "Barangay 6 (Pob.)",
  "Bignay 1",
  "Bignay 2",
  "Bucal",
  "Canda",
  "Castañas",
  "Concepcion 1",
  "Concepcion Banahaw",
  "Concepcion Palasan",
  "Concepcion Pinagbakuran",
  "Gibanga",
  "Guisguis San Roque",
  "Guisguis Talon",
  "Janagdong 1",
  "Janagdong 2",
  "Limbon",
  "Lutucan 1",
  "Lutucan Bata",
  "Lutucan Malabag",
  "Mamala 1",
  "Mamala 2",
  "Manggalang 1",
  "Manggalang Bantilan",
  "Manggalang Kiling",
  "Manggalang Tulo-Tulo",
  "Montecillo",
  "Morong",
  "Pili",
  "Sampaloc 1",
  "Sampaloc 2",
  "Sampaloc Bogon",
  "Sampaloc Santo Cristo",
  "Talaan Aplaya",
  "Talaan Pantoc",
  "Tumbaga 1",
  "Tumbaga 2",
];

const capacities = ["Owner", "Authorized Representative"];

const projectTypes = [
  "Dwellings",
  "Buildings/Structures",
  "Hotels",
  "Apartments",
];

const buildingClassifications = [
  "Type 1 - Wood",
  "Type 2 - Wood with Non-combustible Roof",
  "Type 3 - Ordinary Masonry/Concrete",
  "Type 4 - Incombustible",
  "Type 5 - Fire Resistive",
];

// Document label mapping for display
// Document labels are now imported from @/lib/documentLabels

export default function TrackApplication() {
  const { user } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });
  const [, navigate] = useLocation();
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null);
  const [editingFileName, setEditingFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResubmissionDialog, setShowResubmissionDialog] = useState(false);
  const [resubmissionFormData, setResubmissionFormData] = useState<any>({});

  const applicationQuery = trpc.applications.getMyApplication.useQuery(undefined, {
    retry: false,
  });
  const uploadAttachmentMutation = trpc.applications.uploadAttachment.useMutation();
  const resubmitApplicationMutation = trpc.applications.resubmitApplication.useMutation();
  const updateAppInfoMutation = trpc.applications.updateApplicationInfoDuringResubmission.useMutation();
  
  const app = applicationQuery.data;

  // Initialize resubmission form when dialog opens
  useEffect(() => {
    if (showResubmissionDialog && app) {
      setResubmissionFormData({
        applicantName: app.applicantName || "",
        applicantEmail: app.applicantEmail || "",
        applicantPhone: app.applicantPhone || "",
        applicantCapacity: app.applicantCapacity || "",
        ownerName: app.ownerName || "",
        barangay: app.barangay || "",
        propertyLocation: app.propertyLocation || "",
        propertyAddress: app.propertyAddress || "",
        projectType: app.projectType || "",
        projectScope: app.projectScope || "",
        buildingClassification: app.buildingClassification || "",
      });
    }
  }, [showResubmissionDialog, app]);

  // Create notifications when application status changes
  useEffect(() => {
    if (!app) return;

    const notifications = JSON.parse(localStorage.getItem("appNotifications") || "[]");
    const hasNotificationForThisStatus = notifications.some(
      (n: any) => n.applicationRef === app.referenceNumber && 
      (n.type === "resubmission_requested" || n.type === "remarks" || n.type === "approved") &&
      new Date(n.timestamp).getTime() > new Date(app.updatedAt).getTime() - 5000
    );

    if (hasNotificationForThisStatus) return; // Notification already created

    // Create notification if application is approved
    if (app.status === "approved") {
      const newNotification = {
        id: Date.now(),
        type: "approved",
        message: "🎉 Your building permit application has been approved! Congratulations!",
        applicationRef: app.referenceNumber,
        status: "approved",
        timestamp: new Date(),
        read: false,
      };
      notifications.unshift(newNotification);
      localStorage.setItem("appNotifications", JSON.stringify(notifications.slice(0, 50)));
      return;
    }

    // Create notification if application requires resubmission with remarks
    if (app.status === "for_resubmission") {
      const hasRemarks = (app.attachments as any[])?.some((att: any) => att.remarks) || app.staffRemarks;
      
      if (hasRemarks) {
        const newNotification = {
          id: Date.now(),
          type: "resubmission_requested",
          message: app.staffRemarks 
            ? "Your application requires modifications. Staff has provided detailed remarks for your review."
            : "Your application requires modifications. Please review the staff remarks and unlock files.",
          applicationRef: app.referenceNumber,
          status: "for_resubmission",
          remarks: app.staffRemarks,
          timestamp: new Date(),
          read: false,
        };
        notifications.unshift(newNotification);
        localStorage.setItem("appNotifications", JSON.stringify(notifications.slice(0, 50)));
      }
    }

    // Create notification if there are file remarks
    const attachmentsWithRemarks = (app.attachments as any[])?.filter((att: any) => att.remarks) || [];
    if (attachmentsWithRemarks.length > 0) {
      const hasRemarksNotification = notifications.some(
        (n: any) => n.type === "remarks" && n.applicationRef === app.referenceNumber
      );

      if (!hasRemarksNotification) {
        const newNotification = {
          id: Date.now(),
          type: "remarks",
          message: `Staff has added remarks to ${attachmentsWithRemarks.length} document(s). Please review the feedback.`,
          applicationRef: app.referenceNumber,
          status: app.status,
          timestamp: new Date(),
          read: false,
        };
        notifications.unshift(newNotification);
        localStorage.setItem("appNotifications", JSON.stringify(notifications.slice(0, 50)));
      }
    }
  }, [app]);

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
      case "pending_resubmit":
        return "bg-blue-100 text-blue-800";
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

  const handleResubmissionSubmit = async () => {
    if (!app) return;

    try {
      setIsSubmitting(true);

      // Submit the updated application information
      await updateAppInfoMutation.mutateAsync({
        applicationId: app.id,
        applicantName: resubmissionFormData.applicantName || undefined,
        applicantEmail: resubmissionFormData.applicantEmail || undefined,
        applicantPhone: resubmissionFormData.applicantPhone || undefined,
        applicantCapacity: resubmissionFormData.applicantCapacity || undefined,
        ownerName: resubmissionFormData.ownerName || undefined,
        barangay: resubmissionFormData.barangay || undefined,
        propertyLocation: resubmissionFormData.propertyLocation || undefined,
        propertyAddress: resubmissionFormData.propertyAddress || undefined,
        projectType: resubmissionFormData.projectType || undefined,
        projectScope: resubmissionFormData.projectScope || undefined,
        buildingClassification: resubmissionFormData.buildingClassification || undefined,
      });

      toast.success("✓ Application information updated and resubmitted for review!");
      setShowResubmissionDialog(false);
      applicationQuery.refetch();
    } catch (error: any) {
      const message =
        error?.message || "Failed to update application. Please try again.";
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
      case "pending_resubmit":
        return <Clock className="h-5 w-5 text-blue-600" />;
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
      case "pending_resubmit":
        return "Your resubmitted application is being reviewed.";
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
        <Card className="p-6 bg-gradient-to-r from-meo-600 to-meo-700 dark:text-white text-black">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t dark:border-white/20 border-black/20">
              <div>
                <p className="dark:text-white/70 text-black/70 text-xs uppercase">Reference Number</p>
                <p className="font-mono font-semibold text-sm">{app.referenceNumber}</p>
              </div>
              <div>
                <p className="dark:text-white/70 text-black/70 text-xs uppercase">Submitted Date & Time</p>
                <p className="font-semibold text-sm">
                  {new Date(app.submittedAt).toLocaleDateString()}<br />
                  {new Date(app.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="dark:text-white/70 text-black/70 text-xs uppercase">Days In Review</p>
                <p className="font-semibold">{app.processingDays}</p>
              </div>
              {app.approvalDays !== null && app.approvalDays !== undefined && (
                <div>
                  <p className="dark:text-white/70 text-black/70 text-xs uppercase">Approval Time</p>
                  <p className="font-semibold dark:text-green-400 text-green-600">
                    {app.approvalDays === 0 ? 'Same day' : `${app.approvalDays} day${app.approvalDays !== 1 ? 's' : ''}`}
                  </p>
                </div>
              )}
              <div>
                <p className="dark:text-white/70 text-black/70 text-xs uppercase">Processing</p>
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
              {attachments.map((attachment: any, idx: number) => {
                console.log(`[DEBUG] Attachment ${idx}:`, { documentKey: attachment.documentKey, label: attachment.label, name: attachment.name });
                return (
                <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{attachment.name}</p>
                      {(attachment.documentKey || attachment.label) && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                          {attachment.documentKey ? getFormattedDocumentLabel(attachment.documentKey) : attachment.label}
                        </p>
                      )}
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
                    {(app.status === "for_resubmission" || app.status === "pending_resubmit") && attachment.isLocked === false && (
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
                      title="View document"
                    >
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="sr-only">View</span>
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      title="Download document"
                    >
                      <a href={attachment.url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </a>
                    </Button>
                  </div>
                </div>
              );
              })}
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
          {(app.status === "for_resubmission" || app.status === "pending_resubmit") && (
            <Button 
              onClick={() => setShowResubmissionDialog(true)}
              className="btn-primary-meo"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Resubmit & Edit Application
            </Button>
          )}
        </div>

        {/* Resubmission Dialog */}
        <Dialog open={showResubmissionDialog} onOpenChange={setShowResubmissionDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Resubmit Application & Edit Information</DialogTitle>
              <DialogDescription>
                Update your application information before resubmitting. All fields are optional - only update what needs to be changed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Applicant Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base">Applicant Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="applicantName" className="text-sm">
                      Full Name
                    </Label>
                    <Input
                      id="applicantName"
                      value={resubmissionFormData.applicantName || ""}
                      onChange={(e) =>
                        setResubmissionFormData({
                          ...resubmissionFormData,
                          applicantName: e.target.value,
                        })
                      }
                      placeholder="Your full name"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="applicantCapacity" className="text-sm">
                      Your Capacity
                    </Label>
                    <Select
                      value={resubmissionFormData.applicantCapacity || ""}
                      onValueChange={(value) =>
                        setResubmissionFormData({
                          ...resubmissionFormData,
                          applicantCapacity: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select capacity" />
                      </SelectTrigger>
                      <SelectContent>
                        {capacities.map((cap) => (
                          <SelectItem key={cap} value={cap}>
                            {cap}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {resubmissionFormData.applicantCapacity === "Authorized Representative" && (
                    <div>
                      <Label htmlFor="ownerName" className="text-sm">
                        Property Owner Name
                      </Label>
                      <Input
                        id="ownerName"
                        value={resubmissionFormData.ownerName || ""}
                        onChange={(e) =>
                          setResubmissionFormData({
                            ...resubmissionFormData,
                            ownerName: e.target.value,
                          })
                        }
                        placeholder="Owner's full name"
                        className="mt-2"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="applicantEmail" className="text-sm">
                      Email
                    </Label>
                    <Input
                      id="applicantEmail"
                      type="email"
                      value={resubmissionFormData.applicantEmail || ""}
                      onChange={(e) =>
                        setResubmissionFormData({
                          ...resubmissionFormData,
                          applicantEmail: e.target.value,
                        })
                      }
                      placeholder="your.email@example.com"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="applicantPhone" className="text-sm">
                      Phone Number
                    </Label>
                    <Input
                      id="applicantPhone"
                      value={resubmissionFormData.applicantPhone || ""}
                      onChange={(e) =>
                        setResubmissionFormData({
                          ...resubmissionFormData,
                          applicantPhone: e.target.value,
                        })
                      }
                      placeholder="+639123456789"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="barangay" className="text-sm">
                      Barangay
                    </Label>
                    <Select
                      value={resubmissionFormData.barangay || ""}
                      onValueChange={(value) =>
                        setResubmissionFormData({
                          ...resubmissionFormData,
                          barangay: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select barangay" />
                      </SelectTrigger>
                      <SelectContent>
                        {barangays.map((barangay) => (
                          <SelectItem key={barangay} value={barangay}>
                            {barangay}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base">Property Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="propertyLocation" className="text-sm">
                      Location
                    </Label>
                    <Input
                      id="propertyLocation"
                      value={resubmissionFormData.propertyLocation || ""}
                      onChange={(e) =>
                        setResubmissionFormData({
                          ...resubmissionFormData,
                          propertyLocation: e.target.value,
                        })
                      }
                      placeholder="e.g., Downtown, Poblacion"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="propertyAddress" className="text-sm">
                      Complete Address
                    </Label>
                    <Input
                      id="propertyAddress"
                      value={resubmissionFormData.propertyAddress || ""}
                      onChange={(e) =>
                        setResubmissionFormData({
                          ...resubmissionFormData,
                          propertyAddress: e.target.value,
                        })
                      }
                      placeholder="Street, Barangay, Municipality"
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="projectType" className="text-sm">
                        Project Type
                      </Label>
                      <Select
                        value={resubmissionFormData.projectType || ""}
                        onValueChange={(value) =>
                          setResubmissionFormData({
                            ...resubmissionFormData,
                            projectType: value,
                          })
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="buildingClassification" className="text-sm">
                        Building Classification
                      </Label>
                      <Select
                        value={resubmissionFormData.buildingClassification || ""}
                        onValueChange={(value) =>
                          setResubmissionFormData({
                            ...resubmissionFormData,
                            buildingClassification: value,
                          })
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select classification" />
                        </SelectTrigger>
                        <SelectContent>
                          {buildingClassifications.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Scope */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base">Project Scope</h3>
                <Label htmlFor="projectScope" className="text-sm">
                  Description
                </Label>
                <Textarea
                  id="projectScope"
                  value={resubmissionFormData.projectScope || ""}
                  onChange={(e) =>
                    setResubmissionFormData({
                      ...resubmissionFormData,
                      projectScope: e.target.value,
                    })
                  }
                  placeholder="Describe the scope of your project..."
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Dialog Actions */}
            <div className="flex gap-3 justify-end border-t pt-6">
              <Button
                variant="outline"
                onClick={() => setShowResubmissionDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResubmissionSubmit}
                disabled={isSubmitting}
                className="btn-primary-meo"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Resubmit Application
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

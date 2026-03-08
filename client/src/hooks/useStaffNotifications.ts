import { useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

interface StoredStaffNotification {
  id: number;
  type: "submission_received" | "resubmission_received";
  message: string;
  applicantName: string;
  applicantEmail: string;
  applicationRef: string;
  applicationId: number;
  timestamp: Date;
  read: boolean;
  detailsCount?: number;
}

export function useStaffNotifications() {
  const { user } = useAuth();
  const listApplicationsQuery = trpc.applications.list.useQuery(
    { limit: 50, offset: 0 },
    {
      enabled: user?.role === "staff" || user?.role === "admin",
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  const syncNotifications = useCallback(() => {
    if (!listApplicationsQuery.data) return;

    const applications = listApplicationsQuery.data;
    const stored = localStorage.getItem("staffNotifications");
    const existingNotifications: StoredStaffNotification[] = stored
      ? JSON.parse(stored)
      : [];

    // Get notification refs that already exist
    const existingRefs = new Set(existingNotifications.map((n) => n.applicationRef));

    // Create notifications for new pending applications
    const newNotifications = applications
      .filter(
        (app) =>
          (app.status === "pending" || app.status === "pending_resubmit") &&
          !existingRefs.has(app.referenceNumber)
      )
      .map((app) => ({
        id: Date.now() + Math.random(),
        type:
          app.status === "pending_resubmit"
            ? ("resubmission_received" as const)
            : ("submission_received" as const),
        message:
          app.status === "pending_resubmit"
            ? `${app.applicantName} has resubmitted their application with updated files.`
            : `New application submitted and ready for review.`,
        applicantName: app.applicantName,
        applicantEmail: app.applicantEmail,
        applicationRef: app.referenceNumber,
        applicationId: app.id,
        timestamp: new Date(),
        read: false,
        detailsCount: app.status === "pending_resubmit" ? 1 : undefined,
      }));

    if (newNotifications.length > 0) {
      const allNotifications = [
        ...newNotifications,
        ...existingNotifications,
      ].slice(0, 50); // Keep only last 50
      localStorage.setItem("staffNotifications", JSON.stringify(allNotifications));
    }
  }, [listApplicationsQuery.data]);

  useEffect(() => {
    syncNotifications();
  }, [syncNotifications]);

  return {
    notifications: listApplicationsQuery.data || [],
    isLoading: listApplicationsQuery.isLoading,
    refetch: listApplicationsQuery.refetch,
  };
}

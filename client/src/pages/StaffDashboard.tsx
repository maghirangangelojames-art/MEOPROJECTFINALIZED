import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Clock, CheckCircle2, AlertCircle, Pause, FileText, TrendingUp, Zap, ArrowLeft } from "lucide-react";
import { SkeletonAppCard } from "@/components/SkeletonLoader";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { toast } from "sonner";

export default function StaffDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "for_resubmission" | "resubmitted">("pending");
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  // Check if user is staff
  if (user?.role !== "staff" && user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 flex items-center justify-center animate-fade-in">
        <Card className="p-8 text-center max-w-md card-hover shadow-xl">
          <div className="h-14 w-14 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the staff dashboard.
          </p>
          <Button asChild className="btn-primary-meo">
            <Link href="/">Back to Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Fetch applications based on filters
  const applicationsQuery = searchQuery
    ? trpc.applications.search.useQuery({
        query: searchQuery,
        limit,
        offset,
      })
    : statusFilter === "all"
    ? trpc.applications.list.useQuery({ limit, offset })
    : statusFilter === "resubmitted"
    ? trpc.applications.byStatus.useQuery({
        status: "pending_resubmit" as any,
        limit,
        offset,
      })
    : trpc.applications.byStatus.useQuery({
        status: statusFilter as any,
        limit,
        offset,
      });

  const applications = applicationsQuery.data || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="badge-status-yellow">⏳ Pending</Badge>;
      case "approved":
        return <Badge className="badge-status-green">✓ Approved</Badge>;
      case "for_resubmission":
        return <Badge className="badge-status-red">↺ Resubmission Needed</Badge>;
      case "pending_resubmit":
        return <Badge variant="outline" className="badge-status-blue">↻ Resubmitted</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getProcessingIndicator = (statusIndicator: "green" | "yellow" | "red", processingDays: number) => {
    const colors = {
      green: "bg-green-500",
      yellow: "bg-yellow-500", 
      red: "bg-red-500",
    };

    const labels = {
      green: "0-1 day",
      yellow: "2 days",
      red: "3+ days",
    };

    return (
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${colors[statusIndicator]} indicator-pulse`} />
        <span className="text-xs font-medium text-muted-foreground">{labels[statusIndicator]}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-800 dark:from-blue-950 dark:via-blue-900 dark:to-slate-900 border-b border-border/20 sticky top-0 z-40 shadow-md animate-slide-in-down">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-white hover:bg-white/10"
              >
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="h-12 w-12 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Staff Dashboard</h1>
                <p className="text-blue-100 text-sm mt-1">Manage building permit applications</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white text-sm font-light">Welcome back,</p>
              <p className="text-white text-lg font-semibold">{user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 animate-fade-in">
        {/* Search and Filters */}
        <Card className="p-6 mb-8 card-hover shadow-lg">
          <div className="space-y-4">
            <div className="flex gap-3 flex-col sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="🔍 Search by name, reference number, or location..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setOffset(0);
                  }}
                  className="pl-10 transition-all focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => {
                setStatusFilter(value);
                setOffset(0);
              }}>
                <SelectTrigger className="w-full sm:w-56 transition-all focus:ring-2 focus:ring-primary/50">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📋 All Applications</SelectItem>
                  <SelectItem value="pending">⏳ Pending</SelectItem>
                  <SelectItem value="approved">✓ Approved</SelectItem>
                  <SelectItem value="for_resubmission">↺ Resubmission Needed</SelectItem>
                  <SelectItem value="resubmitted">↻ Resubmitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Applications List */}
        <div className="space-y-4">
          {applicationsQuery.isLoading ? (
            <>
              <SkeletonAppCard />
              <SkeletonAppCard />
              <SkeletonAppCard />
            </>
          ) : applications.length === 0 ? (
            <Card className="p-12 text-center card-hover shadow-md">
              <div className="inline-block p-4 bg-amber-100 dark:bg-amber-900 rounded-full mb-4">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-muted-foreground font-medium">No applications found</p>
              <p className="text-muted-foreground text-sm mt-2">Try adjusting your filters or search terms</p>
            </Card>
          ) : (
            applications.map((app: any, index: number) => (
              <Card
                key={app.id}
                className="p-6 card-interactive shadow-md hover:shadow-xl transition-all duration-300 group animate-slide-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(`/application/${app.id}`)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Application Info */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ref #</p>
                    <p className="font-mono font-bold text-base text-foreground">{app.referenceNumber}</p>
                    <p className="text-sm text-muted-foreground truncate group-hover:text-primary transition-colors">{app.applicantName}</p>
                  </div>

                  {/* Property Info */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">🏠 Location</p>
                    <p className="font-semibold text-sm text-foreground">{app.propertyLocation}</p>
                    <p className="text-sm text-muted-foreground text-xs">{app.projectType}</p>
                  </div>

                  {/* Submission Time & Processing */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">📅 Submitted</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(app.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {getProcessingIndicator(app.statusIndicator, app.processingDays)}
                    {app.approvalDays !== null && app.approvalDays !== undefined && (
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          Approved in {app.approvalDays === 0 ? 'same day' : `${app.approvalDays} day${app.approvalDays !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    )}

                  {/* Status */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</p>
                    {getStatusBadge(app.status)}
                  </div>

                  {/* Action */}
                  <div className="space-y-2 flex flex-col justify-between">
                    <div />
                    <Button
                      size="sm"
                      className="btn-primary-meo w-full group-hover:shadow-lg transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/application/${app.id}`);
                      }}
                    >
                      Review →
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {applications.length > 0 && (
          <div className="flex justify-between items-center mt-10">
            <Button
              variant="outline"
              className="btn-secondary-meo"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              ← Previous
            </Button>
            <span className="text-sm font-medium text-muted-foreground px-4 py-2 bg-white dark:bg-gray-800 rounded-lg">
              Showing {offset + 1} - {offset + applications.length}
            </span>
            <Button
              variant="outline"
              className="btn-secondary-meo"
              disabled={applications.length < limit}
              onClick={() => setOffset(offset + limit)}
            >
              Next →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

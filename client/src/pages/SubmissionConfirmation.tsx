import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Copy, Home, FileText, Calendar, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export default function SubmissionConfirmation() {
  const [location] = useLocation();
  const [copied, setCopied] = useState(false);
  const [refNumber, setRefNumber] = useState<string>("");
  
  // Extract reference number from URL on mount
  useEffect(() => {
    // Use window.location.search to get the query string
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("refNumber") || "PERMIT-2026-00000";
    setRefNumber(ref);
    console.log("[SubmissionConfirmation] Extracted refNumber:", ref, "from search:", window.location.search);
  }, []);
  
  // Fetch the application to get the exact submission timestamp from the database
  const applicationQuery = trpc.applications.getByRefNumber.useQuery(
    { refNumber },
    { 
      enabled: !!refNumber && refNumber !== "PERMIT-2026-00000",
      retry: 2,
    }
  );
  
  const app = applicationQuery.data;
  const submissionTime = app?.submittedAt ? new Date(app.submittedAt) : null;

  useEffect(() => {
    if (applicationQuery.error) {
      console.error("[SubmissionConfirmation] Query error:", applicationQuery.error);
    }
    if (app) {
      console.log("[SubmissionConfirmation] Application data loaded:", app);
    }
  }, [applicationQuery.error, app]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(refNumber);
    setCopied(true);
    toast.success("Reference number copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <Card className="p-8 sm:p-12 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Title and Message */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-black dark:text-white">
              Application Submitted!
            </h1>
            <p className="text-lg text-black dark:text-white">
              Your building permit application has been successfully submitted and is now being processed.
            </p>
          </div>

          {/* Reference Number Section */}
          <div className="bg-gradient-meo rounded-lg p-6 text-white space-y-3">
            <p className="text-sm font-medium opacity-90 text-black dark:text-white">Your Reference Number</p>
            <div className="flex items-center justify-center gap-3">
              <code className="text-2xl font-bold tracking-wider text-black dark:text-white">{refNumber}</code>
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Copy reference number"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs opacity-75 text-black dark:text-white">
              {copied ? "✓ Copied to clipboard" : "Click to copy"}
            </p>
            
            {/* Date and Time Submitted */}
            {refNumber === "PERMIT-2026-00000" ? (
              <div className="border-t border-white/20 pt-4 mt-4">
                <p className="text-xs opacity-75 text-center text-black dark:text-white">Reference number not found in URL</p>
              </div>
            ) : applicationQuery.isLoading ? (
              <div className="border-t border-white/20 pt-4 mt-4 animate-pulse">
                <p className="text-xs opacity-50 text-center text-black dark:text-white">Loading submission time...</p>
              </div>
            ) : applicationQuery.isError ? (
              <div className="border-t border-white/20 pt-4 mt-4">
                <p className="text-xs opacity-75 text-center text-black dark:text-white">Unable to load submission time</p>
              </div>
            ) : submissionTime ? (
              <div className="border-t border-white/20 pt-4 mt-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-black dark:text-white">
                  <Calendar className="h-4 w-4" />
                  <span>{submissionTime.toLocaleDateString('en-PH', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-black dark:text-white">
                  <Clock className="h-4 w-4" />
                  <span>{submissionTime.toLocaleTimeString('en-PH', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true 
                  })}</span>
                </div>
              </div>
            ) : (
              <div className="border-t border-white/20 pt-4 mt-4">
                <p className="text-xs opacity-75 text-center text-black dark:text-white">Submission time unavailable</p>
              </div>
            )}
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-left space-y-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-lg">What Happens Next?</h3>
            <ol className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-300 flex-shrink-0">1.</span>
                <span>Your application will be reviewed by our staff within 1-3 business days.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-300 flex-shrink-0">2.</span>
                <span>You will be notified on your View Application page for your application status.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-300 flex-shrink-0">3.</span>
                <span>The staff will send you either an approval or, if files are not correct, additional changes are necessary.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-300 flex-shrink-0">4.</span>
                <span>Once approved, bring all your hard copies to Sariaya Municipal Engineering Office.</span>
              </li>
            </ol>
          </div>

          {/* Important Notes */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-left">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <span className="font-semibold">📌 Important:</span> Save your reference number for future inquiries. You can use it to track your application status at any time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              asChild
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button
              asChild
              className="btn-primary-meo flex items-center justify-center gap-2"
            >
              <Link href="/track-application">
                <FileText className="h-4 w-4" />
                Track Application
              </Link>
            </Button>
          </div>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Need help? Contact us at <a href="mailto:meo@sariaya.gov.ph" className="text-primary hover:underline">meo@sariaya.gov.ph</a> or call <a href="tel:+639123456789" className="text-primary hover:underline">+63 9123 456 789</a>
          </p>
        </div>
      </div>
    </div>
  );
}

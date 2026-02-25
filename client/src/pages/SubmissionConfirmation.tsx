import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Copy, Home, FileText } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function SubmissionConfirmation() {
  const [location] = useLocation();
  const [copied, setCopied] = useState(false);
  
  // Extract reference number from URL
  const params = new URLSearchParams(location.split("?")[1]);
  const refNumber = params.get("refNumber") || "PERMIT-2026-00000";

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
            <h1 className="text-4xl font-bold text-foreground">
              Application Submitted!
            </h1>
            <p className="text-lg text-muted-foreground">
              Your building permit application has been successfully submitted and is now being processed.
            </p>
          </div>

          {/* Reference Number Section */}
          <div className="bg-gradient-meo rounded-lg p-6 text-white space-y-3">
            <p className="text-sm font-medium opacity-90">Your Reference Number</p>
            <div className="flex items-center justify-center gap-3">
              <code className="text-2xl font-bold tracking-wider">{refNumber}</code>
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Copy reference number"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs opacity-75">
              {copied ? "✓ Copied to clipboard" : "Click to copy"}
            </p>
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left space-y-4">
            <h3 className="font-semibold text-blue-900 text-lg">What Happens Next?</h3>
            <ol className="space-y-3 text-sm text-blue-800">
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
                <span>Your application will be reviewed by our staff within 3 business days.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
                <span>You will receive email updates on the status of your application.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
                <span>Use your reference number to track your application status anytime.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">4.</span>
                <span>If additional documents are needed, we will notify you via email.</span>
              </li>
            </ol>
          </div>

          {/* Important Notes */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
            <p className="text-sm text-amber-900">
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

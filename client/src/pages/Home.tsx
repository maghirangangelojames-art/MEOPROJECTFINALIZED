import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, FileText, CheckCircle, Clock, TrendingUp, Zap, Shield, Globe, HelpCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";

export default function Home() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const canStartApplication = isAuthenticated && user?.role === "user";

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-slide-in-down">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-gradient-meo flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">MEO Sariaya</h1>
              <p className="text-xs text-muted-foreground">Building Permit System</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-sm text-muted-foreground hidden sm:inline font-medium">
                  {user?.name || "User"}
                </span>
                {user?.role === "user" && (
                  <Link href="/track-application">
                    <Button variant="outline" size="sm" className="transition-all hover:bg-primary/10">
                      View Application
                    </Button>
                  </Link>
                )}
                {user?.role !== "user" && (
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="transition-all hover:bg-primary/10">
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout} disabled={loading} className="transition-all hover:bg-destructive/10">
                  Logout
                </Button>
              </div>
            ) : (
              <Button asChild size="sm" className="btn-primary-meo">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-meo relative overflow-hidden py-16 sm:py-24 lg:py-40">
        <div className="container relative z-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-8 text-white animate-slide-in-left">
              <div className="space-y-3">
                <div className="inline-block px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-white/90 backdrop-blur-sm border border-white/20">
                  ✨ Streamlined Permit Process
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
                  Digital Building Permit System
                </h1>
                <p className="text-lg text-white/85 sm:text-xl font-light">
                  Fast, secure, and transparent building permit applications. Manage your permits with ease.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {canStartApplication ? (
                  <Button asChild size="lg" className="btn-lg-primary-meo shadow-xl">
                    <Link href="/apply">Start Application</Link>
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          size="lg"
                          className="bg-white text-primary hover:bg-white/90 disabled:opacity-100 shadow-xl font-semibold"
                          disabled
                        >
                          Start Application
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      You must sign in first before starting an application.
                    </TooltipContent>
                  </Tooltip>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 hover:text-white shadow-sm"
                  onClick={() => setLearnMoreOpen(true)}
                >
                  Learn More
                </Button>
              </div>
              {!canStartApplication ? (
                <Alert className="bg-white/95 text-foreground border-white/70 max-w-xl rounded-lg shadow-lg animate-scale-in">
                  <AlertDescription>
                    ℹ️ Sign in first to start your building permit application.
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>

            {/* Hero Illustration */}
            <div className="relative h-64 sm:h-80 lg:h-96 animate-slide-in-right">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-300 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/5 rounded-2xl blur-2xl animate-pulse" />
                  <FileText className="h-32 w-32 text-white/40 relative" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -z-10 h-96 w-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 bg-white/5 rounded-full blur-3xl" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 lg:py-32 animate-fade-in">
        <div className="container space-y-16">
          <div className="space-y-4 text-center animate-slide-in-up">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Why Choose Our System?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
              Experience a streamlined permit application process designed for efficiency, transparency, and ease of use.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card className="card-hover group animate-slide-in-up" style={{ animationDelay: "0s" }}>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center group-hover:scale-125 transition-transform duration-300 shadow-md">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Quick Setup</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Complete your application in minutes with our intuitive guided process.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card className="card-hover group animate-slide-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center group-hover:scale-125 transition-transform duration-300 shadow-md">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Real-time Tracking</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Monitor your application status with live updates and transparent timelines.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card className="card-hover group animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center group-hover:scale-125 transition-transform duration-300 shadow-md">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Secure & Encrypted</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your data is protected with enterprise-grade encryption and security.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 4 */}
            <Card className="card-hover group animate-slide-in-up" style={{ animationDelay: "0.3s" }}>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center group-hover:scale-125 transition-transform duration-300 shadow-md">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">24/7 Access</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Access your applications anytime, anywhere from any device.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 5 */}
            <Card className="card-hover group animate-slide-in-up" style={{ animationDelay: "0.4s" }}>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center group-hover:scale-125 transition-transform duration-300 shadow-md">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Analytics & Insights</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    View detailed system metrics and application processing analytics.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 6 */}
            <Card className="card-hover group animate-slide-in-up" style={{ animationDelay: "0.5s" }}>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center group-hover:scale-125 transition-transform duration-300 shadow-md">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Verified & Certified</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Official municipal government system for permit processing.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats Section */}
          <div className="mt-16 grid gap-8 sm:grid-cols-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-2xl p-8 shadow-lg animate-scale-in">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <p className="text-muted-foreground">Applications Processed</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <p className="text-muted-foreground">Satisfaction Rate</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">2-3 days</div>
              <p className="text-muted-foreground">Average Processing Time</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid gap-6 sm:grid-cols-3 mt-12">
            <Card className="card-hover p-8 space-y-4 text-center animate-slide-in-up">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 mx-auto mb-2 shadow-md">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-xl">For Applicants</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Start your building permit application process today
              </p>
              {canStartApplication ? (
                <Button asChild className="btn-primary-meo w-full">
                  <Link href="/apply">Start Application</Link>
                </Button>
              ) : (
                <div className="space-y-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block w-full">
                        <Button className="btn-primary-meo w-full disabled:opacity-100" disabled>
                          Start Application
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Sign in first to start an application.
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </Card>
            <Card className="card-hover p-8 space-y-4 text-center animate-slide-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 mx-auto mb-2 shadow-md">
                <LayoutDashboard className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-xl">For Staff</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Access the staff dashboard to manage applications
              </p>
              <Button asChild className="btn-secondary-meo w-full">
                <Link href="/dashboard">Staff Dashboard</Link>
              </Button>
            </Card>
            <Card className="card-hover p-8 space-y-4 text-center animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-green-600 mx-auto mb-2 shadow-md">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-semibold text-xl">System Report</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                View analytics and system performance metrics
              </p>
              <Button asChild className="btn-secondary-meo w-full">
                <Link href="/report">View Report</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 py-16 sm:py-20 lg:py-28 animate-fade-in">
        <div className="container space-y-8 text-center">
          <div className="space-y-4 animate-slide-in-up">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
              Submit your building permit application today and track its progress in real-time.
            </p>
          </div>
          {canStartApplication ? (
            <Button asChild size="lg" className="btn-lg-primary-meo animate-scale-in">
              <Link href="/apply">Start Your Application Now</Link>
            </Button>
          ) : (
            <div className="max-w-xl mx-auto space-y-4 animate-scale-in">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block w-full">
                    <Button size="lg" className="btn-primary-meo w-full disabled:opacity-100" disabled>
                      Start Your Application Now
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Sign in first to start an application.
                </TooltipContent>
              </Tooltip>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href="/login">Sign In Here</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12 sm:py-16">
        <div className="container space-y-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3 animate-slide-in-up">
              <h3 className="font-semibold text-lg">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Digital Building Permit System for the Municipal Engineering Office of Sariaya, Quezon.
              </p>
            </div>
            <div className="space-y-3 animate-slide-in-up" style={{ animationDelay: "0.1s" }}>
              <h3 className="font-semibold text-lg">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/" className="hover:text-foreground transition-colors hover:underline">Home</Link></li>
                <li>
                  {canStartApplication ? (
                    <Link href="/apply" className="hover:text-foreground transition-colors hover:underline">Apply Now</Link>
                  ) : (
                    <Link href="/login" className="hover:text-foreground transition-colors hover:underline">Sign In</Link>
                  )}
                </li>
                <li><Link href="/report" className="hover:text-foreground transition-colors hover:underline">System Report</Link></li>
              </ul>
            </div>
            <div className="space-y-3 animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
              <h3 className="font-semibold text-lg">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors hover:underline">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors hover:underline">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors hover:underline">Contact Us</a></li>
              </ul>
            </div>
            <div className="space-y-3 animate-slide-in-up" style={{ animationDelay: "0.3s" }}>
              <h3 className="font-semibold text-lg">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors hover:underline">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors hover:underline">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Municipal Engineering Office, Sariaya, Quezon. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Learn More Modal */}
      <Dialog open={learnMoreOpen} onOpenChange={setLearnMoreOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">How to File Your Building Permit Application</DialogTitle>
            <DialogDescription>
              Step-by-step guide to complete your application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">
                  1
                </div>
                <h3 className="font-semibold text-lg">Applicant Information</h3>
              </div>
              <div className="ml-11 space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Your Capacity:</strong> Select whether you are the property owner or an authorized representative
                </p>
                <p>
                  <strong>Owner Name (if applicable):</strong> If you're an authorized representative, provide the property owner's name
                </p>
                <p>
                  <strong>Personal Details:</strong> Enter your full name, email, and 11-digit phone number
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold text-sm">
                  2
                </div>
                <h3 className="font-semibold text-lg">Property & Location Details</h3>
              </div>
              <div className="ml-11 space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Property Location:</strong> Lot number, block, and subdivision name (e.g., Lot 5, Block 3, Sariaya Heights)
                </p>
                <p>
                  <strong>Complete Address:</strong> Full address including street, barangay, municipality, and postal code
                </p>
                <p>
                  <strong>Barangay:</strong> Select your property's barangay from the list
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white font-bold text-sm">
                  3
                </div>
                <h3 className="font-semibold text-lg">Project Details</h3>
              </div>
              <div className="ml-11 space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Project Type:</strong> Select either "Residential - Single Family" or "Residential - Multi-Family"
                </p>
                <p>
                  <strong>Project Scope:</strong> Describe what you plan to build (e.g., size, number of stories, intended use)
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-sm">
                  4
                </div>
                <h3 className="font-semibold text-lg">Required Documents</h3>
              </div>
              <div className="ml-11 space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Upload the following documents (PDF or JPG):</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Build plans & structural analysis (signed by licensed engineer)</li>
                  <li>Electrical permit (signed by professional engineer)</li>
                  <li>Sanitary/plumbing permit (signed by master plumber)</li>
                  <li>Tax declaration & property documents</li>
                  <li>Barangay clearance</li>
                  <li>DOLE application (if applicable)</li>
                  <li>Authorization documents (if not the owner)</li>
                </ul>
              </div>
            </div>

            {/* Step 5 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white font-bold text-sm">
                  5
                </div>
                <h3 className="font-semibold text-lg">Review & Submit</h3>
              </div>
              <div className="ml-11 space-y-2 text-sm text-muted-foreground">
                <p>
                  Review all your information on the final page, then click "Submit Application"
                </p>
                <p>
                  You'll receive a reference number to track your application progress
                </p>
              </div>
            </div>

            {/* Timeline Info */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">Processing Timeline</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    All residential permits are typically processed within 1-3 business days. You can track your application status in real-time using your reference number.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button asChild className="btn-primary-meo flex-1">
                <Link href="/apply">Start Application</Link>
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setLearnMoreOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { LayoutDashboard } from "lucide-react";

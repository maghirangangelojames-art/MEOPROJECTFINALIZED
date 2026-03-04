import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, FileText, CheckCircle, Clock, TrendingUp, Zap, Shield, Globe, AlertCircle, LayoutDashboard, Mail, Phone, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { useState } from "react";

const pageScreenshots = [
  {
    id: "home",
    title: "Home Page",
    description: "Welcome to your building permit system with easy navigation and quick access to all features.",
    image: "/IMAGES/homepage.jpg",
  },
  {
    id: "application-form",
    title: "Application Form",
    description: "Fill out your building permit application with our intuitive and guided form interface.",
    image: "/IMAGES/application page.jpg",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Monitor your permits and manage your applications from a comprehensive dashboard.",
    image: "/IMAGES/dashboard page.jpg",
  },
  {
    id: "track-status",
    title: "Track Status",
    description: "Real-time tracking of your application status and permit processing progress.",
    image: "/IMAGES/track page.jpg",
  },
];

export default function Home() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);
  const canStartApplication = isAuthenticated && user?.role === "user";

  const goToPrevious = () => {
    setCurrentScreenshotIndex(
      currentScreenshotIndex === 0 ? pageScreenshots.length - 1 : currentScreenshotIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentScreenshotIndex(
      currentScreenshotIndex === pageScreenshots.length - 1 ? 0 : currentScreenshotIndex + 1
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      
      // Clear ALL browser storage to prevent stale data
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear IndexedDB caches (used by service workers, TRPC)
      if ('indexedDB' in window) {
        const dbs = await window.indexedDB.databases();
        dbs.forEach(db => {
          window.indexedDB.deleteDatabase(db.name);
        });
      }
      
      // Redirect with cache-buster to force fresh load
      window.location.href = "/?v=" + Date.now();
    } catch (error) {
      console.error("Logout failed", error);
      // Even if logout errors, still clear everything
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/?v=" + Date.now();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-slide-in-down">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-700 to-blue-800 flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-250 shadow-md border border-white/20">
              <FileText className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">MEO Sariaya</h1>
              <p className="text-xs text-muted-foreground font-medium">Building Permit System</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {user?.role === "user" && (
                  <NotificationBell />
                )}
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
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-800 dark:from-blue-950 dark:via-blue-900 dark:to-slate-900 relative overflow-hidden py-16 sm:py-24 lg:py-40">
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

            {/* Hero Carousel - Professional Design */}
            <div className="relative w-full h-96 lg:h-[500px] animate-slide-in-right group">
              {/* Main carousel container */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                {/* Image with proper scaling */}
                <img
                  key={`img-${currentScreenshotIndex}`}
                  src={pageScreenshots[currentScreenshotIndex].image}
                  alt={pageScreenshots[currentScreenshotIndex].title}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                />
                
                {/* Dark overlay gradient at bottom for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Content overlay - Bottom positioned */}
                <div className="absolute inset-x-0 bottom-0 p-8 text-white">
                  <div className="max-w-2xl">
                    <h3 
                      key={`title-${currentScreenshotIndex}`}
                      className="text-3xl sm:text-4xl font-bold mb-3 animate-fade-in"
                    >
                      {pageScreenshots[currentScreenshotIndex].title}
                    </h3>
                    <p 
                      key={`desc-${currentScreenshotIndex}`}
                      className="text-base sm:text-lg text-white/90 leading-relaxed animate-fade-in max-w-lg"
                    >
                      {pageScreenshots[currentScreenshotIndex].description}
                    </p>
                  </div>
                </div>

                {/* Navigation - Cleaner, more subtle */}
                <button
                  onClick={goToPrevious}
                  aria-label="Previous screenshot"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-all duration-300 text-white border border-white/20 hover:border-white/40 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <button
                  onClick={goToNext}
                  aria-label="Next screenshot"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-all duration-300 text-white border border-white/20 hover:border-white/40 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Indicator dots - Now at the bottom */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {pageScreenshots.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentScreenshotIndex(index)}
                      aria-label={`Go to screenshot ${index + 1}`}
                      className={`transition-all duration-300 rounded-full backdrop-blur-sm ${
                        index === currentScreenshotIndex
                          ? "w-10 h-3 bg-white/90 shadow-lg"
                          : "w-3 h-3 bg-white/40 hover:bg-white/60"
                      }`}
                    />
                  ))}
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
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center group-hover:scale-125 transition-transform duration-250 shadow-md">
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
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center group-hover:scale-125 transition-transform duration-250 shadow-md">
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
          <div className="mt-16 grid gap-8 sm:grid-cols-3 bg-gradient-to-r from-blue-50/50 to-slate-50/50 dark:from-blue-950/30 dark:to-slate-950/30 rounded-lg p-8 shadow-md animate-scale-in border border-border dark:border-border/50">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">N/A</div>
              <p className="text-muted-foreground font-medium">Applications Processed</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">N/A</div>
              <p className="text-muted-foreground font-medium">Satisfaction Rate</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">2-3 days</div>
              <p className="text-muted-foreground font-medium">Average Processing Time</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid gap-6 sm:grid-cols-3 mt-12">
            <Card className="card-hover p-8 space-y-4 text-center animate-slide-in-up">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 mx-auto mb-2 shadow-md">
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
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 mx-auto mb-2 shadow-md">
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
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 mx-auto mb-2 shadow-md">
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
      <section className="bg-gradient-to-r from-blue-50/50 to-slate-50/50 dark:from-blue-950/20 dark:to-slate-950/20 py-16 sm:py-20 lg:py-28 animate-fade-in border-t border-border">
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

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 lg:py-32 bg-muted/30 dark:bg-muted/10 animate-fade-in">
        <div className="container space-y-12">
          <div className="space-y-4 text-center animate-slide-in-up">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
              Find answers to common questions about our building permit system and process.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {/* FAQ 1 */}
              <AccordionItem value="faq-1" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  What is the Sariaya Building Permit System?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  The Sariaya Building Permit System is a digital platform that streamlines the building permit application and approval process. It allows applicants to submit permit applications online, track their status in real-time, and communicate directly with the municipal staff.
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 2 */}
              <AccordionItem value="faq-2" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  Who can use this system?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  Any individual or authorized representative who needs to apply for a building permit in Sariaya can use this system. You'll need to create an account and log in to submit applications.
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 3 */}
              <AccordionItem value="faq-3" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  What are the main benefits of using this system?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2 space-y-2">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Faster permit processing</li>
                    <li>Transparent status tracking</li>
                    <li>Secure document upload</li>
                    <li>Real-time notifications about your application status</li>
                    <li>No need to visit the office for initial submission</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 4 */}
              <AccordionItem value="faq-4" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  How do I create an account?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  Click the "Sign In" button on the homepage. You'll be guided through a secure login process. First-time users will be guided to set up their account with their personal information.
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 5 */}
              <AccordionItem value="faq-5" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  What information do I need to register?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2 space-y-2">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Full name</li>
                    <li>Valid email address</li>
                    <li>11-digit phone number</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 6 */}
              <AccordionItem value="faq-6" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  Is my information secure?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  Yes, all your personal information is encrypted and securely stored in our database. We comply with data privacy standards and only authorized staff can access your information for processing your application.
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 7 */}
              <AccordionItem value="faq-7" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  What types of building projects can I apply for?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2 space-y-2">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Dwellings (Residential Houses)</li>
                    <li>Buildings/Structures</li>
                    <li>Hotels</li>
                    <li>Apartments</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 8 */}
              <AccordionItem value="faq-8" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  What is "Applicant Capacity" and why is it important?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2 space-y-3">
                  <p>Applicant Capacity indicates your role in the project:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong className="text-foreground">Owner:</strong> You are the property owner applying for your own project</li>
                    <li><strong className="text-foreground">Authorized Representative:</strong> You are representing the actual property owner (you'll need to provide the owner's name)</li>
                  </ul>
                  <p>If you're an Authorized Representative, you'll need to upload additional authorization documents from the property owner.</p>
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 9 */}
              <AccordionItem value="faq-9" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  What documents do I need to submit?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2 space-y-2">
                  <p className="font-semibold text-foreground">Required documents typically include:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Build plans and structural analysis signed by a licensed civil engineer/architect</li>
                    <li>Electrical permit/plan signed by a licensed electrical engineer</li>
                    <li>Sanitary/plumbing permit signed by a licensed master plumber</li>
                    <li>Tax declaration</li>
                    <li>Transfer certificate of title</li>
                    <li>Current year tax receipt</li>
                    <li>Barangay clearance</li>
                    <li>DOLE application (CHSP) - Grand Central</li>
                    <li>If not the lot owner: Authorization from the lot owner</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 10 */}
              <AccordionItem value="faq-10" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  Can I save my application and complete it later?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  Yes, the system saves your progress as you fill out the multi-step form. You can close the application and return to it later without losing your information.
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 11 */}
              <AccordionItem value="faq-11" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  What file formats are accepted for document uploads?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  The system accepts common document formats including PDF, JPG, PNG, and other standard image/document formats. Individual field requirements may specify certain formats, so please check the upload instructions for each document.
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 12 */}
              <AccordionItem value="faq-12" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  How do I track the status of my application?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  After submission, you'll receive a reference number. Use the "View Application" or "Track Application" section to check your application status. You'll also receive email notifications about any status changes (approved, on hold, needs resubmission, etc.).
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 13 */}
              <AccordionItem value="faq-13" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  How long does it take to process my application?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  Processing times may vary depending on the completeness of your submission and current workload. Typically, applications are processed within 2-3 business days. You'll be notified of any updates via email. If additional documents are needed, you'll be asked to resubmit through the system.
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 14 */}
              <AccordionItem value="faq-14" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  What does "Resubmission Required" mean?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  If your application status shows "Resubmission Required," it means the staff needs additional information or clarified documents. You'll receive details about what's needed, and you can upload the revised documents directly through the system.
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 15 */}
              <AccordionItem value="faq-15" className="border border-border rounded-lg px-6 dark:bg-muted/5">
                <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                  What if my application is rejected?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  If not approved, staff will provide detailed remarks explaining why. You can address the concerns and resubmit your application with the necessary corrections. Our staff is here to help you through the process.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 animate-fade-in">
        <div className="container space-y-12">
          <div className="space-y-4 text-center animate-slide-in-up">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Get in Touch
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
              Have a question? Connect with us through our social media or contact information.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 max-w-2xl mx-auto">
            {/* Email Card */}
            <Card className="card-hover group p-8 space-y-4 text-center flex flex-col items-center animate-slide-in-up dark:bg-muted/10" style={{ animationDelay: "0.1s" }}>
              <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center group-hover:scale-125 transition-transform duration-250 shadow-md">
                <Mail className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="font-semibold text-lg">Email</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Send us an email for inquiries
                </p>
              </div>
              {showEmail ? (
                <div className="w-full space-y-3 mt-auto pt-2">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Email Address</p>
                    <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 rounded px-3 py-2 border border-purple-200 dark:border-purple-800">
                      <a 
                        href="mailto:meo.sariaya2022@gmail.com"
                        className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline flex-1 truncate"
                      >
                        meo.sariaya2022@gmail.com
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("meo.sariaya2022@gmail.com");
                          setEmailCopied(true);
                          setTimeout(() => setEmailCopied(false), 2000);
                        }}
                        className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded transition-colors flex-shrink-0"
                        title="Copy email"
                      >
                        <Copy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </button>
                    </div>
                    {emailCopied && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">✓ Copied to clipboard</p>
                    )}
                  </div>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowEmail(false)}
                  >
                    Hide
                  </Button>
                </div>
              ) : (
                <Button 
                  className="btn-secondary-meo w-full mt-auto"
                  onClick={() => setShowEmail(true)}
                >
                  Reveal Email
                </Button>
              )}
            </Card>

            {/* Phone Card */}
            <Card className="card-hover group p-8 space-y-4 text-center flex flex-col items-center animate-slide-in-up dark:bg-muted/10" style={{ animationDelay: "0.2s" }}>
              <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center group-hover:scale-125 transition-transform duration-250 shadow-md">
                <Phone className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="font-semibold text-lg">Phone</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Call us during office hours
                </p>
              </div>
              {showPhoneNumber ? (
                <div className="w-full space-y-3 mt-auto pt-2">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Phone Number</p>
                    <a 
                      href="tel:+639173736190"
                      className="inline-block bg-white dark:bg-slate-800 rounded px-4 py-2 font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                    >
                      (042) 373 6190
                    </a>
                  </div>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowPhoneNumber(false)}
                  >
                    Hide
                  </Button>
                </div>
              ) : (
                <Button 
                  className="btn-secondary-meo w-full mt-auto"
                  onClick={() => setShowPhoneNumber(true)}
                >
                  Reveal Phone Number
                </Button>
              )}
            </Card>
          </div>


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
            <div className="space-y-3 animate-slide-in-up">
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
            <div className="space-y-3 animate-slide-in-up">
              <h3 className="font-semibold text-lg">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors hover:underline">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors hover:underline">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors hover:underline">Contact Us</a></li>
              </ul>
            </div>
            <div className="space-y-3 animate-slide-in-up">
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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

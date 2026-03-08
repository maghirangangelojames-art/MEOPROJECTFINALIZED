// Example: Professional Page with New Animations and Components
// This file demonstrates how to use all the new UI enhancements together

import { useState } from "react";
import { AnimatedCard, AnimatedBadge, AnimatedProgressBar } from "@/components/AnimatedComponents";
import { LoadingDots, SkeletonLoader, CardSkeleton } from "@/components/LoadingAnimation";
import { CheckCircle, Clock, AlertCircle, Zap } from "lucide-react";

/**
 * Example: Dashboard Page with Professional Animations
 * Shows best practices for using all new components together
 */
export function DashboardExample() {
  const [isLoading, setIsLoading] = useState(false);

  const applications = [
    {
      id: 1,
      name: "Residential Extension",
      status: "completed",
      progress: 100,
      submitted: "March 1, 2026",
    },
    {
      id: 2,
      name: "Commercial Permit",
      status: "in-progress",
      progress: 65,
      submitted: "March 5, 2026",
    },
    {
      id: 3,
      name: "Renovation Project",
      status: "pending",
      progress: 30,
      submitted: "March 8, 2026",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50/20 dark:to-blue-950/10">
      {/* ==========================================
          HERO SECTION with floating animation
          ========================================== */}
      <section className="gradient-hero py-24 overflow-hidden">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Animated Text */}
            <div className="space-y-6 animate-slide-in-left">
              <h1 className="text-5xl lg:text-6xl font-bold text-white">
                <span className="text-gradient">Your Permits,</span>
                <br />
                Simplified
              </h1>
              <p className="text-xl text-white/80 font-light">
                Track, manage, and process building permits with ease. Real-time updates and professional support every step of the way.
              </p>
              <div className="flex gap-4 pt-4">
                <button className="btn-lg-primary-meo">Start New Application</button>
                <button className="btn-secondary-meo text-white border-white hover:bg-white/20">
                  Learn More
                </button>
              </div>
            </div>

            {/* Right: Floating Card */}
            <div className="animate-slide-in-right">
              <div className="card-gradient animate-float-slow shadow-glow-blue-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-lg bg-white/20 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Quick Submit</h3>
                    <p className="text-white/70 text-sm">Complete in minutes</p>
                  </div>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  Our simplified process helps you submit applications in just a few steps. Let's get your project started.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          STATS SECTION with staggered cards
          ========================================== */}
      <section className="py-16 container">
        <h2 className="text-3xl font-bold mb-12 text-center">Why Choose Us</h2>
        <div className="stagger-container grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "⚡",
              title: "Fast Process",
              description: "Average processing time of 5-7 days",
              color: "blue",
            },
            {
              icon: "✓",
              title: "Accuracy",
              description: "99% accuracy rate with expert review",
              color: "green",
            },
            {
              icon: "🛡️",
              title: "Secure",
              description: "Your data is protected with enterprise security",
              color: "purple",
            },
          ].map((feature, idx) => (
            <AnimatedCard key={idx} hover="lift" gradient={true}>
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* ==========================================
          APPLICATIONS LIST with loading state
          ========================================== */}
      <section className="py-16 container">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold">Your Applications</h2>
          <button className="btn-primary-meo text-sm">+ New Application</button>
        </div>

        {isLoading ? (
          // Loading state with skeleton loaders
          <div className="stagger-container grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((idx) => (
              <CardSkeleton key={idx} count={3} />
            ))}
          </div>
        ) : (
          // Applications grid with staggered animation
          <div className="stagger-container grid md:grid-cols-3 gap-6">
            {applications.map((app) => (
              <AnimatedCard
                key={app.id}
                hover="lift"
                interactive={true}
                onClick={() => console.log("Open application", app.id)}
              >
                {/* Header with status badge */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-foreground">{app.name}</h3>
                  <AnimatedBadge
                    variant={
                      app.status === "completed"
                        ? "success"
                        : app.status === "in-progress"
                          ? "info"
                          : "warning"
                    }
                  >
                    {app.status === "completed" && <CheckCircle className="h-3 w-3" />}
                    {app.status === "in-progress" && <Clock className="h-3 w-3" />}
                    {app.status === "pending" && <AlertCircle className="h-3 w-3" />}
                    <span className="capitalize">{app.status}</span>
                  </AnimatedBadge>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Progress</p>
                  <AnimatedProgressBar
                    percentage={app.progress}
                    color={app.status === "completed" ? "green" : "blue"}
                    showLabel={false}
                  />
                </div>

                {/* Submitted date */}
                <p className="text-xs text-muted-foreground">
                  Submitted: {app.submitted}
                </p>

                {/* CTA */}
                <button className="mt-4 w-full btn-secondary-meo text-sm py-2">
                  View Details
                </button>
              </AnimatedCard>
            ))}
          </div>
        )}
      </section>

      {/* ==========================================
          PROCESS SECTION with timeline animation
          ========================================== */}
      <section className="py-16 container">
        <h2 className="text-3xl font-bold mb-12 text-center">Simple Process</h2>
        <div className="stagger-container max-w-2xl mx-auto space-y-6">
          {[
            {
              step: 1,
              title: "Prepare Documents",
              description: "Gather all required building documents and plans",
            },
            {
              step: 2,
              title: "Fill Application",
              description: "Complete our simple and guided application form",
            },
            {
              step: 3,
              title: "Submit & Pay",
              description: "Submit your application and pay processing fee",
            },
            {
              step: 4,
              title: "Get Approval",
              description: "Receive your permit within 5-7 business days",
            },
          ].map((item, idx) => (
            <div key={idx} className="relative">
              {/* Timeline connector */}
              {idx < 3 && (
                <div className="absolute left-6 top-16 w-0.5 h-12 bg-gradient-to-b from-blue-400 to-transparent" />
              )}

              <div className="flex gap-6">
                {/* Step number */}
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold shadow-lg">
                    {item.step}
                  </div>
                </div>

                {/* Content */}
                <div className="pt-1">
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================
          CTA SECTION
          ========================================== */}
      <section className="py-20 bg-gradient-meo-animated rounded-2xl mx-6 lg:mx-auto lg:max-w-4xl mb-12">
        <div className="container text-center text-white animate-slide-in-up">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Submit your building permit application today and get approval in just days.
          </p>
          <button className="btn-lg-primary-meo inline-block">
            Start Your Application
          </button>
        </div>
      </section>
    </div>
  );
}

export default DashboardExample;

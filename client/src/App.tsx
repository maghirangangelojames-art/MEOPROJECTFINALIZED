import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import PageTransition from "./components/PageTransition";
import Home from "./pages/Home";
import ApplicationForm from "./pages/ApplicationForm";
import SubmissionConfirmation from "./pages/SubmissionConfirmation";
import StaffDashboard from "./pages/StaffDashboard";
import ApplicationDetail from "./pages/ApplicationDetail";
import SystemReport from "./pages/SystemReport";
import TrackApplication from "./pages/TrackApplication";
import LoginRedirect from "./pages/LoginRedirect";
import { useAuth } from "./_core/hooks/useAuth";

function ProtectedApplyRoute() {
  const { isAuthenticated, loading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login",
  });

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
      </div>
    );
  }

  return <ApplicationForm />;
}

function Router() {
  return (
    <PageTransition>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={LoginRedirect} />
        <Route path="/apply" component={ProtectedApplyRoute} />
        <Route path="/submission-confirmation" component={SubmissionConfirmation} />
        <Route path="/track-application" component={TrackApplication} />
        <Route path="/dashboard" component={StaffDashboard} />
        <Route path="/application/:id" component={ApplicationDetail} />
        <Route path="/report" component={SystemReport} />
        <Route path="/404" component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </PageTransition>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable={true}
      >
        <TooltipProvider>
          <Toaster position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

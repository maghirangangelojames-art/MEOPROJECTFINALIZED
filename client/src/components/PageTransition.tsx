import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageTransition component wraps page content with smooth fade-in animation
 * Applied automatically to all routes for consistent page transitions
 */
export default function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
}

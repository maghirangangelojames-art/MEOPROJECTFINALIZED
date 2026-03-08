import { ReactNode, useEffect, useState } from "react";

interface EnhancedPageTransitionProps {
  children: ReactNode;
  className?: string;
  staggerChildren?: boolean;
  duration?: "fast" | "normal" | "slow";
}

/**
 * Enhanced PageTransition component with staggered animations for child elements
 * Creates a professional, polished entrance effect
 */
export default function EnhancedPageTransition({
  children,
  className = "",
  staggerChildren = true,
  duration = "normal",
}: EnhancedPageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setIsVisible(true);
  }, []);

  const durationClass = {
    fast: "animate-fade-in",
    normal: "animate-fade-in-delayed",
    slow: "animate-fade-in-slow",
  }[duration];

  return (
    <div className={`${durationClass} ${className}`}>
      {staggerChildren && isVisible ? (
        <div className="stagger-container">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

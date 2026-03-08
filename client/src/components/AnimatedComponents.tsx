import React, { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hover?: "lift" | "glow" | "scale" | "none";
  gradient?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

/**
 * Professional animated card component with multiple hover effects
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = "",
  hover = "lift",
  gradient = false,
  interactive = false,
  onClick,
}) => {
  const baseClass = gradient ? "card-gradient" : "card-hover";
  const hoverClass = hover === "glow" ? "card-glow" : "";
  const interactiveClass = interactive ? "cursor-pointer active:scale-98" : "";

  return (
    <div
      className={`${baseClass} ${hoverClass} ${interactiveClass} ${className}`}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </div>
  );
};

/**
 * Animated badge component for status indicators
 */
export const AnimatedBadge: React.FC<{
  children: ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "default";
  animated?: boolean;
  className?: string;
}> = ({ children, variant = "default", animated = false, className = "" }) => {
  const variants = {
    success: "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300",
    warning: "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300",
    error: "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300",
    info: "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300",
    default: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
  };

  const animationClass = animated ? "animate-float" : "";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold shadow-sm transition-all duration-200 ${variants[variant]} ${animationClass} ${className}`}
    >
      {children}
    </span>
  );
};

/**
 * Floating action button with animations
 */
export const FloatingActionButton: React.FC<{
  children: ReactNode;
  onClick: () => void;
  color?: "blue" | "green" | "red";
  animated?: boolean;
  className?: string;
}> = ({ children, onClick, color = "blue", animated = false, className = "" }) => {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    red: "bg-red-600 hover:bg-red-700",
  };

  const animationClass = animated
    ? "animate-float-slow shadow-glow-blue"
    : "shadow-lg";

  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 
        h-14 w-14 rounded-full 
        ${colors[color]} text-white 
        flex items-center justify-center 
        transition-all duration-300 
        hover:shadow-xl hover:-translate-y-1 
        active:translate-y-0 
        ${animationClass}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

/**
 * Animated progress bar component
 */
export const AnimatedProgressBar: React.FC<{
  percentage: number;
  color?: "blue" | "green" | "red" | "yellow";
  animated?: boolean;
  showLabel?: boolean;
  className?: string;
}> = ({
  percentage,
  color = "blue",
  animated = true,
  showLabel = true,
  className = "",
}) => {
  const colors = {
    blue: "from-blue-600 to-blue-700",
    green: "from-green-600 to-green-700",
    red: "from-red-600 to-red-700",
    yellow: "from-yellow-600 to-yellow-700",
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colors[color]} transition-all duration-500 ease-out ${
            animated ? "animate-subtle-glow" : ""
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-2 text-right">
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

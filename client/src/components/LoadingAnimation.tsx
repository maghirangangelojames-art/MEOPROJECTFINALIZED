import React from "react";

interface SkeletonLoaderProps {
  variant?: "text" | "circle" | "rectangle" | "card";
  count?: number;
  className?: string;
}

/**
 * Professional skeleton loader component with shimmer animation
 * Perfect for loading states
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = "rectangle",
  count = 1,
  className = "",
}) => {
  const baseClass = "skeleton rounded-md";

  const variantClasses = {
    text: "h-4 w-full mb-3",
    circle: "h-12 w-12 rounded-full",
    rectangle: "h-24 w-full mb-4",
    card: "h-64 w-full mb-4",
  };

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClass} ${variantClasses[variant]}`}
        />
      ))}
    </div>
  );
};

/**
 * Loading dot animation component
 */
export const LoadingDots: React.FC<{ color?: string }> = ({
  color = "bg-blue-600",
}) => {
  return (
    <div className="flex gap-1 items-center justify-center py-8">
      <div className={`h-2.5 w-2.5 rounded-full ${color} loader-dot`} />
      <div className={`h-2.5 w-2.5 rounded-full ${color} loader-dot`} style={{ animationDelay: "0.2s" }} />
      <div className={`h-2.5 w-2.5 rounded-full ${color} loader-dot`} style={{ animationDelay: "0.4s" }} />
    </div>
  );
};

/**
 * Card skeleton with text lines
 */
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="card-elevated">
      <div className="skeleton-circle mb-4" />
      <div className="skeleton-text mb-4" />
      {Array.from({ length: count - 1 }).map((_, i) => (
        <div key={i} className="skeleton-line" />
      ))}
    </div>
  );
};

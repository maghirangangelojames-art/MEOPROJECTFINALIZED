/**
 * SkeletonLoader Component
 * Provides multiple skeleton variations for loading states with shimmer animation
 */

interface SkeletonProps {
  className?: string;
  count?: number;
}

/**
 * Generic skeleton loader with customizable className
 */
export function Skeleton({ className = "h-12 w-full" }: SkeletonProps) {
  return (
    <div
      className={`skeleton rounded-lg ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Card skeleton - simulates a card loading state
 */
export function SkeletonCard() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/**
 * Form skeleton - simulates form field loading
 */
export function SkeletonForm() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

/**
 * Table row skeleton - simulates table row loading
 */
export function SkeletonTableRow() {
  return (
    <div className="grid grid-cols-5 gap-4 py-3">
      <Skeleton className="h-8" />
      <Skeleton className="h-8" />
      <Skeleton className="h-8" />
      <Skeleton className="h-8" />
      <Skeleton className="h-8" />
    </div>
  );
}

/**
 * Application card skeleton - for dashboard loading
 */
export function SkeletonAppCard() {
  return (
    <div className="p-6 space-y-4 border rounded-lg">
      <div className="grid grid-cols-5 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Page header skeleton - for page title and description loading
 */
export function SkeletonPageHeader() {
  return (
    <div className="space-y-3 mb-8">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/**
 * Multiple items skeleton loader with count
 */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

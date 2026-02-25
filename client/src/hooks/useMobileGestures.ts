import { useRef, useEffect, useState } from "react";

interface TouchPosition {
  x: number;
  y: number;
}

interface GestureCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
}

/**
 * useMobileGestures Hook
 * Detects swipe and long-press gestures on touch devices
 * Usage:
 *   const { bind } = useMobileGestures({
 *     onSwipeRight: () => handleBack(),
 *     onLongPress: () => handleContext()
 *   });
 *   return <div {...bind}>{content}</div>
 */
export function useMobileGestures(callbacks: GestureCallbacks) {
  const touchStartRef = useRef<TouchPosition | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minSwipeDistance = 50;
  const longPressDuration = 500;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };

    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      callbacks.onLongPress?.();
    }, longPressDuration);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Clear long press timer if user lifted finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    if (!touchStartRef.current) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const distanceX = touchStartRef.current.x - touchEnd.x;
    const distanceY = touchStartRef.current.y - touchEnd.y;
    const absDistanceX = Math.abs(distanceX);
    const absDistanceY = Math.abs(distanceY);

    // Determine if it's a swipe (not just a tap)
    if (absDistanceX > minSwipeDistance || absDistanceY > minSwipeDistance) {
      // Determine swipe direction
      if (absDistanceX > absDistanceY) {
        // Horizontal swipe
        if (distanceX > minSwipeDistance) {
          callbacks.onSwipeLeft?.();
        } else if (distanceX < -minSwipeDistance) {
          callbacks.onSwipeRight?.();
        }
      } else {
        // Vertical swipe
        if (distanceY > minSwipeDistance) {
          callbacks.onSwipeUp?.();
        } else if (distanceY < -minSwipeDistance) {
          callbacks.onSwipeDown?.();
        }
      }
    }

    touchStartRef.current = null;
  };

  return {
    bind: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
  };
}

/**
 * Hook to detect if device is mobile
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check if device supports touch
    const isTouchDevice = () => {
      return (
        typeof window !== "undefined" &&
        (!!navigator.maxTouchPoints ||
          !!navigator.msMaxTouchPoints ||
          (window.matchMedia && window.matchMedia("(pointer:coarse)").matches))
      );
    };

    setIsTouch(isTouchDevice());
  }, []);

  return isTouch;
}

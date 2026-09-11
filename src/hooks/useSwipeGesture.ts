import { useEffect, useRef } from 'react';

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  maxDuration?: number;
  enabled?: boolean;
  targetRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Checks if the touch event originated from or is inside an element that
 * should not trigger swipe navigation (inputs, sliders, dialogs, horizontally scrollable containers).
 */
function shouldIgnoreSwipe(target: EventTarget | null, boundaryElement: HTMLElement | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  let current: HTMLElement | null = target;
  while (current && current !== boundaryElement && current !== document.body) {
    const tagName = current.tagName.toLowerCase();

    // Form inputs & controls
    if (['input', 'textarea', 'select', 'button'].includes(tagName)) {
      return true;
    }

    // Role exclusions (sliders, dialogs, popovers)
    const role = current.getAttribute('role');
    if (role === 'slider' || role === 'dialog' || role === 'alertdialog') {
      return true;
    }

    // Explicit opt-out attribute
    if (current.dataset.noSwipe !== undefined) {
      return true;
    }

    // Check if element has horizontal scrolling enabled and can scroll
    if (current.scrollWidth > current.clientWidth + 10) {
      const style = window.getComputedStyle(current);
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
        return true;
      }
    }

    current = current.parentElement;
  }

  return false;
}

/**
 * Lightweight touch swipe gesture detection hook.
 *
 * Rules:
 * - Detects horizontal swipe using touch events.
 * - Minimum distance: threshold (default 50px).
 * - Dominance: Math.abs(deltaX) > Math.abs(deltaY) * 1.5 to preserve vertical scrolling.
 * - Maximum duration: maxDuration (default 650ms) to ensure intentional flick/swipe.
 * - Ignores desktop mouse drag and unwanted touch contexts.
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 35,
  maxDuration = 900,
  enabled = true,
  targetRef,
}: SwipeGestureOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number; ignored: boolean } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const element: HTMLElement | Window = targetRef?.current ?? window;

    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (touchEvent.touches.length !== 1) {
        touchStartRef.current = null;
        return;
      }

      const touch = touchEvent.touches[0];
      const target = touchEvent.target;
      const boundary = targetRef?.current ?? document.body;

      const ignored = shouldIgnoreSwipe(target, boundary);

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        ignored,
      };
    };

    const handleTouchEnd = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (!touchStartRef.current || touchStartRef.current.ignored) {
        touchStartRef.current = null;
        return;
      }

      if (touchEvent.changedTouches.length !== 1) {
        touchStartRef.current = null;
        return;
      }

      const touch = touchEvent.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const elapsed = Math.max(1, Date.now() - touchStartRef.current.time);

      touchStartRef.current = null;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const velocityX = absX / elapsed; // px per millisecond

      // High-performance gesture conditions:
      // 1. Within reasonable human swipe duration (<= 900ms)
      // 2. Either distance threshold reached OR quick velocity flick
      // 3. Horizontal motion dominant (absX > absY * 1.15) to preserve vertical scrolling
      const isDistanceReached = absX >= threshold;
      const isQuickFlick = velocityX >= 0.25 && absX >= 20;

      if (elapsed <= maxDuration && (isDistanceReached || isQuickFlick) && absX > absY * 1.15) {
        // Micro-haptic tactile feedback for instant physical confirmation
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(10);
          } catch {}
        }

        if (deltaX < 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }
    };

    const handleTouchCancel = () => {
      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    element.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel as EventListener, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart as EventListener);
      element.removeEventListener('touchend', handleTouchEnd as EventListener);
      element.removeEventListener('touchcancel', handleTouchCancel as EventListener);
    };
  }, [enabled, onSwipeLeft, onSwipeRight, threshold, maxDuration, targetRef]);
}

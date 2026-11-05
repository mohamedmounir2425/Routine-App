import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LIFE_SPACES_CONFIG } from '../config/spacesConfig';
import { useSwipeGesture } from './useSwipeGesture';

const ROOT_TABS = ['/today', '/spaces', '/progress', '/settings'] as const;

interface ContextualSwipeNavigationOptions {
  enabled?: boolean;
  isWorkoutActive?: boolean;
}

/**
 * Resolves the current navigation context (Root tabs vs Nested Space tabs)
 * and binds swipe left/right gestures to the appropriate navigation sequence.
 *
 * Rules:
 * - Swipe LEFT -> Next tab
 * - Swipe RIGHT -> Previous tab
 * - Root navigation: /today -> /spaces -> /progress -> /settings (boundary stops)
 * - Nested space navigation: follows activeSpace.navigation item order (boundary stops)
 * - Never swipe from one Space to another Space or outside of root bounds.
 * - Disabled during Azkar session, Workout Player, or open modal dialogs.
 */
export function useContextualSwipeNavigation({
  enabled = true,
  isWorkoutActive = false,
}: ContextualSwipeNavigationOptions = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // 1. Check if Azkar session is active
  const isAzkarSessionActive =
    (typeof document !== 'undefined' && document.body.classList.contains('azkar-session-active')) ||
    (currentPath.startsWith('/worship/azkar') && location.search.includes('session'));

  // Disable global contextual navigation if workout or azkar session is active
  const isEnabled = enabled && !isAzkarSessionActive && !isWorkoutActive;

  // Ultra-smooth native view transition navigation
  const smoothNavigate = useCallback(
    (targetPath: string) => {
      // Fast bail-out if a modal dialog is currently open
      if (typeof document !== 'undefined' && document.querySelector('[role="dialog"], .modal-backdrop')) {
        return;
      }

      if (typeof document !== 'undefined' && 'startViewTransition' in document) {
        (document as Document & { startViewTransition: (callback: () => void) => unknown }).startViewTransition(() => {
          navigate(targetPath);
        });
      } else {
        navigate(targetPath);
      }
    },
    [navigate]
  );

  // 3. Resolve if inside a Space
  const activeSpace = LIFE_SPACES_CONFIG.find(
    (space) => currentPath === space.route || currentPath.startsWith(`${space.route}/`)
  );

  // 4. Resolve current index for Space Sub-Navigation
  const resolveSpaceNavIndex = useCallback(() => {
    if (!activeSpace || !activeSpace.navigation.length) return -1;
    const nav = activeSpace.navigation;
    if (activeSpace.id === 'home' && currentPath.startsWith('/home/inventory')) return 1;
    if (activeSpace.id === 'home' && /\/home\/(tasks|routines|maintenance|projects)/.test(currentPath)) return nav.length - 1;

    // Exact match
    const exactIndex = nav.findIndex((item) => item.path === currentPath);
    if (exactIndex !== -1) return exactIndex;

    // Sub-path prefix match (excluding base route unless nothing else matches)
    const childIndex = nav.findIndex(
      (item) => item.path !== activeSpace.route && currentPath.startsWith(item.path)
    );
    if (childIndex !== -1) return childIndex;

    // Default to first tab (overview) if inside the space route
    return 0;
  }, [activeSpace, currentPath]);

  // 5. Resolve current index for Root Tabs
  const resolveRootNavIndex = useCallback(() => {
    if (currentPath === '/' || currentPath.startsWith('/today')) return 0;
    if (currentPath.startsWith('/spaces')) return 1;
    if (currentPath.startsWith('/progress') || currentPath.startsWith('/stats')) return 2;
    if (currentPath.startsWith('/settings')) return 3;
    return -1;
  }, [currentPath]);

  // 6. Handle Swipe Left (Go to previous item in RTL visual flow)
  const handleSwipeLeft = useCallback(() => {
    if (activeSpace) {
      // Space nested navigation
      const currentIndex = resolveSpaceNavIndex();
      const nav = activeSpace.navigation;
      if (currentIndex > 0) {
        smoothNavigate(nav[currentIndex - 1].path);
      }
    } else {
      // Root tabs navigation
      const currentIndex = resolveRootNavIndex();
      if (currentIndex > 0) {
        smoothNavigate(ROOT_TABS[currentIndex - 1]);
      }
    }
  }, [activeSpace, resolveSpaceNavIndex, resolveRootNavIndex, smoothNavigate]);

  // 7. Handle Swipe Right (Go to next item in RTL visual flow)
  const handleSwipeRight = useCallback(() => {
    if (activeSpace) {
      // Space nested navigation
      const currentIndex = resolveSpaceNavIndex();
      const nav = activeSpace.navigation;
      if (currentIndex >= 0 && currentIndex < nav.length - 1) {
        smoothNavigate(nav[currentIndex + 1].path);
      }
    } else {
      // Root tabs navigation
      const currentIndex = resolveRootNavIndex();
      if (currentIndex >= 0 && currentIndex < ROOT_TABS.length - 1) {
        smoothNavigate(ROOT_TABS[currentIndex + 1]);
      }
    }
  }, [activeSpace, resolveSpaceNavIndex, resolveRootNavIndex, smoothNavigate]);

  // Bind touch swipe gesture
  useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    enabled: isEnabled,
  });
}

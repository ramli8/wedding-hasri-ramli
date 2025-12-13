/**
 * Fullscreen Utility for Mobile/Tablet
 * Auto-triggers fullscreen mode on admin pages
 */

export const isFullscreenSupported = (): boolean => {
  if (typeof document === 'undefined') return false;
  
  return !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled
  );
};

export const isFullscreenActive = (): boolean => {
  if (typeof document === 'undefined') return false;
  
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
};

export const enterFullscreen = async (): Promise<void> => {
  if (typeof document === 'undefined') return;
  
  const elem = document.documentElement;

  try {
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      await (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).mozRequestFullScreen) {
      await (elem as any).mozRequestFullScreen();
    } else if ((elem as any).msRequestFullscreen) {
      await (elem as any).msRequestFullscreen();
    }
    
    // Lock screen orientation to portrait on mobile
    if ('screen' in window && 'orientation' in (window.screen as any)) {
      try {
        await (window.screen.orientation as any).lock('portrait');
      } catch (e) {
        // Orientation lock not critical, silent fail
      }
    }
    
    console.log('✅ Fullscreen mode activated');
  } catch (error) {
    console.warn('⚠️ Fullscreen request failed:', error);
    throw error;
  }
};

export const exitFullscreen = async (): Promise<void> => {
  if (typeof document === 'undefined') return;
  
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
    
    console.log('✅ Fullscreen mode exited');
  } catch (error) {
    console.warn('Exit fullscreen failed:', error);
  }
};

export const toggleFullscreen = async (): Promise<void> => {
  if (isFullscreenActive()) {
    await exitFullscreen();
  } else {
    await enterFullscreen();
  }
};

export const isMobileOrTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for mobile devices
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  
  // Check for tablet-specific sizes
  const isTabletSize = window.innerWidth >= 768 && window.innerWidth < 1280;
  
  // Check touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return (isMobile || isTabletSize) && hasTouch;
};

export const shouldAutoFullscreen = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if on admin pages
  const isAdminPage = window.location.pathname.startsWith('/admin');
  
  // Check if mobile or tablet
  const isMobileDevice = isMobileOrTablet();
  
  // Check if already in fullscreen
  const alreadyFullscreen = isFullscreenActive();
  
  // Check if already triggered this session
  const sessionTriggered = sessionStorage.getItem('fullscreen-triggered') === 'true';
  
  return isAdminPage && isMobileDevice && !alreadyFullscreen && !sessionTriggered;
};

export const setupFullscreenAutoTrigger = () => {
  if (typeof window === 'undefined') return;
  
  // Auto-trigger on page load
  const triggerFullscreen = () => {
    if (shouldAutoFullscreen()) {
      console.log('🎯 Auto-triggering fullscreen for mobile/tablet');
      
      // Delay slightly to ensure page is ready
      setTimeout(() => {
        enterFullscreen().catch(() => {
          console.log('ℹ️ Fullscreen requires user interaction on some browsers');
        });
      }, 500);
    }
  };

  // Trigger on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', triggerFullscreen);
  } else {
    triggerFullscreen();
  }

  // Re-trigger on navigation (for SPAs)
  window.addEventListener('popstate', triggerFullscreen);
  
  // Listen for fullscreen changes
  const fullscreenChangeHandler = () => {
    if (!isFullscreenActive()) {
      console.log('ℹ️ User exited fullscreen');
    }
  };

  document.addEventListener('fullscreenchange', fullscreenChangeHandler);
  document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
  document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
  document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
};

// Initialize on import
if (typeof window !== 'undefined') {
  setupFullscreenAutoTrigger();
}

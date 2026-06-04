import { useEffect, useRef } from "react";

export function useTabNotification() {
  const originalTitle = useRef(document.title);
  const unreadCount = useRef(0);
  const flashInterval = useRef(null);

  const setUnreadCount = (count) => {
    unreadCount.current = count;

    // Clear existing interval
    if (flashInterval.current) {
      clearInterval(flashInterval.current);
      flashInterval.current = null;
    }

    if (count > 0) {
      // ✅ Update tab title with count
      document.title = `(${count}) Hamro Astro`;

      // ✅ Flash the tab title
      let isOriginal = false;
      flashInterval.current = setInterval(() => {
        document.title = isOriginal
          ? `(${count}) Hamro Astro`
          : `💬 New Message!`;
        isOriginal = !isOriginal;
      }, 1500);

    } else {
      // ✅ Reset title when messages read
      document.title = originalTitle.current;
    }
  };

  const clearNotification = () => {
    unreadCount.current = 0;
    if (flashInterval.current) {
      clearInterval(flashInterval.current);
      flashInterval.current = null;
    }
    document.title = originalTitle.current;
  };

  // ✅ Clear when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        clearNotification();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (flashInterval.current) clearInterval(flashInterval.current);
      document.title = originalTitle.current;
    };
  }, []);

  return { setUnreadCount, clearNotification };
}
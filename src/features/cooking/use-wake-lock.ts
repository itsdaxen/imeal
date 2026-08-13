"use client";

import { useEffect } from "react";

// Cooking means long gaps without touching the screen, so the display would
// otherwise sleep mid-recipe. The lock is dropped whenever the tab is hidden and
// must be re-acquired on return.
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) {
      return;
    }

    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    const acquire = async () => {
      try {
        sentinel = await navigator.wakeLock.request("screen");
      } catch {
        // Denied, unsupported, or the document is not visible. Cooking still works.
      }
    };

    const reacquire = () => {
      if (document.visibilityState === "visible" && !released) {
        void acquire();
      }
    };

    void acquire();
    document.addEventListener("visibilitychange", reacquire);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", reacquire);
      void sentinel?.release();
    };
  }, [enabled]);
}

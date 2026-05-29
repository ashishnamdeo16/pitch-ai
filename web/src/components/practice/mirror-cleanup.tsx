"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { stopCameraStream } from "@/lib/camera-stream";
import { useSessionStore } from "@/store/session-store";

/** Stop mirror camera when navigating away from Practice. */
export function PracticeMirrorCleanup() {
  const pathname = usePathname();
  const setMirrorMode = useSessionStore((s) => s.setMirrorMode);

  useEffect(() => {
    if (pathname !== "/dashboard/practice") {
      stopCameraStream();
      setMirrorMode(false);
    }
  }, [pathname, setMirrorMode]);

  return null;
}

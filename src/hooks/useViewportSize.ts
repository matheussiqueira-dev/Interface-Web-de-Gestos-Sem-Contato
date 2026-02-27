"use client";

import { useEffect, useState } from "react";

interface ViewportSize {
  width: number;
  height: number;
  dpr: number;
}

function readViewport(): ViewportSize {
  if (typeof window === "undefined") {
    return {
      width: 0,
      height: 0,
      dpr: 1,
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  };
}

export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(() => readViewport());

  useEffect(() => {
    let frameId = 0;

    const handleResize = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        setSize(readViewport());
      });
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  return size;
}

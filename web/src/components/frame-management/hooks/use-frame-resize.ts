import { useEffect, useState } from "react";

export function useFrameResize(canvasAreaRef: React.RefObject<HTMLDivElement | null>) {
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = canvasAreaRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setAvailableWidth(width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [canvasAreaRef]);

  return availableWidth;
}

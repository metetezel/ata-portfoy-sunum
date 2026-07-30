"use client";

import { useEffect, useRef, useState } from "react";

// Recharts' own ResponsiveContainer occasionally never resolves a positive
// size in this Next.js/Turbopack dev setup (its ResizeObserver-driven state
// update doesn't reach the chart), leaving charts blank. Measuring the
// container ourselves and handing Recharts fixed pixel dimensions sidesteps
// that: fixed width/height skips Recharts' own size-detection path entirely.
export function GrafikKapsayici({
  height,
  children,
}: {
  // Omit height to fill whatever the parent (a flex/grid cell) gives it,
  // instead of a fixed pixel value — used for charts that should grow into
  // available page space rather than stay a fixed size.
  height?: number;
  children: (boyut: { width: number; height: number }) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [olculenBoyut, setOlculenBoyut] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setOlculenBoyut({ width: rect.width, height: rect.height });
    });
    observer.observe(el);
    const rect = el.getBoundingClientRect();
    setOlculenBoyut({ width: rect.width, height: rect.height });
    return () => observer.disconnect();
  }, []);

  const nihaiYukseklik = height ?? olculenBoyut.height;

  return (
    <div ref={ref} style={{ width: "100%", height: height ?? "100%" }}>
      {olculenBoyut.width > 0 && nihaiYukseklik > 0
        ? children({ width: olculenBoyut.width, height: nihaiYukseklik })
        : null}
    </div>
  );
}

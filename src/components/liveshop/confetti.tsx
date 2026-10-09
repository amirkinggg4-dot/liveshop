"use client";

import { useMemo } from "react";

const COLORS = ["#6C5CFF", "#FF3B8B", "#00C896", "#FFFFFF", "#B45CFF"];

/** بارش کانفتی — فقط هنگام تعامل (مودال برد/گیواوی) mount می‌شود */
export default function Confetti({ count = 80 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 2.4 + Math.random() * 2,
        drift: (Math.random() - 0.5) * 140,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
        round: Math.random() > 0.7,
      })),
    [count]
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      aria-hidden
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="ls-confetti-piece"
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              width: p.size,
              height: p.size * 1.5,
              borderRadius: p.round ? "50%" : "2px",
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              "--ls-drift": `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

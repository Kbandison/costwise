"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface CounterProps {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  decimals?: number;
}

export function Counter({
  target,
  prefix = "",
  suffix = "",
  duration = 1.5,
  className,
  decimals = 0,
}: CounterProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = counterRef.current;
    const numEl = spanRef.current;
    if (!el || !numEl) return;

    const obj = { value: 0 };

    const tween = gsap.to(obj, {
      value: target,
      duration,
      ease: "power2.out",
      snap: { value: decimals > 0 ? 1 / Math.pow(10, decimals) : 1 },
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        toggleActions: "play none none none",
      },
      onUpdate: () => {
        numEl.textContent = obj.value.toFixed(decimals);
      },
    });

    return () => {
      tween.kill();
    };
  }, [target, duration, decimals]);

  return (
    <span
      ref={counterRef}
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {prefix}
      <span ref={spanRef}>0</span>
      {suffix}
    </span>
  );
}

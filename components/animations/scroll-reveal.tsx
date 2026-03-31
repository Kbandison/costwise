"use client";

import { useGSAP } from "@/hooks/use-gsap";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  scale?: number;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 60,
  duration = 0.7,
  scale,
}: ScrollRevealProps) {
  const ref = useGSAP((gsap) => {
    const el = ref.current;
    if (!el) return;

    const fromVars: gsap.TweenVars = {
      y,
      opacity: 0,
    };

    if (scale !== undefined) {
      fromVars.scale = scale;
    }

    gsap.from(el, {
      ...fromVars,
      duration,
      delay,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

"use client";

import { useGSAP } from "@/hooks/use-gsap";

interface TextRevealProps {
  children: string;
  className?: string;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
  stagger?: number;
  delay?: number;
}

export function TextReveal({
  children,
  className,
  tag: Tag = "h2",
  stagger = 0.12,
  delay = 0,
}: TextRevealProps) {
  const lines = children.includes("\n")
    ? children.split("\n")
    : children.split(" ");

  const isWords = !children.includes("\n");

  const ref = useGSAP((gsap) => {
    const el = ref.current;
    if (!el) return;

    const spans = el.querySelectorAll<HTMLSpanElement>(".text-reveal-item");

    gsap.from(spans, {
      y: "100%",
      opacity: 0,
      duration: 0.8,
      stagger,
      delay,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });
  });

  return (
    <div ref={ref}>
      <Tag className={className}>
        {lines.map((segment, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              verticalAlign: "top",
            }}
          >
            <span
              className="text-reveal-item"
              style={{ display: "inline-block" }}
            >
              {segment}
              {isWords && i < lines.length - 1 ? "\u00A0" : ""}
            </span>
            {!isWords && i < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </Tag>
    </div>
  );
}

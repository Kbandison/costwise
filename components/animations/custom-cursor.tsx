"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/use-app-store";

const cursorVariants = {
  default: { scale: 1, opacity: 1 },
  hover: { scale: 3, opacity: 1 },
  action: { scale: 2, opacity: 1 },
  hidden: { scale: 1, opacity: 0 },
};

export function CustomCursor() {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const cursorVariant = useAppStore((s) => s.cursorVariant);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkDesktop();
    window.addEventListener("resize", checkDesktop);

    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", checkDesktop);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  if (!isDesktop) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 h-4 w-4 rounded-full bg-white pointer-events-none z-[9999] mix-blend-difference"
      animate={{
        x: mouseX - 8,
        y: mouseY - 8,
        ...cursorVariants[cursorVariant],
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 28,
        mass: 0.5,
      }}
    />
  );
}

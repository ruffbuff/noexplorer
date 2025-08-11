import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SignatureGlowProps {
  className?: string;
  intensity?: number; // 0..1
  children?: React.ReactNode;
}

// Subtle reactive glow that follows the pointer using design tokens.
export const SignatureGlow: React.FC<SignatureGlowProps> = ({
  className,
  intensity = 1,
  children,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--glow-x", `${x}px`);
      el.style.setProperty("--glow-y", `${y}px`);
    };

    const onLeave = () => {
      el.style.setProperty("--glow-x", `-9999px`);
      el.style.setProperty("--glow-y", `-9999px`);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "relative",
        // Create a radial glow using brand tokens. Respect reduced motion implicitly.
        "before:pointer-events-none before:absolute before:inset-0 before:[mask-image:radial-gradient(200px_200px_at_var(--glow-x,_-200px)_var(--glow-y,_-200px),_black,_transparent_60%)]",
        "before:bg-[radial-gradient(400px_400px_at_var(--glow-x,_-200px)_var(--glow-y,_-200px),_hsl(var(--brand-500)/0.25),_transparent_60%)]",
        className
      )}
      style={{
        // Additional control for intensity if needed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ["--intensity" as any]: intensity,
      }}
    >
      {children}
    </div>
  );
};

export default SignatureGlow;

"use client";

import { useEffect, useRef, useState } from "react";
import { clamp, rand } from "@/lib/bubbles";

export function Cat() {
  const [blinking, setBlinking] = useState(false);
  const [hopping, setHopping] = useState(false);
  const [pupil, setPupil] = useState({ nx: 0, ny: 0 });
  const timeoutRef = useRef(0);

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      const nx = clamp(e.clientX / window.innerWidth - 0.5, -0.5, 0.5);
      const ny = clamp(e.clientY / window.innerHeight - 0.5, -0.5, 0.5);
      setPupil({ nx, ny });
    }
    document.addEventListener("pointermove", handlePointerMove);
    return () => document.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let cancelled = false;
    function blinkLoop() {
      timeoutRef.current = window.setTimeout(() => {
        if (cancelled) return;
        setBlinking(true);
        window.setTimeout(() => {
          if (cancelled) return;
          setBlinking(false);
          blinkLoop();
        }, 140);
      }, rand(2600, 6200));
    }
    blinkLoop();
    return () => {
      cancelled = true;
      clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleClick() {
    if (!hopping) setHopping(true);
  }

  const className = [blinking && "blink", hopping && "hop"].filter(Boolean).join(" ");

  return (
    <svg
      id="cat"
      className={className}
      viewBox="0 0 80 74"
      role="button"
      aria-label="ねこ"
      tabIndex={0}
      onClick={handleClick}
      onAnimationEnd={() => setHopping(false)}
    >
      <g className="tail">
        <path
          d="M28 61 C11 63 1 53 3 41 C3.7 36.5 8 34.8 10 38.5 C8.4 47.5 14 55.5 29 53.5 Z"
          fill="#33313E"
          opacity="0.88"
        />
      </g>
      <g fill="#33313E" opacity="0.9">
        <ellipse cx="47" cy="56" rx="22" ry="16" />
        <circle cx="47" cy="29" r="16" />
        <path d="M35 19 C33.5 12 31.5 6.5 30 3 C34.8 5.2 39.5 8.6 43.5 12.5 Z" />
        <path d="M59 19 C60.5 12 62.5 6.5 64 3 C59.2 5.2 54.5 8.6 50.5 12.5 Z" />
        <path d="M33 25 l-7.5 2.6 7 2.2 Z" />
        <path d="M32.5 31 l-6.5 3 6.5 2.2 Z" />
        <path d="M61 25 l7.5 2.6 -7 2.2 Z" />
        <path d="M61.5 31 l6.5 3 -6.5 2.2 Z" />
        <path d="M36 42 l-4 4 5.5 0.5 Z" />
        <path d="M58 42 l4 4 -5.5 0.5 Z" />
      </g>
      <g className="eye">
        <circle cx={41 + pupil.nx * 2.2} cy={29 + pupil.ny * 1.8} r="2.2" fill="#FCFBF8" />
      </g>
      <g className="eye">
        <circle cx={53 + pupil.nx * 2.2} cy={29 + pupil.ny * 1.8} r="2.2" fill="#FCFBF8" />
      </g>
    </svg>
  );
}

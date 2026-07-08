"use client";

import { useEffect, useState } from "react";
import { HUES, rand } from "@/lib/bubbles";

type MiniBubble = {
  id: number;
  size: number;
  left: number;
  top: number;
  borderColor: string;
  background: string;
  duration: number;
  delay: number;
};

/** このサイト自体のモック。ミニ泡は SSR とのランダム値不一致を避けるため mount 時にだけ生成する。 */
export function SiteMock() {
  const [bubbles, setBubbles] = useState<MiniBubble[]>([]);

  useEffect(() => {
    function seedBubbles() {
      setBubbles(
        Array.from({ length: 9 }, (_, i) => {
          const size = rand(14, 44);
          return {
            id: i,
            size,
            left: rand(4, 88),
            top: rand(20, 90),
            borderColor: `rgba(${HUES[i % 4]},0.9)`,
            background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.8) 0 18%, rgba(${HUES[(i + 1) % 4]},0.25))`,
            duration: rand(5, 11),
            delay: -rand(0, 8),
          };
        })
      );
    }
    seedBubbles();
  }, []);

  return (
    <div className="mock m-site">
      <div className="tbar">
        <span className="dots">
          <span />
          <span />
          <span />
        </span>
        <span>natume-nat.dev</span>
      </div>
      <div className="sbody">
        <span className="slogo">Yutaro Nakayama</span>
        {bubbles.map((b) => (
          <span
            key={b.id}
            className="b"
            style={{
              width: b.size,
              height: b.size,
              left: `${b.left}%`,
              top: `${b.top}%`,
              borderColor: b.borderColor,
              background: b.background,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

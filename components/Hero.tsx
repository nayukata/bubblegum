"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  TAU,
  clamp,
  drawBubble,
  drawPops,
  fitCanvas,
  pickHues,
  rand,
  spawnPop,
  type PopEffects,
} from "@/lib/bubbles";
import { hasSeenOpening } from "@/lib/opening";
import { playPop } from "@/lib/sound";

type Bubble = {
  baseX: number;
  y: number;
  r: number;
  hA: string;
  hB: string;
  vy: number;
  ph: number;
  dph: number;
  amp: number;
  spin: number;
  dspin: number;
};

function bubbleX(b: Bubble): number {
  return b.baseX + Math.sin(b.ph) * b.amp;
}

export function Hero() {
  const [revealed, setRevealed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // オープニングが既に済んでいれば(セッション内の再訪問)、イベントを待たずに即 reveal する。
  useLayoutEffect(() => {
    function revealIfAlreadySeen() {
      if (hasSeenOpening()) setRevealed(true);
    }
    revealIfAlreadySeen();
  }, []);

  useEffect(() => {
    function handleDone() {
      setRevealed(true);
    }
    // リプレイ開始時は一旦隠し、オープニング終了時にまた reveal し直す(元実装と同じ挙動)。
    function handleReplay() {
      setRevealed(false);
    }
    window.addEventListener("opening-done", handleDone);
    window.addEventListener("replay-opening", handleReplay);
    return () => {
      window.removeEventListener("opening-done", handleDone);
      window.removeEventListener("replay-opening", handleReplay);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let bubbles: Bubble[] = [];
    const fx: PopEffects = { rings: [], drops: [] };
    let raf = 0;

    function makeBubble(w: number, h: number, fromBottom: boolean): Bubble {
      const r = rand(12, 62);
      const [hA, hB] = pickHues();
      return {
        baseX: rand(-40, w + 40),
        y: fromBottom ? h + r + rand(0, h * 0.4) : rand(-r, h + r),
        r,
        hA,
        hB,
        vy: rand(0.12, 0.4) * (r / 40 + 0.6),
        ph: rand(0, TAU),
        dph: rand(0.004, 0.012),
        amp: rand(8, 26),
        spin: rand(0, TAU),
        dspin: rand(-0.004, 0.004),
      };
    }

    function seedBubbles() {
      const { w, h } = fitCanvas(canvas!);
      const n = clamp(Math.round((w * h) / 46000), 8, 24);
      bubbles = Array.from({ length: n }, () => makeBubble(w, h, false));
    }

    function popBubble(b: Bubble) {
      playPop();
      spawnPop(fx, bubbleX(b), b.y, b.r, b.hA, b.hB);
      const { w, h } = fitCanvas(canvas!);
      Object.assign(b, makeBubble(w, h, true));
    }

    function loop() {
      const { w, h } = fitCanvas(canvas!);
      ctx!.clearRect(0, 0, w, h);
      for (const b of bubbles) {
        if (!reduced) {
          b.y -= b.vy;
          b.ph += b.dph;
          b.spin += b.dspin;
        }
        if (b.y < -b.r - 20) Object.assign(b, makeBubble(w, h, true));
        drawBubble(ctx!, bubbleX(b), b.y, b.r, b.spin, b.hA, b.hB, 0.92);
      }
      drawPops(ctx!, fx);
      raf = requestAnimationFrame(loop);
    }

    function handleClick(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      for (const b of bubbles) {
        if (Math.hypot(bubbleX(b) - x, b.y - y) < b.r + 6) {
          popBubble(b);
          break;
        }
      }
    }

    seedBubbles();
    raf = requestAnimationFrame(loop);
    canvas.addEventListener("click", handleClick);
    window.addEventListener("resize", seedBubbles);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("click", handleClick);
      window.removeEventListener("resize", seedBubbles);
    };
  }, []);

  return (
    <section className="hero" id="top">
      <canvas id="bubbleCanvas" ref={canvasRef} aria-hidden="true" />
      <div className="hero-inner">
        <p className={`eyebrow float ${revealed ? "in" : ""}`} style={{ transitionDelay: "0ms" }}>
          Yutaro Nakayama / engineer — automation lover
        </p>
        <h1 className={`float ${revealed ? "in" : ""}`} style={{ transitionDelay: "130ms" }}>
          泡のように、
          <br />
          軽やかにつくる。
        </h1>
        <p className={`lede float ${revealed ? "in" : ""}`} style={{ transitionDelay: "260ms" }}>
          面倒なことは仕組みに任せて、誰かの力になるものをつくっています。TypeScript
          と自動化と、猫が好きなエンジニアです。
        </p>
        <div className={`chips float ${revealed ? "in" : ""}`} style={{ transitionDelay: "390ms" }}>
          <span className="chip">自動化思考</span>
          <span className="chip">TypeScript / Next.js</span>
          <span className="chip">困りごと歓迎</span>
          <span className="chip">オンラインゲーム</span>
        </div>
      </div>
      <div className={`scroll-hint float ${revealed ? "in" : ""}`} style={{ transitionDelay: "520ms" }}>
        scroll
        <span className="dot" />
      </div>
    </section>
  );
}

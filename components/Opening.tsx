"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { TAU, easeInOut, easeOut, drawBubble, fitCanvas, pickHues, rand } from "@/lib/bubbles";
import { consumeOpeningReplayRequest, hasSeenOpening, markOpeningSeen } from "@/lib/opening";
import { ensureAudioContext, playReveal, playRise } from "@/lib/sound";

const NAME_TEXT = "bubble gum";
const SUB_TEXT = "yutaro nakayama";
const nameChars = [...NAME_TEXT];
const subChars = [...SUB_TEXT];

type Obstacle = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  r: number;
  spin: number;
  dspin: number;
  t0: number;
  rise: number;
  conv: number;
  hA: string;
  hB: string;
  popped: boolean;
};

type Ring = { x: number; y: number; r: number; max: number; a: number; hA: string };

export function Opening() {
  const [removed, setRemoved] = useState(false);
  const [fading, setFading] = useState(false);
  const [gateVisible, setGateVisible] = useState(false);
  const [nameCharsIn, setNameCharsIn] = useState<boolean[]>(() => nameChars.map(() => false));
  const [subCharsIn, setSubCharsIn] = useState<boolean[]>(() => subChars.map(() => false));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const doneRef = useRef(false);
  const isPlayingRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);
  const endOpeningRef = useRef<() => void>(() => {});
  const playOpeningRef = useRef<(force: boolean) => void>(() => {});

  useLayoutEffect(() => {
    function clearTimers() {
      for (const id of timeoutsRef.current) clearTimeout(id);
      timeoutsRef.current = [];
    }

    function forceAllCharsIn() {
      setNameCharsIn(nameChars.map(() => true));
      setSubCharsIn(subChars.map(() => true));
    }

    function revealCharsStaggered() {
      nameChars.forEach((_, i) => {
        const id = window.setTimeout(() => {
          setNameCharsIn((prev) => prev.map((v, idx) => (idx === i ? true : v)));
        }, i * 55);
        timeoutsRef.current.push(id);
      });
      // SUB は文字数が伸びると reveal 時間 + transition(0.7s) が endOpening までの budget を
      // 越えて末尾が浮上前にフェードに巻き込まれる。stagger を可変+初期遅延を短縮して budget 内に収める。
      const subStagger = Math.min(40, Math.floor(400 / Math.max(1, subChars.length)));
      subChars.forEach((_, i) => {
        const id = window.setTimeout(() => {
          setSubCharsIn((prev) => prev.map((v, idx) => (idx === i ? true : v)));
        }, 150 + i * subStagger);
        timeoutsRef.current.push(id);
      });
    }

    function endOpening() {
      if (doneRef.current) return;
      doneRef.current = true;
      isPlayingRef.current = false;
      markOpeningSeen();
      cancelAnimationFrame(rafRef.current);
      forceAllCharsIn();
      setFading(true);
      const id = window.setTimeout(() => setRemoved(true), 720);
      timeoutsRef.current.push(id);
      window.dispatchEvent(new CustomEvent("opening-done"));
    }
    endOpeningRef.current = endOpening;

    function playOpening(force: boolean) {
      // 再生中に何らかの理由で再度呼ばれても、force(明示的なリプレイ)でない限り無視する。
      // 二重の rAF ループや音の多重発火を防ぐための再入ガード。
      if (isPlayingRef.current && !force) return;
      if (!force && hasSeenOpening()) {
        doneRef.current = true;
        setRemoved(true);
        window.dispatchEvent(new CustomEvent("opening-done"));
        return;
      }
      isPlayingRef.current = true;
      setGateVisible(false);
      doneRef.current = false;
      clearTimers();
      setRemoved(false);
      setFading(false);
      setNameCharsIn(nameChars.map(() => false));
      setSubCharsIn(subChars.map(() => false));

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        endOpening();
        return;
      }
      playRise();

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) {
        endOpening();
        return;
      }

      // canvas はこの時点ではまだ display:none(state 更新が反映される前)なので、
      // ここで fitCanvas を呼ぶと clientWidth/Height が 0 になり、obstacle が全部原点に
      // seed されてしまう(泡が一切見えなくなるバグの原因)。実際に表示された後の
      // 最初の rAF フレームまで座標計算を遅延する。
      let obstacles: Obstacle[] | null = null;
      let rings: Ring[] = [];
      let charsShown = false;
      let start = 0;

      function seedObstacles(w: number, h: number): Obstacle[] {
        const cx = w / 2;
        const cy = h * 0.44;
        const list: Obstacle[] = [];
        for (let i = 0; i < 34; i++) {
          const [hA, hB] = pickHues();
          list.push({
            x0: rand(w * 0.05, w * 0.95),
            y0: h + rand(30, h * 0.5),
            x1: rand(w * 0.1, w * 0.9),
            y1: rand(h * 0.2, h * 0.8),
            x2: cx + rand(-w * 0.16, w * 0.16),
            y2: cy + rand(-30, 30),
            r: rand(10, 42),
            spin: rand(0, TAU),
            dspin: rand(-0.01, 0.01),
            t0: rand(0, 0.45),
            rise: rand(1.0, 1.5),
            conv: rand(0.5, 0.75),
            hA,
            hB,
            popped: false,
          });
        }
        return list;
      }

      function frame(now: number) {
        const { w: ww, h: hh } = fitCanvas(canvas!);
        if (!obstacles) {
          obstacles = seedObstacles(ww, hh);
          start = now;
        }
        const t = (now - start) / 1000;
        ctx!.clearRect(0, 0, ww, hh);
        for (const o of obstacles) {
          o.spin += o.dspin;
          const t1 = o.t0 + o.rise;
          const t2 = t1 + o.conv;
          if (t < o.t0) continue;
          if (t < t1) {
            const p = easeOut((t - o.t0) / o.rise);
            const x = o.x0 + (o.x1 - o.x0) * p + Math.sin(t * 3 + o.spin) * 8;
            const y = o.y0 + (o.y1 - o.y0) * p;
            drawBubble(ctx!, x, y, o.r, o.spin, o.hA, o.hB, Math.min(p * 3, 1));
          } else if (t < t2) {
            const p = easeInOut((t - t1) / o.conv);
            const x = o.x1 + (o.x2 - o.x1) * p;
            const y = o.y1 + (o.y2 - o.y1) * p;
            drawBubble(ctx!, x, y, o.r * (1 - p * 0.55), o.spin, o.hA, o.hB, 1);
          } else if (!o.popped) {
            o.popped = true;
            rings.push({ x: o.x2, y: o.y2, r: o.r * 0.5, max: o.r * 1.8, a: 0.85, hA: o.hA });
          }
        }
        for (const rg of rings) {
          rg.r += (rg.max - rg.r) * 0.14;
          rg.a -= 0.035;
          if (rg.a > 0) {
            ctx!.strokeStyle = `rgba(${rg.hA},${rg.a})`;
            ctx!.lineWidth = 2;
            ctx!.beginPath();
            ctx!.arc(rg.x, rg.y, rg.r, 0, TAU);
            ctx!.stroke();
          }
        }
        rings = rings.filter((rg) => rg.a > 0);
        if (t > 1.75 && !charsShown) {
          charsShown = true;
          playReveal();
          revealCharsStaggered();
        }
        // 元の閾値 3.15s は 9 文字の "portfolio" 前提で調整されていた。
        // 15 文字の "yutaro nakayama" では reveal + transition が 3.06s 頃終わるため、
        // 完全に浮上している状態を見せる余白を確保するため 3.5s まで伸ばす。
        if (t > 3.5) {
          endOpening();
          return;
        }
        rafRef.current = requestAnimationFrame(frame);
      }
      rafRef.current = requestAnimationFrame(frame);
    }
    playOpeningRef.current = playOpening;

    function handleReplay() {
      // html に scroll-behavior: smooth があるため "auto" は smooth 扱いになり、
      // オープニングの冒頭がスクロール中に隠れてしまう。"instant" で即座に戻す。
      window.scrollTo({ top: 0, behavior: "instant" });
      // ボタンクリックの同期呼び出し連鎖の中で resume するので、自動再生制限に引っかからない。
      ensureAudioContext();
      playOpening(true);
    }

    function decideInitialEntry() {
      const forcedReplay = consumeOpeningReplayRequest();
      const reducedAtMount = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (forcedReplay || hasSeenOpening() || reducedAtMount) {
        // 再訪問・作品詳細からの強制リプレイ・reduced-motion のいずれかなら、
        // ゲートを挟まずこれまで通りの判定に任せる(reduced はこの中で即終了する)。
        playOpening(forcedReplay);
      } else {
        // 純粋な初回訪問のみ、ブラウザの自動再生制限を避けるための tap to start を挟む。
        setGateVisible(true);
      }
    }
    decideInitialEntry();
    window.addEventListener("replay-opening", handleReplay);
    return () => {
      window.removeEventListener("replay-opening", handleReplay);
      cancelAnimationFrame(rafRef.current);
      clearTimers();
    };
  }, []);

  // tap to start ゲート表示中だけ、泡を2〜3個ゆっくり漂わせる(本編の収束アニメーションとは別の軽い演出)。
  useEffect(() => {
    if (!gateVisible) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const { w, h } = fitCanvas(canvas);
    const idleBubbles = Array.from({ length: 3 }, () => {
      const [hA, hB] = pickHues();
      return {
        x: rand(w * 0.2, w * 0.8),
        y: rand(h * 0.25, h * 0.75),
        r: rand(30, 60),
        hA,
        hB,
        vy: rand(0.05, 0.12),
        ph: rand(0, TAU),
        spin: rand(0, TAU),
      };
    });
    let raf = 0;
    function frame() {
      const { w: ww, h: hh } = fitCanvas(canvas!);
      ctx!.clearRect(0, 0, ww, hh);
      for (const b of idleBubbles) {
        if (!reduced) {
          b.y -= b.vy;
          b.ph += 0.004;
        }
        if (b.y < -b.r) b.y = hh + b.r;
        drawBubble(ctx!, b.x + Math.sin(b.ph) * 10, b.y, b.r, b.spin, b.hA, b.hB, 0.5);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [gateVisible]);

  function handleSkipClick(event: MouseEvent) {
    // ゲート中は #opening 自体がクリックハンドラを持つため、skip 単独のクリックとして扱う。
    event.stopPropagation();
    setGateVisible(false);
    endOpeningRef.current();
  }

  function handleGateActivate() {
    // トラステッドなユーザー操作(クリック/Enter/Space)の呼び出し連鎖内で resume するので、
    // 自動再生制限に引っかからず初回から音が鳴る。
    ensureAudioContext();
    playOpeningRef.current(false);
  }

  function handleGateKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleGateActivate();
    }
  }

  // 完全にアンマウントすると canvas の ref が失われ、リプレイ時に canvasRef.current が
  // null のまま playOpening が走って即終了してしまう。元実装と同じく display:none で隠すだけにする。
  return (
    <div
      id="opening"
      className={fading ? "fade" : ""}
      aria-hidden={gateVisible ? undefined : "true"}
      style={removed ? { display: "none" } : undefined}
      role={gateVisible ? "button" : undefined}
      tabIndex={gateVisible ? 0 : undefined}
      aria-label={gateVisible ? "オープニングを再生" : undefined}
      onClick={gateVisible ? handleGateActivate : undefined}
      onKeyDown={gateVisible ? handleGateKeyDown : undefined}
    >
      <canvas ref={canvasRef} />
      {gateVisible ? (
        <div className="op-logo">
          <p className="op-tap">tap to start</p>
        </div>
      ) : (
        <div className="op-logo">
          <div className="op-name">
            {nameChars.map((ch, i) => (
              <span key={i} className={`op-char ${nameCharsIn[i] ? "in" : ""}`}>
                {/* op-char は inline-block のため半角スペースが幅ゼロに潰れる。nbsp で語間を保つ */}
                {ch === " " ? " " : ch}
              </span>
            ))}
          </div>
          <div className="op-sub">
            {subChars.map((ch, i) => (
              <span key={i} className={`op-char ${subCharsIn[i] ? "in" : ""}`}>
                {ch === " " ? " " : ch}
              </span>
            ))}
          </div>
        </div>
      )}
      <button id="skipBtn" type="button" onClick={handleSkipClick}>
        skip →
      </button>
    </div>
  );
}

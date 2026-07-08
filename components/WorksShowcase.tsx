"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, ViewTransition } from "react";
import { HearcatMock } from "./mocks/HearcatMock";
import { QiitaMock } from "./mocks/QiitaMock";
import { TermMock } from "./mocks/TermMock";
import { SiteMock } from "./mocks/SiteMock";
import {
  TAU,
  clamp,
  drawBubble,
  drawPops,
  easeInOut,
  fitCanvas,
  pickFrom,
  rand,
  spawnPop,
  type PopEffects,
} from "@/lib/bubbles";
import { playPop } from "@/lib/sound";
import { themeToCssVars, WORKS } from "@/lib/works";
import { saveWorksReturnScroll } from "@/lib/worksReturn";

const MOCK_COMPONENTS = {
  hearcat: HearcatMock,
  qiita: QiitaMock,
  term: TermMock,
  site: SiteMock,
} as const;

// パネルの背後を漂う装飾用の泡の色。作品ごとのテーマ(背景/文字色)とは独立した演出要素なので固定4色で足りる。
const HUESETS: readonly (readonly [string, string])[] = [
  ["176,204,255", "191,227,240"],
  ["245,216,228", "250,228,214"],
  ["207,235,221", "191,227,240"],
  ["217,210,245", "245,216,228"],
];

// 各作品でスクロールが止まる「間」の重み(遷移1に対する比率)。
const DWELL = 0.55;

function steppedPos(p: number, n: number): number {
  const total = n * DWELL + (n - 1);
  let t = p * total;
  for (let i = 0; i < n; i++) {
    if (t < DWELL) return i;
    t -= DWELL;
    if (i === n - 1) break;
    if (t < 1) return i + easeInOut(t);
    t -= 1;
  }
  return n - 1;
}

type ShowcaseBubble = {
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

const WORK_COUNT = WORKS.length;

export function WorksShowcase() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const lenRef = useRef(0);
  const activeRef = useRef(0);
  const bubblesRef = useRef<ShowcaseBubble[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // useLayoutEffect にしているのは、#worksWrap の高さ確定(layout())を通常の
  // useEffect より前に済ませるため。HashScrollRestore がこの直後の layout effect で
  // 同期的にスクロール復元を行う設計になっており、View Transition が新画面を
  // キャプチャする前に「wrap 高さ確定 → スクロール復元」の順序を保証する必要がある。
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const rail = railRef.current;
    const canvas = canvasRef.current;
    const bar = barRef.current;
    if (!wrap || !rail || !canvas || !bar) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function makeBubble(w: number, h: number, fromBottom: boolean): ShowcaseBubble {
      const set = pickFrom(HUESETS, activeRef.current);
      return {
        baseX: rand(-40, w + 40),
        y: fromBottom ? h + rand(20, h * 0.4) : rand(0, h),
        r: rand(10, 52),
        hA: set[0],
        hB: set[1],
        vy: rand(0.15, 0.5),
        ph: rand(0, TAU),
        dph: rand(0.004, 0.012),
        amp: rand(8, 24),
        spin: rand(0, TAU),
        dspin: rand(-0.004, 0.004),
      };
    }

    function seed() {
      const { w, h } = fitCanvas(canvas!);
      const count = clamp(Math.round((w * h) / 52000), 8, 20);
      bubblesRef.current = Array.from({ length: count }, () => makeBubble(w, h, false));
    }

    function layout() {
      // rail.scrollWidth は末尾側の padding を含まないブラウザ実装があり、
      // それをそのまま引くと len が paddingRight ぶん過大になり p=1 で最終パネルが中央からずれる。
      // 先頭パネルは paddingLeft で中央に来る設計なので、同じ考え方で最終パネルの中心を直接計算する。
      const lastPanel = rail!.lastElementChild;
      lenRef.current =
        lastPanel instanceof HTMLElement
          ? Math.max(0, lastPanel.offsetLeft + lastPanel.offsetWidth / 2 - window.innerWidth / 2)
          : 0;
      wrap!.style.height = `${window.innerHeight + lenRef.current * 1.4}px`;
    }

    function isVisible() {
      const r = wrap!.getBoundingClientRect();
      return r.bottom > -100 && r.top < window.innerHeight + 100;
    }

    const fx: PopEffects = { rings: [], drops: [] };

    function draw() {
      if (!isVisible()) return;
      const { w, h } = fitCanvas(canvas!);
      ctx!.clearRect(0, 0, w, h);
      for (const b of bubblesRef.current) {
        if (!reduced) {
          b.y -= b.vy;
          b.ph += b.dph;
          b.spin += b.dspin;
        }
        if (b.y < -b.r - 20) Object.assign(b, makeBubble(w, h, true));
        drawBubble(ctx!, b.baseX + Math.sin(b.ph) * b.amp, b.y, b.r, b.spin, b.hA, b.hB, 0.85);
      }
      drawPops(ctx!, fx);
    }

    // 泡の canvas は rail や head の下に敷かれていて直接クリックを受けられないため、
    // セクション側でクリックを拾って当たり判定する。リンクとモックカードの上は
    // 除外する(カードに隠れて見えない泡が鳴ると不可解なため)。
    function handleClick(e: MouseEvent) {
      if (e.target instanceof Element && e.target.closest("a, button, .works-panel-visual")) {
        return;
      }
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      for (const b of bubblesRef.current) {
        if (Math.hypot(b.baseX + Math.sin(b.ph) * b.amp - x, b.y - y) < b.r + 6) {
          playPop();
          spawnPop(fx, b.baseX + Math.sin(b.ph) * b.amp, b.y, b.r, b.hA, b.hB);
          const { w, h } = fitCanvas(canvas!);
          Object.assign(b, makeBubble(w, h, true));
          break;
        }
      }
    }

    function onScroll() {
      const rect = wrap!.getBoundingClientRect();
      // works がピン留めされて画面を占有している間はサイトヘッダーを隠して
      // 「作品世界へ潜っている」没入感を強める(nav の CSS が body のクラスに反応する)
      document.body.classList.toggle(
        "works-dive",
        rect.top <= 0 && rect.bottom >= window.innerHeight
      );
      const totalScroll = wrap!.offsetHeight - window.innerHeight;
      if (totalScroll <= 0) return;
      const p = clamp(-rect.top / totalScroll, 0, 1);
      const pos = steppedPos(p, WORK_COUNT);
      rail!.style.transform = `translateX(${-(pos / (WORK_COUNT - 1)) * lenRef.current}px)`;
      bar!.style.width = `${p * 100}%`;
      const idx = clamp(Math.round(pos), 0, WORK_COUNT - 1);
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActiveIndex(idx);
      }
    }

    let raf = 0;
    function loop() {
      draw();
      raf = requestAnimationFrame(loop);
    }

    function handleResize() {
      layout();
      seed();
      onScroll();
    }

    layout();
    seed();
    onScroll();
    raf = requestAnimationFrame(loop);
    wrap.addEventListener("click", handleClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    // フォント読み込みで各パネルの実寸が変わることがあるため、確定後に len を計算し直す。
    document.fonts.ready.then(() => {
      layout();
      onScroll();
    });
    return () => {
      cancelAnimationFrame(raf);
      wrap.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", handleResize);
      document.body.classList.remove("works-dive");
    };
  }, []);

  const activeWork = pickFrom(WORKS, activeIndex);

  return (
    <div id="worksWrap" ref={wrapRef}>
      <section
        className="works-pin"
        id="works"
        style={{ backgroundColor: activeWork.theme.bg, ...themeToCssVars(activeWork.theme) }}
      >
        <canvas ref={canvasRef} aria-hidden="true" />
        <div className="works-head">
          <p className="sec-eyebrow float">works</p>
          <h2 className="sec-title float">つくったもの</h2>
          <p className="works-counter">
            <b>{String(activeIndex + 1).padStart(2, "0")}</b> / {String(WORK_COUNT).padStart(2, "0")}
          </p>
        </div>
        <div className="works-rail" ref={railRef}>
          {WORKS.map((work) => {
            const Mock = MOCK_COMPONENTS[work.mock];
            return (
              <article className="works-panel" key={work.slug}>
                <div className="works-panel-copy">
                  <p className="works-panel-num">
                    <b>{work.num}</b> — {work.tag}
                  </p>
                  <ViewTransition name={`work-title-${work.slug}`}>
                    <h3>{work.title}</h3>
                  </ViewTransition>
                  <p className="works-panel-lede">{work.lede}</p>
                  <Link
                    className="works-panel-go"
                    href={`/works/${work.slug}`}
                    onClick={saveWorksReturnScroll}
                  >
                    {work.cta}
                  </Link>
                </div>
                <ViewTransition name={`work-${work.slug}`}>
                  <div className="works-panel-visual">
                    <Mock />
                  </div>
                </ViewTransition>
              </article>
            );
          })}
        </div>
        <div className="works-progress" aria-hidden="true">
          <div className="bar">
            <div ref={barRef} />
          </div>
        </div>
      </section>
    </div>
  );
}

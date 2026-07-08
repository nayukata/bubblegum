// 泡の演出(canvas)を使う複数のクライアントコンポーネント(Hero / Opening / Wash / WorksShowcase / SiteMock)で
// 共有する、泡そのものの数学・描画ロジック。ここに集約することで見た目のブレをなくす。

export const TAU = Math.PI * 2;

export const HUES = ["191,227,240", "217,210,245", "245,216,228", "207,235,221"] as const;

export function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * 添字が範囲外になり得ない前提の配列アクセス用ヘルパー。
 * noUncheckedIndexedAccess 下で `arr[i]` が `T | undefined` になるのを、呼び出し側での
 * 非 null アサーション濫用ではなく、範囲クランプという意味のある形で解消する。
 */
export function pickFrom<T>(arr: readonly T[], index: number): T {
  const clamped = clamp(Math.round(index), 0, arr.length - 1);
  const value = arr[clamped];
  if (value === undefined) {
    throw new Error("pickFrom: array is empty");
  }
  return value;
}

export function pickHues(): [string, string] {
  const i = Math.floor(Math.random() * HUES.length);
  let j = Math.floor(Math.random() * HUES.length);
  if (j === i) j = (j + 1) % HUES.length;
  return [pickFrom(HUES, i), pickFrom(HUES, j)];
}

export function fitCanvas(canvas: HTMLCanvasElement): { w: number; h: number } {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return { w, h };
}

export function drawBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  spin: number,
  hA: string,
  hB: string,
  alpha: number
): void {
  if (r < 0.5 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.15, x, y, r);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.7, "rgba(255,255,255,0.03)");
  g.addColorStop(0.88, `rgba(${hA},0.14)`);
  g.addColorStop(1, `rgba(${hB},0.34)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.lineWidth = Math.max(1.2, r * 0.07);
  ctx.lineCap = "round";
  const arcs: [string, number, number, number][] = [
    [hA, 0, 1.7, 0.6],
    [hB, 2.2, 3.7, 0.55],
    ["255,255,255", 4.1, 5.3, 0.4],
  ];
  for (const [c, a0, a1, al] of arcs) {
    ctx.strokeStyle = `rgba(${c},${al})`;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.92, spin + a0, spin + a1);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.17, r * 0.09, -0.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.arc(x + r * 0.35, y + r * 0.4, r * 0.06, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/**
 * 泡が弾けたときの「広がるリング + 飛び散るしぶき」。クリックで泡を割れる
 * キャンバス(Hero / WorksShowcase)で共有し、弾け方のブレをなくす。
 */
export type PopEffects = {
  rings: { x: number; y: number; r: number; max: number; a: number; hA: string }[];
  drops: { x: number; y: number; vx: number; vy: number; a: number; c: string; s: number }[];
};

export function spawnPop(
  fx: PopEffects,
  x: number,
  y: number,
  r: number,
  hA: string,
  hB: string
): void {
  fx.rings.push({ x, y, r: r * 0.8, max: r * 2.1, a: 0.9, hA });
  for (let i = 0; i < 7; i++) {
    const an = rand(0, TAU);
    fx.drops.push({
      x,
      y,
      vx: Math.cos(an) * rand(1, 3),
      vy: Math.sin(an) * rand(1, 3) - 1,
      a: 0.9,
      c: hB,
      s: rand(1.5, 3.5),
    });
  }
}

/** リングとしぶきを 1 フレーム分進めて描き、消え終わったものを取り除く。 */
export function drawPops(ctx: CanvasRenderingContext2D, fx: PopEffects): void {
  for (const rg of fx.rings) {
    rg.r += (rg.max - rg.r) * 0.16;
    rg.a -= 0.045;
    if (rg.a > 0) {
      ctx.strokeStyle = `rgba(${rg.hA},${rg.a})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rg.x, rg.y, rg.r, 0, TAU);
      ctx.stroke();
    }
  }
  fx.rings = fx.rings.filter((r) => r.a > 0);
  for (const d of fx.drops) {
    d.x += d.vx;
    d.y += d.vy;
    d.vy += 0.06;
    d.a -= 0.025;
    if (d.a > 0) {
      ctx.fillStyle = `rgba(${d.c},${d.a})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.s, 0, TAU);
      ctx.fill();
    }
  }
  fx.drops = fx.drops.filter((d) => d.a > 0);
}

/**
 * drawBubble はガラスの泡らしさのため中心をほぼ透明にする設計で、直径 10px 未満の
 * 粒として大量に撒くと視認できないほど薄くなる(実測で確認)。粉散演出(Wash)用に、
 * 小さくてもはっきり見える塗りつぶし中心の粒を別関数として用意する。
 */
export function drawGrain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  hA: string,
  hB: string,
  alpha: number
): void {
  if (r < 0.4 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = `rgba(${hB},0.85)`;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = `rgba(${hA},0.9)`;
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.45, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.18, 0, TAU);
  ctx.fill();
  ctx.restore();
}

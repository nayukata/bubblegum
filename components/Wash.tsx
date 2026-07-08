"use client";

import { useEffect, useRef } from "react";
import { TAU, clamp, easeOut, fitCanvas, rand } from "@/lib/bubbles";
import { playPop } from "@/lib/sound";

// 水中に潜る比喩のセクション間トランジション。
//
// 覆いの主役は backdrop blur によるピント(CSS 側で固定 22px、.washing クラスで有効化):
//   - 覆う: ページは透けて見え続けたまま、視界が水の色に沈みながらぼけていく
//   - 保持: ぼけ切って内容を判別できない間に instant ジャンプする
//   - 晴れる: ピントがゆっくり戻ってくる = 「徐々に視界がクリアになる」
// canvas には「一点の太陽とそこから放射する光」「遠近 3 層の泡」「きらめく微細な粒」
// 「周辺を沈めるビネット」を描く。
//
// 時計は 2 本持つ: 風景(泡・光の揺らぎ)の時計は巻き戻さず、覆いの進行の時計だけ
// 連続遷移時に巻き戻す。これにより実行中に別のセクションへ遷移しても、泡が飛び
// 散ることなく「もう一度水が満ちて別の場所に着く」動きになる。
const COVER_DURATION = 0.5;
const HOLD_DURATION = 0.25;
const CLEAR_DURATION = 1.4;
const JUMP_AT = COVER_DURATION;
const CLEAR_START = COVER_DURATION + HOLD_DURATION;
const TOTAL_DURATION = CLEAR_START + CLEAR_DURATION;

const BEAM_COUNT = 7;
// 写真の泡柱はかなり密。柱 1 本に集中させるぶん、数は多めに持つ
const INITIAL_BURSTS = 26;
const INITIAL_FAR_BUBBLES = 30;
const MAX_BUBBLES = 420;
const MIST_COUNT = 110;
const BUBBLE_SPRITE_VARIANTS = 6;

// なだらかに始まりなだらかに終わる補間。晴れフェーズは easeOut だと出だしで一気に
// 抜けて「切り替わった」印象になるため、smoothstep で全域を均等にゆっくり晴れさせる。
function smoothstep(x: number): number {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}

/* ---------- 太陽と光条 ---------- */

// 光は「どこかにある平行な帯」ではなく「一点の眩しい太陽から放射する筋」として
// 構成する。水中写真の光はすべて水面の太陽の一点から発しているため、
// 放射状にしないと舞台照明のように見えてしまう。
type Beam = {
  angle: number;
  width: number;
  alpha: number;
  shimmerFreq: number;
  shimmerPhase: number;
  wobbleAmp: number;
  wobbleFreq: number;
  wobblePhase: number;
};

type Sun = {
  x: number;
  y: number;
  beams: Beam[];
};

function makeSun(w: number, h: number): Sun {
  return {
    // 画面上部のやや左。毎回少し位置を変えて表情を出す
    x: rand(0.22, 0.42) * w,
    y: rand(-0.06, 0.02) * h,
    beams: Array.from({ length: BEAM_COUNT }, (_, i) => {
      const width = rand(40, 140);
      return {
        // 真下を 0 として左右に扇状に開く。完全ランダムだと偶然近い角度に重なって
        // 「白い塊」になるため、等間隔に割り振ってから小さな揺らぎだけ足す
        angle: -0.5 + (i / (BEAM_COUNT - 1)) * 1.25 + rand(-0.05, 0.05),
        width,
        // 幅の広い帯ほど淡くして、細い筋が強く光る自然な配光にする
        alpha: rand(0.14, 0.28) * (160 / (width + 100)),
        shimmerFreq: rand(0.25, 0.6),
        shimmerPhase: rand(0, TAU),
        wobbleAmp: rand(0.01, 0.03),
        wobbleFreq: rand(0.1, 0.25),
        wobblePhase: rand(0, TAU),
      };
    }),
  };
}

// 光条のスプライト。横方向(帯の幅)は柔らかいハロの中に細く明るい芯、
// 縦方向(進行方向)は深くなるほど減衰。エッジのはっきりした形を毎フレーム塗ると
// 「照明の円錐」に見えるため、両方向とも柔らかいグラデーションで焼いておく。
function makeRaySprite(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 1024;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  const lateral = ctx.createLinearGradient(0, 0, c.width, 0);
  lateral.addColorStop(0, "rgba(255,253,246,0)");
  lateral.addColorStop(0.3, "rgba(255,253,246,0.25)");
  lateral.addColorStop(0.45, "rgba(255,253,246,0.5)");
  lateral.addColorStop(0.5, "rgba(255,253,246,1)");
  lateral.addColorStop(0.55, "rgba(255,253,246,0.5)");
  lateral.addColorStop(0.7, "rgba(255,253,246,0.25)");
  lateral.addColorStop(1, "rgba(255,253,246,0)");
  ctx.fillStyle = lateral;
  ctx.fillRect(0, 0, c.width, c.height);
  // 根元(太陽側)は複数の帯が重なって白飛びしやすいので、少し抑えて始める
  const vertical = ctx.createLinearGradient(0, 0, 0, c.height);
  vertical.addColorStop(0, "rgba(0,0,0,0.7)");
  vertical.addColorStop(0.55, "rgba(0,0,0,0.35)");
  vertical.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

function drawSun(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  w: number,
  h: number,
  sun: Sun,
  t: number,
  cover: number
): void {
  // 太陽本体: 眩しい白の滲み。強すぎると爆発のような白飛びになるため、
  // 芯は小さく・裾は早めに減衰させる。紙色に近い暖かい白でサイトのトーンに馴染ませる
  const glowR = h * 0.4;
  const glow = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, glowR);
  glow.addColorStop(0, `rgba(255,253,246,${(0.38 * cover).toFixed(3)})`);
  glow.addColorStop(0.15, `rgba(255,252,242,${(0.15 * cover).toFixed(3)})`);
  glow.addColorStop(0.4, `rgba(250,250,248,${(0.04 * cover).toFixed(3)})`);
  glow.addColorStop(1, "rgba(250,250,248,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // 光条: すべて太陽の一点から放射する
  const len = Math.hypot(w, h) * 1.1;
  for (const beam of sun.beams) {
    const shimmer = 0.7 + 0.3 * Math.sin(beam.shimmerPhase + t * beam.shimmerFreq * TAU);
    const alpha = beam.alpha * cover * shimmer;
    if (alpha <= 0.005) continue;
    const wobble = Math.sin(beam.wobblePhase + t * beam.wobbleFreq * TAU) * beam.wobbleAmp;
    ctx.save();
    ctx.translate(sun.x, sun.y);
    ctx.rotate(beam.angle + wobble);
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.drawImage(sprite, -beam.width / 2, 0, beam.width, len);
    ctx.restore();
  }
}

/* ---------- 泡 ---------- */

// 遠近 4 層。カメラのピントは中景に合っている想定で、
//   far:  遠くの小さな泡。ゆっくり昇り、淡い
//   mid:  ピントの合った泡。輪郭のリムが光る
//   near: 目の前を横切るピンボケの泡。ぼけたリングとして流れる
//   hero: 目の前に迫る大きな泡。強く歪み、回転しながら膨らんで臨場感を作る主役
type Depth = "far" | "mid" | "near" | "hero";

// hero 泡はランダム任せにせず、必ず毎回この時刻(風景時計)に湧かせる。
// 1 個目は覆いの最中から画面内に居るように早めに出す
const HERO_SPAWN_TIMES = [0.1, 0.6, 1.1];

// 泡柱(プルーム)。潜った瞬間の泡は画面のあちこちで発生するのではなく、
// 中央の広い帯に集まって立ち昇る。ただし「1 本の中心線に全員を繋ぐ」構造は
// どう飾っても紐に見えるため、中心線は持たない。代わりにバースト(房)ごとに
// 帯の中の独立した位置を割り当て、無数の鎖が別々に蛇行しながら昇る集合として
// プルームを作る。参考写真の柱の実態はこの「太い帯の中の複数の鎖」になっている。
// 帯の中心だけを共有し(plumeX)、下ほど中心へすぼまる係数で柱らしさを保つ。

type Bubble = {
  depth: Depth;
  // scattered: 柱に属さず遠景にまばらに漂う泡。柱の外の「澄んだ水」に
  // わずかな粒だけ置くために使う
  scattered: boolean;
  // 鎖(自分が属する房)の帯中心からの横オフセット(px)。バースト内で共有する
  chainOff: number;
  // 鎖の蛇行パラメータ。これもバースト内で共有し、鎖ごとに別の曲線を描く
  chainAmp: number;
  chainFreq: number;
  chainPhase: number;
  // 鎖の中での横位置(-1〜1)。クラスタの局所的な広がりに使う
  norm: number;
  x: number;
  baseY: number;
  spawnT: number;
  r: number;
  vy: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  wobbleFreq: number;
  wobblePhase: number;
  baseAlpha: number;
  variant: number;
  rotSpeed: number;
};

// -1〜1 の中心寄りの乱数(rand の合計でガウス近似)
function gaussNorm(): number {
  return (rand(0, 1) + rand(0, 1) + rand(0, 1)) / 1.5 - 1;
}

// 大きい泡ほど歪みの強いスプライトを使う(小さい泡は表面張力でほぼ真円)
function variantFor(r: number): number {
  if (r <= 9) return Math.floor(rand(0, 2));
  if (r <= 18) return Math.floor(rand(1, 4));
  return Math.floor(rand(3, BUBBLE_SPRITE_VARIANTS));
}

// サイズから中景の泡の運動特性を決める(実際の泡の流体挙動に合わせる)。
//   小: ほぼ直進で揺れない
//   中: ジグザグ(らせん)経路で昇る。振幅は半径に比例
//   大: 表面の振動も経路の揺れもゆっくりになる(周期はサイズと逆相関)
// r を後から上書きする箇所(バースト)でも呼び直して整合を保つ。
function applyMidDynamics(b: Bubble): void {
  b.swayAmp = b.r < 6 ? rand(0, 2) : b.r * rand(0.5, 1.1);
  b.swayFreq = clamp(rand(7, 11) / Math.sqrt(b.r + 4), 0.9, 3);
  b.wobbleFreq = clamp(rand(8, 12) / Math.sqrt(b.r + 4), 1, 4);
  b.variant = variantFor(b.r);
}

function makeBubble(
  w: number,
  h: number,
  fromBottom: boolean,
  spawnT: number,
  forceDepth?: Depth
): Bubble {
  const roll = Math.random();
  const depth: Depth = forceDepth ?? (roll < 0.35 ? "far" : roll < 0.92 ? "mid" : "near");
  // 柱の外に置くのは遠景の粒だけ。それも 4 割に留め、柱の外は澄んだ水にする
  const scattered = depth === "far" && Math.random() < 0.4;

  let r: number;
  let vy: number;
  let baseAlpha: number;
  let swayAmp: number;
  let rotSpeed = 0;
  if (depth === "far") {
    r = rand(2, 6);
    vy = rand(15, 45);
    baseAlpha = rand(0.2, 0.45);
    swayAmp = rand(2, 8);
  } else if (depth === "near") {
    r = rand(34, 80);
    vy = rand(150, 260);
    baseAlpha = rand(0.2, 0.36);
    swayAmp = rand(12, 30);
  } else if (depth === "hero") {
    r = rand(38, 80);
    vy = rand(120, 230);
    baseAlpha = rand(0.55, 0.85);
    swayAmp = rand(15, 35);
    rotSpeed = rand(-0.5, 0.5);
  } else {
    const sizeRoll = Math.random();
    r = sizeRoll < 0.6 ? rand(5, 10) : sizeRoll < 0.9 ? rand(10, 18) : rand(18, 30);
    // 実際の泡の終端速度はサイズとともに上がったあと頭打ちになる
    // (数 mm 以上はほぼ一定)。小さい泡だけ明確に遅くする
    vy = r > 10 ? rand(150, 200) : 55 + r * 9 + rand(0, 30);
    baseAlpha = r > 12 ? rand(0.5, 0.85) : rand(0.35, 0.7);
    swayAmp = rand(5, 16);
  }

  const b: Bubble = {
    depth,
    scattered,
    // 帯の中の位置は中心寄りのガウス分布。帯の半幅はおよそ画面幅の 3 割。
    // hero は柱の中心近くを昇らせる(端だと「目の前を通る」感じにならない)
    chainOff: gaussNorm() * (depth === "hero" ? 0.12 : 0.34) * w,
    chainAmp: rand(20, 50),
    chainFreq: rand(0.004, 0.008),
    chainPhase: rand(0, TAU),
    norm: gaussNorm() * 0.6,
    x: rand(0, w),
    baseY: fromBottom
      ? h + rand(10, 100) + (depth === "hero" ? r : 0)
      : depth === "hero"
        ? rand(h * 0.5, h * 0.95)
        : rand(h * 0.15, h + 60),
    spawnT,
    r,
    vy,
    swayAmp,
    swayFreq: rand(0.8, 2),
    phase: rand(0, TAU),
    // hero はゆっくり大きくうねる。小さい泡は速く細かく震える
    wobbleFreq: depth === "hero" ? rand(1.2, 2.2) : rand(2.5, 5.5),
    wobblePhase: rand(0, TAU),
    baseAlpha,
    variant:
      depth === "hero" ? BUBBLE_SPRITE_VARIANTS - 1 - Math.floor(rand(0, 2)) : variantFor(r),
    rotSpeed,
  };
  if (depth === "mid") applyMidDynamics(b);
  return b;
}

// 泡は 1 個ずつ連続で湧かせず「吐いた息のまとまり(バースト)」単位で湧かせる。
// バーストは大きめの泡 1 個の周りに小さな泡が付随する房状のクラスタで、
// メンバー全員が同じ鎖(横位置と蛇行曲線)を共有して 1 本の鎖として昇る。
// プルームはこの独立した鎖の集合になる(全員を 1 本の中心線に繋ぐと紐に見える)。
function makeBurst(w: number, h: number, fromBottom: boolean, spawnT: number): Bubble[] {
  // 参考写真の柱は上部で画面幅の 6 割近くを占める。ガウスの裾を広めに取り、
  // 帯の外へ飛びすぎる分だけクランプする
  const chainOff = clamp(gaussNorm() * 0.36, -0.42, 0.42) * w;
  const chainAmp = rand(20, 50);
  const chainFreq = rand(0.004, 0.008);
  const chainPhase = rand(0, TAU);
  const yC = fromBottom ? h + rand(20, 90) : rand(h * 0.1, h + 60);
  const count = 6 + Math.floor(rand(0, 6));
  const cluster: Bubble[] = [];
  let leadVy = 0;
  for (let i = 0; i < count; i++) {
    const b = makeBubble(w, h, fromBottom, spawnT, "mid");
    b.scattered = false;
    b.chainOff = chainOff + rand(-12, 12);
    b.chainAmp = chainAmp;
    b.chainFreq = chainFreq;
    b.chainPhase = chainPhase;
    b.norm = gaussNorm() * 0.6;
    if (i === 0) {
      // 房の主役。参考写真の主役級は画面幅の 2 割近い大きさがあり、
      // 泡が小さいとどれだけ散らしても「点の列 = 線」に見えてしまう。
      // プルームの見た目の骨格はこの大泡たちが作る
      b.r = Math.random() < 0.3 ? rand(30, 48) : rand(16, 30);
      // 数 mm を超えた泡の終端速度はサイズによらずほぼ一定(頭打ち)
      b.vy = rand(160, 210);
      b.baseAlpha = rand(0.6, 0.9);
      b.baseY = yC;
      leadVy = b.vy;
    } else if (i === 1) {
      // 中くらいの相棒。主役の近くに寄り添い、房に厚みを出す
      b.r = rand(10, 20);
      b.vy = leadVy * rand(0.8, 0.98);
      b.baseAlpha = rand(0.5, 0.8);
      b.baseY = yC + rand(-30, 40);
    } else {
      // 付随する小泡。主役のすぐ下を少し遅れて昇り、房が縦に伸びていく
      b.r = rand(4, 14);
      b.vy = leadVy * rand(0.72, 0.95);
      b.baseAlpha = rand(0.4, 0.7);
      b.baseY = yC + rand(-14, 90);
    }
    applyMidDynamics(b);
    cluster.push(b);
  }
  return cluster;
}

// 泡のスプライト群。真円ではなく輪郭を波打たせた「歪んだ泡」を複数パターン焼く。
// 中身はほぼ透明、輪郭は光を受けて発光するリム、太陽側に強いグリント。
// 後半のバリアントほど歪みが強く、大きな泡に割り当てる。
function makeBubbleSprites(): HTMLCanvasElement[] {
  return Array.from({ length: BUBBLE_SPRITE_VARIANTS }, (_, i) => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d");
    if (!ctx) return c;
    const cx = c.width / 2;
    const base = 50;
    // 歪みは後半のバリアント(大泡用)にだけ二乗カーブで乗せる。実際の泡は
    // 小さいほど表面張力で真円になるため、先頭は完全な真円にする。
    // 強くしすぎるとアメーバ状になり泡に見えなくなる
    const strength = i / (BUBBLE_SPRITE_VARIANTS - 1);
    const deform1 = 0.068 * strength * strength;
    const deform2 = 0.05 * strength * strength;
    const phase1 = rand(0, TAU);
    const phase2 = rand(0, TAU);

    ctx.beginPath();
    const steps = 48;
    for (let s = 0; s <= steps; s++) {
      const th = (s / steps) * TAU;
      const rr =
        base * (1 + deform1 * Math.sin(3 * th + phase1) + deform2 * Math.sin(5 * th + phase2));
      const px = cx + Math.cos(th) * rr;
      const py = cx + Math.sin(th) * rr;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // 中身: 水がわずかに白む程度
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();

    // 輪郭: にじむ光のリム
    ctx.shadowColor = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 7;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 太陽側(左上)の強いグリント
    const hlX = cx - base * 0.42;
    const hlY = cx - base * 0.42;
    const hl = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, base * 0.3);
    hl.addColorStop(0, "rgba(255,255,255,0.95)");
    hl.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.arc(hlX, hlY, base * 0.3, 0, TAU);
    ctx.fill();

    // 反対側(右下)にまわり込む淡い照り返し
    const rfX = cx + base * 0.4;
    const rfY = cx + base * 0.42;
    const rf = ctx.createRadialGradient(rfX, rfY, 0, rfX, rfY, base * 0.34);
    rf.addColorStop(0, "rgba(255,255,255,0.4)");
    rf.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rf;
    ctx.beginPath();
    ctx.arc(rfX, rfY, base * 0.34, 0, TAU);
    ctx.fill();
    return c;
  });
}

// 近景のピンボケ泡スプライト。輪郭が幅広くにじんだリングになり、
// 「レンズの前を横切るボケ」として描く。
function makeDefocusSprite(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  const cx = c.width / 2;
  const ring = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx - 2);
  ring.addColorStop(0, "rgba(255,255,255,0)");
  ring.addColorStop(0.5, "rgba(255,255,255,0)");
  ring.addColorStop(0.68, "rgba(255,255,255,0.28)");
  ring.addColorStop(0.8, "rgba(255,255,255,0.5)");
  ring.addColorStop(0.92, "rgba(255,255,255,0.28)");
  ring.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(cx, cx, cx - 2, 0, TAU);
  ctx.fill();

  // ボケの中のさらに淡いハイライト
  const hlX = cx - (cx - 2) * 0.35;
  const hlY = cx - (cx - 2) * 0.35;
  const hl = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, (cx - 2) * 0.4);
  hl.addColorStop(0, "rgba(255,255,255,0.3)");
  hl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hl;
  ctx.beginPath();
  ctx.arc(hlX, hlY, (cx - 2) * 0.4, 0, TAU);
  ctx.fill();
  return c;
}

/* ---------- 微細な粒 ---------- */

type Mist = {
  x: number;
  baseY: number;
  r: number;
  vy: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  baseAlpha: number;
  twinkleFreq: number;
  twinklePhase: number;
};

function makeMist(w: number, h: number): Mist {
  return {
    x: rand(0, w),
    baseY: rand(0, h + 40),
    r: rand(0.8, 2.6),
    vy: rand(12, 55),
    swayAmp: rand(3, 12),
    swayFreq: rand(0.4, 1.2),
    phase: rand(0, TAU),
    baseAlpha: rand(0.25, 0.8),
    twinkleFreq: rand(1.5, 4),
    twinklePhase: rand(0, TAU),
  };
}

// 中心が白くエッジへ溶ける光のスプライト。毎フレーム createRadialGradient すると
// 数百個で重いため、一度だけ焼いて drawImage で撒く。
function makeGlowSprite(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  const cx = c.width / 2;
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cx, cx, 0, TAU);
  ctx.fill();
  return c;
}

// 画面の周辺を深い水の色へ沈めるビネット。中央は透明のままにして
// 「視界の端から水に包まれる」奥行きを出す。色はサイトのアクセント(--deep)に
// 寄せた青紫にして、彩度の高い青にしない。
function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, cover: number): void {
  const cx = w / 2;
  const cy = h / 2;
  const outer = Math.hypot(cx, cy);
  const grad = ctx.createRadialGradient(cx, cy, outer * 0.45, cx, cy, outer);
  grad.addColorStop(0, "rgba(104,104,180,0)");
  grad.addColorStop(1, `rgba(104,104,180,${(0.38 * cover).toFixed(3)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/**
 * ナビ遷移のときに視界が水に沈んでぼけ、覆われている間に instant ジャンプし、
 * ピントがゆっくり戻りながら晴れていくセクション間トランジション。
 * "bubble-wash" カスタムイベント (detail.targetId) を待ち受ける。
 * 実行中に再度イベントが来た場合は、覆いの時計だけ巻き戻して新しい行き先へ
 * 「もう一度水が満ちる」動きで連続遷移する。
 */
export function Wash() {
  const washRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 実行中の wash に新しい行き先を渡す retarget 関数。null なら未実行
  const retargetRef = useRef<((el: Element) => void) | null>(null);

  useEffect(() => {
    const washEl = washRef.current;
    const canvas = canvasRef.current;
    if (!washEl || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const glowSprite = makeGlowSprite();
    const raySprite = makeRaySprite();
    const bubbleSprites = makeBubbleSprites();
    const defocusSprite = makeDefocusSprite();
    let raf = 0;

    // 覆いの進行は opacity だけで表現する。blur の半径は CSS 側で固定 22px にしてあり、
    // ぼけた層と素の画面のクロスフェードでピントが戻る見え方を作る(半径そのものを
    // 毎フレーム動かすと背景の再フィルタが走って大きくフレーム落ちするため)。
    // CSS transition に任せると数値制御と二重にスムージングがかかるため使わない。
    function applyCover(cover: number) {
      washEl!.style.opacity = String(clamp(cover, 0, 1));
    }

    function clearCover() {
      washEl!.style.opacity = "";
      washEl!.classList.remove("washing");
    }

    function coverAt(tc: number): number {
      if (tc < COVER_DURATION) return easeOut(tc / COVER_DURATION);
      if (tc < CLEAR_START) return 1;
      return 1 - smoothstep((tc - CLEAR_START) / CLEAR_DURATION);
    }

    function runWash(targetEl: Element) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        // html の scroll-behavior:smooth があるため "auto" でも smooth 扱いになる。
        // 演出をスキップする分岐なので常に "instant" で即座に移動する。
        targetEl.scrollIntoView({ behavior: "instant" });
        return;
      }
      if (retargetRef.current) {
        retargetRef.current(targetEl);
        return;
      }
      washEl!.classList.add("washing");
      const { w, h } = fitCanvas(canvas!);
      // 風景の時計。泡や光の揺らぎはこちらで進み、連続遷移でも巻き戻さない
      const sceneStart = performance.now();
      // 覆いの時計。retarget 時にここだけ巻き戻す
      let coverStart = sceneStart;
      let target = targetEl;
      let jumped = false;

      const sun = makeSun(w, h);
      // 帯(プルーム)の中心。画面中央のやや太陽寄り。全体をわずかに斜めに流して
      // 直立した幾何学的な柱に見えないようにする
      const plumeX = rand(0.4, 0.56) * w;
      const plumeTilt = rand(-0.06, 0.06) * w;
      const mist: Mist[] = Array.from({ length: MIST_COUNT }, () => makeMist(w, h));
      // 初期状態から柱が「房の集まり」に見えるよう、バースト単位で画面内に置く。
      // 柱の外の遠景の粒だけは個別に散らす
      let bubbles: Bubble[] = Array.from({ length: INITIAL_BURSTS }, () =>
        makeBurst(w, h, false, 0)
      ).flat();
      for (let i = 0; i < INITIAL_FAR_BUBBLES; i++) {
        bubbles.push(makeBubble(w, h, false, 0, "far"));
      }
      let heroIndex = 0;
      let nextBurstT = rand(0.05, 0.15);
      let nextTrickleT = 0;
      if (Math.random() < 0.8) playPop();

      retargetRef.current = (el: Element) => {
        target = el;
        if (jumped) {
          // すでにジャンプ済み(晴れフェーズ)なら、現在の cover 値から連続に
          // 覆い直せる位置へ覆いの時計を巻き戻す(easeOut の逆関数)
          const nowMs = performance.now();
          const currentCover = coverAt((nowMs - coverStart) / 1000);
          const tEquiv = (1 - Math.cbrt(1 - currentCover)) * COVER_DURATION;
          coverStart = nowMs - tEquiv * 1000;
          jumped = false;
        }
        // ジャンプ前なら行き先の差し替えだけでよい
      };

      function frame(now: number) {
        const t = (now - sceneStart) / 1000;
        const tc = (now - coverStart) / 1000;
        const { w: ww, h: hh } = fitCanvas(canvas!);
        ctx!.clearRect(0, 0, ww, hh);

        // cover: 0(素の視界) → 1(完全に水中) の進行度。opacity・canvas の全要素を
        // このひとつの値に連動させ、覆いと晴れを一体で進める。
        const cover = coverAt(tc);
        applyCover(cover);

        // 泡柱は晴れ始めても少しの間湧き続けさせ、途切れた印象を残さない。
        // 柱の泡はバースト単位、遠景・近景の泡はまばらな個別湧きにする
        if (tc < CLEAR_START + 0.4 && bubbles.length < MAX_BUBBLES) {
          if (t >= nextBurstT) {
            bubbles.push(...makeBurst(ww, hh, true, t));
            nextBurstT = t + rand(0.07, 0.2);
          }
          if (t >= nextTrickleT) {
            bubbles.push(makeBubble(ww, hh, true, t, Math.random() < 0.8 ? "far" : "near"));
            nextTrickleT = t + rand(0.05, 0.15);
          }
        }
        // hero 泡は決まった時刻に必ず登場させる。1 個目は最初から画面内の下側に
        while (heroIndex < HERO_SPAWN_TIMES.length && t >= HERO_SPAWN_TIMES[heroIndex]!) {
          bubbles.push(makeBubble(ww, hh, heroIndex > 0, t, "hero"));
          heroIndex++;
        }

        if (cover > 0.005) {
          drawVignette(ctx!, ww, hh, cover);

          // 光と泡は加算合成で重ねる。重なった場所がより明るく光り、
          // 「発光する水」の質感になる。
          ctx!.globalCompositeOperation = "lighter";
          drawSun(ctx!, raySprite, ww, hh, sun, t, cover);

          // 泡は晴れフェーズでもフォグより長く残す(cover^0.6 は cover より減衰が遅い)。
          // 視界がクリアになっても泡が昇り続けている余韻を残すため。
          const bubbleAlpha = Math.pow(cover, 0.6);
          for (const b of bubbles) {
            const age = t - b.spawnT;
            const y = b.baseY - b.vy * age;
            if (y < -160) continue;
            const sway = Math.sin(b.phase + age * b.swayFreq) * b.swayAmp;
            const rise = clamp(1 - y / hh, 0, 1);
            let x: number;
            if (b.scattered) {
              x = b.x + sway;
            } else {
              // 帯の中の泡。属する鎖ごとに独立した横位置と蛇行曲線を持ち、
              // 下ほど帯の中心へすぼまる(conv)ことで「上で広がる柱」の
              // シルエットを保つ。鎖の中では個々の泡が局所的に揺れる
              const conv = 0.55 + 0.45 * rise;
              const snake = Math.sin(y * b.chainFreq + b.chainPhase) * b.chainAmp;
              const spreadLocal = 34 + 56 * rise;
              x = plumeX + plumeTilt * rise + b.chainOff * conv + snake + b.norm * spreadLocal + sway * 0.4;
            }
            const fadeIn = clamp(age * 3, 0, 1);
            const alpha = b.baseAlpha * fadeIn * bubbleAlpha;
            if (alpha <= 0.01) continue;
            // 形はサイズで決まる(実際の泡の流体挙動):
            // 小さい泡は表面張力で真円のまま。中〜大は水の抵抗で進行方向に
            // 潰れた扁平(oblate)が基本形になり、その周りで表面が振動する。
            // 扁平を中心に振動させるので縦長にはならない
            // squish は rx に掛け ry を割るため、縦横比には 2 乗で効く。
            // 係数はその前提で決める(基本 1.1〜1.2、振動ピークでも 1.3 程度)
            const oblate = clamp((b.r - 6) * 0.006, 0, 0.1);
            const wobbleAmp = b.depth === "hero" ? 0.06 : clamp((b.r - 4) * 0.002, 0, 0.05);
            const squish = 1 + oblate + wobbleAmp * Math.sin(b.wobblePhase + age * b.wobbleFreq);
            // 昇るほど水圧が下がり、わずかに膨らむ(ボイルの法則)
            const boyle = 1 + 0.08 * rise;
            const rx = b.r * squish * boyle;
            const ry = (b.r / squish) * boyle;
            const sprite =
              b.depth === "near"
                ? defocusSprite
                : (bubbleSprites[b.variant] ?? bubbleSprites[0]!);
            ctx!.globalAlpha = clamp(alpha, 0, 1);
            if (b.depth === "hero") {
              // カメラへ近づいてくる錯覚: 昇りながらゆっくり膨らみ、回転する
              const grow = 1 + 0.25 * Math.min(age, 2);
              ctx!.save();
              ctx!.translate(x, y);
              ctx!.rotate(b.rotSpeed * age);
              ctx!.drawImage(sprite, -rx * grow, -ry * grow, rx * grow * 2, ry * grow * 2);
              ctx!.restore();
            } else if (b.depth === "mid" && b.r > 18) {
              // 大きい泡は姿勢ごと左右にゆっくり揺れながら昇る(ロッキング)。
              // グリントが太陽側から離れすぎない小さな角度に留める
              const rock =
                Math.sin(b.wobblePhase + age * b.wobbleFreq * 0.7) *
                clamp((b.r - 18) * 0.012, 0, 0.25);
              ctx!.save();
              ctx!.translate(x, y);
              ctx!.rotate(rock);
              ctx!.drawImage(sprite, -rx, -ry, rx * 2, ry * 2);
              ctx!.restore();
            } else {
              ctx!.drawImage(sprite, x - rx, y - ry, rx * 2, ry * 2);
            }
          }

          for (const m of mist) {
            // 連続遷移で表示時間が延びても粒が尽きないよう、上に抜けたら下から戻す
            const range = hh + 60;
            let y = (m.baseY - m.vy * t) % range;
            if (y < -20) y += range;
            const x = m.x + Math.sin(m.phase + t * m.swayFreq) * m.swayAmp;
            const twinkle = 0.7 + 0.3 * Math.sin(m.twinklePhase + t * m.twinkleFreq);
            const alpha = m.baseAlpha * twinkle * cover;
            if (alpha <= 0.01) continue;
            // 半径の 3 倍で描いて「点」ではなく「にじむ光」にする
            const d = m.r * 6;
            ctx!.globalAlpha = clamp(alpha, 0, 1);
            ctx!.drawImage(glowSprite, x - d / 2, y - d / 2, d, d);
          }
          ctx!.globalAlpha = 1;
          ctx!.globalCompositeOperation = "source-over";
        }

        bubbles = bubbles.filter((b) => b.baseY - b.vy * (t - b.spawnT) > -160);

        if (tc > JUMP_AT && !jumped) {
          jumped = true;
          target.scrollIntoView({ behavior: "instant" });
        }
        if (tc > TOTAL_DURATION) {
          clearCover();
          retargetRef.current = null;
          setTimeout(() => {
            ctx!.clearRect(0, 0, ww, hh);
          }, 100);
          return;
        }
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
    }

    function handleWash(event: Event) {
      const detail = (event as CustomEvent<{ targetId: string }>).detail;
      const target = document.getElementById(detail.targetId);
      if (!target) return;
      runWash(target);
    }

    window.addEventListener("bubble-wash", handleWash);
    return () => {
      window.removeEventListener("bubble-wash", handleWash);
      cancelAnimationFrame(raf);
      retargetRef.current = null;
    };
  }, []);

  return (
    <div id="wash" ref={washRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

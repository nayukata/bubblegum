import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "bubble gum — 泡のように、軽やかにつくる。";

const PAPER = "#fcfbf8";
const INK = "#33313e";
const INK_SOFT = "#6b6878";
const DEEP = "#6c63c7";

type Bubble = {
  cx: number;
  cy: number;
  r: number;
  border: string;
};

const BUBBLES: readonly Bubble[] = [
  { cx: 130, cy: 120, r: 90, border: "rgba(191,227,240,0.9)" },
  { cx: 1080, cy: 90, r: 60, border: "rgba(245,216,228,0.9)" },
  { cx: 1040, cy: 520, r: 110, border: "rgba(217,210,245,0.9)" },
  { cx: 80, cy: 500, r: 70, border: "rgba(207,235,221,0.9)" },
  { cx: 960, cy: 250, r: 42, border: "rgba(191,227,240,0.7)" },
  { cx: 220, cy: 340, r: 34, border: "rgba(245,216,228,0.7)" },
];

// 泡の装飾はページ本体と同じくパステルの輪郭のみで描く(塗りは薄い)。
// satori は SVG を直接扱えるので、円は SVG で描いてレイアウト干渉を避ける。
export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: PAPER,
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <svg
          width={size.width}
          height={size.height}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {BUBBLES.map((b, i) => (
            <circle
              key={i}
              cx={b.cx}
              cy={b.cy}
              r={b.r}
              fill="rgba(255,255,255,0.5)"
              stroke={b.border}
              strokeWidth={2}
            />
          ))}
        </svg>
        <div
          style={{
            fontSize: 128,
            fontWeight: 500,
            color: INK,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          bubble gum
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 32,
            color: INK_SOFT,
            letterSpacing: "0.08em",
          }}
        >
          a site by Yutaro Nakayama
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 56,
            fontSize: 22,
            color: DEEP,
            fontFamily: "monospace",
            letterSpacing: "0.2em",
          }}
        >
          bubblegum.natume.workers.dev
        </div>
      </div>
    ),
    { ...size }
  );
}

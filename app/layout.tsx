import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Zen_Kaku_Gothic_New, Zen_Maru_Gothic, M_PLUS_1_Code } from "next/font/google";
import { SoundButton } from "@/components/SoundButton";
import { Wash } from "@/components/Wash";
import { Nav } from "@/components/Nav";
import { Cat } from "@/components/Cat";
import "./globals.css";

const zenMaruGothic = Zen_Maru_Gothic({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-zen-maru-gothic",
  display: "swap",
});

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-zen-kaku-gothic-new",
  display: "swap",
});

const mPlus1Code = M_PLUS_1_Code({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-m-plus-1-code",
  display: "swap",
});

const SITE_URL = "https://bubblegum.natume.workers.dev";
const SITE_TITLE = "bubble gum — 泡のように、軽やかにつくる。";
const SITE_DESCRIPTION =
  "エンジニア Yutaro Nakayama の自己紹介サイト。HearCat（Mac 用リアルタイム文字起こしアプリ）、Claude Code 向けスキル集、Qiita 記事など、つくったものと日々のことを泡のように並べています。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    // 各ページで title を指定した場合はそのまま使う(既に " — Yutaro Nakayama" 付きのため二重を避ける)
    template: "%s",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "bubble gum",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@natume_nat",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ja"
      // globals.css の html { scroll-behavior: smooth } を Next のルート遷移処理に伝える。
      // 未指定だと route 遷移時のスクロール制御が smooth と衝突する可能性がある、と Next 自身が警告する。
      data-scroll-behavior="smooth"
      className={`${zenMaruGothic.variable} ${zenKakuGothicNew.variable} ${mPlus1Code.variable}`}
    >
      <body>
        <SoundButton />
        <Wash />
        <Nav />
        <main>{children}</main>
        <Cat />
      </body>
    </html>
  );
}

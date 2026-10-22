import type { CSSProperties } from "react";

export type WorkTheme = {
  bg: string;
  ink: string;
  soft: string;
  faint: string;
  accent: string;
  track: string;
  btnBg: string;
};

export type WorkMock = "hearcat" | "wellbeing" | "qiita" | "term" | "site";

export type Work = {
  slug: string;
  num: string;
  tag: string;
  title: string;
  lede: string;
  cta: string;
  body: readonly string[];
  externalUrl: string | null;
  externalLabel: string | null;
  theme: WorkTheme;
  mock: WorkMock;
};

const NAVY_THEME = {
  bg: "#0C1424",
  ink: "#E7EDF9",
  soft: "#9FB0D4",
  faint: "#5F739C",
  accent: "#8FB0FF",
  track: "rgba(143,176,255,0.22)",
  btnBg: "rgba(255,255,255,0.06)",
} satisfies WorkTheme;

const QIITA_THEME = {
  bg: "#F2FAEC",
  ink: "#33313E",
  soft: "#6B6878",
  faint: "#9B98A8",
  accent: "#3E9A00",
  track: "rgba(62,154,0,0.22)",
  btnBg: "rgba(255,255,255,0.55)",
} satisfies WorkTheme;

const TERMINAL_THEME = {
  bg: "#211E2A",
  ink: "#E4E1EE",
  soft: "#B4AFC6",
  faint: "#8E88A3",
  accent: "#7ED9B2",
  track: "rgba(126,217,178,0.2)",
  btnBg: "rgba(255,255,255,0.05)",
} satisfies WorkTheme;

const LAVENDER_THEME = {
  bg: "#F1EEFB",
  ink: "#33313E",
  soft: "#6B6878",
  faint: "#9B98A8",
  accent: "#6C63C7",
  track: "rgba(108,99,199,0.22)",
  btnBg: "rgba(255,255,255,0.55)",
} satisfies WorkTheme;

const TEAL_THEME = {
  bg: "#EAF6F4",
  ink: "#33313E",
  soft: "#6B6878",
  faint: "#9B98A8",
  accent: "#0D9488",
  track: "rgba(13,148,136,0.22)",
  btnBg: "rgba(255,255,255,0.55)",
} satisfies WorkTheme;

export const WORKS = [
  {
    slug: "hearcat",
    num: "01",
    tag: "product — macOS app",
    title: "HearCat",
    lede: "秘密は、外に出さない。必要なのは、Mac だけ。自分の声と通話相手の声をリアルタイムで日本語文字起こしする、Mac 用メニューバーアプリ。録音・要約もすべて端末内で完結します。",
    cta: "view →",
    body: [
      "毎日の1on1やミーティングで、話した内容をあとで思い出せなくてつらい思いをしたことから生まれました。相手の声と自分の声を同時に、リアルタイムで日本語の文字に起こしながら記録する、Mac 用のメニューバーアプリです。",
      "文字起こしのエンジンには macOS の SpeechAnalyzer を使い、外部のクラウド API には一切送信しません。Core Audio でシステム音声と自分のマイクを同時にキャプチャして、誰が話しているかを分けて表示します。会議の内容が、この Mac から出ないことを最優先にしました。",
      "録音したログはあとから AI に読み込ませて、要点だけをまとめさせることもできます。議事録を書くのが面倒だったので、仕組みにしました。",
    ],
    externalUrl: "https://hearcat.natume.workers.dev/",
    externalLabel: "HearCat のサイト →",
    theme: NAVY_THEME,
    mock: "hearcat",
  },
  {
    slug: "wellbeing-log",
    num: "02",
    tag: "product — iOS / Android app",
    title: "Well-Being Log +",
    lede: "働く人の健康とウェルビーイングを調べる研究のための、参加者向けアプリ。アンケートへの回答と、ヘルスケアのデータの連携を、毎日の負担にならない形にまとめました。",
    cta: "view →",
    body: [
      "慶應義塾大学医学部 健康・医療・社会イノベーションセンターと森ビル株式会社が共同で進める「働く人の健康・ウェルビーイング調査」の研究用アプリです。麻布台ヒルズ入居企業などで働く方のうち、研究に同意した参加者が使います。",
      "参加者はアプリから、ウェルビーイングや働き方についてのアンケートに答え、Apple のヘルスケアや Android のヘルスコネクトに記録された歩数や睡眠などのデータを研究に提供します。データを渡す範囲は参加者が自分で選べて、いつでも見直せるようにしています。",
      "業務として開発に参加し、パスワードやメールアドレスの変更をアプリ内で完結させる画面、アプリ更新の配信時に起きていた強制終了の修正、クラッシュの監視の導入などを担当しました。",
    ],
    externalUrl: "https://apps.apple.com/jp/app/well-being-log/id6803768488",
    externalLabel: "App Store で見る →",
    theme: TEAL_THEME,
    mock: "wellbeing",
  },
  {
    slug: "persona-ui",
    num: "03",
    tag: "featured article",
    title: "ペルソナ×UI の記事",
    lede: "Qiita で 900 を超える LGTM をいただいた代表記事。AI とペルソナ設計の話。",
    cta: "read →",
    body: [
      "Qiita に投稿した「ペルソナ×UI」の記事です。おかげさまで 900 を超える LGTM をいただきました。AIにUIを作らせるとき、なぜ的外れなものが出てくるのか、という疑問から書き始めました。",
      "結論は単純で、AIは「誰のためのUIか」を知らないまま作らされている、という話です。ペルソナを先に言語化してから設計に入ると、同じAIでも出力の精度がまったく変わります。",
      "記事内ではペルソナシートのテンプレートも公開しています。実務でそのまま使える形にしてあるので、よければ手元のプロジェクトで試してみてください。",
    ],
    externalUrl: "https://qiita.com/natume_nat/items/c3d904ff5f898ad243f3",
    externalLabel: "Qiita で読む →",
    theme: QIITA_THEME,
    mock: "qiita",
  },
  {
    slug: "agent-skills",
    num: "04",
    tag: "oss — claude code plugins",
    title: "agent-skills",
    lede: "Claude Code のスキルを配布している自作の plugin marketplace。PR 作成やデザインのヒアリングなど、開発の面倒ごとをスキルにして配っています。",
    cta: "view →",
    body: [
      "Claude Code 向けに自作したスキルを配布している plugin marketplace です。PR 作成、PR レビュー、UX 法則にもとづく UI レビュー、曖昧なデザイン要望を具体化するヒアリングなど、開発で繰り返す作業をスキルとして切り出しています。",
      "コマンドを覚えて呼び出すのではなく、タスクの内容に応じて Claude が自動で発動するのが特徴です。marketplace を追加すれば、欲しいスキルだけを選んで導入できます。",
      "「同じ作業を二度やったら仕組みにする」の実践置き場でもあります。手元で育てたスキルを、そのまま配れる形にして置いています。",
    ],
    externalUrl: "https://github.com/nayukata/agent-skills",
    externalLabel: "GitHub で見る →",
    theme: TERMINAL_THEME,
    mock: "term",
  },
  {
    slug: "this-site",
    num: "05",
    tag: "playground",
    title: "このサイト自体",
    lede: "泡の演出も音も、全部コードで合成しています。オープニングをもう一度見たくなったら、フッターからどうぞ。",
    cta: "view →",
    body: [
      "このサイト自体も作品のひとつです。泡の演出も、オープニングの音も、全部コードで合成していて、画像や音声ファイルは一枚も使っていません。",
      "View Transitions を使って、この works の一覧から各ページへ、泡がそのまま変形しながら移動するようにしています。ページを移動している感覚を、できるだけ消したくて。",
      "下のボタンから、オープニングをもう一度見られます。",
    ],
    externalUrl: null,
    externalLabel: null,
    theme: LAVENDER_THEME,
    mock: "site",
  },
] satisfies Work[];

export function getWorkBySlug(slug: string): Work | undefined {
  return WORKS.find((work) => work.slug === slug);
}

export type ThemeCssVars = CSSProperties & {
  [key: `--${string}`]: string | number;
};

export function themeToCssVars(theme: WorkTheme): ThemeCssVars {
  return {
    "--v-bg": theme.bg,
    "--v-ink": theme.ink,
    "--v-soft": theme.soft,
    "--v-faint": theme.faint,
    "--v-accent": theme.accent,
    "--v-track": theme.track,
    "--v-btn": theme.btnBg,
  };
}

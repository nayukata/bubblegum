"use client";

import { useLayoutEffect } from "react";
import { hasSeenOpening } from "@/lib/opening";
import { consumeWorksReturnFallback, consumeWorksReturnScroll } from "@/lib/worksReturn";

// works 一覧への復帰専用の復元。BackToWorksLink は hash を使わず "/" へ遷移するため、
// hash の有無に関係なく毎回ここを先に試す。保存済みスクロール位置(サムネのパネルから
// 詳細へ進んだ場合)があればそこへ、無くてもフォールバックフラグ(直リンクなどパネルを
// 経由しなかった場合)が立っていれば #works の先頭へ、それぞれ同期的に復元する。
// どちらにも該当しなければ false を返し、呼び出し側は通常の hash 処理へフォールバックする。
function restoreWorksReturn(): boolean {
  const savedScroll = consumeWorksReturnScroll();
  if (savedScroll !== null) {
    const scrollTarget: number = savedScroll;
    function restore() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const clamped = Math.max(0, Math.min(scrollTarget, maxScroll));
      window.scrollTo({ top: clamped, behavior: "instant" });
      // scrollTo() 自体は scroll イベントを非同期にしか発火しないため、WorksShowcase 側の
      // rail transform(どのパネルを画面内に表示するか)がこの時点ではまだ古い scrollY を
      // 元にした位置のまま。View Transition が新画面をキャプチャするより前に同期的に
      // 追従させたいので、scroll イベントを明示的に dispatch してハンドラを同期実行させる。
      window.dispatchEvent(new Event("scroll"));
    }
    // WorksShowcase 側の useLayoutEffect が #worksWrap の高さを先に確定させている前提
    // (page.tsx で WorksShowcase → HashScrollRestore の順に並べている)なので、ここで
    // 同期的に scrollTo する。
    restore();
    // フォント確定でパネル幅がわずかに変わることがあるため、念のため補正をかけ直す。
    document.fonts.ready.then(restore);
    return true;
  }
  if (consumeWorksReturnFallback()) {
    document.getElementById("works")?.scrollIntoView({ behavior: "instant" });
    return true;
  }
  return false;
}

function scrollToHash() {
  const hash = window.location.hash;
  if (!hash) return;
  const target = document.getElementById(hash.slice(1));
  target?.scrollIntoView({ behavior: "auto" });
}

/**
 * ナビの hash リンク(#about 等)や works からの復帰で、Next のハッシュスクロールが
 * ViewTransition と競合して効かないことがあるため、自前で補う。
 * オープニング未読の初回訪問時はオープニングの完了を待ってからスクロールする。
 */
export function HashScrollRestore() {
  useLayoutEffect(() => {
    function run() {
      if (restoreWorksReturn()) return;
      scrollToHash();
    }

    if (hasSeenOpening()) run();

    function handleOpeningDone() {
      run();
    }

    window.addEventListener("opening-done", handleOpeningDone);
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      window.removeEventListener("opening-done", handleOpeningDone);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  return null;
}

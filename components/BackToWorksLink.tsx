"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { markWorksReturnFallback } from "@/lib/worksReturn";

/**
 * 作品詳細ページの「← works へ戻る」リンク。hash 付き URL(/#works)を使うと、
 * Next 自身の hash スクロールと HashScrollRestore のスクロール復元が競合したり、
 * 連続往復で hash が入れ子に蓄積する(/#works%23works%23works)不具合があったため、
 * hash を使わず "/" へ遷移する。復元はすべて sessionStorage 経由
 * (worksReturnScroll / worksReturnFallback)に一本化する。
 */
export function BackToWorksLink({ className, children }: { className?: string; children: ReactNode }) {
  return (
    // scroll={false}: Next のデフォルトの遷移時スクロールリセット(scrollTo(0,0))を止める。
    // これが HashScrollRestore の同期復元と競合し、works パネルの共有要素が
    // 復元前の位置(scrollY=0)で ViewTransition に捕捉されて morph が発火しない
    // 不具合の原因だった(実測で確認)。
    <Link className={className} href="/" scroll={false} onClick={markWorksReturnFallback}>
      {children}
    </Link>
  );
}

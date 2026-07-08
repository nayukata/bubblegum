// WorksShowcase(components/WorksShowcase.tsx)と HashScrollRestore の両方が、
// 作品詳細ページから works へ戻ったときにどのスクロール位置を復元すべきかを知る必要があるため共有する。
const WORKS_RETURN_SCROLL_KEY = "worksReturnScroll";

export function saveWorksReturnScroll(): void {
  try {
    sessionStorage.setItem(WORKS_RETURN_SCROLL_KEY, String(window.scrollY));
  } catch {
    // private mode 等で sessionStorage が使えない場合は諦める(戻り先は #works 先頭にフォールバックする)
  }
}

// クランプはここでは行わない。呼び出し側(HashScrollRestore)は #worksWrap の高さが
// 展開され切ったあとの scrollHeight で改めてクランプする必要があるため。
export function consumeWorksReturnScroll(): number | null {
  try {
    const raw = sessionStorage.getItem(WORKS_RETURN_SCROLL_KEY);
    if (raw === null) return null;
    sessionStorage.removeItem(WORKS_RETURN_SCROLL_KEY);
    const value = Number(raw);
    return Number.isNaN(value) ? null : value;
  } catch {
    return null;
  }
}

const WORKS_RETURN_FALLBACK_KEY = "worksReturnFallback";

// works panel を経由せず(直リンクや別タブ経由で)作品詳細ページへ来た訪問者は
// saveWorksReturnScroll() によるスクロール保存を持たない。その場合のフォールバックとして
// 「#works までは飛んでほしい」という意図だけを持ち越す。
export function markWorksReturnFallback(): void {
  try {
    sessionStorage.setItem(WORKS_RETURN_FALLBACK_KEY, "1");
  } catch {
    // private mode 等で sessionStorage が使えない場合は諦める(戻り先はページ先頭になる)
  }
}

export function consumeWorksReturnFallback(): boolean {
  try {
    const flagged = sessionStorage.getItem(WORKS_RETURN_FALLBACK_KEY);
    if (flagged) sessionStorage.removeItem(WORKS_RETURN_FALLBACK_KEY);
    return Boolean(flagged);
  } catch {
    return false;
  }
}

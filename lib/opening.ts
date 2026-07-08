// Opening と Hero の両方が「オープニングを見せる必要があるか」を知る必要があるため共有する。
export const OPENING_SEEN_KEY = "openingSeen";

// Opening はホーム(page.tsx)にしか存在しない。作品詳細ページ(/works/this-site)の
// 「オープニングをもう一度」ボタンはホームへ遷移したあとに再生させたいので、
// 遷移をまたいで意図を伝えるためのフラグを sessionStorage に置く。
const FORCE_REPLAY_KEY = "forceOpeningReplay";

export function hasSeenOpening(): boolean {
  try {
    return Boolean(sessionStorage.getItem(OPENING_SEEN_KEY));
  } catch {
    return false;
  }
}

export function markOpeningSeen(): void {
  try {
    sessionStorage.setItem(OPENING_SEEN_KEY, "1");
  } catch {
    // private mode 等で sessionStorage が使えない場合は諦める(演出自体は続行する)
  }
}

export function requestOpeningReplay(): void {
  try {
    sessionStorage.setItem(FORCE_REPLAY_KEY, "1");
  } catch {
    // 同上。フラグが立たなければホーム側は通常の初回判定にフォールバックする。
  }
}

export function consumeOpeningReplayRequest(): boolean {
  try {
    const requested = sessionStorage.getItem(FORCE_REPLAY_KEY);
    if (requested) sessionStorage.removeItem(FORCE_REPLAY_KEY);
    return Boolean(requested);
  } catch {
    return false;
  }
}

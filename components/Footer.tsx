"use client";

export function Footer() {
  function handleReplay() {
    // html に scroll-behavior: smooth があるため "auto" は smooth 扱いになり、
    // スクロール中にオープニングのアニメーション冒頭が見えなくなる。"instant" で即座に戻す。
    window.scrollTo({ top: 0, behavior: "instant" });
    window.dispatchEvent(new CustomEvent("replay-opening"));
  }

  return (
    <footer>
      <p className="meta">© Yutaro Nakayama — built to update itself</p>
      <button id="replayBtn" type="button" onClick={handleReplay}>
        オープニングをもう一度
      </button>
    </footer>
  );
}

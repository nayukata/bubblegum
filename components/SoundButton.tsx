"use client";

import { useEffect, useState } from "react";
import { ensureAudioContext, setSoundEnabled, unlockAudioOnFirstInteraction } from "@/lib/sound";

export function SoundButton() {
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => unlockAudioOnFirstInteraction(), []);

  function handleClick() {
    ensureAudioContext();
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  }

  return (
    <button id="soundBtn" type="button" aria-pressed={soundOn} onClick={handleClick}>
      {soundOn ? "♪ sound on" : "♪ sound off"}
    </button>
  );
}

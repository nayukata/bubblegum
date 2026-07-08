"use client";

import { useEffect } from "react";

// フィードカード(articles/repositories)は元実装で「非同期に後から挿入される」前提の
// 独立したグループとして (i % 6) * 80ms のディレイを付けていた。SSR で最初から DOM にある
// 今の構成でも、同じグループ分けだけは踏襲する。
const FEED_CONTAINER_SELECTOR = ".a-grid, .r-row";

function applyStagger(elements: Element[], stepMs: number, cycle: number, observer: IntersectionObserver) {
  elements.forEach((el, i) => {
    if (el instanceof HTMLElement) {
      el.style.transitionDelay = `${(i % cycle) * stepMs}ms`;
    }
    observer.observe(el);
  });
}

/**
 * サーバーで描画された `.float` 要素(hero 内を除く)に、IntersectionObserver による
 * reveal とグループ単位の transition-delay を後付けする。cloneElement 版の Float は
 * server component から渡された children で hydration mismatch を起こすため廃止した。
 */
export function FloatReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );

    const feedFloats = new Set<Element>();
    document.querySelectorAll(FEED_CONTAINER_SELECTOR).forEach((container) => {
      const floats = Array.from(container.querySelectorAll(".float"));
      applyStagger(floats, 80, 6, observer);
      floats.forEach((el) => feedFloats.add(el));
    });

    const generalFloats = Array.from(document.querySelectorAll(".float")).filter(
      (el) => !el.closest(".hero") && !feedFloats.has(el)
    );
    applyStagger(generalFloats, 90, 5, observer);

    return () => observer.disconnect();
  }, []);

  return null;
}

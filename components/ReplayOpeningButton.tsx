"use client";

import { useRouter } from "next/navigation";
import { requestOpeningReplay } from "@/lib/opening";

/**
 * Opening はホーム(page.tsx)にしか存在しないため、作品詳細ページからは
 * まずホームへ遷移してから再生させる。
 */
export function ReplayOpeningButton({ className, children }: { className?: string; children: string }) {
  const router = useRouter();

  function handleClick() {
    requestOpeningReplay();
    router.push("/");
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  );
}

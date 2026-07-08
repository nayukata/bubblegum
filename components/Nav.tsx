"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";

const NAV_LINKS = [
  { hash: "#about", label: "about" },
  { hash: "#works", label: "works" },
  { hash: "#articles", label: "articles" },
  { hash: "#contact", label: "contact" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  function handleClick(event: MouseEvent<HTMLAnchorElement>, hash: string) {
    event.preventDefault();
    if (isHome) {
      const targetId = hash.slice(1);
      window.dispatchEvent(new CustomEvent("bubble-wash", { detail: { targetId } }));
    } else {
      router.push(`/${hash}`);
    }
  }

  return (
    <nav>
      <Link className="logo" href="/#top" onClick={(e) => handleClick(e, "#top")}>
        bubble gum
      </Link>
      <div className="links">
        {NAV_LINKS.map((link) => (
          <Link key={link.hash} href={`/${link.hash}`} onClick={(e) => handleClick(e, link.hash)}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

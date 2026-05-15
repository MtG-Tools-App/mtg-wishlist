"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();

  function handleTitleClick() {
    if (pathname === "/") {
      router.refresh();
    } else {
      router.push("/");
    }
  }

  return (
    <header className="sticky top-0 z-20 bg-bg border-b border-border">
      <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
        <button
          onClick={handleTitleClick}
          className="text-text font-semibold tracking-tight text-sm"
          aria-label="ホームへ移動して再読み込み"
        >
          MtG Wishlist
        </button>
        <nav className="flex gap-5 text-sm">
          <Link
            href="/"
            className="text-text-muted hover:text-text transition-colors"
          >
            一覧
          </Link>
          <Link
            href="/add"
            className="text-modern hover:opacity-80 transition-opacity font-medium"
          >
            ＋ 追加
          </Link>
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link
          href="/"
          className="text-zinc-100 font-semibold tracking-tight text-sm"
        >
          MtG Wishlist
        </Link>
        <nav className="flex gap-5 text-sm">
          <Link
            href="/"
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            一覧
          </Link>
          <Link
            href="/add"
            className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
          >
            ＋ 追加
          </Link>
        </nav>
      </div>
    </header>
  );
}

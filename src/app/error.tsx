"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-4">
      <p className="text-zinc-300 text-sm font-medium">エラーが発生しました</p>
      {error.message && (
        <p className="text-zinc-500 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded px-3 py-2 max-w-sm w-full text-center">
          {error.message}
        </p>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-md transition-colors"
      >
        再試行
      </button>
    </div>
  );
}

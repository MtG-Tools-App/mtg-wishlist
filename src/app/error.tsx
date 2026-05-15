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
      <p className="text-text text-sm font-medium">エラーが発生しました</p>
      {error.message && (
        <p className="text-text-subtle text-xs font-mono bg-surface border border-border rounded px-3 py-2 max-w-sm w-full text-center">
          {error.message}
        </p>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 bg-cta hover:opacity-90 text-cta-text text-sm rounded-md transition-opacity"
      >
        再試行
      </button>
    </div>
  );
}

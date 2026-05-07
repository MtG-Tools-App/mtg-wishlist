"use client";

import { useState, useTransition } from "react";
import { deleteWishlistItemAction } from "@/lib/actions/wishlist";
import { ErrorMessage } from "@/components/ErrorMessage";

export function DeleteButton({ id, name_en }: { id: number; name_en: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        `「${name_en}」をリストから削除しますか?\n価格履歴も一緒に削除されます。`
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteWishlistItemAction(id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <span className="ml-auto flex flex-col items-end gap-1">
      <button
        onClick={handleDelete}
        disabled={pending}
        className="min-w-[32px] min-h-[32px] flex items-center justify-center text-xs text-zinc-600 hover:text-zinc-400 disabled:opacity-40 transition-colors px-2"
        aria-label={`${name_en}を削除`}
      >
        {pending ? "…" : "削除"}
      </button>
      {error && <ErrorMessage error={error} />}
    </span>
  );
}

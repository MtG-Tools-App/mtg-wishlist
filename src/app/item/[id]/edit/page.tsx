import Link from "next/link";
import { notFound } from "next/navigation";
import { getWishlistItemById } from "@/lib/db/queries";
import { EditForm } from "./EditForm";
import { finishLabel } from "@/lib/format/finish";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const itemId = Number(id);
  if (isNaN(itemId)) notFound();

  const item = await getWishlistItemById(itemId);
  if (!item) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-4">
      <Link
        href="/"
        className="text-text-muted hover:text-text text-sm transition-colors w-fit"
      >
        ← 一覧へ戻る
      </Link>

      <div className="bg-bg border border-border rounded-lg p-3 flex gap-3">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name_en}
            width={50}
            height={70}
            className="rounded shrink-0 object-cover self-start"
          />
        ) : (
          <div className="w-[50px] h-[70px] bg-surface rounded shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-text text-sm font-semibold leading-tight">
            {item.name_en}
          </p>
          {item.name_ja && (
            <p className="text-text-muted text-xs">{item.name_ja}</p>
          )}
          <p className="text-text-subtle text-xs mt-1">
            {item.set_code.toUpperCase()} · {finishLabel(item.finish)}
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-text text-sm font-semibold mb-3">編集</h2>
        <EditForm item={item} />
      </section>
    </div>
  );
}

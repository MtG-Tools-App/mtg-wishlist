import Link from "next/link";
import { notFound } from "next/navigation";
import { getWishlistItemById, getRecentPriceLogs } from "@/lib/db/queries";
import { LogForm } from "./LogForm";
import { finishLabel } from "@/lib/format/finish";

export default async function LogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const itemId = Number(id);
  if (isNaN(itemId)) notFound();

  const [item, logs] = await Promise.all([
    getWishlistItemById(itemId),
    getRecentPriceLogs(itemId, 5),
  ]);

  if (!item) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-4">
      <Link
        href="/"
        className="text-text-muted hover:text-text text-sm transition-colors w-fit"
      >
        ← 一覧へ戻る
      </Link>

      {/* Card info */}
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
          {item.target_price != null && (
            <p className="text-text-subtle text-xs">
              目標:{" "}
              <span className="text-text">
                ¥{item.target_price.toLocaleString("ja-JP")}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Recent logs */}
      {logs.length > 0 && (
        <section>
          <h2 className="text-text-muted text-xs mb-2">過去の記録</h2>
          <ul className="flex flex-col gap-1">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-center gap-2 text-xs text-text-muted bg-bg border border-border rounded px-3 py-2"
              >
                <span className="text-text font-medium">
                  ¥{log.price.toLocaleString("ja-JP")}
                </span>
                <span className="text-text-fade">·</span>
                <span>{log.shop}</span>
                {log.condition_actual && (
                  <>
                    <span className="text-text-fade">·</span>
                    <span>{log.condition_actual}</span>
                  </>
                )}
                <span className="text-text-fade">·</span>
                <span>{new Date(log.logged_at * 1000).toLocaleDateString("ja-JP")}</span>
                {log.available === 0 && (
                  <span className="ml-auto text-text-fade">在庫なし</span>
                )}
                {log.url && (
                  <a
                    href={log.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-modern hover:opacity-80"
                  >
                    ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Log form */}
      <section>
        <h2 className="text-text text-sm font-semibold mb-3">価格を記録</h2>
        <LogForm wishlistItemId={itemId} />
      </section>
    </div>
  );
}

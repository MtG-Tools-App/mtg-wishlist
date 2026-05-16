import type { ScryfallFinish } from "@/lib/scryfall/types";

interface CardHeaderProps {
  imageUrl: string | null;
  nameEn: string;
  nameJa?: string | null;
  finish?: ScryfallFinish;
  onSurface?: boolean;
  children?: React.ReactNode;
}

export function CardHeader({ imageUrl, nameEn, nameJa, finish, onSurface, children }: CardHeaderProps) {
  return (
    <>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={nameEn}
          width={100}
          height={140}
          className="rounded shrink-0 object-cover self-start"
          loading="lazy"
        />
      ) : (
        <div
          className="w-[100px] h-[140px] rounded shrink-0 flex items-center justify-center text-xs"
          style={{ backgroundColor: "var(--color-glass)", color: "var(--color-surface-subtle)" }}
        >
          N/A
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <p
            className="text-sm font-medium leading-tight truncate min-w-0"
            style={{ color: onSurface ? "var(--color-surface-text)" : "var(--color-text)" }}
          >
            {nameEn}
          </p>
          <FoilBadge finish={finish} onSurface={onSurface} />
        </div>
        {nameJa && (
          <p
            className="text-xs leading-tight"
            style={{ color: onSurface ? "var(--color-surface-subtle)" : "var(--color-text-muted)" }}
          >
            {nameJa}
          </p>
        )}
        {children}
      </div>
    </>
  );
}

function FoilBadge({ finish, onSurface }: { finish?: ScryfallFinish; onSurface?: boolean }) {
  if (finish !== "foil" && finish !== "etched") return null;
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-full)] font-bold uppercase tracking-wider shrink-0 leading-none"
      style={{
        backgroundColor: "var(--color-glass-strong)",
        backdropFilter: "blur(var(--blur-sm))",
        color: onSurface ? "var(--color-surface-text)" : "var(--color-text)",
      }}
    >
      {finish === "etched" ? "Etched" : "Foil"}
    </span>
  );
}

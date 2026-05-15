import type { ScryfallFinish } from "@/lib/scryfall/types";

interface CardHeaderProps {
  imageUrl: string | null;
  nameEn: string;
  nameJa?: string | null;
  finish?: ScryfallFinish;
  children?: React.ReactNode;
}

export function CardHeader({ imageUrl, nameEn, nameJa, finish, children }: CardHeaderProps) {
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
        <div className="w-[100px] h-[140px] bg-surface rounded shrink-0 flex items-center justify-center text-text-fade text-xs">
          N/A
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <p className="text-text text-sm font-medium leading-tight truncate min-w-0">
            {nameEn}
          </p>
          <FoilBadge finish={finish} />
        </div>
        {nameJa && (
          <p className="text-text-muted text-xs leading-tight">{nameJa}</p>
        )}
        {children}
      </div>
    </>
  );
}

function FoilBadge({ finish }: { finish?: ScryfallFinish }) {
  if (finish !== "foil" && finish !== "etched") return null;
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-text text-text font-medium shrink-0 leading-none uppercase tracking-wide">
      {finish === "etched" ? "Etched" : "Foil"}
    </span>
  );
}

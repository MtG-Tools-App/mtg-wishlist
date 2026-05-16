export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-2">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: "var(--color-accent-secondary)", borderTopColor: "transparent" }}
      />
      <p className="text-text-muted text-sm">読み込み中...</p>
    </div>
  );
}

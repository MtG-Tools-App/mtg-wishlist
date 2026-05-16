export function ErrorMessage({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div
      className="border border-border text-accent-primary text-sm rounded-[var(--radius-md)] px-3 py-2"
      style={{ backgroundColor: "var(--color-glass)", backdropFilter: "blur(var(--blur-md))" }}
    >
      {error}
    </div>
  );
}

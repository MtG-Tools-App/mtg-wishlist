export function ErrorMessage({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="border border-border bg-surface text-text-subtle text-sm rounded-md px-3 py-2">
      {error}
    </div>
  );
}

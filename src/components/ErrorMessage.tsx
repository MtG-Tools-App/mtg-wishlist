export function ErrorMessage({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="border border-zinc-600 bg-zinc-800 text-zinc-300 text-sm rounded-md px-3 py-2">
      {error}
    </div>
  );
}

import { AddPageClient } from "./AddPageClient";

export default function AddPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-text text-base font-semibold mb-4">
        カードを追加
      </h1>
      <AddPageClient />
    </div>
  );
}

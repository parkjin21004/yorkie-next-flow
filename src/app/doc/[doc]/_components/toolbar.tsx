"use client";

export default function Toolbar({ onAdd }: { onAdd: () => void }) {
  const baseBtn =
    "inline-flex items-center justify-center rounded-[var(--radius)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--color-primary)_35%,transparent)] disabled:opacity-50 disabled:pointer-events-none";
  const btnPrimary =
    baseBtn +
    " bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)] border border-[color-mix(in_oklab,var(--color-primary)_60%,black_10%)] hover:bg-[color-mix(in_oklab,var(--color-primary)_92%,white_8%)]";
  const btnSubtle =
    baseBtn +
    " bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[color-mix(in_oklab,var(--color-surface)_92%,white_8%)]";

  return (
    <div className="fixed top-4 right-4 flex gap-2 z-10">
      <button className={`${btnPrimary} px-3 py-2`} onClick={onAdd}>
        Add
      </button>
      <button className={`${btnSubtle} px-3 py-2`} disabled>
        Remove
      </button>
    </div>
  );
}

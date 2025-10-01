"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

function slugifyDocumentName(input: string): string {
  const trimmed = input.trim().toLowerCase();
  const replaced = trimmed
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return replaced || "untitled";
}

export default function DocForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const key = slugifyDocumentName(name);
      const params = new URLSearchParams();
      if (username.trim()) params.set("user", username.trim());
      router.push(
        `/doc/${key}${params.toString() ? `?${params.toString()}` : ""}`
      );
    },
    [name, username, router]
  );

  const baseBtn =
    "inline-flex items-center justify-center rounded-[var(--radius)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--color-primary)_35%,transparent)] disabled:opacity-50 disabled:pointer-events-none";
  const btnPrimary =
    baseBtn +
    " bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)] border border-[color-mix(in_oklab,var(--color-primary)_60%,black_10%)] hover:bg-[color-mix(in_oklab,var(--color-primary)_92%,white_8%)]";

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl flex gap-3">
      <input
        type="text"
        placeholder="문서명을 입력하세요"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
      />
      <input
        type="text"
        placeholder="사용자 이름"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-48 px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
      />
      <button type="submit" className={`${btnPrimary} px-4 py-2`}>
        접속
      </button>
    </form>
  );
}

import DocForm from "@/app/_components/doc-form";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold">문서 접속</h1>
        <p className="text-[var(--color-text-muted)]">
          문서명을 입력하면 동일 문서명으로 접속한 사용자와 실시간 공동 편집이
          가능합니다.
        </p>
        <DocForm />
      </div>
    </div>
  );
}

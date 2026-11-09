import Link from "next/link";

/** 통계 화면 위 탭 — 사이즈별 판매 · 접속 통계(서버 V51). 주소로 나눈다 */
export function StatsTabs({ current }: { current: "sizes" | "visits" }) {
  const tabs = [
    { key: "visits", href: "/admin/stats/visits/", label: "접속 통계" },
    { key: "sizes", href: "/admin/stats/", label: "사이즈별 판매" },
  ] as const;
  return (
    <nav aria-label="통계 종류" className="border-subtle mb-8 flex gap-6 border-b">
      {tabs.map((t) => {
        const on = t.key === current;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`ease-fluid -mb-px inline-flex min-h-11 items-center border-b-2 text-sm transition-colors duration-300 ${
              on ? "border-accent text-primary font-medium" : "text-secondary hover:text-primary border-transparent"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

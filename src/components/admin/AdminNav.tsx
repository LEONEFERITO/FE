import Link from "next/link";

/**
 * 관리자 화면 사이 이동 — 매일 여는 순서대로: 대시보드 · 주문 · 교환/반품 · 상품 · 메인 구성 · 회원,
 * 그다음 가끔 여는 것: 통계 · 공지 · FAQ.
 * 지금 있는 곳은 aria-current 로 알린다. 항목이 많아 좁은 화면에서는 줄을 바꾼다.
 */
const ITEMS = [
  { key: "dashboard", href: "/admin/", label: "대시보드" },
  { key: "orders", href: "/admin/orders/", label: "주문" },
  { key: "returns", href: "/admin/returns/", label: "교환 · 반품" },
  { key: "products", href: "/admin/products/", label: "상품" },
  { key: "display", href: "/admin/display/", label: "메인 구성" },
  { key: "members", href: "/admin/members/", label: "회원" },
  { key: "stats", href: "/admin/stats/", label: "통계" },
  { key: "notices", href: "/admin/notices/", label: "공지" },
  { key: "faqs", href: "/admin/faqs/", label: "FAQ" },
] as const;

export type AdminSection = (typeof ITEMS)[number]["key"];

export function AdminNav({ current }: { current: AdminSection }) {
  return (
    <nav aria-label="관리자 메뉴" className="border-subtle mb-10 flex flex-wrap gap-x-6 border-b">
      {ITEMS.map((item) => {
        const on = item.key === current;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={`ease-fluid -mb-px inline-flex min-h-12 items-center border-b-2 text-sm transition-colors duration-300 ${
              on
                ? "border-accent text-primary"
                : "text-secondary hover:text-primary border-transparent"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

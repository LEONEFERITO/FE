import Link from "next/link";

/**
 * 관리자 화면 사이 이동. 주문 · 상품 · 회원 — 매일 여는 순서대로.
 * 지금 있는 곳은 aria-current 로 알린다.
 */
const ITEMS = [
  { key: "orders", href: "/admin/orders", label: "주문" },
  { key: "products", href: "/admin/products", label: "상품" },
  { key: "members", href: "/admin/members", label: "회원" },
] as const;

export function AdminNav({ current }: { current: (typeof ITEMS)[number]["key"] }) {
  return (
    <nav aria-label="관리자 메뉴" className="border-subtle mb-10 flex gap-6 border-b">
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

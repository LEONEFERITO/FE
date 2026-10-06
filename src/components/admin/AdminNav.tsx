"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import { signOut } from "@/lib/auth";

/**
 * 관리자 메뉴 — 왼쪽 세로 메뉴 (2026-10-06 고객 요청: "옆에 메뉴 있고 이런 식으로").
 *
 * 매일 여는 순서대로: 대시보드 · 주문 · 교환/반품 · 상품 · 메인 구성 · 사이트 사진(하위 다섯) · WHY 구간 · 회원,
 * 그다음 가끔 여는 것: 통계 · 공지 · FAQ. 지금 있는 곳은 주소(pathname)로 알아내 aria-current 로 알린다 —
 * 페이지마다 section 을 넘기지 않아도 된다.
 *
 * 좁은 화면(lg 미만)에서는 세로 메뉴 대신 위쪽에 가로로 스크롤되는 한 줄이 된다(AdminTopNav).
 */
const ITEMS = [
  { key: "dashboard", href: "/admin/", label: "대시보드" },
  { key: "orders", href: "/admin/orders/", label: "주문 관리" },
  { key: "returns", href: "/admin/returns/", label: "취소 · 반품 · 교환" },
  { key: "products", href: "/admin/products/", label: "상품 관리" },
  { key: "display", href: "/admin/display/", label: "메인 구성" },
  {
    key: "images",
    href: "/admin/display/main-lines/",
    label: "사이트 사진",
    children: [
      { href: "/admin/display/main-lines/", label: "메인 라인 카드" },
      { href: "/admin/display/line/", label: "라인 페이지" },
      { href: "/admin/display/lookbook/", label: "룩북" },
      { href: "/admin/display/brand/", label: "브랜드 페이지" },
      { href: "/admin/display/offline/", label: "매장 사진" },
    ],
  },
  { key: "why", href: "/admin/display/why/", label: "메인 WHY 구간" },
  { key: "members", href: "/admin/members/", label: "회원 관리" },
  { key: "stats", href: "/admin/stats/", label: "통계" },
  { key: "notices", href: "/admin/notices/", label: "공지사항" },
  { key: "faqs", href: "/admin/faqs/", label: "FAQ" },
] as const;

export type AdminSection = (typeof ITEMS)[number]["key"];

/** 주소가 어느 메뉴에 속하는지. 긴 주소부터 맞춰 본다 — /admin/display/why/ 가 /admin/display/ 로 잡히지 않게. */
function activeOf(pathname: string): { key: string; child?: string } {
  const path = pathname.endsWith("/") ? pathname : pathname + "/";
  for (const item of ITEMS) {
    if ("children" in item) {
      const child = item.children.find((c) => path.startsWith(c.href));
      if (child) return { key: item.key, child: child.href };
    }
  }
  const leaf = [...ITEMS]
    .filter((i) => i.key !== "dashboard" && i.key !== "images" && path.startsWith(i.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  // /admin/display/ 하위 중 메뉴에 없는 것(진열 순서)은 메인 구성, 그 외 /admin/... 는 대시보드
  return { key: leaf?.key ?? "dashboard" };
}

const itemClass = (on: boolean) =>
  `ease-fluid flex min-h-11 items-center px-4 text-sm transition-colors duration-200 ${
    on ? "bg-primary text-white" : "text-primary hover:bg-band"
  }`;

export function AdminSidebar() {
  const active = activeOf(usePathname() ?? "/admin/");

  async function logout() {
    try {
      await signOut();
    } finally {
      window.location.assign("/admin/login/");
    }
  }

  return (
    <nav aria-label="관리자 메뉴" className="flex h-full flex-col">
      <ul className="flex flex-col gap-0.5 py-2">
        {ITEMS.map((item) => {
          const on = item.key === active.key;
          return (
            <li key={item.key}>
              <Link href={item.href} aria-current={on && !("children" in item) ? "page" : undefined} className={itemClass(on && !("children" in item))}>
                {item.label}
              </Link>
              {"children" in item && (
                <ul className="mb-1 flex flex-col">
                  {item.children.map((c) => {
                    const onChild = active.child === c.href;
                    return (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          aria-current={onChild ? "page" : undefined}
                          className={`ease-fluid flex min-h-10 items-center pl-8 pr-4 text-xs transition-colors duration-200 ${
                            onChild ? "bg-primary text-white" : "text-secondary hover:bg-band hover:text-primary"
                          }`}
                        >
                          {c.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <div className="border-subtle mt-auto flex flex-col border-t py-2">
        <Link href="/" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-primary flex min-h-10 items-center px-4 text-xs">
          손님 사이트 보기<span className="sr-only">(새 창)</span>
        </Link>
        <Link href="/admin/password/" className="text-secondary hover:text-primary flex min-h-10 items-center px-4 text-xs">
          비밀번호 바꾸기
        </Link>
        <button type="button" onClick={logout} className="text-secondary hover:text-primary flex min-h-10 items-center px-4 text-left text-xs">
          로그아웃
        </button>
      </div>
    </nav>
  );
}

/** 좁은 화면용 — 같은 메뉴를 가로 한 줄로. 하위 메뉴는 펼치지 않고 상위만 */
export function AdminTopNav() {
  const active = activeOf(usePathname() ?? "/admin/");
  return (
    <nav aria-label="관리자 메뉴" className="border-subtle bg-base -mx-5 overflow-x-auto border-b px-5 lg:hidden">
      <ul className="flex w-max gap-1 py-2">
        {ITEMS.map((item) => {
          const on = item.key === active.key;
          return (
            <li key={item.key}>
              <Link href={item.href} aria-current={on ? "page" : undefined} className={`${itemClass(on)} whitespace-nowrap rounded-full`}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** 맨 위 띠 — 워드마크 + "관리자" */
export function AdminTopBar() {
  return (
    <div className="border-subtle bg-base flex h-14 items-center gap-3 border-b px-5">
      <Link href="/admin/" className="text-accent-deep inline-flex items-center gap-3" aria-label="관리자 대시보드">
        <Logo width={120} label="" />
        <span className="text-primary text-sm">관리자</span>
      </Link>
    </div>
  );
}

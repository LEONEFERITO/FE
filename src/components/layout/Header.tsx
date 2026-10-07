"use client";

import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { ABOUT_GROUPS, ABOUT_LABEL, CATEGORY_GROUPS, type NavLink } from "@/data/siteNav";

/**
 * 전역 헤더 — 화면 폭을 가득 채우는 배너.
 *
 * 처음에는 여백 위에 떠 있는 알약이었는데, 히어로가 **풀블리드 분할**로 바뀌면서
 * 틀렸다. 사진이 화면 끝까지 닿는데 그 위 알약만 양옆에 여백을 남기니,
 * 헤더가 페이지에 얹힌 게 아니라 **떠다니는 조각**으로 보였다.
 * 화면 폭을 가득 채우고 아래에 1px 경계를 두면, 헤더가 사진의 천장이 된다.
 *
 * 안쪽 내용도 컨테이너로 묶지 않고 화면 양끝에 붙인다. 1320px 안으로 넣으면
 * 바는 풀와이드인데 내용만 가운데 모여서, 채운 의미가 없어진다.
 *
 * `overHero` 를 주면 히어로 구간 위에서는 면 없이 투명해지고(위에서 아래로
 * 옅어지는 scrim 만 남는다), 히어로를 지나면 와인 배너로 굳는다.
 * 벨벳 위에서는 글자를 크림색으로 바꾼다 — 고동색 글자는 벨벳 위에서 1.6:1 이라 안 보인다.
 *
 * backdrop-blur 는 이 고정 요소에만 건다. 스크롤되는 본문에 걸면 GPU 가 매 프레임
 * 다시 그려서 모바일이 버벅인다.
 *
 * 내비 라벨의 자간을 넓힌 이유: 이 브랜드는 따뜻한 색이 이미 다 쓰여서
 * (고동 25° · 경고 34.5° · 골드 41°) 색만으로는 구분이 어렵다.
 * 자간이라는 **형태**로도 "분류" 임을 알 수 있게 한다 (WCAG 1.4.1).
 */

/*
 * 내비는 **고객이 요구한 메뉴**만 둔다 (BRAND_BRIEF 1-3).
 *
 * 뺀 것과 이유:
 *   SIZE GUIDE      이용 메뉴얼(2-2) 안의 "내게 맞는 사이즈 고르는 법"
 *   LEONE · FERITO  제품 구별(2-4) 안의 분류
 * 둘 다 다른 메뉴 **안에 들어가는 내용**이라, 헤더에 따로 두면 같은 것을 두 군데서 찾게 된다.
 *
 * 연결 링크(1-3 의 4번 — 인스타·네이버플레이스)는 여기 넣지 않는다.
 * 사이트를 떠나는 링크라 헤더에 두면 둘러보던 사람을 밖으로 내보낸다. 푸터가 제자리다.
 *
 * 링크가 가리키는 페이지는 전부 실재한다. 없는 주소를 미리 걸어두면
 * "곧 생긴다" 가 아니라 "고장났다" 로 읽힌다 — 내용이 없는 동안에는 준비 중 화면을 둔다.
 */
/*
 * ── 2026-10-05 고객 디자인 가이드로 바뀐 규칙 (위 주석은 그 전의 규칙이다) ──
 * 헤더 내비는 **분류**다: 메인 · Suit · Jacket · Trousers · Shirts · Shoes · Accessories.
 * 기존 몰(leoneferito.kr)의 내비를 그대로 옮기고 맨 앞에 "메인" 을 더했다 — 고객이 적은 표기 그대로다.
 * 분류 목록과 주소는 data/categories.ts 의 CATEGORY_NAV 한 곳에서 온다 (카테고리 페이지 · 사이트맵과 같은 목록).
 *
 * 헤더에서 내려온 메뉴(BRAND · GUIDE · LOOKBOOK · QNA)는 없어지지 않는다. 모바일 메뉴의 둘째 묶음과
 * 푸터로 옮겼고, 메인의 "브랜드 이용 메뉴얼" · "문의 · 채널" 구간이 각각 GUIDE · QNA 로 잇는다.
 */
/*
 * ── 2026-10-06 고객 사이트 구조표로 바뀐 규칙 (위 두 주석은 그 전의 규칙이다) ──
 * 헤더는 구조표의 상위 메뉴 열 개다: THE MAISON · THE GUIDE · THE LOOKBOOK · SHIRTS · TROUSERS · JACKET · SUIT ·
 * FOOTWEAR · ACCESSORIES · CLIENT SERVICES. 하위 메뉴는 PC 에서 드롭다운, 모바일에서 펼침이다.
 * 목록은 data/siteNav.ts 의 SITE_NAV 하나에서 온다 (푸터도 같은 목록).
 *
 * 같은 날 정리: 브랜드 · 안내 · 룩북 · 고객 서비스 넷은 ABOUT 한 칸으로 묶었다(data/siteNav.ts ABOUT_GROUPS).
 * 헤더 한 줄은 MAIN · ABOUT · SHIRTS · TROUSERS · JACKET · SUIT · FOOTWEAR · ACCESSORIES 여덟 칸이고,
 * 1024px 부터 평소 글자 크기로 들어간다. 그 아래는 햄버거로 연다.
 *
 * 드롭다운은 hover 와 키보드 초점(focus-within) 둘 다로 열린다. 마우스가 없는 사람도 Tab 으로 하위 메뉴에 닿는다.
 */

/** 헤더 한 줄의 링크 모양 — 글자색은 헤더의 색 묶음을 따른다(검정 GNB 위 크림 · 배너 위 투명일 때 진한 글자), 강조는 accent */
const navLinkClass = () =>
  "text-2xs tracking-label ease-fluid inline-flex min-h-11 items-center whitespace-nowrap text-primary transition-colors duration-700 hover:text-accent group-focus-within/nav:text-accent group-hover/nav:text-accent";

/** 사이트 밖 주소(카카오톡)는 새 창으로 — 둘러보던 사람이 사이트를 잃지 않게 */
function NavAnchor({
  item,
  className,
  onClick,
  children,
}: {
  item: NavLink;
  className: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return item.external ? (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
      {children}
      <span className="sr-only">(새 창)</span>
    </a>
  ) : (
    <Link href={item.href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

/** 오른쪽 묶음. 개인 영역이라 탐색 메뉴와 나눠 둔다. */
const ACCOUNT_NAV = [
  { href: "/mypage", label: "MY" },
  { href: "/cart", label: "CART (0)" },
] as const;

export function Header({ overHero = false }: { overHero?: boolean }) {
  const [open, setOpen] = useState(false);
  // 히어로 위에 떠 있는 동안 true. overHero 가 아니면 항상 false(=평소 모습).
  const [onHero, setOnHero] = useState(overHero);

  useEffect(() => {
    if (!overHero) return;

    const hero = document.querySelector("[data-hero]");
    if (!hero) return;

    /*
     * 히어로 구간 위에 떠 있는 동안만 투명하게 둔다.
     *
     * scroll 리스너를 쓰지 않는다. 한 번의 스크롤에 수십 번 발화하고,
     * 그때마다 위치를 재면 프레임을 갉아먹는다. Observer 는 브라우저가
     * 합성 단계에서 처리한다.
     *
     * rootMargin 으로 화면 위쪽을 헤더 높이만큼 잘라내서, 히어로 아래쪽이
     * 그 선을 넘어가는 순간 교차가 끊긴다 = 벨벳 구간이 끝났다는 뜻이다.
     * 히어로 높이를 가정하지 않으므로 연출 길이를 바꿔도 헤더를 고칠 필요가 없다.
     */
    // 붙잡힌 무대(data-hero="pin")는 화면 맨 아래 한 줄로 본다 — 무대 바닥이 화면 바닥 위로 올라오는 순간
    // (= 무대가 풀려 위로 빠지기 시작) 헤더가 원래 색으로 돌아온다. 투명한 채 남으면 빠져나가는 사진 위에 로고가 겹친다.
    const pinned = hero.getAttribute("data-hero") === "pin";
    const io = new IntersectionObserver(
      ([entry]) => setOnHero(entry.isIntersecting),
      { rootMargin: pinned ? "-99% 0px 0px 0px" : "-80px 0px 0px 0px", threshold: 0 },
    );

    io.observe(hero);
    return () => io.disconnect();
  }, [overHero]);

  // 메뉴가 열린 동안 뒤 본문이 스크롤되면 위치를 잃는다.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Esc 로 닫힌다. 모달을 키보드로 빠져나갈 길이 없으면 접근성 위반이다.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /*
   * 히어로 위에 떠 있는 동안 투명해진다.
   *
   * **모바일에서만** 그렇게 둔다. 모바일 히어로는 무대색(#54090F) 한 판이라
   * 그 위에 헤더 면이 또 얹히면 색이 두 겹으로 보인다. 투명하게 두면 사진이
   * 화면 끝까지 이어진다.
   * 데스크톱은 한쪽이 촬영 원본이라 사진 밝기에 따라 글자가 사라진다 — 면을 유지한다.
   * 그래서 아래 클래스마다 md: 로 평소 모습을 되돌린다.
   *
   * 메뉴가 열리면 오버레이가 덮으므로 다시 평소 색이어야 한다.
   */
  const light = onHero && !open;

  return (
    <>
      {/*
        GNB 색 — 2026-10-06 고객 요청("상단 GNB 컬러 확인"): 기존 몰(leoneferito.kr)처럼 **흰 바탕 · 진한 글자 ·
        아래 얇은 선**. on-cream on-white 로 이 안의 토큰만 밝은 쪽으로 뒤집는다(드롭다운 · ABOUT 판도 같이).
        반투명(bg-base/85)을 쓰지 않는다 — 반투명이면 뒤 페이지 색이 비쳐 흰 페이지 위에서 회갈색으로 탁해졌다.
        히어로 위에서는 바탕 · 선을 비워 투명하고, 히어로 배너를 지나면 원래 색으로 굳는다(2026-10-06 요청 — PC · 모바일 모두).

        2026-10-07 고객 요청으로 "원래 색" 이 **검정**이 됐다(on-black — 크림 글자 · 골드 로고). 메인 배너는 밝은 종이라
        투명한 동안에는 진한 글자가 필요하다 — 그때만 on-cream on-white 묶음을 쓰고, 배너를 지나면 on-black 으로 바뀐다.
      */}
      <header
        className={`ease-fluid sticky top-0 z-40 w-full border-b transition-colors duration-700 ${
          // 색 묶음 클래스가 background 를 직접 깔아서(레이어 밖 CSS) 유틸리티보다 세다 — 투명은 ! 로 이긴다
          light ? "on-cream on-white border-transparent bg-transparent!" : "on-black border-subtle bg-base"
        }`}
      >
        <div className="relative flex h-14 w-full items-center justify-between px-5 md:h-18 md:px-10">
          {/*
            로고는 히어로 위에서도 그대로 둔다.

            전에는 숨겼는데 그건 무대형 히어로(거대한 워드마크가 화면 한가운데)
            전용 규칙이었다. 지금 분할형은 워드마크가 구간 맨 아래라 겹치지 않고,
            상단이 비면 헤더가 있는지조차 알기 어렵다.
          */}
          <Link
            href="/"
            className="text-accent-deep hover:text-accent ease-fluid transition-colors duration-700"
            aria-label="LEONE FERITO 홈"
          >
            <span className="md:hidden">
              <Logo width={112} label="" />
            </span>
            <span className="hidden md:inline-block">
              <Logo width={150} label="" />
            </span>
          </Link>

          {/*
            여덟 칸 — MAIN · ABOUT · 분류 여섯. 로고와 계정 묶음 사이 남는 폭의 한가운데.
            드롭다운은 hover 와 키보드 초점(focus-within) 둘 다로 열린다. 위에 투명한 다리(pt-3)를 둬서
            마우스가 내려오는 동안 닫히지 않고, 닫혀 있을 때는 invisible 이라 Tab 순서에서도 빠진다.
          */}
          <nav aria-label="주요 메뉴" className="hidden min-w-0 flex-1 justify-center px-4 lg:flex">
            <ul className="flex items-center gap-5 xl:gap-8">
              <li>
                <Link href="/" className={navLinkClass()}>
                  MAIN
                </Link>
              </li>

              {/* ABOUT — 넓은 판(헤더 폭 전체)에 네 묶음이 열로. li 가 relative 가 아니라서 판은 헤더 줄 기준이다 */}
              <li className="group/nav">
                <Link href="/brand/" className={navLinkClass()}>
                  {ABOUT_LABEL}
                </Link>
                <div className="invisible absolute inset-x-0 top-full z-50 pt-0 opacity-0 transition-[opacity,visibility] duration-300 ease-out group-focus-within/nav:visible group-focus-within/nav:opacity-100 group-hover/nav:visible group-hover/nav:opacity-100">
                  <div className="on-black bg-base border-subtle shadow-lift border-y">
                    <div className="mx-auto grid max-w-[1180px] grid-cols-4 gap-8 px-10 py-8">
                      {ABOUT_GROUPS.map((group) => (
                        <div key={group.label} className="min-w-0">
                          <Link
                            href={group.href}
                            className="text-accent hover:text-accent-hover tracking-label ease-fluid inline-flex min-h-11 items-center text-xs transition-colors duration-300"
                          >
                            {group.label}
                          </Link>
                          <p className="text-muted text-2xs mb-2">{group.description}</p>
                          <ul>
                            {group.children.map((child) => (
                              <li key={child.href}>
                                <NavAnchor
                                  item={child}
                                  className="text-secondary hover:text-primary focus-visible:text-primary ease-fluid tracking-label inline-flex min-h-10 items-center text-2xs transition-colors duration-300"
                                >
                                  {child.label}
                                </NavAnchor>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </li>

              {CATEGORY_GROUPS.map((group) => (
                <li key={group.label} className="group/nav relative">
                  <Link href={group.href} className={navLinkClass()}>
                    {group.label}
                  </Link>
                  {group.children.length > 0 && (
                    <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-[opacity,visibility] duration-300 ease-out group-focus-within/nav:visible group-focus-within/nav:opacity-100 group-hover/nav:visible group-hover/nav:opacity-100">
                      <div className="on-black bg-base border-subtle shadow-lift w-64 border p-2">
                        <p className="text-muted text-2xs px-3 pb-2 pt-2">{group.description}</p>
                        <ul>
                          {group.children.map((child) => (
                            <li key={child.href}>
                              <NavAnchor
                                item={child}
                                className="hover:bg-band focus-visible:bg-band ease-fluid flex min-h-11 flex-col justify-center px-3 py-2 transition-colors duration-300"
                              >
                                <span className="text-primary text-xs tracking-label">{child.label}</span>
                                {child.description && (
                                  <span className="text-muted text-2xs mt-0.5 leading-snug">{child.description}</span>
                                )}
                              </NavAnchor>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            {/*
              min-h-11 · px-1: 표적 기준 24×24 를 채운다 (WCAG 2.5.8).
              높이는 원래 20px 이었고, 폭은 "MY" 가 글자만으로 23px 이라 1px 모자랐다.
              여백만큼 gap 을 줄여(-mx-1 대신 gap-4) 보이는 간격은 그대로 둔다.
            */}
            {ACCOUNT_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-2xs tracking-label text-accent-deep hover:text-accent ease-fluid hidden min-h-11 min-w-11 items-center justify-center whitespace-nowrap px-1 transition-colors duration-700 sm:inline-flex"
              >
                {item.label}
              </Link>
            ))}

            {/* 햄버거 — 두 줄이 회전·이동하며 X 로 합쳐진다. 그냥 사라지면 값싸 보인다. */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
              className="relative -mr-1.5 h-11 w-11 lg:hidden"
            >
              <span
                className={`ease-fluid absolute left-1/2 top-1/2 block h-px w-5 -translate-x-1/2 transition-all duration-500 ${
                  "bg-accent-deep"
                } ${open ? "rotate-45" : "-translate-y-1"}`}
              />
              <span
                className={`ease-fluid absolute left-1/2 top-1/2 block h-px w-5 -translate-x-1/2 transition-all duration-500 ${
                  "bg-accent-deep"
                } ${open ? "-rotate-45" : "translate-y-1"}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* 전체 화면 오버레이 — 링크가 계단식으로 올라온다 */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="on-black bg-base fixed inset-0 z-30 lg:hidden"
      >
        <nav
          aria-label="모바일 메뉴"
          /*
            가운데 정렬(justify-center)을 버리고 위에서부터 쌓는다. 분류 일곱에 나머지 메뉴가 더해져
            작은 화면에서는 한 화면을 넘는다 — 가운데 정렬이면 위아래가 잘려 닿지 못하는 링크가 생긴다.
            넘치면 이 안에서 스크롤한다.
          */
          className="flex h-full flex-col overflow-y-auto px-8 pb-10 pt-24"
        >
          {/*
            상품 분류(SHIRTS … ACCESSORIES)는 펼치지 않고 바로 그 분류 페이지로 간다 — 2026-10-07 고객 요청으로
            모바일 메뉴의 하위 항목(전체 보기 · Classic Fit … )을 뺐다. 세부 분류는 분류 페이지 위의 칩으로 고른다.
            ABOUT 묶음(THE MAISON …)만 펼침(<details>)이다 — 열고 닫기 · 키보드 · 스크린리더를 브라우저가 해 준다.
          */}
          <ul className="flex flex-col">
            {[...CATEGORY_GROUPS, ...ABOUT_GROUPS].map((group, i) => (
              <li
                key={group.label}
                className={`border-subtle ease-soft border-b transition-all duration-700 ${
                  i === CATEGORY_GROUPS.length ? "border-t-accent/40 mt-6 border-t pt-2" : ""
                }`}
                style={{
                  transitionDelay: open ? `${100 + i * 45}ms` : "0ms",
                  opacity: open ? 1 : 0,
                  transform: open ? "none" : "translateY(1.25rem)",
                }}
              >
                {group.children.length === 0 || i < CATEGORY_GROUPS.length ? (
                  <Link
                    href={group.href}
                    onClick={() => setOpen(false)}
                    className="font-display text-accent-deep hover:text-accent ease-fluid flex min-h-14 items-center text-xl transition-colors duration-500"
                  >
                    {group.label}
                  </Link>
                ) : (
                  <details className="group/m">
                    <summary className="font-display text-accent-deep flex min-h-14 cursor-pointer list-none items-center justify-between text-xl [&::-webkit-details-marker]:hidden">
                      {group.label}
                      <CaretDown
                        size={14}
                        weight="light"
                        aria-hidden="true"
                        className="ease-fluid transition-transform duration-500 group-open/m:rotate-180"
                      />
                    </summary>
                    <ul className="pb-4">
                      <li>
                        <Link
                          href={group.href}
                          onClick={() => setOpen(false)}
                          className="text-accent tracking-label ease-fluid inline-flex min-h-11 items-center text-xs transition-colors duration-500"
                        >
                          전체 보기 — {group.description}
                        </Link>
                      </li>
                      {group.children.map((child) => (
                        <li key={child.href}>
                          <NavAnchor
                            item={child}
                            onClick={() => setOpen(false)}
                            className="text-secondary hover:text-accent tracking-label ease-fluid inline-flex min-h-11 items-center text-xs transition-colors duration-500"
                          >
                            {child.label}
                          </NavAnchor>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>

          {/* 둘째 묶음 — 헤더 한 줄에서 내려온 메뉴와 개인 영역. 분류보다 작게, 두 열로 */}
          <ul
            className="ease-soft mt-6 grid grid-cols-2 gap-x-6 transition-opacity duration-700"
            style={{ opacity: open ? 1 : 0, transitionDelay: open ? "560ms" : "0ms" }}
          >
            {[{ href: "/", label: "MAIN" }, ...ACCOUNT_NAV].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-secondary hover:text-accent tracking-label ease-fluid inline-flex min-h-11 items-center text-xs transition-colors duration-500"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

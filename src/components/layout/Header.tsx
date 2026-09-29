"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";

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
const NAV = [
  { href: "/brand", label: "BRAND" },
  { href: "/guide", label: "GUIDE" },
  { href: "/lookbook", label: "LOOKBOOK" },
  { href: "/products", label: "COLLECTION" },
  { href: "/qna", label: "QNA" },
] as const;

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
    const io = new IntersectionObserver(
      ([entry]) => setOnHero(entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 },
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
      <header
        className={`ease-fluid sticky top-0 z-40 w-full border-b transition-all duration-700 ${
          light
            ? /*
                위에서 아래로 옅어지는 scrim 만 남긴다. 완전 투명으로 두면
                히어로 상단이 밝은 컷일 때 로고와 햄버거가 묻힌다.
                md: 부터는 평소의 와인 배너로 되돌린다.
              */
              "border-transparent bg-gradient-to-b from-black/45 to-transparent md:border-subtle/70 md:bg-base/85 md:bg-none md:shadow-soft md:backdrop-blur-xl"
            : "border-subtle/70 bg-base/85 shadow-soft backdrop-blur-xl"
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
            className={`ease-fluid transition-colors duration-700 ${
              light
                ? "text-primary hover:text-accent md:text-accent-deep"
                : "text-accent-deep hover:text-accent"
            }`}
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
            내비는 **화면 정중앙**에 고정한다.
            justify-between 안에 두면 좌우 그룹(로고 · 카트)의 폭 차이만큼 밀린다.
            지금은 오른쪽으로 44px 밀려 있었고, 히어로 위에서 로고가 사라지면 더 틀어진다.
            바가 풀와이드가 되면서 이 정중앙이 곧 화면 정중앙이라 기준이 하나로 맞는다.
          */}
          <nav
            aria-label="주요 메뉴"
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
          >
            <ul className="flex items-center gap-8">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`text-2xs tracking-label ease-fluid transition-colors duration-700 ${
                      light
                        ? "text-primary/80 hover:text-primary md:text-secondary"
                        : "text-secondary hover:text-accent"
                    }`}
                  >
                    {item.label}
                  </Link>
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
                className={`text-2xs tracking-label ease-fluid hidden min-h-11 min-w-11 items-center justify-center whitespace-nowrap px-1 transition-colors duration-700 sm:inline-flex ${
                  light
                    ? "text-primary hover:text-white md:text-accent-deep"
                    : "text-accent-deep hover:text-accent"
                }`}
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
                  light ? "bg-primary md:bg-accent-deep" : "bg-accent-deep"
                } ${open ? "rotate-45" : "-translate-y-1"}`}
              />
              <span
                className={`ease-fluid absolute left-1/2 top-1/2 block h-px w-5 -translate-x-1/2 transition-all duration-500 ${
                  light ? "bg-primary md:bg-accent-deep" : "bg-accent-deep"
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
        className="bg-base/90 fixed inset-0 z-30 backdrop-blur-2xl lg:hidden"
      >
        <nav
          aria-label="모바일 메뉴"
          className="flex h-full flex-col justify-center px-8"
        >
          <ul className="flex flex-col gap-6">
            {[...NAV, ...ACCOUNT_NAV].map((item, i) => (
              <li
                key={item.href}
                className="ease-soft transition-all duration-700"
                style={{
                  transitionDelay: open ? `${120 + i * 70}ms` : "0ms",
                  opacity: open ? 1 : 0,
                  transform: open ? "none" : "translateY(1.5rem)",
                }}
              >
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-accent-deep hover:text-accent ease-fluid text-3xl transition-colors duration-500"
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

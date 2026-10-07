"use client";

import { ChatCircle, Phone, Question, X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { CALL_NUMBER, KAKAO_CHANNEL } from "@/data/business";

/**
 * 퀵메뉴 — 오른쪽 아래에 떠 있는 LF 모노그램 버튼. 누르면 위로 세 갈래가 펼쳐진다.
 *   카카오톡 채널 (1:1 채팅) · 문의하기 (QnA) · 전화 연결 (tel:)
 *
 * 관리자 화면에서는 띄우지 않는다 — 손님용 창구다.
 *
 * ── 닫기 ────────────────────────────────────────────────
 * Esc · 바깥 누르기 · 항목 누르기 · 다른 페이지로 이동. Esc 로 닫으면 초점을 버튼으로 돌려준다.
 *
 * ── 움직임 ──────────────────────────────────────────────
 * 항목은 아래에서 하나씩 올라온다(위쪽 항목이 조금 늦게). 모노그램은 돌면서 X 로 바뀐다.
 * transform · opacity 만 쓰고, 움직임을 줄인 사용자에게는 globals.css 의 전역 규칙이 전환을 끈다.
 * 닫힌 동안 항목은 invisible 이라 Tab 으로 들어가지 않는다.
 *
 * ── 중요한 버튼과 겹칠 때 (모바일) ──────────────────────
 * 폰에서는 이 버튼이 화면 아래쪽의 주 버튼(배너의 "전체 제품", 상세의 "장바구니 담기", 결제하기 등)을 덮는다
 * (2026-10-07 모바일 점검). `data-quick-avoid` 표시가 있는 요소나 본문의 제출 버튼이 화면 아래 띠(버튼이 떠 있는 높이)에
 * 들어와 있는 동안만 버튼을 아래로 걷어 둔다. 지나가면 다시 나온다. 데스크톱은 여백이 넓어 걷지 않는다.
 */
export function QuickMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  // 비켜 선 페이지. 다른 페이지로 가면 자연히 어긋나 다시 보인다(렌더 중 비교 — effect 로 되돌리지 않는다).
  const [hiddenOn, setHiddenOn] = useState<string | null>(null);
  const overHero = hiddenOn === pathname;

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 767px)");
    if (!narrow.matches) return;
    // 화면 아래 띠 — 버튼(56px) + 아래 여백 + 숨 쉴 틈
    const band = 104;
    const seen = new Set<Element>();
    const hits = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) hits.add(e.target);
          else hits.delete(e.target);
        }
        setHiddenOn(hits.size > 0 ? pathname : null);
      },
      { rootMargin: `-${Math.max(0, window.innerHeight - band)}px 0px 0px 0px` },
    );
    // 버튼은 데이터를 받은 뒤에 그려지기도 한다(장바구니 · 주문서) — 새로 생기면 마저 지켜본다
    let queued = 0;
    const scan = () => {
      queued = 0;
      document.querySelectorAll('[data-quick-avoid], main button[type="submit"]').forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    };
    scan();
    const mo = new MutationObserver(() => {
      if (!queued) queued = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      if (queued) cancelAnimationFrame(queued);
    };
  }, [pathname]);

  // 페이지가 바뀌면 닫는다 — effect 대신 렌더 중에 맞춘다
  if (open && openedAt !== pathname) {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  if (pathname?.startsWith("/admin")) return null;

  const close = () => setOpen(false);
  const items = [
    {
      key: "kakao",
      label: "카카오톡 채널",
      // 1:1 채팅으로 바로 — 채널 홈을 거치지 않는다 (2026-10-06 결정)
      href: KAKAO_CHANNEL.chat,
      external: true,
      icon: <ChatCircle size={20} weight="fill" aria-hidden="true" />,
      iconClass: "bg-[#FEE500] text-[#191919]",
    },
    {
      key: "qna",
      label: "문의하기",
      href: "/qna/",
      external: false,
      icon: <Question size={20} weight="regular" aria-hidden="true" />,
      iconClass: "bg-surface text-primary border-subtle border",
    },
    {
      key: "call",
      label: "전화 연결",
      href: `tel:${CALL_NUMBER.replace(/-/g, "")}`,
      external: false,
      icon: <Phone size={20} weight="regular" aria-hidden="true" />,
      iconClass: "bg-surface text-primary border-subtle border",
    },
  ];

  return (
    <div
      ref={rootRef}
      className={`ease-fluid fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex flex-col items-end gap-3 transition-[transform,opacity] duration-500 md:right-6 md:bottom-6 ${
        overHero && !open ? "pointer-events-none invisible translate-y-4 opacity-0" : ""
      }`}
    >
      <ul id={listId} aria-label="빠른 문의" className={`flex flex-col items-end gap-2.5 ${open ? "" : "invisible"}`}>
        {items.map((item, i) => {
          // 아래(버튼 가까운) 항목부터 올라온다
          const delay = open ? (items.length - 1 - i) * 55 : 0;
          const inner = (
            <>
              <span className="bg-surface/95 text-primary border-subtle shadow-soft rounded-full border px-3.5 py-1.5 text-xs whitespace-nowrap backdrop-blur">
                {item.label}
                {item.key === "call" && <span className="text-muted ml-1.5 tabular-nums">{CALL_NUMBER}</span>}
              </span>
              <span className={`shadow-soft flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.iconClass}`}>
                {item.icon}
              </span>
            </>
          );
          const cls =
            "ease-fluid flex min-h-11 items-center gap-2.5 transition-[transform,opacity] duration-500 hover:-translate-x-0.5 active:scale-[0.97]";
          return (
            <li
              key={item.key}
              className={`ease-fluid transition-[transform,opacity] duration-500 ${
                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
              style={{ transitionDelay: `${delay}ms` }}
            >
              {item.external ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={close} className={cls}>
                  {inner}
                  <span className="sr-only">(새 창)</span>
                </a>
              ) : item.href.startsWith("tel:") ? (
                <a href={item.href} onClick={close} className={cls}>
                  {inner}
                </a>
              ) : (
                <Link href={item.href} onClick={close} className={cls}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={open ? "빠른 문의 닫기" : "빠른 문의 열기"}
        onClick={() => {
          setOpenedAt(pathname);
          setOpen((v) => !v);
        }}
        className="group bg-stage border-gold/60 shadow-lift ease-fluid relative flex h-14 w-14 items-center justify-center rounded-full border transition-[transform,border-color] duration-500 hover:-translate-y-0.5 hover:border-gold active:scale-[0.96]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/leoneferito-monogram.webp"
          alt=""
          width={22}
          height={25}
          className={`ease-fluid absolute h-[25px] w-auto transition-[transform,opacity] duration-500 ${
            open ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          }`}
        />
        <X
          size={22}
          weight="light"
          aria-hidden="true"
          className={`text-gold ease-fluid absolute transition-[transform,opacity] duration-500 ${
            open ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0"
          }`}
        />
      </button>
    </div>
  );
}

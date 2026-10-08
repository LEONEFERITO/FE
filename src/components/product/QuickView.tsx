"use client";

import { ArrowRight, ArrowUpRight, CaretLeft, CaretRight, X } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

import { LineSummary } from "@/components/product/LineBadge";
import { SizeSelector } from "@/components/product/SizeSelector";
import { usePurchase } from "@/components/product/usePurchase";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { pendingLabel } from "@/lib/pending";
import { CATEGORY_LABEL, type Product } from "@/types/product";

/**
 * 빠른 보기 — 목록의 카드를 누르면 상세 페이지로 가지 않고 **그 자리에서 카드가 커지며** 팝업이 된다
 * (2026-10-08 고객 요청. 레퍼런스: koala-art.co.kr 의 상품 팝업, 그리고 고객이 보내 준 ExpandCard 예시 —
 * 카드 사진이 팝업 사진 자리로 날아가고, 폰에서는 손잡이를 끌어내려 닫는다).
 *
 * ── 안에 무엇이 있나 ───────────────────────────────────
 * 왼쪽 사진(넘겨 보기 · 손가락으로 밀기), 오른쪽 분류 · 이름 · 한 줄 소개 · 가격 · 제작 기간 · 라인 · 사이즈 ·
 * 담기 / 바로 구매. 상세 사이즈 · 제품 설명 · 상세 이미지는 팝업에 없다 — "자세히 보기" 가 상세 페이지로 간다.
 * 담기 · 바로 구매는 구매 판과 같은 규칙(usePurchase)이다.
 *
 * ── 어떻게 움직이나 (라이브러리 없이) ───────────────────
 * 예시는 framer-motion 의 layoutId 로 카드 → 팝업을 잇는다. 같은 효과를 **Web Animations API** 로 낸다:
 * 열릴 때 카드 사진의 자리(origin)를 재서 팝업 사진을 그 자리 · 그 크기에서 제자리로 움직인다(FLIP).
 * 닫힐 때는 반대로 돌아간 뒤 닫는다. 판 자체와 배경은 CSS 로 흐려졌다 또렷해진다 (globals.css .quick).
 * 정보 칸은 살짝 늦게 오른쪽에서 들어온다. 움직임을 줄인 사용자에게는 날아가지 않고 바로 나타난다.
 *
 * 폰: 위 손잡이를 끌어내리면 판이 손가락을 따라 내려오고, 100px 넘게 내리거나 빠르게 튕기면 닫힌다.
 *
 * ── <dialog> 를 쓰는 이유 ───────────────────────────────
 * 초점 가두기 · Esc 닫기 · 바깥 비활성화 · 본문 스크롤 잠금을 브라우저가 해 준다. 바깥(배경)을 누르면 닫힌다.
 * 바탕은 언제나 흰색이다(on-cream on-white) — 검은 라인 페이지에서 열려도 팝업은 상품 상세와 같은 면이다.
 * 직각 · 그림자 없음(사이트 규칙).
 *
 * 사진은 **열린 뒤에만** 그린다 — 목록의 카드마다 팝업이 하나씩 있어서, 닫힌 채로도 사진을 다 내려받으면
 * 목록이 열릴 때 사진이 두 배로 간다.
 */

const KRW = new Intl.NumberFormat("ko-KR");
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** from(카드 사진 자리) → to(팝업 사진 자리) 로 옮기는 transform. 둘의 비율이 달라 가로 · 세로를 따로 맞춘다 */
function flipTransform(from: DOMRect, to: DOMRect) {
  return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
}

export function QuickView({
  product,
  open,
  onClose,
  originRef,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
  /** 카드의 사진 칸 — 여기서 커져 나오고 여기로 돌아간다 */
  originRef: RefObject<HTMLElement | null>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(false);
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);
  const closing = useRef(false);
  const { selectedSize, setSelectedSize, pending, notice, put } = usePurchase(product);

  // 한 번 열리면 안쪽(사진)을 그린다 — effect 가 아니라 렌더 중에 맞춘다
  if (open && !opened) setOpened(true);

  // 열기 — showModal 은 렌더 뒤에, FLIP 은 사진 칸이 그려진 뒤에(useLayoutEffect)
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      closing.current = false;
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !opened) return;
    const photo = photoRef.current;
    const origin = originRef.current;
    if (!photo || !origin || reduced()) return;
    const from = origin.getBoundingClientRect();
    const to = photo.getBoundingClientRect();
    photo.animate([{ transform: flipTransform(from, to) }, { transform: "none" }], {
      duration: 460,
      easing: EASE,
    });
  }, [open, opened, originRef]);

  // 열린 동안 뒤 페이지를 잠근다 — iOS 사파리는 <dialog> 만으로는 뒤 페이지 스크롤을 못 막아서,
  // 팝업 위를 밀면 뒤 페이지가 따라 움직이며 화면이 깨져 보였다(2026-10-08 폰 제보)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /**
   * 닫기 — 사진을 카드 자리로 돌려보낸 뒤 실제로 닫는다.
   * 손잡이를 끌어내려 닫을 때(`slide`)는 판을 그 자리에서 **아래로 마저** 내린다 — 전에는 판이 위로 튀어 올라
   * 사진이 날아간 뒤 닫혀서 깨져 보였다.
   */
  function requestClose(mode: "flip" | "slide" = "flip") {
    if (closing.current) return;
    closing.current = true;
    const el = dialogRef.current;
    const photo = photoRef.current;
    const origin = originRef.current;
    if (mode === "slide" && el && !reduced()) {
      const from = el.style.transform || "none";
      const anim = el.animate([{ transform: from }, { transform: "translateY(110vh)" }], {
        duration: 240,
        easing: EASE,
        fill: "forwards",
      });
      anim.onfinish = () => {
        onClose();
        anim.cancel();
        el.style.transform = "";
      };
      return;
    }
    if (el) el.style.transform = "";
    if (!photo || !origin || reduced()) {
      onClose();
      return;
    }
    const from = origin.getBoundingClientRect();
    const to = photo.getBoundingClientRect();
    const anim = photo.animate([{ transform: "none" }, { transform: flipTransform(from, to) }], {
      duration: 300,
      easing: EASE,
      fill: "forwards",
    });
    anim.onfinish = () => {
      onClose();
      // 다음에 열릴 때 제자리에서 시작하도록 되돌린다
      anim.cancel();
    };
  }

  const photos = product.images;
  const photo = photos[Math.min(index, Math.max(0, photos.length - 1))] ?? null;
  const name = product.name ?? pendingLabel("제품명");
  const price = product.priceKrw !== null ? `${KRW.format(product.priceKrw)}원` : null;
  const listPrice =
    product.listPriceKrw !== null && product.priceKrw !== null && product.listPriceKrw > product.priceKrw
      ? `${KRW.format(product.listPriceKrw)}원`
      : null;
  const step = (d: number) => setIndex((i) => (i + d + photos.length) % photos.length);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`quick-${product.slug}-title`}
      // 배경(::backdrop)을 누르면 target 이 dialog 자신이다 — 안쪽을 누르면 자식이 target 이라 안 닫힌다
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      // Esc — 브라우저가 바로 닫지 않게 막고, 돌아가는 움직임을 거쳐 닫는다
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClose={onClose}
      // overflow-hidden · touch-none: 스크롤은 안쪽 정보 칸만 한다. 판 자체가 또 스크롤되면 손잡이 · 사진이 밀려 올라가며 깨진다
      // max-h 를 직접 준다 — 브라우저 기본값(100% − 2em − 6px)이 안쪽 상자보다 6px 작아 바닥이 잘렸다
      className="quick on-cream on-white bg-base text-primary m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-[1100px] touch-none overflow-hidden p-0 md:max-h-[min(88svh,820px)] md:w-[92vw]"
    >
      {opened && (
        <div className="flex max-h-[calc(100svh-2rem)] flex-col md:max-h-[min(88svh,820px)] md:grid md:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
          {/* 폰 손잡이 — 끌어내려 닫는다 */}
          <div
            className="flex shrink-0 cursor-grab touch-none justify-center pb-1.5 pt-2.5 md:hidden"
            onPointerDown={(e) => {
              drag.current = { y: e.clientY, t: performance.now(), dy: 0 };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              const el = dialogRef.current;
              if (!d || !el) return;
              d.dy = Math.max(0, e.clientY - d.y);
              el.style.transform = `translateY(${d.dy}px)`;
              el.style.transition = "none";
            }}
            onPointerUp={(e) => {
              const d = drag.current;
              const el = dialogRef.current;
              drag.current = null;
              if (!d || !el) return;
              e.currentTarget.releasePointerCapture(e.pointerId);
              const v = d.dy / Math.max(1, performance.now() - d.t); // px/ms
              el.style.transition = "";
              if (d.dy > 100 || v > 0.5) {
                requestClose("slide");
              } else {
                el.animate([{ transform: `translateY(${d.dy}px)` }, { transform: "none" }], { duration: 260, easing: EASE });
                el.style.transform = "";
              }
            }}
          >
            <span className="bg-strong block h-1 w-10 rounded-full" />
          </div>

          {/* ── 사진 — 카드 사진 자리에서 커져 나온다 ───────────── */}
          <div
            ref={photoRef}
            className="bg-velvet relative aspect-[4/5] max-h-[44svh] w-full shrink-0 origin-top-left overflow-hidden md:aspect-auto md:max-h-none md:min-h-[520px]"
            onTouchStart={(e) => {
              touchX.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              const x0 = touchX.current;
              const x1 = e.changedTouches[0]?.clientX;
              touchX.current = null;
              if (x0 === null || x1 === undefined || photos.length < 2) return;
              if (x1 - x0 > 40) step(-1);
              else if (x0 - x1 > 40) step(1);
            }}
          >
            {photo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={photo.url}
                src={photo.url}
                alt={photo.alt || `${name} 사진 ${index + 1}`}
                // 폰은 사진 칸을 44svh 로 눌러 세로가 모자라다 — 가운데를 보면 머리가 잘려서 위를 본다
                className="absolute inset-0 h-full w-full object-cover object-top md:object-center"
              />
            ) : (
              <span className="text-2xs tracking-label absolute inset-0 flex items-center justify-center text-[#F7F1EA]/60">
                촬영본 준비 중
              </span>
            )}

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="이전 사진"
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#F7F1EA]/40 bg-[#170A0E]/35 text-[#F7F1EA] md:left-4"
                >
                  <CaretLeft size={16} weight="light" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="다음 사진"
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#F7F1EA]/40 bg-[#170A0E]/35 text-[#F7F1EA] md:right-4"
                >
                  <CaretRight size={16} weight="light" aria-hidden="true" />
                </button>
                <ul className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5" aria-label="사진 고르기">
                  {photos.map((p, i) => (
                    <li key={p.url}>
                      <button
                        type="button"
                        onClick={() => setIndex(i)}
                        aria-label={`${i + 1}번째 사진`}
                        aria-current={i === index ? "true" : undefined}
                        className={`ease-fluid block h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                          i === index ? "w-6 bg-[#F7F1EA]" : "w-1.5 bg-[#F7F1EA]/45"
                        }`}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* ── 정보 — 살짝 늦게 들어온다 ───────────────────── */}
          {/* 정보 칸만 세로로 스크롤한다(touch-action: pan-y). 판(touch-none) 안에서 이 칸이 스크롤 컨테이너라 여기 값이 이긴다 */}
          <div
            className="quick-info relative flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain px-5 pb-8 pt-5 md:px-10 md:pb-10 md:pt-12"
            style={{ touchAction: "pan-y" }}
          >
            <button
              type="button"
              onClick={() => requestClose()}
              aria-label="닫기"
              className="border-subtle text-primary hover:border-accent hover:text-accent ease-fluid absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-300 md:right-5 md:top-5"
            >
              <X size={16} weight="light" aria-hidden="true" />
            </button>

            <Eyebrow>{CATEGORY_LABEL[product.category].en}</Eyebrow>
            <h2
              id={`quick-${product.slug}-title`}
              className="font-display text-primary leading-display tracking-display pr-10 text-2xl md:text-3xl"
            >
              {name}
            </h2>
            <Link
              href={`/products/${product.slug}/`}
              className="border-subtle text-secondary hover:border-accent hover:text-accent ease-fluid tracking-button inline-flex min-h-10 w-fit items-center gap-2 border px-4 text-xs transition-colors duration-300"
            >
              자세히 보기
              <ArrowRight size={12} weight="light" aria-hidden="true" />
            </Link>

            {product.summary && <p className="text-secondary text-sm leading-relaxed">{product.summary}</p>}

            <div className="flex items-baseline gap-3">
              <p className={`font-display text-2xl tabular-nums ${price ? "text-primary" : "text-muted"}`}>
                {price ?? pendingLabel("판매가")}
              </p>
              {listPrice && <p className="text-accent text-sm tabular-nums line-through">{listPrice}</p>}
            </div>

            <p className="text-secondary text-xs">
              {product.leadTimeDays != null ? (
                <>
                  주문 후 제작 · <b className="text-primary font-medium">약 {product.leadTimeDays}일</b> 뒤 출고
                </>
              ) : (
                <span className="text-muted">{pendingLabel("제작 기간")}</span>
              )}
            </p>

            <LineSummary line={product.line} />

            <hr className="border-subtle my-1" />

            <h3 className="text-primary text-sm font-medium">사이즈</h3>
            <SizeSelector skus={product.skus} value={selectedSize} onChange={setSelectedSize} />

            <div className="mt-2 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={!selectedSize || pending !== null}
                onClick={() => put("cart")}
                className="group bg-accent hover:bg-accent-hover text-on-accent tracking-button ease-fluid flex items-center justify-between gap-4 rounded-full py-4 pl-7 pr-2 text-[15px] transition-all duration-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="flex-1 text-center">{pending === "cart" ? "담는 중" : "장바구니 담기"}</span>
                <span className="bg-on-accent/12 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                  <ArrowUpRight size={11} weight="light" aria-hidden="true" />
                </span>
              </button>
              <button
                type="button"
                disabled={!selectedSize || pending !== null}
                onClick={() => put("buy")}
                className="border-strong hover:border-accent hover:text-accent text-primary tracking-button ease-fluid rounded-full border py-4 text-[15px] transition-all duration-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {pending === "buy" ? "주문서로 가는 중" : "바로 구매"}
              </button>
              {notice && (
                <p
                  role={notice.tone === "error" ? "alert" : "status"}
                  className={`text-2xs flex flex-wrap items-center gap-x-3 gap-y-1 leading-relaxed ${
                    notice.tone === "ok" ? "text-success" : "text-error"
                  }`}
                >
                  <span>{notice.text}</span>
                  {notice.tone === "ok" && (
                    <Link
                      href="/cart/"
                      className="text-accent inline-flex min-h-11 items-center underline underline-offset-4"
                    >
                      장바구니 보기
                    </Link>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

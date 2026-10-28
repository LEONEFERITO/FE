"use client";

import { ArrowUpRight, InstagramLogo } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";
import { pendingLabel } from "@/lib/pending";
import { PIECE_LABEL, SUIT_SETS, isSuitSet, offeredSets, suitDefaults, suitLabel, suitPrice, type SuitSet, type SuitSizes } from "@/lib/suit";

import { SizeSelector } from "@/components/product/SizeSelector";
import { usePurchase } from "@/components/product/usePurchase";
import { LINE_LABEL } from "@/types/product";
import type { Product } from "@/types/product";
import { SHIPPING } from "@/data/shipping";
import { leadTimeText } from "@/lib/leadTime";

/**
 * 구매 판 — 상세 맨 위 오른쪽 (2026-10-28 디자이너 시안으로 다시 짰다).
 *
 * 순서: 라인(레오네 · 페리토 구분) → 상품명 → 제품 설명 → 제작 기간 · 배송비 → 가격 → (선) → 작은 사진 다섯 칸 → 컬러 → 사이즈 → 버튼
 *
 * 수트 구성 상품(lib/suit, 서버 V43)은 사이즈 자리에 «구성»(3피스 · 2피스) → 조각마다 사이즈(자켓 · 베스트 · 팬츠)가 온다.
 * 가격 줄은 고른 구성의 값으로 바뀐다. 담을 때는 "3피스 · 자켓 L / 베스트 M / 팬츠 L" 한 줄이 사이즈로 간다.
 *
 * 2026-10-28 에 뺀 것: 분류 눈썹("— JACKET", 라인 표시로 바뀜), 한 줄 요약 · 라인 설명(제품 설명이 대신한다),
 * "상세 사이즈 보기" 링크(아래 상세 사이즈 구간 제목과 함께 걷음), 버튼 아래 배송 · 교환 안내 세 줄.
 *
 * PC 에서는 이 판이 왼쪽 큰 사진과 같은 높이라(ProductTop), 버튼 묶음을 맨 아래로 밀어(mt-auto) 사진 아랫단에 맞춘다.
 */

function formatKrw(value: number | null): string | null {
  if (value === null) return null;
  return new Intl.NumberFormat("ko-KR").format(value) + "원";
}

/**
 * 컬러 동그라미 — 상품의 색상 칸(고시 · 엑셀 "색상")을 "/" · "," · "·" 로 나눠 색마다 하나.
 * 이름을 아는 색만 칠하고, 모르는 색은 글자로 보여 준다(엉뚱한 색을 칠하는 것보다 낫다).
 */
const SWATCH: Record<string, string> = {
  블랙: "#111111", 검정: "#111111", black: "#111111",
  화이트: "#FFFFFF", 흰색: "#FFFFFF", white: "#FFFFFF",
  아이보리: "#F3EEDF", ivory: "#F3EEDF", 크림: "#EFE6D2", cream: "#EFE6D2",
  네이비: "#1E2A44", navy: "#1E2A44",
  그레이: "#8A8A8A", 회색: "#8A8A8A", grey: "#8A8A8A", gray: "#8A8A8A", 라이트그레이: "#C9C9C9",
  차콜: "#3A3D42", charcoal: "#3A3D42",
  베이지: "#D7C6A5", beige: "#D7C6A5",
  브라운: "#5B3A29", 갈색: "#5B3A29", brown: "#5B3A29", 카멜: "#B07A47", camel: "#B07A47",
  카키: "#6B6A47", khaki: "#6B6A47", 올리브: "#5E6236", olive: "#5E6236", 그린: "#3F5E45", green: "#3F5E45",
  블루: "#2F5D9E", blue: "#2F5D9E", 스카이블루: "#9CC3E6", skyblue: "#9CC3E6",
  버건디: "#5E1F21", 와인: "#5E1F21", burgundy: "#5E1F21", wine: "#5E1F21",
};

function colorsOf(text: string | null | undefined): { name: string; hex: string | null }[] {
  if (!text?.trim()) return [];
  return text
    .split(/[/,·]/)
    .map((c) => c.trim())
    .filter(Boolean)
    .map((name) => ({ name, hex: SWATCH[name.replace(/\s/g, "").toLowerCase()] ?? SWATCH[name.replace(/\s/g, "")] ?? null }));
}

export function PurchasePanel({
  product,
  photoIndex = 0,
  onPhoto,
}: {
  product: Product;
  /** 큰 사진에 보이는 사진 번호 — ProductTop 이 들고 있다 */
  photoIndex?: number;
  onPhoto?: (i: number) => void;
}) {
  // 담기 · 바로 구매 · 사이즈 선택 (usePurchase)
  const { selectedSize, setSelectedSize, pending, notice, put } = usePurchase(product);

  // 수트 구성 — 고른 구성 · 조각별 사이즈. 바뀔 때마다 담을 한 줄(selectedSize)을 다시 만든다
  const suit = isSuitSet(product);
  const sets = suit ? offeredSets(product) : [];
  const [choice, setChoice] = useState<{ set: SuitSet | null; sizes: SuitSizes }>(() => suitDefaults(product));
  function choose(next: { set: SuitSet | null; sizes: SuitSizes }) {
    setChoice(next);
    setSelectedSize(next.set ? suitLabel(next.set, next.sizes) : null);
  }

  const unitPrice = suit ? (choice.set ? suitPrice(product, choice.set) : null) : product.priceKrw;
  const price = formatKrw(unitPrice);
  // 정가(취소선)는 판매가(= 3피스) 기준이라 2피스에는 그리지 않는다
  const listPrice = !suit || choice.set === "THREE" ? formatKrw(product.listPriceKrw) : null;
  const line = LINE_LABEL[product.line];
  const about = product.description?.trim() || product.summary?.trim() || null;
  const colors = colorsOf(product.notice?.color);
  // 배송비 — 서버 배송 정책과 같은 기준(data/shipping). 기준 금액 이상이면 무료
  const freeShipping = unitPrice !== null && unitPrice >= SHIPPING.freeThresholdKrw;

  return (
    <div className="flex h-full min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-3">
        {/* 라인 — 레오네 · 페리토 구분(2026-10-28 "가로 작대기 빼고 라인 구분 용도로") */}
        <p className="text-accent text-2xs tracking-label">
          {line.en} · {line.ko} ({line.kind})
        </p>

        <h1 className="font-display text-primary text-3xl leading-display tracking-display md:text-4xl">
          {product.name ?? pendingLabel("제품명")}
        </h1>

        {about && (
          <div className="text-secondary flex flex-col gap-2 text-sm leading-relaxed">
            {about.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para.trim()}
              </p>
            ))}
          </div>
        )}

        {/*
          제작 기간 — 주문 후 만드는 옷이라 결제 전에 반드시 보여야 한다(전자상거래법, 약관 제14조).
          가격 바로 위에 둔다. 사이즈를 다 고른 뒤에야 "3주 걸립니다" 를 보면 배신감이 든다.
        */}
        <div className="flex flex-col gap-0.5 text-xs">
          <p className="text-muted">
            {product.leadTimeDays != null ? (
              <>
                주문 후 제작 · <b className="text-primary font-medium">{leadTimeText(product.leadTimeDays, product.leadTimeMinDays)} 뒤 출고</b>
              </>
            ) : (
              pendingLabel("제작 기간")
            )}
          </p>
          {unitPrice !== null && (
            <p className="text-muted">{freeShipping ? "무료배송" : `배송비 ${new Intl.NumberFormat("ko-KR").format(SHIPPING.feeKrw)}원`}</p>
          )}
        </div>

        <div className="flex items-baseline gap-3">
          <p className={`font-display text-2xl tabular-nums ${price ? "text-primary" : "text-muted"}`}>
            {price ?? pendingLabel("판매가")}
          </p>
          {listPrice && <p className="text-accent text-(length:--fs-base) tabular-nums line-through">{listPrice}</p>}
        </div>
      </div>

      <hr className="border-subtle" />

      {/* 작은 사진 — 다섯 칸, 모두 같은 크기 네모(2026-10-28 "사이즈 다 똑같게"). 누르면 왼쪽 큰 사진이 바뀐다 */}
      {product.images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2" aria-label="사진 고르기">
          {product.images.slice(0, 5).map((p, i) => (
            // 같은 사진을 두 칸에 올려도 겹치지 않게 순서를 키에 넣는다
            <li key={`${i}-${p.url}`}>
              <button
                type="button"
                onClick={() => onPhoto?.(i)}
                aria-label={`${i + 1}번째 사진 보기`}
                aria-current={i === photoIndex ? "true" : undefined}
                className={`ease-fluid block aspect-[4/5] w-full overflow-hidden border transition-colors duration-300 ${
                  i === photoIndex ? "border-accent" : "hover:border-accent/50 border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {colors.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h2 className="text-primary text-sm font-medium">컬러</h2>
          <ul className="flex flex-wrap items-center gap-3">
            {colors.map((c) =>
              c.hex ? (
                <li key={c.name} title={c.name} className="flex items-center">
                  <span
                    aria-hidden="true"
                    className="ring-strong block h-6 w-6 rounded-full ring-1 ring-offset-2"
                    style={{ background: c.hex }}
                  />
                  <span className="sr-only">{c.name}</span>
                </li>
              ) : (
                <li key={c.name} className="text-primary text-sm">
                  {c.name}
                </li>
              ),
            )}
          </ul>
        </div>
      )}

      {suit ? (
        <>
          {/* 구성 — 3피스(자켓 + 베스트 + 팬츠) · 2피스(자켓 + 팬츠). 파는 구성만 나온다 */}
          <div className="flex flex-col gap-2.5">
            <h2 className="text-primary text-sm font-medium">구성</h2>
            {sets.length === 0 ? (
              <p className="text-muted text-xs">지금 주문할 수 있는 구성이 없습니다.</p>
            ) : (
              <div role="radiogroup" aria-label="구성" className="grid grid-cols-2 gap-2">
                {sets.map((set) => {
                  const on = choice.set === set;
                  return (
                    <button
                      key={set}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => choose({ ...choice, set })}
                      className={`ease-fluid flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full border px-3 transition-all duration-500 ${
                        on
                          ? "border-accent bg-accent-tint text-accent"
                          : "border-strong text-primary hover:border-accent hover:bg-accent-tint/50 active:scale-[0.97]"
                      }`}
                    >
                      <span className="text-[14px] font-medium tabular-nums">
                        {SUIT_SETS[set].label} · {formatKrw(suitPrice(product, set))}
                      </span>
                      <span className="text-[11px] leading-none opacity-80">{SUIT_SETS[set].detail}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/*
            조각마다 사이즈 — 고른 구성에 든 조각만. 조각 이름을 왼쪽에 두고 한 줄(다섯 칸)로 —
            세 조각을 위아래로 크게 쌓으면 버튼이 왼쪽 큰 사진 아래로 한참 내려간다.
          */}
          {choice.set && (
            <div className="flex flex-col gap-2.5">
              <h2 className="text-primary text-sm font-medium">사이즈</h2>
              <div className="flex flex-col gap-2">
                {SUIT_SETS[choice.set].pieces.map((pc) => (
                  <div key={pc} className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-2">
                    <span className="text-secondary flex min-h-11 items-center text-xs">{PIECE_LABEL[pc]}</span>
                    <SizeSelector
                      name={PIECE_LABEL[pc]}
                      columns={5}
                      skus={product.skus.filter((k) => k.piece === pc)}
                      value={choice.sizes[pc] ?? null}
                      onChange={(size) => choose({ ...choice, sizes: { ...choice.sizes, [pc]: size } })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2.5">
          <h2 className="text-primary text-sm font-medium">사이즈</h2>
          <SizeSelector skus={product.skus} value={selectedSize} onChange={setSelectedSize} />
        </div>
      )}

      {product.instagramUrl && (
        // 바깥 사이트로 나가므로 새 창이다. 그 사실을 글로도 알린다. noopener: 열린 창이 이 페이지를 조작하지 못하게
        <a
          href={product.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-interactive text-secondary hover:border-accent hover:text-primary ease-fluid group inline-flex min-h-11 w-fit items-center gap-2 rounded-full border px-5 text-xs transition-colors duration-300"
        >
          <InstagramLogo size={15} weight="light" aria-hidden="true" />
          인스타그램에서 보기
          <ArrowUpRight size={11} weight="light" aria-hidden="true" />
          <span className="sr-only">(새 창)</span>
        </a>
      )}

      {/*
        버튼 — PC 에서는 맨 아래로 밀어(mt-auto) 왼쪽 큰 사진의 아랫단에 맞춘다(2026-10-28 디자이너).
        data-quick-avoid — 모바일에서 이 버튼들이 오른쪽 아래에 오면 퀵메뉴가 잠시 비킨다 (QuickMenu)
      */}
      <div data-quick-avoid="" className="mt-2 flex flex-col gap-2.5 lg:mt-auto">
        <button
          type="button"
          disabled={!selectedSize || pending !== null}
          onClick={() => put("cart")}
          className="group bg-accent hover:bg-accent-hover text-on-accent shadow-button hover:shadow-button-hover tracking-button ease-fluid flex items-center justify-between gap-4 rounded-full py-4 pl-7 pr-2 text-[15px] transition-all duration-500 hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0"
        >
          <span className="flex-1 text-center">{pending === "cart" ? "담는 중" : "장바구니 담기"}</span>
          <span className="bg-on-accent/12 ease-fluid flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-500 group-hover:-translate-y-px group-hover:translate-x-1 group-hover:scale-105">
            <ArrowUpRight size={11} weight="light" aria-hidden="true" />
          </span>
        </button>

        <button
          type="button"
          disabled={!selectedSize || pending !== null}
          onClick={() => put("buy")}
          className="border-strong hover:border-accent hover:text-accent hover:shadow-soft text-primary tracking-button ease-fluid rounded-full border py-4 text-[15px] transition-all duration-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
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
              <Link href="/cart/" className="text-accent inline-flex min-h-11 items-center underline underline-offset-4">
                장바구니 보기
              </Link>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

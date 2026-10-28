"use client";

import { ArrowRight, CaretDown } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";

import { ProductCard } from "@/components/product/ProductCard";
import { matchesSub, type CategorySub } from "@/data/categories";
import { LINE_LABEL, type Product, type ProductLine } from "@/types/product";

/**
 * 분류 페이지의 상품 — 2026-10-28 디자이너 시안으로 다시 짰다.
 *
 * ── 구성 ───────────────────────────────────────────────
 *   위 : 가운데 LEONE | FERITO 알약 두 개(고른 쪽 와인 · 안 고른 쪽 회색), 오른쪽 정렬(신상품 · 상품명 · 낮은가격 · 높은가격).
 *        그 아래 옅은 회색으로 깜빡이는 안내 "라인을 클릭하여 …" — 한 번 누르면 깜빡임을 멈춘다.
 *   처음 : 레오네 한 줄(PC 5개) → 페리토 한 줄. 줄마다 라인 이름과 «전체 보기».
 *   라인을 고르면 : 그 라인 전부 → 아래에 다른 라인 한 줄. 고른 알약을 다시 누르면 처음으로.
 *
 * 예전 도구 줄(칸 수 토글 · 위아래 선)과 왼쪽 거르기(개수 · 라인 · 사이즈 · 재고)는 디자이너 요청으로 걷었다.
 * 세부 분류(?sub=, 헤더 드롭다운이 거는 공유 주소)는 그대로 듣는다 — 고른 세부 분류는 안내 아래에 작게 보인다.
 *
 * 정적 내보내기라 쿼리는 브라우저에서만 읽힌다. 그래서 페이지는 CategoryProductsFromUrl 을 Suspense 로 감싸고,
 * 빌드 HTML(= 대체 화면)에는 분류 전체를 그린다 — 검색엔진과 JS 없는 환경에는 전체 목록이 보인다.
 *
 * 카드는 목록 · 메인과 **같은 카드**다(ProductCard).
 */

const LINES: ProductLine[] = ["LEONE", "FERITO"];

type Sort = "new" | "name" | "price-asc" | "price-desc";

const SORTS: { value: Sort; label: string }[] = [
  { value: "new", label: "신상품" },
  { value: "name", label: "상품명" },
  { value: "price-asc", label: "낮은가격" },
  { value: "price-desc", label: "높은가격" },
];

function sortProducts(products: Product[], sort: Sort): Product[] {
  // "신상품" 은 서버가 준 순서 그대로다(관리자가 정한 진열 순서).
  if (sort === "new") return products;
  const list = [...products];
  if (sort === "name") {
    // 이름이 아직 없는 상품은 뒤로. 이름끼리는 한글 사전순.
    list.sort((a, b) => {
      if (a.name === null || b.name === null) return a.name === b.name ? 0 : a.name === null ? 1 : -1;
      return a.name.localeCompare(b.name, "ko");
    });
  } else {
    // 가격 문의(= null) 상품은 어느 방향이든 뒤로 — "낮은가격" 맨 앞에 가격 없는 상품이 오면 틀린 답이다.
    const dir = sort === "price-asc" ? 1 : -1;
    list.sort((a, b) => {
      if (a.priceKrw === null || b.priceKrw === null) return a.priceKrw === b.priceKrw ? 0 : a.priceKrw === null ? 1 : -1;
      return (a.priceKrw - b.priceKrw) * dir;
    });
  }
  return list;
}

// PC 5칸 · 태블릿 3칸 · 폰 2칸
const GRID = "grid grid-cols-2 gap-x-1 gap-y-7 md:grid-cols-3 md:gap-x-3 md:gap-y-10 lg:grid-cols-5";
// 한 줄만 보일 때 — 칸 수에 맞춰 넘치는 카드를 숨긴다(폰 2×2 = 4개, 태블릿 3개, PC 5개)
const PREVIEW = 5;
const previewHide = (i: number) => (i === 4 ? "max-lg:hidden" : i === 3 ? "md:max-lg:hidden" : "");

export function CategoryProductsFromUrl(props: { products: Product[]; categorySlug: string; subs: CategorySub[] }) {
  const sub = useSearchParams().get("sub");
  return <CategoryProducts {...props} activeSub={props.subs.some((s) => s.slug === sub) ? sub : null} />;
}

export function CategoryProducts({
  products,
  categorySlug,
  subs = [],
  activeSub = null,
}: {
  products: Product[];
  categorySlug?: string;
  subs?: CategorySub[];
  activeSub?: string | null;
}) {
  const [line, setLine] = useState<ProductLine | null>(null);
  const [touched, setTouched] = useState(false);
  const [sort, setSort] = useState<Sort>("new");
  const sortId = useId();
  const hintId = useId();

  const sub = subs.find((s) => s.slug === activeSub) ?? null;
  const byLine = useMemo(() => {
    const list = sortProducts(sub ? products.filter((p) => matchesSub(p, sub)) : products, sort);
    return Object.fromEntries(LINES.map((l) => [l, list.filter((p) => p.line === l)])) as Record<ProductLine, Product[]>;
  }, [products, sub, sort]);

  // 고른 라인이 먼저, 나머지는 아래(한 줄)
  const order: ProductLine[] = line ? [line, ...LINES.filter((l) => l !== line)] : LINES;
  const total = byLine.LEONE.length + byLine.FERITO.length;

  function pick(l: ProductLine) {
    setTouched(true);
    setLine((cur) => (cur === l ? null : l));
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 md:px-10">
      {/*
        ── 위: 라인 알약(가운데) + 정렬(오른쪽), 그 아래 안내 ─────────────
        PC 는 한 줄(빈 칸 | 알약 | 정렬) 아래에 안내. 폰은 알약 → 안내 → 정렬(오른쪽) — 안내가 알약 바로 밑에 붙게 정렬을 맨 뒤로 보낸다.
      */}
      <div className="grid grid-cols-1 items-center md:grid-cols-[1fr_auto_1fr] md:gap-x-4">
        <div aria-hidden="true" className="hidden md:col-start-1 md:row-start-1 md:block" />
        <div role="group" aria-label="라인 고르기" aria-describedby={hintId} className="flex justify-center gap-2.5 md:col-start-2 md:row-start-1">
          {LINES.map((l) => {
            const on = line === l;
            return (
              <button
                key={l}
                type="button"
                aria-pressed={on}
                onClick={() => pick(l)}
                className={`font-display ease-fluid inline-flex min-h-11 min-w-[128px] items-center justify-center rounded-full px-7 text-sm tracking-[0.12em] transition-colors duration-300 md:min-w-[140px] ${
                  on ? "bg-[#5E1F21] text-[#F7F1EA]" : "bg-[#E6E6E6] text-[#8A8A8A] hover:bg-[#DADADA] hover:text-[#555555]"
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
        <span className="relative order-last mt-2 inline-flex min-h-11 items-center justify-self-end md:order-none md:col-start-3 md:row-start-1 md:mt-0">
          <label htmlFor={sortId} className="sr-only">
            정렬
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="text-primary h-11 cursor-pointer appearance-none bg-transparent pl-3 pr-8 text-xs"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <CaretDown size={12} weight="light" aria-hidden="true" className="pointer-events-none absolute right-2" />
        </span>
        {/* 안내 — 옅은 회색, 천천히 깜빡인다. 한 번 고르면 멈춘다(동작 줄이기면 처음부터 멈춤) */}
        <p id={hintId} className={`mt-3 text-center text-xs text-[#ABABAB] md:col-span-3 md:row-start-2 ${touched ? "" : "category-hint-blink"}`}>
          라인을 클릭하여 원하는 스타일을 분류해 확인해 보세요
        </p>
      </div>
      {sub && categorySlug && (
        <p className="text-secondary mt-2 text-center text-2xs">
          {sub.label}
          <span aria-hidden="true" className="text-muted">
            {" "}
            ·{" "}
          </span>
          <Link href={`/category/${categorySlug}/`} className="text-accent underline underline-offset-4">
            전체 보기
          </Link>
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {line ? `${LINE_LABEL[line].ko} ${byLine[line].length}개` : `${total}개의 상품`}
      </p>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-5 py-24 text-center">
          <p className="text-primary text-sm">{sub ? `${sub.label} 제품을 준비하고 있습니다` : "제품을 준비하고 있습니다"}</p>
          <Link
            href="/products/"
            className="border-interactive text-accent hover:border-accent hover:bg-accent-tint ease-fluid tracking-button inline-flex min-h-11 items-center rounded-full border px-6 text-xs transition-all duration-500"
          >
            전체 제품 보기
          </Link>
        </div>
      ) : (
        order.map((l) => {
          const all = byLine[l];
          const full = line === l;
          const shown = full ? all : all.slice(0, PREVIEW);
          const label = LINE_LABEL[l];
          return (
            <section key={l} aria-label={`${label.en} ${label.kind} 라인`} className="mt-10 md:mt-14">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="flex items-baseline gap-2.5">
                  <span className="font-display text-primary text-lg tracking-[0.12em] md:text-xl">{label.en}</span>
                  <span className="text-muted text-2xs">{label.kind} 라인</span>
                </h2>
                {!full && all.length > 0 && (
                  <button
                    type="button"
                    onClick={() => pick(l)}
                    className="text-secondary hover:text-primary ease-fluid group inline-flex min-h-11 items-center gap-1.5 text-xs transition-colors duration-300"
                  >
                    전체 보기 <span className="tabular-nums">({all.length})</span>
                    <ArrowRight size={12} weight="light" aria-hidden="true" className="ease-fluid transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                )}
              </div>
              {all.length > 0 ? (
                <ul className={`-mx-5 mt-4 md:mx-0 md:mt-5 ${GRID}`}>
                  {shown.map((p, i) => (
                    <li key={p.slug} className={`min-w-0 ${full ? "" : previewHide(i)}`}>
                      <ProductCard product={p} inset />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted mt-4 text-xs">이 라인의 제품을 준비하고 있습니다.</p>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

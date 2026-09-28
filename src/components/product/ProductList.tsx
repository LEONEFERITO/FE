"use client";

import { useMemo, useState } from "react";

import { ProductCard } from "@/components/product/ProductCard";
import { FIT_LABEL, type FitType, type Product } from "@/types/product";

/**
 * 필터 + 격자.
 *
 * ── 왜 가격 필터가 없는가 ──────────────────────────────
 * PAGES.md 에는 "카테고리·사이즈·핏·가격" 으로 적혀 있지만, 지금 모든 상품의 가격이
 * 미확정(null)이라 가격 슬라이더를 붙이면 **아무것도 걸러지지 않는 조작 장치**가 된다.
 * 동작하지 않는 컨트롤은 없는 것보다 나쁘다. 가격이 확정되면(B-2) 그때 넣는다.
 *
 * ── 왜 URL 이 아니라 컴포넌트 상태인가 ─────────────────
 * 지금은 공유·뒤로가기보다 반응 속도가 중요하고 상품 수가 적다.
 * "필터 걸린 목록을 링크로 보내는" 요구가 생기면 searchParams 로 올린다.
 *
 * ── 접근성 ────────────────────────────────────────────
 * 필터는 버튼이지만 aria-pressed 로 눌림 상태를 알린다.
 * 결과 수는 aria-live 로 알린다 — 격자가 바뀌는 건 눈으로만 보이기 때문이다.
 *
 * 모바일에서 min-h-[44px] 을 주는 이유: 글자 크기(2xs)에 맞춰 패딩만 주면 높이가
 * 30px 언저리가 된다. 손가락 접촉면은 그보다 넓어서 옆 칩을 같이 누르게 된다.
 * 데스크톱은 포인터가 정확하므로 원래 크기로 되돌린다.
 */

const FITS: FitType[] = ["ATHLETIC", "REGULAR"];

interface Chip {
  value: string | null;
  label: string;
}

function ChipRow({
  legend,
  options,
  selected,
  onSelect,
}: {
  legend: string;
  options: Chip[];
  selected: string | null;
  onSelect: (v: string | null) => void;
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="text-muted text-2xs tracking-label mb-2 w-full">
        {legend}
      </legend>
      {options.map((o) => {
        const active = selected === o.value;
        return (
          <button
            key={o.label}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(o.value)}
            className={`ease-fluid text-2xs inline-flex min-h-[44px] items-center rounded-full border px-4 transition-all duration-300 md:min-h-0 md:py-2 ${
              active
                ? "border-velvet bg-velvet-tint text-velvet-deep shadow-soft"
                : "border-subtle text-secondary hover:border-velvet"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </fieldset>
  );
}

export function ProductList({
  products,
  categories,
  sizes,
}: {
  products: Product[];
  categories: string[];
  sizes: string[];
}) {
  const [fit, setFit] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  const reset = () => {
    setFit(null);
    setCategory(null);
    setSize(null);
    setInStockOnly(false);
  };

  const visible = useMemo(
    () =>
      products.filter((p) => {
        if (fit && p.fitType !== fit) return false;
        if (category && p.category !== category) return false;

        if (size) {
          /*
            사이즈 필터는 "그 사이즈가 있는가" 이지 "지금 재고가 있는가" 가 아니다.
            둘을 한 컨트롤에 섞으면 품절인 순간 상품이 사라져서
            "내 사이즈는 원래 안 만드는 브랜드" 로 오해된다. 재고는 별도 스위치다.
          */
          const sku = p.skus.find((s) => s.size === size);
          if (!sku) return false;
          if (inStockOnly && sku.stock === 0) return false;
        } else if (inStockOnly && p.skus.every((s) => s.stock === 0)) {
          return false;
        }

        return true;
      }),
    [products, fit, category, size, inStockOnly],
  );

  const dirty =
    fit !== null || category !== null || size !== null || inStockOnly;

  return (
    <>
      <div className="border-subtle mt-12 flex flex-col gap-7 border-y py-8">
        <ChipRow
          legend="핏"
          selected={fit}
          onSelect={setFit}
          options={[
            { value: null, label: "전체" },
            ...FITS.map((f) => ({ value: f, label: FIT_LABEL[f].ko })),
          ]}
        />
        <ChipRow
          legend="카테고리"
          selected={category}
          onSelect={setCategory}
          options={[
            { value: null, label: "전체" },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
        />
        <ChipRow
          legend="사이즈"
          selected={size}
          onSelect={setSize}
          options={[
            { value: null, label: "전체" },
            ...sizes.map((s) => ({ value: s, label: s })),
          ]}
        />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="text-secondary text-2xs flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="accent-accent h-4 w-4"
            />
            재고 있는 것만
          </label>

          {dirty && (
            <button
              type="button"
              onClick={reset}
              className="text-muted hover:text-accent ease-fluid text-2xs underline underline-offset-4 transition-colors duration-300"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>

      <p aria-live="polite" className="text-muted text-2xs mt-6 tabular-nums">
        {visible.length}개
      </p>

      {visible.length > 0 ? (
        <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      ) : (
        /*
          빈 상태를 "결과 없음" 한 줄로 끝내지 않는다.
          어떤 조건 때문에 비었는지 알려주고, 빠져나갈 길을 같은 자리에 둔다.
        */
        <div className="border-subtle bg-band/50 mt-10 rounded-2xl border p-12 text-center">
          <p className="text-primary text-sm">조건에 맞는 제품이 없습니다</p>
          <p className="text-muted text-2xs mt-2">
            {[
              fit && FIT_LABEL[fit as FitType].ko,
              category,
              size && `${size} 사이즈`,
              inStockOnly && "재고 있는 것만",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <button
            type="button"
            onClick={reset}
            className="text-accent hover:text-velvet ease-fluid text-2xs mt-5 underline underline-offset-4 transition-colors duration-300"
          >
            필터 초기화
          </button>
        </div>
      )}
    </>
  );
}

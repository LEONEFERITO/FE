"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import { FilterSheet } from "@/components/product/FilterSheet";
import { ProductCard } from "@/components/product/ProductCard";
import {
  CATEGORY_LABEL,
  Category,
  LINE_LABEL,
  type Product,
  type ProductLine,
} from "@/types/product";

/**
 * 필터 + 격자.
 *
 * ── 왜 가격 필터가 없는가 ──────────────────────────────
 * PAGES.md 에는 "카테고리·사이즈·핏·가격" 으로 적혀 있지만, 지금 모든 상품의 가격이
 * 미확정(null)이라 가격 슬라이더를 붙이면 **아무것도 걸러지지 않는 조작 장치**가 된다.
 * 동작하지 않는 컨트롤은 없는 것보다 나쁘다. 가격이 확정되면(B-2) 그때 넣는다.
 *
 * ── URL 과 컴포넌트 상태 ───────────────────────────────
 * 상태는 여전히 컴포넌트가 들고 있다. 다만 메인의 카테고리 격자가
 * `/products?category=JACKET` 로 들어오기 시작해서, **들어올 때 한 번만** URL 을 읽는다.
 * (그게 앞 주석에서 미뤄뒀던 "필터 걸린 목록을 링크로 보내는" 요구다)
 *
 * 읽는 방법이 useSearchParams 도 effect 도 아닌 이유:
 *   - useSearchParams: 정적 내보내기에서 이 페이지를 Suspense 경계로 묶으라고 요구한다.
 *   - effect + setState: 첫 렌더 뒤에 한 번 더 렌더가 돈다(연쇄 렌더).
 * URL 은 React 밖에 있는 값이고, 그걸 **렌더 중에 안전하게 읽는** API 가
 * useSyncExternalStore 다. 서버 스냅샷은 null 이라 정적 HTML 은 전체 목록으로 나가고,
 * 하이드레이션 때 React 가 스스로 맞춘다 — 불일치 경고가 나지 않는다.
 *
 * 쓰기는 하지 않는다. 필터를 조작해도 URL 은 그대로다. 양방향으로 묶으면
 * 뒤로가기 한 번에 필터가 한 단계씩 풀려서, 목록을 빠져나가는 데 여러 번 눌러야 한다.
 *
 * ── 접근성 ────────────────────────────────────────────
 * 필터는 버튼이지만 aria-pressed 로 눌림 상태를 알린다.
 * 결과 수는 aria-live 로 알린다 — 격자가 바뀌는 건 눈으로만 보이기 때문이다.
 *
 * 모바일에서 min-h-[44px] 을 주는 이유: 글자 크기(2xs)에 맞춰 패딩만 주면 높이가
 * 30px 언저리가 된다. 손가락 접촉면은 그보다 넓어서 옆 칩을 같이 누르게 된다.
 * 데스크톱은 포인터가 정확하므로 원래 크기로 되돌린다.
 */

const LINES: ProductLine[] = ["LEONE", "FERITO"];

/** 거르기 조건 한 벌. 적용값과 초안이 같은 모양이라 규칙을 한 번만 쓴다. */
interface Filters {
  fit: string | null;
  category: string | null;
  size: string | null;
  inStockOnly: boolean;
}

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
                ? "border-accent bg-accent-tint text-accent shadow-soft"
                : "border-subtle text-secondary hover:border-accent"
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
  categories: Category[];
  sizes: string[];
}) {
  const [fit, setFit] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  // 메인의 카테고리 격자가 /products?category=JACKET 로 들어온다.
  const fromUrl = useSyncExternalStore(
    () => () => {}, // 페이지가 사는 동안 바뀌지 않는다 — 구독할 게 없다
    () => new URLSearchParams(window.location.search).get("category"),
    () => null, // 서버(정적 HTML) 스냅샷
  );

  /*
    카탈로그에 실제로 있는 값만 받는다. 모르는 값이 오면 빈 목록이 되는데,
    그건 "그런 카테고리가 없다" 가 아니라 "고장났다" 로 보인다.
  */
  const initialCategory =
    fromUrl && categories.includes(fromUrl as Category) ? fromUrl : null;

  // undefined = 아직 손대지 않음(= URL 을 따른다). null = 사용자가 '전체' 를 골랐다.
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const category = picked === undefined ? initialCategory : picked;
  const setCategory = setPicked;

  const reset = () => {
    setFit(null);
    setCategory(null); // undefined 가 아니라 null — URL 로 되돌아가면 안 된다
    setSize(null);
    setInStockOnly(false);
  };

  /*
   * 시트용 초안. 시트가 목록을 덮고 있어 고르는 즉시 적용해도 결과가 안 보인다.
   * 그래서 시트 안에서는 이 값만 바꾸고, "보기" 를 눌러야 위의 실제 필터로 옮긴다.
   */
  const [draft, setDraft] = useState<Filters>({
    fit: null, category: null, size: null, inStockOnly: false,
  });

  const openSheet = () =>
    setDraft({ fit, category, size, inStockOnly });

  const applyDraft = () => {
    setFit(draft.fit);
    setCategory(draft.category);
    setSize(draft.size);
    setInStockOnly(draft.inStockOnly);
  };

  const resetDraft = () =>
    setDraft({ fit: null, category: null, size: null, inStockOnly: false });

  /** 지금 걸린 필터 개수. 여는 버튼의 배지에 쓴다. */
  const activeCount =
    (fit ? 1 : 0) + (category ? 1 : 0) + (size ? 1 : 0) + (inStockOnly ? 1 : 0);

  /*
   * 거르는 규칙을 함수로 뺀다. 화면에 보이는 목록과 시트 버튼의 "N개 보기" 가
   * **같은 규칙**을 써야 한다. 두 벌로 두면 한쪽만 고쳐지는 날이 온다.
   */
  const applyFilters = useCallback(
    (f: Filters) =>
      products.filter((p) => {
        if (f.fit && p.line !== f.fit) return false;
        if (f.category && p.category !== f.category) return false;

        if (f.size) {
          /*
            사이즈 필터는 "그 사이즈가 있는가" 이지 "지금 재고가 있는가" 가 아니다.
            둘을 한 컨트롤에 섞으면 품절인 순간 상품이 사라져서
            "내 사이즈는 원래 안 만드는 브랜드" 로 오해된다. 재고는 별도 스위치다.
          */
          const sku = p.skus.find((s) => s.size === f.size);
          if (!sku) return false;
          if (f.inStockOnly && sku.stock === 0) return false;
        } else if (f.inStockOnly && p.skus.every((s) => s.stock === 0)) {
          return false;
        }

        return true;
      }),
    [products],
  );

  const visible = useMemo(
    () => applyFilters({ fit, category, size, inStockOnly }),
    [applyFilters, fit, category, size, inStockOnly],
  );

  /** 초안대로 걸렀을 때 몇 개가 남는가. 시트 버튼에 실시간으로 띄운다. */
  const draftResultCount = useMemo(
    () => applyFilters(draft).length,
    [applyFilters, draft],
  );

  const dirty =
    fit !== null || category !== null || size !== null || inStockOnly;

  return (
    <>
      {/*
        모바일: 거르기 버튼 하나. 라인·카테고리·사이즈·재고를 세로로 쌓으면
        첫 상품이 보이기 전에 400px 넘게 필터가 차지한다.
        데스크톱: 폭이 남으니 그대로 펼쳐 둔다 — 한 번에 보이는 게 낫다.
      */}
      <div className="border-subtle mt-12 flex items-center justify-between gap-4 border-y py-5 md:hidden">
        <FilterSheet
          activeCount={activeCount}
          draftResultCount={draftResultCount}
          onOpen={openSheet}
          onApply={applyDraft}
          onCancel={() => {}}
          onReset={resetDraft}
        >
          <div className="flex flex-col gap-6 pt-2">
            <ChipRow
              legend="라인"
              selected={draft.fit}
              onSelect={(v) => setDraft((d) => ({ ...d, fit: v }))}
              options={[
                { value: null, label: "전체" },
                ...LINES.map((l) => ({ value: l, label: LINE_LABEL[l].ko })),
              ]}
            />
            <ChipRow
              legend="카테고리"
              selected={draft.category}
              onSelect={(v) => setDraft((d) => ({ ...d, category: v }))}
              options={[
                { value: null, label: "전체" },
                ...categories.map((c) => ({
                  value: c,
                  label: CATEGORY_LABEL[c].ko,
                })),
              ]}
            />
            <ChipRow
              legend="사이즈"
              selected={draft.size}
              onSelect={(v) => setDraft((d) => ({ ...d, size: v }))}
              options={[
                { value: null, label: "전체" },
                ...sizes.map((s) => ({ value: s, label: s })),
              ]}
            />
            <label className="text-secondary text-2xs flex min-h-11 cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={draft.inStockOnly}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, inStockOnly: e.target.checked }))
                }
                className="accent-accent h-4 w-4"
              />
              재고 있는 것만
            </label>
          </div>
        </FilterSheet>

        <p aria-live="polite" className="text-muted text-2xs tabular-nums">
          {visible.length}개
        </p>
      </div>

      {/* 데스크톱: 펼쳐진 필터 */}
      <div className="border-subtle mt-12 hidden flex-col gap-7 border-y py-8 md:flex">
        <ChipRow
          legend="라인"
          selected={fit}
          onSelect={setFit}
          options={[
            { value: null, label: "전체" },
            ...LINES.map((l) => ({ value: l, label: LINE_LABEL[l].ko })),
          ]}
        />
        <ChipRow
          legend="카테고리"
          selected={category}
          onSelect={setCategory}
          options={[
            { value: null, label: "전체" },
            ...categories.map((c) => ({
              value: c,
              label: CATEGORY_LABEL[c].ko,
            })),
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
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-secondary text-2xs flex cursor-pointer items-center gap-2.5">
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
              className="text-muted hover:text-accent ease-fluid inline-flex min-h-11 items-center text-2xs underline underline-offset-4 transition-colors duration-300"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* 개수는 모바일에서 거르기 버튼 옆에 이미 있다. 여기선 데스크톱만. */}
      <p
        aria-live="polite"
        className="text-muted text-2xs mt-6 hidden tabular-nums md:block"
      >
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
              fit && LINE_LABEL[fit as ProductLine].ko,
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
            className="text-accent hover:text-accent ease-fluid text-2xs mt-5 underline underline-offset-4 transition-colors duration-300"
          >
            필터 초기화
          </button>
        </div>
      )}
    </>
  );
}

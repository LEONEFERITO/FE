"use client";

import { CaretDown, GridFour, Square, SquaresFour } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { FilterSheet } from "@/components/product/FilterSheet";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types/product";

/**
 * 상품 둘러보기 — 전체 제품(/products)과 분류 페이지(/category/…)가 같이 쓰는 틀
 * (2026-10-08 고객 요청, 레퍼런스: LYFT 의 상품 목록).
 *
 * ── 구성 ───────────────────────────────────────────────
 *   도구 줄 : 화면 끝까지 닿는 위아래 선. 왼쪽에 보기 방식(칸 수) 토글, 오른쪽에 정렬.
 *             폰은 세 칸 — FILTER | SORT | 칸 수 — 이 세로선으로 나뉜다.
 *   왼쪽 거르기(PC) : 글자 목록. 항목마다 개수가 붙고, 고른 항목은 진하게 · 밑줄. 다시 누르면 풀린다.
 *   폰 거르기 : 같은 목록이 아래에서 올라오는 시트(FilterSheet)에 들어간다 — 초안을 고르고 "보기" 로 적용.
 *   격자 : 카드 사이를 조금만 띄운다(폰 4px · PC 12px). 폰에서는 좌우 끝까지 붙는다.
 *          칸 수 토글 — 폰 1 / 2 칸, PC 2 / 4 칸.
 *
 * ── 거르기 규칙 ────────────────────────────────────────
 * 페이지가 묶음(Facet)을 넘긴다. 묶음마다 하나만 고른다(라인 · 분류 · 사이즈 · 재고 · 세부 분류).
 * 항목의 개수는 **이 페이지 상품 전체** 기준이다 — 다른 조건과 교차해 줄어드는 개수는 보는 사람을 헷갈리게 한다.
 * 사이즈는 "그 사이즈가 있는가" 이지 "지금 재고가 있는가" 가 아니다. 재고는 별도 묶음이다 — 둘을 섞으면
 * 품절인 순간 상품이 사라져서 "내 사이즈는 원래 안 만드는 브랜드" 로 오해된다.
 *
 * 상품 정보는 서버 컴포넌트가 HTML 에 박아 내보낸다. 첫 화면은 전체 목록이고, 거르기 · 정렬만 브라우저에서 돈다.
 *
 * ── 주소 ──────────────────────────────────────────────
 * 들어올 때의 조건(`initial`)은 페이지가 주소에서 읽어 넘긴다. 고를 때 주소를 바꿀지는 `urlFor` 가 정한다
 * (분류 페이지의 세부 분류는 공유되는 주소라 replaceState 로 맞춘다 — 뒤로가기 기록은 쌓지 않는다).
 */

export interface FacetOption {
  value: string;
  label: string;
  test: (p: Product) => boolean;
}

export interface Facet {
  key: string;
  label: string;
  options: FacetOption[];
}

export type Selection = Record<string, string | null>;

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

/** 묶음 하나의 글자 목록 — PC 왼쪽 칸과 폰 시트가 같은 모양이다 */
function FacetList({
  facet,
  counts,
  selected,
  onSelect,
  sheet = false,
}: {
  facet: Facet;
  counts: Record<string, number>;
  selected: string | null;
  onSelect: (value: string | null) => void;
  sheet?: boolean;
}) {
  return (
    <fieldset>
      <legend className="text-primary text-2xs tracking-label mb-3 font-medium">{facet.label}</legend>
      <ul className={`flex flex-col ${sheet ? "gap-0" : "gap-1.5"}`}>
        {facet.options.map((o) => {
          const on = selected === o.value;
          return (
            <li key={o.value}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(on ? null : o.value)}
                className={`ease-fluid inline-flex items-center gap-1.5 text-left text-xs transition-colors duration-300 ${
                  sheet ? "min-h-11 w-full" : "min-h-7"
                } ${on ? "text-primary font-medium underline underline-offset-4" : "text-secondary hover:text-primary"}`}
              >
                {o.label}
                <span className="text-muted tabular-nums">({counts[`${facet.key}:${o.value}`] ?? 0})</span>
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

export function ProductBrowser({
  products: all,
  facets,
  initial = {},
  urlFor,
}: {
  products: Product[];
  facets: Facet[];
  /** 들어올 때의 조건 — 페이지가 주소에서 읽어 넘긴다 */
  initial?: Selection;
  /** 조건이 바뀔 때 맞출 주소. 돌려주지 않으면(undefined) 주소는 그대로 */
  urlFor?: (selection: Selection) => string | undefined;
}) {
  const empty = useMemo(() => Object.fromEntries(facets.map((f) => [f.key, null])) as Selection, [facets]);
  const [selection, setSelection] = useState<Selection>({ ...empty, ...initial });
  const [draft, setDraft] = useState<Selection>(selection);
  const [sort, setSort] = useState<Sort>("new");
  const [dense, setDense] = useState(true);
  const selectId = useId();
  const mobileSelectId = useId();

  // 주소 맞추기 — 첫 렌더는 건너뛴다(들어올 때의 주소가 곧 조건이다)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const url = urlFor?.(selection);
    if (url !== undefined && url !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, "", url);
    }
  }, [selection, urlFor]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of facets) for (const o of f.options) c[`${f.key}:${o.value}`] = all.filter(o.test).length;
    return c;
  }, [all, facets]);

  const apply = useMemo(
    () => (sel: Selection) =>
      all.filter((p) =>
        facets.every((f) => {
          const v = sel[f.key];
          if (!v) return true;
          const o = f.options.find((x) => x.value === v);
          return o ? o.test(p) : true;
        }),
      ),
    [all, facets],
  );

  const visible = useMemo(() => sortProducts(apply(selection), sort), [apply, selection, sort]);
  const draftCount = useMemo(() => apply(draft).length, [apply, draft]);
  const activeCount = facets.filter((f) => selection[f.key]).length;
  const reset = () => setSelection(empty);

  const gridClass = dense
    ? "grid-cols-2 gap-x-1 gap-y-7 md:grid-cols-4 md:gap-x-3 md:gap-y-10"
    : "grid-cols-1 gap-y-8 md:grid-cols-2 md:gap-x-3 md:gap-y-12";

  const sortSelect = (id: string, className: string) => (
    <span className={`relative inline-flex items-center ${className}`}>
      <label htmlFor={id} className="sr-only">
        정렬
      </label>
      <select
        id={id}
        value={sort}
        onChange={(e) => setSort(e.target.value as Sort)}
        className="text-primary tracking-label h-full w-full cursor-pointer appearance-none bg-transparent pl-4 pr-9 text-xs uppercase"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <CaretDown size={12} weight="light" aria-hidden="true" className="pointer-events-none absolute right-4" />
    </span>
  );

  const viewToggle = (
    <div className="flex h-full items-stretch" role="group" aria-label="보기 방식">
      <button
        type="button"
        aria-pressed={!dense}
        aria-label="크게 보기"
        onClick={() => setDense(false)}
        className={`ease-fluid flex w-12 items-center justify-center transition-colors duration-300 md:w-11 ${!dense ? "text-primary" : "text-muted hover:text-primary"}`}
      >
        <Square size={16} weight="light" aria-hidden="true" className="md:hidden" />
        <SquaresFour size={18} weight="light" aria-hidden="true" className="hidden md:block" />
      </button>
      <button
        type="button"
        aria-pressed={dense}
        aria-label="작게 보기"
        onClick={() => setDense(true)}
        className={`ease-fluid flex w-12 items-center justify-center transition-colors duration-300 md:w-11 ${dense ? "text-primary" : "text-muted hover:text-primary"}`}
      >
        <SquaresFour size={16} weight="light" aria-hidden="true" className="md:hidden" />
        <GridFour size={18} weight="light" aria-hidden="true" className="hidden md:block" />
      </button>
    </div>
  );

  return (
    <div>
      {/* ── 도구 줄 — 화면 끝까지 닿는 선 ─────────────────── */}
      <div className="border-subtle border-y">
        {/* 폰: FILTER | SORT | 칸 수 */}
        <div className="divide-subtle flex h-12 divide-x md:hidden">
          <FilterSheet
            label="FILTER"
            triggerClassName="tracking-label text-primary flex h-full flex-1 items-center justify-center gap-2 text-xs"
            activeCount={activeCount}
            draftResultCount={draftCount}
            onOpen={() => setDraft(selection)}
            onApply={() => setSelection(draft)}
            onCancel={() => {}}
            onReset={() => setDraft(empty)}
          >
            <div className="flex flex-col gap-7 pt-2">
              {facets.map((f) => (
                <FacetList
                  key={f.key}
                  facet={f}
                  counts={counts}
                  selected={draft[f.key] ?? null}
                  onSelect={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
                  sheet
                />
              ))}
            </div>
          </FilterSheet>
          {sortSelect(mobileSelectId, "flex-1 justify-center")}
          {viewToggle}
        </div>

        {/* PC: 칸 수 | ... | 정렬 */}
        <div className="mx-auto hidden h-12 max-w-[1440px] items-stretch justify-between px-5 md:flex md:px-10">
          <div className="border-subtle -ml-2 border-r pr-2">{viewToggle}</div>
          <div className="border-subtle -mr-2 border-l pl-2">{sortSelect(selectId, "h-full")}</div>
        </div>
      </div>

      {/* ── 본문 — PC 왼쪽 거르기 + 격자 ─────────────────── */}
      <div className="mx-auto max-w-[1440px] px-5 md:flex md:gap-10 md:px-10">
        <aside className="hidden w-48 shrink-0 pt-10 md:block" aria-label="거르기">
          <div className="sticky top-[88px] flex flex-col gap-8">
            <p aria-live="polite" className="text-muted text-2xs tabular-nums">
              {visible.length}개의 상품
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-accent hover:text-accent-hover ease-fluid ml-3 underline underline-offset-4 transition-colors duration-300"
                >
                  초기화
                </button>
              )}
            </p>
            {facets.map((f) => (
              <FacetList
                key={f.key}
                facet={f}
                counts={counts}
                selected={selection[f.key] ?? null}
                onSelect={(v) => setSelection((s) => ({ ...s, [f.key]: v }))}
              />
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <p aria-live="polite" className="text-muted text-2xs mt-3 text-right tabular-nums md:hidden">
            {visible.length}개의 상품
          </p>

          {visible.length > 0 ? (
            <ul className={`-mx-5 mt-3 grid md:mx-0 md:mt-10 ${gridClass}`}>
              {visible.map((p) => (
                <li key={p.slug} className="min-w-0">
                  <ProductCard product={p} inset />
                </li>
              ))}
            </ul>
          ) : (
            /*
              빈 상태를 "결과 없음" 한 줄로 끝내지 않는다 — 조건을 보여주고, 빠져나갈 길을 같은 자리에 둔다.
            */
            <div className="flex flex-col items-center gap-5 py-24 text-center">
              <p className="text-primary text-sm">조건에 맞는 제품이 없습니다</p>
              <p className="text-muted text-2xs">
                {facets
                  .map((f) => f.options.find((o) => o.value === selection[f.key])?.label)
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {activeCount > 0 ? (
                <button
                  type="button"
                  onClick={reset}
                  className="text-accent ease-fluid text-2xs underline underline-offset-4 transition-colors duration-300"
                >
                  조건 지우기
                </button>
              ) : (
                <Link
                  href="/products/"
                  className="border-interactive text-accent hover:border-accent hover:bg-accent-tint ease-fluid tracking-button inline-flex min-h-11 items-center rounded-full border px-6 text-xs transition-all duration-500"
                >
                  전체 제품 보기
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { ArrowDown, ArrowUp, Plus, X } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { ADMIN_CONNECTED, listProducts, type AdminProductRow } from "@/lib/admin";
import { CATEGORY_LABEL, type Category } from "@/types/product";

/**
 * 함께 구매 상품 (서버 V52, 2026-11-10 고객 "추가 구매 옵션을 만들고 금액을 설정하는 기능을 상품 업로드에").
 *
 * 이미 등록한 상품(셔츠 · 타이 · 구두 …)을 골라 붙이고, 함께 살 때의 금액을 적는다. 비우면 그 상품의 원래 판매가.
 * 손님 상세의 구매 판에 «함께 구매» 로 이 순서대로 나온다 — 붙인 상품이 공개된 것만.
 * 함께 구매 금액은 이 상품과 같은 주문일 때만 적용된다(서버가 계산한다).
 * 수트 구성(조각별 사이즈) 상품과 자기 자신은 붙일 수 없다(서버가 막는다).
 */

export interface AddonRow {
  productId: string;
  /** 칸에 적은 그대로. 빈칸 = 원래 판매가 */
  priceKrw: string;
}

const won = (v: number) => new Intl.NumberFormat("ko-KR").format(v) + "원";

export function AddonListField({ value, onChange, selfId }: { value: AddonRow[]; onChange: (next: AddonRow[]) => void; selfId?: string }) {
  const [products, setProducts] = useState<AdminProductRow[] | null>(null);

  useEffect(() => {
    if (!ADMIN_CONNECTED) return;
    let alive = true;
    listProducts()
      .then((list) => alive && setProducts(list))
      .catch(() => alive && setProducts([]));
    return () => {
      alive = false;
    };
  }, []);

  const choices = (products ?? []).filter((p) => p.id !== selfId);
  const byId = new Map(choices.map((p) => [p.id, p]));

  function update(i: number, patch: Partial<AddonRow>) {
    onChange(value.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ol className="flex flex-col gap-2">
          {value.map((row, i) => {
            const p = byId.get(row.productId);
            return (
              <li key={i} className="border-subtle bg-surface flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2.5">
                <span className="text-muted text-2xs w-5 shrink-0 tabular-nums" aria-hidden="true">{i + 1}</span>
                <select
                  value={row.productId}
                  onChange={(e) => update(i, { productId: e.target.value })}
                  aria-label={`${i + 1}번째 함께 구매 상품`}
                  className="text-primary border-interactive focus-visible:border-accent min-h-11 min-w-0 flex-1 rounded-lg border bg-transparent px-2.5 text-sm sm:max-w-[22rem]"
                >
                  <option value="">{products === null ? "불러오는 중" : "상품 고르기"}</option>
                  {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => {
                    const group = choices.filter((x) => x.category === c);
                    if (group.length === 0) return null;
                    return (
                      <optgroup key={c} label={CATEGORY_LABEL[c].ko}>
                        {group.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.name ?? x.slug}
                            {x.status !== "PUBLISHED" ? " (공개 전)" : ""}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <label className="text-secondary flex min-h-11 items-center gap-2 text-xs">
                  함께 구매 금액
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.priceKrw}
                    onChange={(e) => update(i, { priceKrw: e.target.value.replace(/[^0-9]/g, "") })}
                    placeholder={p?.priceKrw != null ? `${won(p.priceKrw)}(판매가)` : "비우면 판매가"}
                    aria-label={`${i + 1}번째 함께 구매 금액(원), 비우면 판매가`}
                    className="text-primary placeholder:text-muted/70 border-interactive focus-visible:border-accent min-h-11 w-36 rounded-lg border bg-transparent px-2.5 text-right text-sm tabular-nums"
                  />
                </label>
                <span className="ml-auto flex shrink-0 items-center gap-1">
                  <IconButton label={`${i + 1}번째 위로`} onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp size={14} weight="light" aria-hidden="true" />
                  </IconButton>
                  <IconButton label={`${i + 1}번째 아래로`} onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                    <ArrowDown size={14} weight="light" aria-hidden="true" />
                  </IconButton>
                  <IconButton label={`${i + 1}번째 빼기`} onClick={() => onChange(value.filter((_, k) => k !== i))}>
                    <X size={14} weight="light" aria-hidden="true" />
                  </IconButton>
                </span>
                {p && p.status !== "PUBLISHED" && (
                  <p className="text-muted text-2xs w-full pl-7">공개 전 상품은 손님 화면에 나오지 않습니다. 그 상품을 공개하면 함께 보입니다.</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <button
        type="button"
        onClick={() => onChange([...value, { productId: "", priceKrw: "" }])}
        disabled={value.length >= 12}
        className="border-interactive text-accent hover:border-accent hover:bg-accent-tint ease-fluid text-2xs inline-flex min-h-11 w-fit items-center gap-2 rounded-full border px-5 transition-all duration-300 disabled:opacity-40"
      >
        <Plus size={13} weight="light" aria-hidden="true" />
        함께 구매 상품 추가
      </button>
    </div>
  );
}

function IconButton({ label, onClick, disabled = false, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="text-muted hover:text-primary ease-fluid flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

"use client";

import { ArrowDown, ArrowUp, PencilSimple, Plus, X } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { ImageField, type ImageFieldValue } from "@/components/admin/ImageField";
import { ADMIN_CONNECTED, listProducts, type AdminProductRow } from "@/lib/admin";
import { CATEGORY_LABEL, type Category } from "@/types/product";

/**
 * 함께 구매 상품 (서버 V52 · V53, 2026-11-10 고객 "추가 구매 옵션을 만들고 금액을 설정하는 기능을 상품 업로드에",
 * "내용을 직접 기재 · 이미지 · 컬러 및 사이즈 옵션 선택").
 *
 * 줄마다 둘 중 하나다:
 *   · 등록된 상품 — 이미 올린 상품(셔츠 · 타이 · 구두 …)을 골라 붙이고 함께 살 때의 금액을 적는다(비우면 그 상품의 판매가).
 *   · 직접 입력 — 이름 · 설명 · 사진 · 금액 · 컬러 · 사이즈를 여기서 바로 적는다. 상품으로 따로 등록하지 않아도 된다.
 *     컬러 · 사이즈는 쉼표로 나눠 적고, 비우면 손님이 고르지 않는다. 이 상품과 함께일 때만 살 수 있고 재고는 세지 않는다.
 *
 * 손님 상세의 구매 판에 «함께 구매» 로 이 순서대로 나온다. 등록된 상품은 공개된 것만.
 * 수트 구성(조각별 사이즈) 상품과 자기 자신은 붙일 수 없다(서버가 막는다).
 */

export interface AddonRow {
  kind: "product" | "custom";
  /** 등록된 상품 — 고른 상품. 직접 입력 — 이미 저장된 항목의 id(새 줄은 빈 값) */
  productId: string;
  /** 칸에 적은 그대로. 등록된 상품은 빈칸 = 원래 판매가, 직접 입력은 꼭 적는다 */
  priceKrw: string;
  // ── 직접 입력만 ──
  name: string;
  description: string;
  image: ImageFieldValue | null;
  /** 쉼표로 나눈 컬러 이름. 빈칸 = 컬러를 고르지 않는다 */
  colors: string;
  /** 쉼표로 나눈 사이즈. 빈칸 = 사이즈를 고르지 않는다 */
  sizes: string;
}

const EMPTY: Omit<AddonRow, "kind"> = { productId: "", priceKrw: "", name: "", description: "", image: null, colors: "", sizes: "" };

/** "네이비, 블랙 ,," → ["네이비", "블랙"] */
export const splitOptions = (text: string): string[] =>
  text
    .split(/[,，\n]/)
    .map((v) => v.trim())
    .filter(Boolean);

/** 제출 때만 검사한다. 줄 번호 → 문구 */
export function validateAddons(rows: AddonRow[]): Record<number, string> {
  const errors: Record<number, string> = {};
  rows.forEach((r, i) => {
    if (r.kind !== "custom") return;
    const colors = splitOptions(r.colors);
    const sizes = splitOptions(r.sizes);
    if (!r.name.trim()) errors[i] = "이름을 적어 주세요.";
    else if (!/^\d+$/.test(r.priceKrw.trim()) || Number(r.priceKrw) <= 0) errors[i] = "금액을 숫자로 적어 주세요.";
    else if (colors.some((c) => /[/·]/.test(c))) errors[i] = "컬러 이름에는 / 와 · 를 쓸 수 없습니다.";
    else if (new Set(colors).size !== colors.length || new Set(sizes).size !== sizes.length) errors[i] = "같은 컬러 · 사이즈를 두 번 적었습니다.";
    else if ([...colors, ...sizes].some((v) => v.length > 20)) errors[i] = "컬러 · 사이즈는 하나에 20자까지입니다.";
    else if (colors.length > 12 || sizes.length > 20) errors[i] = "컬러는 12개, 사이즈는 20개까지 적을 수 있습니다.";
  });
  return errors;
}

const won = (v: number) => new Intl.NumberFormat("ko-KR").format(v) + "원";
const input =
  "text-primary placeholder:text-muted/70 border-interactive focus-visible:border-accent ease-fluid min-h-11 w-full min-w-0 rounded-lg border bg-transparent px-3 text-sm transition-colors duration-300";

export function AddonListField({
  value,
  onChange,
  selfId,
  errors = {},
}: {
  value: AddonRow[];
  onChange: (next: AddonRow[]) => void;
  selfId?: string;
  errors?: Record<number, string>;
}) {
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

  const full = value.length >= 12;
  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ol className="flex flex-col gap-2">
          {value.map((row, i) => {
            const p = byId.get(row.productId);
            const controls = (
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
            );
            if (row.kind === "custom") {
              return (
                <li key={i} className="border-subtle bg-surface flex flex-col gap-3 rounded-xl border px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-muted text-2xs w-5 shrink-0 tabular-nums" aria-hidden="true">{i + 1}</span>
                    <span className="text-accent text-2xs">직접 입력</span>
                    {controls}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Labeled label="이름">
                      <input type="text" value={row.name} maxLength={40} onChange={(e) => update(i, { name: e.target.value })}
                        placeholder="예: 실크 넥타이" className={input} />
                    </Labeled>
                    <Labeled label="금액 (원)">
                      <input type="text" inputMode="numeric" value={row.priceKrw}
                        onChange={(e) => update(i, { priceKrw: e.target.value.replace(/[^0-9]/g, "") })}
                        placeholder="예: 45000" className={`${input} text-right tabular-nums`} />
                    </Labeled>
                    <Labeled label="설명 (선택)" wide>
                      <input type="text" value={row.description} maxLength={200} onChange={(e) => update(i, { description: e.target.value })}
                        placeholder="예: 착장에 함께 맨 네이비 스트라이프 타이" className={input} />
                    </Labeled>
                    <Labeled label="컬러 옵션 (선택) — 쉼표로 나눠 적기">
                      <input type="text" value={row.colors} onChange={(e) => update(i, { colors: e.target.value })}
                        placeholder="예: 네이비, 버건디" className={input} />
                    </Labeled>
                    <Labeled label="사이즈 옵션 (선택) — 쉼표로 나눠 적기">
                      <input type="text" value={row.sizes} onChange={(e) => update(i, { sizes: e.target.value })}
                        placeholder="예: 95, 100, 105" className={input} />
                    </Labeled>
                  </div>
                  <ImageField label="사진 (선택)" aspect="square" value={row.image} onChange={(image) => update(i, { image })} />
                  {errors[i] && <p role="alert" className="text-error text-2xs">{errors[i]}</p>}
                </li>
              );
            }
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
                {controls}
                {p && p.status !== "PUBLISHED" && (
                  <p className="text-muted text-2xs w-full pl-7">공개 전 상품은 손님 화면에 나오지 않습니다. 그 상품을 공개하면 함께 보입니다.</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex flex-wrap gap-2">
        <AddButton disabled={full} onClick={() => onChange([...value, { kind: "custom", ...EMPTY }])}>
          <PencilSimple size={13} weight="light" aria-hidden="true" />
          직접 입력해서 추가
        </AddButton>
        <AddButton disabled={full} onClick={() => onChange([...value, { kind: "product", ...EMPTY }])}>
          <Plus size={13} weight="light" aria-hidden="true" />
          등록된 상품에서 고르기
        </AddButton>
      </div>
    </div>
  );
}

function Labeled({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-secondary text-2xs">{label}</span>
      {children}
    </label>
  );
}

function AddButton({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="border-interactive text-accent hover:border-accent hover:bg-accent-tint ease-fluid text-2xs inline-flex min-h-11 w-fit items-center gap-2 rounded-full border px-5 transition-all duration-300 disabled:opacity-40"
    >
      {children}
    </button>
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

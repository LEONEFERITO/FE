"use client";

import { Plus } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

import type { ProductAddon } from "@/types/product";

/**
 * 함께 구매 상품 (서버 V52, 2026-11-10 고객 "수트 구매 시 착장에 함께 입은 셔츠 · 타이 · 신발도 고를 수 있게").
 *
 * 관리자가 이 상품에 붙인 다른 상품들이 한 줄씩 나온다 — 작은 사진 · 이름 · 함께 구매 금액(원래 판매가와 다르면 원래 값에 줄).
 * 그 상품의 컬러 · 굽높이 · 사이즈를 고르고 «추가» 를 누르면 위 «고른 옵션» 에 줄이 생긴다(usePurchase.addAddonLine).
 * 함께 구매 금액은 이 상품과 같은 주문일 때만 서버가 적용한다 — 따로 주문하면 원래 판매가.
 */

const won = (v: number) => new Intl.NumberFormat("ko-KR").format(v) + "원";

export function AddonPicker({
  addons,
  onAdd,
}: {
  addons: ProductAddon[];
  /** 고른 사이즈 줄(굽이 있으면 굽까지 붙이지 않은 사이즈) · 컬러 · 굽 */
  onAdd: (addon: ProductAddon, size: string, color: string, heel: string | null) => void;
}) {
  if (addons.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="text-primary text-sm font-medium">
        함께 구매<span className="text-muted ml-2 text-xs font-normal">이 착장에 함께 입은 상품</span>
      </h2>
      <ul className="flex flex-col gap-2">
        {addons.map((a) => (
          <AddonRow key={a.slug} addon={a} onAdd={onAdd} />
        ))}
      </ul>
    </div>
  );
}

const select =
  "text-primary min-h-10 min-w-[6.5rem] flex-1 basis-[6.5rem] rounded-lg border border-[#DADADA] bg-white px-2 text-[13px] focus-visible:border-[var(--accent-base)]";

function AddonRow({ addon, onAdd }: { addon: ProductAddon; onAdd: (addon: ProductAddon, size: string, color: string, heel: string | null) => void }) {
  const orderable = addon.skus.filter((s) => s.orderable);
  const [size, setSize] = useState(orderable.length === 1 ? orderable[0].size : "");
  const [color, setColor] = useState(addon.colors.length === 1 ? addon.colors[0].name : "");
  const [heel, setHeel] = useState(addon.heels[0] ?? null);
  const [hint, setHint] = useState<string | null>(null);
  const discounted = addon.priceKrw < addon.basePriceKrw;

  function add() {
    if (addon.colors.length > 0 && !color) return setHint("컬러를 골라 주세요.");
    if (!size) return setHint("사이즈를 골라 주세요.");
    setHint(null);
    onAdd(addon, size, color, heel);
  }

  return (
    <li className="flex flex-col gap-2.5 rounded-[16px] border border-[#EDEDED] p-3">
      <div className="flex items-center gap-3">
        <div className="bg-velvet aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-md">
          {addon.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={addon.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {/* 직접 입력한 항목(서버 V53)은 자기 상세가 없다 — 이름만 */}
          {addon.custom ? (
            <p className="text-primary truncate text-[13px] font-medium">{addon.name}</p>
          ) : (
            <a href={`/products/${addon.slug}/`} className="text-primary hover:text-accent block truncate text-[13px] font-medium">
              {addon.name}
            </a>
          )}
          {addon.description && <p className="text-secondary text-xs leading-snug break-keep">{addon.description}</p>}
          <p className="text-[13px] tabular-nums">
            <b className="text-primary font-medium">{won(addon.priceKrw)}</b>
            {discounted && <span className="text-muted ml-2 text-xs line-through">{won(addon.basePriceKrw)}</span>}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {addon.colors.length > 1 && (
          <select value={color} onChange={(e) => setColor(e.target.value)} aria-label={`${addon.name} 컬러`} className={select}>
            <option value="">컬러</option>
            {addon.colors.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        )}
        {addon.heels.length > 0 && (
          <select value={heel ?? ""} onChange={(e) => setHeel(e.target.value)} aria-label={`${addon.name} 굽높이`} className={select}>
            {addon.heels.map((h, i) => (
              <option key={h} value={h}>
                굽 {h}{addon.heelPrices[i] ? ` (+${won(addon.heelPrices[i])})` : ""}
              </option>
            ))}
          </select>
        )}
        {/* 사이즈가 하나뿐이고 살 수 있으면 고를 것이 없다 — 처음부터 골라 두고 칸을 숨긴다(직접 입력 항목의 «FREE» 등) */}
        {!(addon.skus.length === 1 && orderable.length === 1) && (
          <select value={size} onChange={(e) => setSize(e.target.value)} aria-label={`${addon.name} 사이즈`} className={select}>
            <option value="">사이즈</option>
            {addon.skus.map((s) => (
              <option key={s.id} value={s.size} disabled={!s.orderable}>
                {s.size}
                {!s.orderable ? (s.soldOut ? " (품절)" : " (주문 불가)") : ""}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={add}
          className="border-strong text-primary hover:border-accent hover:text-accent ease-fluid inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13px] transition-colors duration-300"
        >
          <Plus size={12} weight="regular" aria-hidden="true" />
          추가
        </button>
      </div>
      {hint && <p role="alert" className="text-error text-2xs">{hint}</p>}
    </li>
  );
}

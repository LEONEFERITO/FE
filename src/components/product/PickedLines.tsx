"use client";

import { Minus, Plus, X } from "@phosphor-icons/react/dist/ssr";

import { MAX_LINE_QUANTITY, type PickedLine } from "@/components/product/usePurchase";

/**
 * «고른 옵션» 목록 (2026-11-03 고객 "컬러와 사이즈 선택 후 각각 구매할 수량").
 * 줄마다 컬러 / 사이즈 · 수량(− 숫자 +) · 줄 금액 · 빼기. 맨 아래에 총 수량과 총 금액.
 * 금액은 화면 표시용이다 — 실제 금액은 장바구니 · 주문서에서 서버가 다시 계산한다.
 */
function won(n: number) {
  return new Intl.NumberFormat("ko-KR").format(n) + "원";
}

export function PickedLines({
  lines,
  unitPrice,
  maxFor,
  onQuantity,
  onRemove,
  unit = "벌",
}: {
  lines: PickedLine[];
  /** 수량 단위 — 신발은 «켤레»(lib/unit) */
  unit?: string;
  unitPrice: (line: PickedLine) => number | null;
  /** 이 줄을 몇 벌까지 — 남은 수량이 적으면 그만큼 */
  maxFor?: (line: PickedLine) => number;
  onQuantity: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
}) {
  if (lines.length === 0) return null;
  const total = lines.reduce((sum, l) => sum + (unitPrice(l) ?? 0) * l.quantity, 0);
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  return (
    <div className="flex flex-col gap-2">
      <ul aria-label="고른 옵션" className="flex flex-col gap-2">
        {lines.map((l, i) => {
          const label = l.color ? `${l.color} / ${l.size}` : l.size;
          const price = unitPrice(l);
          const max = maxFor?.(l) ?? MAX_LINE_QUANTITY;
          return (
            <li key={`${l.color}|${l.size}`} className="flex items-center gap-3 rounded-[16px] bg-[#F7F7F7] py-2 pr-1.5 pl-4">
              <p className="text-primary min-w-0 flex-1 text-[13px] leading-snug break-keep">{label}</p>
              <div className="flex shrink-0 items-center rounded-full border border-[#DADADA] bg-white" role="group" aria-label={`${label} 수량`}>
                <button
                  type="button"
                  onClick={() => onQuantity(i, l.quantity - 1)}
                  disabled={l.quantity <= 1}
                  aria-label={`${label} 수량 줄이기`}
                  className="text-primary flex h-9 w-9 items-center justify-center disabled:opacity-30"
                >
                  <Minus size={12} weight="regular" aria-hidden="true" />
                </button>
                <span aria-live="polite" className="text-primary w-6 text-center text-[13px] tabular-nums">
                  {l.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onQuantity(i, l.quantity + 1)}
                  disabled={l.quantity >= max}
                  aria-label={`${label} 수량 늘리기`}
                  className="text-primary flex h-9 w-9 items-center justify-center disabled:opacity-30"
                >
                  <Plus size={12} weight="regular" aria-hidden="true" />
                </button>
              </div>
              <p className="text-primary w-[84px] shrink-0 text-right text-[13px] tabular-nums">{price != null ? won(price * l.quantity) : "—"}</p>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`${label} 빼기`}
                className="text-muted hover:text-primary flex h-9 w-9 shrink-0 items-center justify-center"
              >
                <X size={12} weight="regular" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="flex items-baseline justify-end gap-2 pr-1.5 text-sm">
        <span className="text-secondary text-xs">총 {count}{unit}</span>
        <span className="text-primary font-display text-lg tabular-nums">{won(total)}</span>
      </p>
    </div>
  );
}

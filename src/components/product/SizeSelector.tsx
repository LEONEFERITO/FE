"use client";

import type { Sku } from "@/types/product";

/**
 * 사이즈 선택.
 *
 * **품절 사이즈를 숨기지 않는다.** 숨기면 "내 사이즈는 원래 안 만드는 브랜드" 로 읽히고,
 * 보여주면 "이번에 품절" 로 읽힌다. 페리토 라인은 큰 사이즈가 자주 품절이라 이 차이가 크다.
 *
 * 품절 표시는 색만으로 하지 않는다. 취소선(형태) + 아래 안내 문구(텍스트)를 함께 쓴다 —
 * 색약 사용자에게는 품절 회색과 본문 회색이 구분되지 않는다 (WCAG 1.4.1).
 *
 * 라디오 그룹 의미를 주어 키보드·스크린리더로도 고를 수 있게 한다.
 */

interface SizeSelectorProps {
  skus: Sku[];
  value: string | null;
  onChange: (size: string) => void;
}

export function SizeSelector({ skus, value, onChange }: SizeSelectorProps) {
  // 다 팔린 사이즈(재고 0, 서버 V30)와 만들 수 없는 사이즈를 다른 말로 알린다
  const soldOut = skus.filter((s) => !s.orderable && s.soldOut);
  const unavailable = skus.filter((s) => !s.orderable && !s.soldOut);
  const selected = skus.find((s) => s.size === value);

  return (
    <div className="flex flex-col gap-3">
      <div
        role="radiogroup"
        aria-label="사이즈"
        className="grid grid-cols-4 gap-2.5"
      >
        {skus.map((sku) => {
          const isSoldOut = !sku.orderable;
          const isSelected = value === sku.size;

          return (
            <button
              key={sku.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isSoldOut}
              disabled={isSoldOut}
              onClick={() => onChange(sku.size)}
              className={[
                "ease-fluid rounded-xl border py-3.5 text-[15px] tabular-nums transition-all duration-500",
                isSelected
                  ? "border-accent bg-accent-tint text-accent"
                  : isSoldOut
                    ? "border-subtle text-soldout cursor-not-allowed line-through"
                    : "border-strong text-primary hover:border-accent hover:bg-accent-tint/50 active:scale-[0.97]",
              ].join(" ")}
            >
              {sku.size}
              {isSoldOut && <span className="sr-only"> {sku.soldOut ? "품절" : "주문 불가"}</span>}
            </button>
          );
        })}
      </div>

      {/* 고른 사이즈가 얼마 안 남았으면 — 5벌 이하일 때만 서버가 수량을 준다 */}
      {selected?.orderable && selected.remaining != null && (
        <p className="text-accent text-xs" aria-live="polite">
          {selected.size} 사이즈 {selected.remaining}벌 남았습니다.
        </p>
      )}
      {soldOut.length > 0 && (
        <p className="text-soldout text-xs">{soldOut.map((s) => s.size).join(", ")} 사이즈는 품절입니다.</p>
      )}
      {unavailable.length > 0 && (
        <p className="text-soldout text-xs">
          {unavailable.map((s) => s.size).join(", ")} 사이즈는 지금 주문할 수 없습니다.
        </p>
      )}
    </div>
  );
}

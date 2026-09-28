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
  const soldOut = skus.filter((s) => s.stock === 0);

  return (
    <div className="flex flex-col gap-3">
      <div
        role="radiogroup"
        aria-label="사이즈"
        className="grid grid-cols-4 gap-2.5"
      >
        {skus.map((sku) => {
          const isSoldOut = sku.stock === 0;
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
              {isSoldOut && <span className="sr-only"> 품절</span>}
            </button>
          );
        })}
      </div>

      {soldOut.length > 0 && (
        <p className="text-soldout text-xs">
          {soldOut.map((s) => s.size).join(", ")} 사이즈는 품절입니다.
        </p>
      )}
    </div>
  );
}

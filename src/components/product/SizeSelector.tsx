"use client";

import type { Sku } from "@/types/product";

/**
 * 사이즈 선택.
 *
 * **품절 사이즈를 숨기지 않는다.** 숨기면 "내 사이즈는 원래 안 만드는 브랜드" 로 읽히고,
 * 보여주면 "이번에 품절" 로 읽힌다. 페리토 라인은 큰 사이즈가 자주 품절이라 이 차이가 크다.
 *
 * 품절 표시는 색만으로 하지 않는다. 회색 면 · 취소선(형태) + 칸 안의 「품절」 글자(텍스트)를 함께 쓴다 —
 * 색약 사용자에게는 품절 회색과 본문 회색이 구분되지 않는다 (WCAG 1.4.1).
 *
 * 라디오 그룹 의미를 주어 키보드·스크린리더로도 고를 수 있게 한다.
 */

interface SizeSelectorProps {
  skus: Sku[];
  value: string | null;
  onChange: (size: string) => void;
  /** 수트 조각 이름(자켓 · 베스트 · 팬츠) — 화면 낭독기와 "2벌 남았습니다" 문장 앞에 붙는다 */
  name?: string;
  /** 한 줄 칸 수. 수트 조각은 5(사이즈 다섯이 한 줄에) */
  columns?: 4 | 5;
}

export function SizeSelector({ skus, value, onChange, name, columns = 4 }: SizeSelectorProps) {
  const selected = skus.find((s) => s.size === value);

  return (
    <div className={`flex flex-col ${columns === 5 ? "gap-1.5" : "gap-3"}`}>
      <div
        role="radiogroup"
        aria-label={name ? `${name} 사이즈` : "사이즈"}
        className={`grid gap-2 ${columns === 5 ? "grid-cols-5" : "grid-cols-4"}`}
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
                // 칸 높이를 같게 — 품절 칸만 두 줄(사이즈 + "품절")이라 높이를 고정하고 가운데에 놓는다
                // 2026-10-28 디자이너 시안: 둥근 알약 모양, 조금 낮게
                "ease-fluid flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-full border text-[14px] tabular-nums transition-all duration-500",
                isSelected
                  ? "border-accent bg-accent-tint text-accent"
                  : isSoldOut
                    ? // 확실히 "못 누르는 칸" 으로 — 회색 면 · 흐린 글자 · 취소선 · "품절" 글자 (2026-10-14 "더 확실하게 비활성화")
                      "bg-band border-transparent text-soldout cursor-not-allowed"
                    : "border-strong text-primary hover:border-accent hover:bg-accent-tint/50 active:scale-[0.97]",
              ].join(" ")}
            >
              <span className={isSoldOut ? "line-through opacity-60" : undefined}>{sku.size}</span>
              {isSoldOut && (
                <span className="text-[11px] leading-none tracking-normal">{sku.soldOut ? "품절" : "주문 불가"}</span>
              )}
            </button>
          );
        })}
      </div>

      {/*
        고른 사이즈가 5벌 이하로 남았으면 글자 한 줄로 알린다 — 잘 나가는 제품처럼 보이게(2026-10-14). 서버는 5벌 이하일 때만 수량을 준다.
        품절 · 주문 불가 사이즈는 따로 문장으로 적지 않는다 — 칸 자체에 「품절」 · 「주문 불가」가 글자로 있다(색만으로 알리지 않는다).
      */}
      {selected?.orderable && selected.remaining != null && (
        <p aria-live="polite" className="text-accent text-xs">
          {name ? `${name} ` : ""}{selected.size} 사이즈 {selected.remaining}벌 남았습니다.
        </p>
      )}
    </div>
  );
}

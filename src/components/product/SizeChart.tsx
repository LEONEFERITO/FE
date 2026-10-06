"use client";

import { ArrowsOut, Warning, X } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";

import type { SizeChartImage } from "@/types/product";
import { pendingHint } from "@/lib/pending";

/**
 * 상세 사이즈 차트 — 고객이 만든 이미지 한 장.
 *
 * ── 왜 표가 아니라 이미지인가 ───────────────────────────
 * 고객 결정이다(2026-09-29). 카테고리마다 재는 곳이 달라서 브랜드 쪽에서 만든
 * 차트를 그대로 올리고 싶다는 요구다. 숫자를 구조화해 받는 방식과 견줘 잃는 것이
 * 있지만(아래), 어차피 지금은 실측값이 하나도 들어와 있지 않아 당장 사라지는 화면은 없다.
 *
 * ── 이미지로 하면 잃는 것 (되돌릴 수 있게 적어 둔다) ────
 *   · 목록 카드의 "어깨 46~52" 요약 — 뽑아낼 숫자가 없다
 *   · 사이즈를 고를 때 그 사이즈 치수를 옆에 띄우는 것
 *   · 상품 간 비교, 검색, 사이즈 추천
 * DB 의 숫자 테이블은 그대로 둔다. 나중에 값이 들어오면 표를 다시 켤 수 있다.
 *
 * ── 이미지라서 반드시 챙겨야 하는 것 ────────────────────
 * 표를 그림으로 만들면 **글자가 해상도에 고정된다.** 335px 화면에서는 그만큼 작아져
 * 읽을 수 없다. 그래서 두 가지를 둔다:
 *   1. 눌러서 전체 화면으로 키우기 (확대·스크롤 가능)
 *   2. 대체 텍스트 — 스크린리더에게는 이미지가 유일한 정보원이다
 *
 * 그리고 가로·세로를 미리 받아 자리를 잡는다. 이미지가 도착하면서 칸이 커지면
 * 그 아래 구매 버튼이 아래로 밀린다(레이아웃 이동).
 */

interface Props {
  chart: SizeChartImage | null;
  /** 측정 기준·허용 오차. 이미지 안에 있어도 글자로 한 번 더 남긴다 — 아래 주석 참고. */
  basis: string | null;
  tolerance: string | null;
  /**
   * 바깥에 이미 제목이 있으면 그 id. 주면 자체 제목(h2)을 그리지 않는다 —
   * 같은 "상세 사이즈" 제목이 두 번 읽히지 않게.
   */
  headingId?: string;
}

export function SizeChart({ chart, basis, tolerance, headingId }: Props) {
  const [zoomed, setZoomed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  /*
   * <dialog> 를 쓴다. 직접 만든 오버레이와 달리 초점 가두기·Esc 닫기·바깥 비활성화를
   * 브라우저가 해 준다. 손으로 만들면 그 셋 중 하나는 반드시 빠진다.
   */
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (zoomed && !el.open) el.showModal();
    if (!zoomed && el.open) el.close();
  }, [zoomed]);

  return (
    <section
      className="flex min-w-0 flex-col gap-3.5"
      aria-labelledby={headingId ?? "size-chart-heading"}
    >
      <div
        className={`flex items-baseline gap-3 ${headingId ? "justify-end" : "justify-between"}`}
      >
        {!headingId && (
          <h2 id="size-chart-heading" className="text-primary text-sm font-medium">
            상세 사이즈
          </h2>
        )}
        {chart && (
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="text-accent hover:text-accent ease-fluid text-2xs inline-flex min-h-11 items-center gap-1.5 transition-colors duration-300"
          >
            <ArrowsOut size={13} weight="light" aria-hidden="true" />
            크게 보기
          </button>
        )}
      </div>

      {chart ? (
        <>
          <div className="min-w-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setZoomed(true)}
              // 이미지 자체도 누르면 커진다. 작은 글자를 본 사람의 첫 행동이 "눌러 보기" 다.
              className="bg-surface block w-full cursor-zoom-in overflow-hidden rounded-none"
              aria-label="사이즈 차트 크게 보기"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={chart.url}
                alt={chart.alt}
                width={chart.width ?? undefined}
                height={chart.height ?? undefined}
                loading="lazy"
                decoding="async"
                /*
                  width/height 를 주면 브라우저가 비율을 알아 자리를 미리 잡는다.
                  없으면 이미지가 도착하는 순간 아래 내용이 밀린다.
                */
                className="h-auto w-full"
              />
            </button>
          </div>

          <p className="text-muted text-2xs leading-relaxed">
            표가 작게 보이면 눌러서 크게 보실 수 있습니다.
          </p>
        </>
      ) : (
        <div className="border-subtle bg-band/60 text-muted text-2xs rounded-2xl border px-5 py-8 text-center leading-relaxed">
          사이즈 차트가 아직 등록되지 않았습니다.
        </div>
      )}

      {/*
        측정 기준과 허용 오차는 **이미지 밖에 글자로도** 둔다.
        차트 안에 적혀 있더라도, 이 둘은 분쟁이 생겼을 때 그대로 인용되는 문장이라
        복사할 수 있어야 하고 스크린리더로도 읽혀야 한다.
        둘레인지 단면인지에 따라 값이 2배 차이 나기 때문에 빠지면 실측이 오히려 교환을 늘린다.
      */}
      <p className="text-muted text-2xs leading-relaxed">
        {basis ?? pendingHint("측정 기준", "평평히 놓고 잰 단면 기준")}
        {" · "}
        {tolerance ?? pendingHint("허용 오차", "±1cm")}
      </p>

      {chart && !chart.alt.trim() && (
        /*
          대체 텍스트가 비면 스크린리더 사용자에게 이 구간은 존재하지 않는 것과 같다.
          표를 이미지로 만든 이상 여기가 유일한 통로다. 관리자에게 보이는 경고다.
        */
        <p className="text-warning text-2xs flex gap-1.5 leading-relaxed">
          <Warning size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
          <span>
            이 차트에 대체 텍스트가 없습니다. 화면을 읽어 주는 기기에서는 사이즈
            정보가 전달되지 않습니다.
          </span>
        </p>
      )}

      {/* ── 크게 보기 ─────────────────────────────────── */}
      <dialog
        ref={dialogRef}
        onClose={() => setZoomed(false)}
        // 배경(::backdrop)을 눌러도 닫힌다. 모달을 빠져나갈 길이 많을수록 좋다.
        onClick={(e) => {
          if (e.target === dialogRef.current) setZoomed(false);
        }}
        className="bg-base/95 text-primary m-0 h-full max-h-none w-full max-w-none p-0 backdrop:bg-black/70"
      >
        <div className="flex h-full flex-col">
          <div className="border-subtle flex items-center justify-between border-b px-5 py-3">
            <p className="text-primary text-sm font-medium">상세 사이즈</p>
            <button
              type="button"
              onClick={() => setZoomed(false)}
              aria-label="닫기"
              className="text-muted hover:text-accent ease-fluid flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300"
            >
              <X size={18} weight="light" aria-hidden="true" />
            </button>
          </div>

          {/*
            넘치면 스크롤한다. 표 이미지는 세로로 길거나 가로로 넓은데, 어느 쪽이든
            화면에 맞추려고 축소하면 다시 못 읽게 된다. 원래 크기로 두고 움직이게 한다.
          */}
          <div className="flex-1 overflow-auto p-4">
            {chart && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={chart.url}
                alt={chart.alt}
                className="mx-auto h-auto w-auto max-w-none"
              />
            )}
          </div>
        </div>
      </dialog>
    </section>
  );
}

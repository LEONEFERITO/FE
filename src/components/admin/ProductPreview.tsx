"use client";

import { useState } from "react";

import { CATEGORY_LABEL, LINE_LABEL, type Category, type ProductLine } from "@/types/product";

/**
 * 입력한 내용이 실제로 어떻게 보이는지.
 *
 * ── 왜 필요한가 ─────────────────────────────────────────
 * 글자 수만 세어 주면 "40자" 가 화면에서 몇 줄인지 알 수 없다. 40자가 데스크톱에서는
 * 한 줄인데 모바일에서는 세 줄이 되어 가격을 밀어낸다. 그건 <b>보여줘야</b> 안다.
 *
 * ── PC / 모바일을 함께 본다 ─────────────────────────────
 * 두 폭에서 같은 글자가 다르게 접힌다. 관리자가 데스크톱에서만 확인하면
 * 모바일에서 제목이 몇 줄이 되는지 모른 채 공개한다.
 * 그래서 폭을 바꿔 보는 스위치를 둔다 — 실제 카드와 같은 규칙으로 그린다.
 *
 * ── 진짜 카드와 어긋나지 않게 ───────────────────────────
 * 여기서 쓰는 줄 수 제한(line-clamp)과 글자 크기는 목록 카드와 같은 값이어야 한다.
 * 달라지면 미리보기가 거짓말을 한다. 카드 쪽을 고치면 여기도 같이 고친다.
 */

const KRW = new Intl.NumberFormat("ko-KR");

interface Props {
  name: string;
  summary: string;
  priceKrw: number | null;
  category: Category;
  line: ProductLine;
  imageUrl: string | null;
  leadTimeDays: number | null;
}

export function ProductPreview({
  name,
  summary,
  priceKrw,
  category,
  line,
  imageUrl,
  leadTimeDays,
}: Props) {
  const [width, setWidth] = useState<"mobile" | "desktop">("desktop");

  return (
    <section
      aria-label="미리보기"
      className="border-subtle bg-band/40 flex flex-col gap-4 rounded-2xl border p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-primary text-sm font-medium">미리보기</h2>

        {/* 폭 전환. 두 폭에서 줄바꿈이 어떻게 달라지는지 바로 본다. */}
        <div
          role="group"
          aria-label="미리보기 폭"
          className="border-subtle flex overflow-hidden rounded-full border"
        >
          {(["desktop", "mobile"] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWidth(w)}
              aria-pressed={width === w}
              className={`text-2xs ease-fluid min-h-11 px-4 transition-colors duration-300 ${
                width === w
                  ? "bg-accent-tint text-accent"
                  : "text-muted hover:text-accent"
              }`}
            >
              {w === "desktop" ? "PC" : "모바일"}
            </button>
          ))}
        </div>
      </div>

      {/*
        카드를 실제 폭으로 그린다. 모바일 카드는 375px 화면에서 2열이라 약 165px,
        데스크톱 목록은 4열이라 약 300px 다. 그 폭에서 글자가 어떻게 접히는지가 핵심이다.
      */}
      <div className="flex justify-center py-2">
        {/*
          maxWidth 로 한 번 더 조인다. 300px 을 그대로 두면 320px 화면에서
          좌우 여백을 합쳐 칸을 넘어 페이지가 가로로 밀린다 — QA 가 잡은 결함이다.
          미리보기가 원래 폭보다 좁아지면 줄바꿈이 실제와 달라지지만,
          가로 스크롤이 생기는 것보다는 낫고 그 폭에서는 어차피 실제 카드도 더 좁다.
        */}
        <div
          className="flex w-full flex-col gap-3 transition-[width] duration-300"
          /*
            min() 으로 준다. width 를 300px 로 박으면 그 값이 **min-content** 가 되어
            부모 칸을 밀어낸다 — maxWidth 로는 막히지 않는다(최대치만 제한할 뿐이다).
            min(300px, 100%) 은 칸이 좁으면 칸을 따라간다.
          */
          style={{ width: `min(${width === "mobile" ? 165 : 300}px, 100%)` }}
        >
          <div className="border-subtle bg-surface aspect-[3/4] w-full overflow-hidden rounded-xl border">
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-muted text-2xs flex h-full items-center justify-center">
                대표 이미지 없음
              </span>
            )}
          </div>

          <p className="text-accent text-2xs tracking-label">
            {CATEGORY_LABEL[category].en}
            <span aria-hidden="true"> · </span>
            {LINE_LABEL[line].ko}
          </p>

          {/*
            line-clamp-2 는 목록 카드와 같은 값이다. 두 줄을 넘으면 실제로도 잘린다.
            min-h 로 두 줄 자리를 미리 잡아 두어, 이름이 짧아도 아래가 들썩이지 않는다.
          */}
          <p className="font-display text-primary leading-display line-clamp-2 min-h-[2.6em] text-sm">
            {name || <span className="text-muted">상품명 없음</span>}
          </p>

          {summary && (
            <p className="text-secondary line-clamp-1 text-2xs">{summary}</p>
          )}

          <p className="text-secondary text-xs tabular-nums">
            {priceKrw !== null && !Number.isNaN(priceKrw) ? (
              `${KRW.format(priceKrw)}원`
            ) : (
              <span className="text-muted">가격 미정</span>
            )}
          </p>
        </div>
      </div>

      <p className="text-muted text-2xs border-subtle border-t pt-4 leading-relaxed">
        {leadTimeDays
          ? `주문 후 약 ${leadTimeDays}일 뒤 수령`
          : "제작 기간을 입력하면 결제 화면에 표시됩니다. 값이 없으면 공개할 수 없습니다."}
      </p>
    </section>
  );
}

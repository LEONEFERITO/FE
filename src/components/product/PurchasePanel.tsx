"use client";

import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { pendingLabel } from "@/lib/pending";

import { LineSummary } from "@/components/product/LineBadge";
import { SizeChart } from "@/components/product/SizeChart";
import { ModelInfo } from "@/components/product/ModelInfo";
import { SizeSelector } from "@/components/product/SizeSelector";
import { CATEGORY_LABEL } from "@/types/product";
import type { Product } from "@/types/product";

/**
 * 구매 패널.
 *
 * 요소 순서가 이 사이트의 주장이다:
 *   상품명 → 가격 → **핏 → 사이즈 → 실측표 → 모델 정보** → 구매 버튼
 *
 * 일반 쇼핑몰은 가격 다음에 바로 구매 버튼이 온다. 여기서는 그 사이에
 * "내 몸에 맞는가" 를 판단할 재료를 전부 넣는다. 운동으로 체형이 달라진 고객이 기성복에서 실패하는
 * 이유가 정보 부족이고, 그 실패는 전부 사이즈 교환 CS 로 돌아온다.
 *
 * 선택한 사이즈를 실측표 강조와 연결하려고 client 컴포넌트로 묶었다.
 */

function formatKrw(value: number | null): string | null {
  if (value === null) return null;
  return new Intl.NumberFormat("ko-KR").format(value) + "원";
}

export function PurchasePanel({ product }: { product: Product }) {
  // 기본 선택은 재고가 있는 첫 사이즈. 품절만 있으면 선택하지 않는다.
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.skus.find((s) => s.stock > 0)?.size ?? null,
  );

  const price = formatKrw(product.priceKrw);
  const listPrice = formatKrw(product.listPriceKrw);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Eyebrow>{CATEGORY_LABEL[product.category].en}</Eyebrow>

      <h1 className="font-display text-primary text-3xl leading-display tracking-display md:text-4xl">
        {product.name ?? pendingLabel("제품명")}
      </h1>

      <div className="flex items-baseline gap-3">
        <p
          className={`font-display text-2xl tabular-nums ${price ? "text-primary" : "text-muted"}`}
        >
          {price ?? pendingLabel("판매가")}
        </p>
        {listPrice && (
          /* 정가 취소선은 버건디로. 서브 컬러가 실제로 일하는 몇 안 되는 자리다 —
             세일이라는 사실이 한눈에 읽혀야 하고, 면적은 아주 좁다. */
          <p className="text-accent text-base tabular-nums line-through">
            {listPrice}
          </p>
        )}
      </div>

      <LineSummary line={product.line} />

      <hr className="border-subtle my-2" />

      <div className="flex items-baseline justify-between">
        <h2 className="text-primary text-sm font-medium">사이즈</h2>
        <Link
          href="/#size-finder-heading"
          className="text-accent hover:text-accent ease-fluid group inline-flex min-h-11 items-center gap-1.5 text-xs transition-colors duration-500"
        >
          사이즈 가이드
          <span className="ease-fluid transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <ArrowUpRight size={11} weight="light" aria-hidden="true" />
          </span>
        </Link>
      </div>

      <SizeSelector
        skus={product.skus}
        value={selectedSize}
        onChange={setSelectedSize}
      />

      <hr className="border-subtle my-2" />

      {/*
        상세 사이즈는 고객이 만든 차트 이미지로 보여준다(2026-09-29 결정).
        선택한 사이즈를 강조하던 기능은 이미지라 할 수 없다 — 그 대가는 SizeChart 주석 참고.
      */}
      <SizeChart
        chart={product.sizeChart}
        basis={product.measurements.basis}
        tolerance={product.measurements.tolerance}
      />

      <ModelInfo model={product.model} />

      {/*
        주 버튼 — 포인트 컬러(고동색) 채움. 베이지 배경 대비 9.64:1 이라
        면만으로도 버튼이 확실히 보인다. (다크 테마에서는 벨벳이 1.89:1 이라
        골드 헤어라인으로 경계를 만들어야 했다 — 배경이 바뀌면 필요한 처치도 바뀐다)

        화살표는 텍스트 옆에 맨몸으로 두지 않고 자체 원형 안에 넣는다.
        hover 시 원이 대각선으로 밀려나며 버튼 내부에 운동감이 생긴다.

        D1(판매 범위) 미확정 — 커머스 기준이다. 카탈로그로 확정되면 라벨만 바뀐다.
      */}
      <div className="mt-3 flex flex-col gap-2.5">
        <button
          type="button"
          disabled={!selectedSize}
          className="group bg-accent hover:bg-accent-hover text-on-accent shadow-button hover:shadow-button-hover tracking-button ease-fluid flex items-center justify-between gap-4 rounded-full py-4 pl-7 pr-2 text-[15px] transition-all duration-500 hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0"
        >
          <span className="flex-1 text-center">장바구니 담기</span>
          <span className="bg-on-accent/12 ease-fluid flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-500 group-hover:-translate-y-px group-hover:translate-x-1 group-hover:scale-105">
            <ArrowUpRight size={11} weight="light" aria-hidden="true" />
          </span>
        </button>

        <button
          type="button"
          disabled={!selectedSize}
          className="border-strong hover:border-accent hover:text-accent hover:shadow-soft text-primary tracking-button ease-fluid rounded-full border py-4 text-[15px] transition-all duration-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        >
          바로 구매
        </button>
      </div>

      {/*
        의류는 사이즈 교환이 CS 의 대부분이다. 구매 직전에 교환 조건이 보여야
        "일단 사보고 안 맞으면 바꾸지" 라는 결심이 선다.
      */}
      <ul className="mt-2 flex flex-col gap-2">
        {[
          // TODO(고객확인) D-1 · A-3: 값이 오면 이 배열을 실제 정책 문장으로 바꾼다
          pendingLabel("배송비 정책"),
          pendingLabel("교환·반품 기간과 배송비 부담"),
          pendingLabel("사이즈 교환 조건"),
        ].map((line) => (
          <li key={line} className="text-muted flex gap-2 text-xs">
            <span
              aria-hidden="true"
              className="bg-strong mt-2 h-px w-2.5 shrink-0"
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

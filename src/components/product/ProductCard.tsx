"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { QuickView } from "@/components/product/QuickView";
import { CATEGORY_LABEL } from "@/types/product";
import type { Product } from "@/types/product";

/**
 * 목록용 상품 카드.
 *
 * ── 이 카드가 보여주는 것 ────────────────────────────────
 * 사진 → 이름 → 가격 · 분류. 두 줄, 작게 (2026-10-08 고객 요청 — 레퍼런스 LYFT).
 *
 * 전에는 실측 요약과 사이즈 칩이 카드에 있었다("나한테 맞나" 의 판단 재료를 목록에서부터 준다는 약속).
 * 카드가 너무 길어져 뺐고, 그 둘은 카드를 누르면 열리는 빠른 보기 팝업(QuickView)과 상세 페이지가 맡는다 —
 * 한 번 누르면 바로 사이즈와 실측이 나오니 약속은 그대로다.
 *
 * ── D1(판매 범위)이 아직 미확정인 것에 대한 대응 ──────────
 * 가격이 null 이면 "가격 문의" 로 표시한다. 카탈로그+문의로 확정되면 이 카드를
 * 고칠 필요가 없고, 판매로 확정되면 값이 채워지면서 자연스럽게 가격이 뜬다.
 * 그래서 D1 을 기다리지 않고 목록을 만들 수 있다.
 *
 * ── 2026-10-06 고객 요청: 기존 몰(leoneferito.kr/category/Shirts/45/)처럼 ──────
 * 라인 배지를 없애고, 사진은 **테두리 · 라운딩 · 그림자 없이** 맨 사진 그대로, 글자는 왼쪽 정렬.
 * 예전의 "쟁반 위 사진"(헤어라인 테두리 + 고동색 그늘 + hover 에 들림)은 걷어 냈다 — 바탕이 흰색이 되면서
 * 사진 자체가 면이 된다. hover 는 사진이 아주 조금 커지는 것과 이름 색만 남긴다.
 *
 * ── 2026-10-08 고객 요청: 누르면 팝업(빠른 보기) ──────────
 * 사진 · 이름을 누르면 상세로 가지 않고 QuickView 팝업이 **이 카드의 사진 자리에서 커지며** 열린다.
 * 링크(href)는 그대로 둔다 — 크롤러 · JS 없는 환경 · 새 탭 열기(가운데 클릭 · Ctrl+클릭)는 전처럼 상세 페이지로
 * 간다. 보통 클릭만 가로챈다.
 *
 * `inset` — 카드끼리 **틈 없이 붙여** 둘 때(메인의 제품 격자) 글자만 안쪽으로 조금 들인다. 사진은 끝까지 붙는다.
 */

const KRW = new Intl.NumberFormat("ko-KR");

export function ProductCard({ product, inset = false }: { product: Product; inset?: boolean }) {
  const [open, setOpen] = useState(false);
  const photoRef = useRef<HTMLDivElement>(null);
  const name = product.name ?? "제품명 확인 중";
  const image = product.images[0]?.url;
  const inStock = product.skus.filter((s) => s.orderable).length;
  const allSoldOut = inStock === 0;


  return (
    <article className="group">
      <Link
        href={`/products/${product.slug}`}
        className="block"
        onClick={(e) => {
          // 새 탭 · 새 창으로 열려는 클릭은 그대로 둔다
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          setOpen(true);
        }}
      >
        {/*
          바깥 껍데기 + 안쪽 알맹이. 카드를 배경에 납작하게 얹지 않는다 —
          베이지 헤어라인 쟁반 위에 사진이 놓인 구조라 물성이 생긴다.
          그림자는 검정이 아니라 고동색 그늘이고, hover 에서 조금 들리며 그늘이 길어진다.

          사진은 **촬영 원본 그대로** 쓴다(누끼 아님). 벨벳 배경·조명·바닥 그림자가
          이미 사진 안에 있어서 카드가 무대를 흉내 낼 필요가 없고, 흉내 낸 것보다 자연스럽다.
          비율 2:3 은 촬영 원본 비율이다 — 3:4 로 자르면 머리나 발이 잘린다.
          누끼는 히어로에서만 쓴다. 거기는 인물이 글자를 딛고 서야 해서 배경이 없어야 한다.
        */}
        <div>
          <div ref={photoRef} className="bg-velvet relative aspect-[2/3] overflow-hidden">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                loading="lazy"
                className="ease-fluid absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            ) : (
              /*
                버건디 면 위 글자는 크림으로 **고정**한다. 이 면은 UI 가 아니라 사진(촬영 배경)이라
                크림 구간(.on-cream) 안에서도 어두운 채로 남는데, 토큰(text-primary)을 쓰면
                거기서 딥 와인 글자가 되어 1.9:1 로 사라진다.
              */
              <span className="text-2xs tracking-label absolute inset-0 flex items-center justify-center text-[#F7F1EA]/60">
                촬영본 준비 중
              </span>
            )}

            {allSoldOut && (
              <span className="text-2xs tracking-label absolute left-3 top-3 bg-[#F7F1EA] px-3 py-1 text-[#2E2925]">
                SOLD OUT
              </span>
            )}
          </div>
        </div>

        {/*
          글자 — 이름, 그 아래 가격 · 분류 한 줄. 작게 (2026-10-08 고객 요청, 레퍼런스 LYFT 의 "이름 / 가격 · 색상 수").
          실측 요약과 사이즈 칩은 카드에서 뺐다 — 카드가 너무 길었다. 그 둘은 빠른 보기 팝업과 상세 페이지에 있다.
        */}
        <div className={`mt-3 text-left ${inset ? "px-3 md:px-0" : ""}`}>
          <h3 className="text-primary ease-fluid group-hover:text-accent text-xs font-medium transition-colors duration-500">
            {name}
          </h3>
          <p className="text-2xs mt-1 flex flex-wrap items-baseline gap-x-2">
            {product.priceKrw !== null ? (
              <span className="text-primary tabular-nums">{KRW.format(product.priceKrw)}원</span>
            ) : (
              // D1 이 카탈로그+문의로 확정되면 이 표시가 정상 상태가 된다.
              <span className="text-muted">가격 문의</span>
            )}
            {product.priceKrw !== null && product.listPriceKrw !== null && product.listPriceKrw > product.priceKrw && (
              <span className="text-muted tabular-nums line-through">{KRW.format(product.listPriceKrw)}원</span>
            )}
            <span className="text-muted tracking-label">{CATEGORY_LABEL[product.category].en}</span>
          </p>
        </div>
      </Link>

      <QuickView product={product} open={open} onClose={() => setOpen(false)} originRef={photoRef} />
    </article>
  );
}

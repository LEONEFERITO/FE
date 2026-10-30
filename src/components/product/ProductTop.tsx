"use client";

import { useState } from "react";

import { Reveal } from "@/components/motion/Reveal";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import type { Product } from "@/types/product";

/**
 * 상세 맨 위 — 왼쪽 큰 사진, 오른쪽 구매 판 (2026-10-28 디자이너 시안).
 *
 * 작은 사진 줄이 큰 사진 아래(왼쪽)에서 구매 판 안(오른쪽)으로 옮겨 가서, 고른 사진 번호를 둘이 함께 쓴다 — 그래서 여기서 들고 있다.
 * PC 에서 두 칸은 같은 높이(grid 기본 stretch)라, 구매 판이 버튼을 맨 아래로 밀면 큰 사진 아랫단과 버튼 아랫단이 맞는다.
 * 구매 판이 사진(4:5)보다 길면(수트 구성처럼 고를 칸이 많을 때) 큰 사진이 판 높이까지 늘어난다 — 버튼은 여전히 사진 아랫단(ProductGallery lg:h-full).
 *
 * 2026-10-31 디자이너 "바로 구매까지 한 화면에": PC 에서 큰 사진 폭을 화면 높이에 맞춘다 — 사진 높이(폭 × 1.25)가
 * 화면 높이 − (헤더 + 위아래 여백) 를 넘지 않게. 구매 판은 남는 폭(최대 460px)을 쓰고, 둘을 가운데로 모은다.
 */
export function ProductTop({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  return (
    // 모바일은 세로로 쌓고, 데스크톱은 이미지 : 정보 = 대략 7 : 5. min-w-0 — 표 · 긴 글이 칸을 밀어내지 않게
    <div className="grid gap-10 lg:grid-cols-[auto_minmax(0,460px)] lg:justify-center lg:gap-14">
      <Reveal className="min-w-0 lg:h-full lg:w-[min(52vw,calc((100dvh-140px)*0.8))]">
        <ProductGallery photos={product.images} name={product.name} index={index} onIndex={setIndex} />
      </Reveal>
      <Reveal delay={140} className="min-w-0 lg:h-full">
        <PurchasePanel product={product} photoIndex={index} onPhoto={setIndex} />
      </Reveal>
    </div>
  );
}

import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types/product";

/**
 * 메인의 제품 격자 — BEST.
 *
 * ── 히어로와 같은 제품이 또 나오는 것에 대해 ──────────────
 * 한 번 격자를 걷어내고 "전체 보기" 한 줄로 줄여봤는데 틀렸다. 900px 히어로와
 * 787px 섹션 사이에 188px 짜리 빈 띠가 끼어 섹션이 아니라 길 잃은 바로 보였고,
 * 무엇보다 **메인에서 제품을 훑어볼 면이 사라졌다.**
 *
 * 그래서 격자를 되살리고 대신 **순서**로 푼다: 히어로 → 브랜드 주장 → 이 격자.
 * 같은 사진이 한 화면 안에서 두 번 보이지 않고, 사용자가 "왜 실측을 공개하는가" 를
 * 읽은 **직후** 에 실측 요약이 붙은 카드를 만난다. 히어로는 캠페인, 이 격자는 카탈로그다.
 * 역할이 다르면 같은 제품이 두 번 나와도 반복이 아니다.
 *
 * 목록 페이지와 **같은 카드** 를 쓴다. 메인 전용 카드를 따로 만들면
 * 실측 표기 규칙이 두 군데로 갈라지고, 한쪽만 고쳐지는 날이 온다.
 *
 * ── 2026-10-17 디자이너 요청 ──────────────────────────────
 * 제목은 "제품" 대신 **BEST**. 위의 눈썹 선(— COLLECTION)과 오른쪽 "전체 보기" 버튼은 뺐다
 * ("위에 라인이랑 버튼 전부 삭제"). 전체 목록은 헤더 분류와 카드에서 간다.
 */
export function FeaturedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section
      className="mx-auto max-w-[1320px] px-5 py-24 md:px-15 md:py-32"
      aria-labelledby="featured-heading"
    >
      <h2
        id="featured-heading"
        className="font-display text-primary leading-display tracking-display text-3xl md:text-4xl"
      >
        BEST
      </h2>

      {/* 2026-10-08 고객 요청: 폰에서 카드 사이를 조금만(4px) 띄운다 — 목록 페이지(ProductBrowser)와 같다. 글자는 카드 안에서 조금 들인다(ProductCard inset) */}
      <ul className="mt-12 grid grid-cols-2 gap-x-1 gap-y-10 md:grid-cols-4 md:gap-x-5 md:gap-y-12">
        {products.map((p) => (
          <li key={p.slug} className="min-w-0">
            <ProductCard product={p} inset />
          </li>
        ))}
      </ul>
    </section>
  );
}

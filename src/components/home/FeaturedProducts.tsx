import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { ProductCard } from "@/components/product/ProductCard";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { Product } from "@/types/product";

/**
 * 메인의 제품 격자.
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
 */
export function FeaturedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section
      className="mx-auto max-w-[1320px] px-5 py-24 md:px-15 md:py-32"
      aria-labelledby="featured-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <Eyebrow>COLLECTION</Eyebrow>
          <h2
            id="featured-heading"
            className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl"
          >
            제품
          </h2>
        </div>

        <Link
          href="/products"
          className="group border-interactive text-accent hover:border-accent hover:text-accent hover:bg-accent-tint ease-fluid tracking-button text-2xs inline-flex items-center gap-2.5 rounded-full border px-6 py-3 transition-all duration-500 hover:-translate-y-px"
        >
          전체 보기
          <ArrowRight
            size={13}
            weight="light"
            aria-hidden="true"
            className="ease-fluid transition-transform duration-500 group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4">
        {products.map((p) => (
          <li key={p.slug}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

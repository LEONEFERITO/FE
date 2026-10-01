import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { CartView } from "@/components/shop/CartView";
import { PageBand } from "@/components/ui/PageBand";
import { getCatalog } from "@/lib/catalog";

/**
 * 장바구니. 회원 전용(D1) — 내용은 서버에 있고 CartView 가 불러온다.
 *
 * 비어 있을 때는 "비어 있습니다" 한 줄이 아니라 대표 제품 몇 점과 컬렉션으로 돌아갈 길을 같이 둔다
 * (시안의 규칙). 그 부분은 빌드 때 카탈로그로 만들어 CartView 에 넘긴다.
 */

export const metadata: Metadata = {
  title: "장바구니",
  // 사람마다 다른 화면이다. 색인할 내용이 없다.
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const suggested = (await getCatalog()).slice(0, 4);

  const empty = (
    <>
      <Reveal>
        <div className="border-subtle bg-surface flex flex-col items-start gap-4 rounded-2xl border p-7 md:flex-row md:items-center md:justify-between md:p-9">
          <div>
            <h2 className="font-display text-primary text-xl md:text-2xl">장바구니가 비어 있습니다</h2>
            <p className="text-secondary mt-2 max-w-[46ch] text-sm leading-relaxed">
              사이즈별 실측을 확인하고 담아 보세요. 주문 후 제작해 보내 드립니다.
            </p>
          </div>
          <Link
            href="/products"
            className="bg-accent text-on-accent hover:bg-accent-hover shadow-button ease-fluid tracking-button inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full px-6 text-sm transition-all duration-500 hover:-translate-y-px"
          >
            컬렉션 보기
            <ArrowRight size={13} weight="light" aria-hidden="true" />
          </Link>
        </div>
      </Reveal>

      {suggested.length > 0 && (
        <section className="mt-14" aria-labelledby="suggested-heading">
          <Reveal>
            <h2 id="suggested-heading" className="font-display text-primary leading-display text-2xl">
              먼저 둘러보기
            </h2>
          </Reveal>
          <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {suggested.map((p, i) => (
              <li key={p.slug} className="min-w-0">
                <Reveal delay={i * 60}>
                  <ProductCard product={p} />
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );

  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        <PageBand eyebrow="CART" title="장바구니" />

        <div className="on-cream">
          <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-15 md:py-16">
            <CartView empty={empty} />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

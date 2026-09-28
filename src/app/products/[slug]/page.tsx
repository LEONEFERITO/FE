import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/motion/Reveal";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductNoticeTable } from "@/components/product/ProductNoticeTable";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { PRODUCTS, findProduct } from "@/data/products";
import { FIT_LABEL } from "@/types/product";

/**
 * 상품 상세.
 *
 * 정적 내보내기(output: "export")라 동적 경로는 빌드 시점에 목록이 필요하다.
 * BE 상품 API(Phase 2)가 생기면 generateStaticParams 에서 목록을 받아온다.
 */

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

/**
 * 상품별 메타데이터 — **D3(Next.js 정적 내보내기)를 고른 이유가 이것이다.**
 *
 * 여기서 만든 title/description/og 가 빌드 시점에 정적 HTML 에 박혀 나간다.
 * 그래서 검색엔진과 카카오톡 공유 봇이 JS 를 실행하지 않고도 상품 정보를 읽는다.
 * SPA 였다면 빈 껍데기 HTML 이 전달돼서 상품 페이지가 검색에 안 잡히고
 * 공유 미리보기도 비어서 나간다 — 커머스에서는 치명적이다.
 */
export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return {};

  const name = product.name ?? "제품 준비 중";
  const fit = FIT_LABEL[product.fitType];

  return {
    title: name,
    description: `${fit.ko} 핏 · ${fit.description} 사이즈별 상세 실측과 모델 착용 정보를 함께 제공합니다.`,
    openGraph: {
      title: `${name} | LEONE FERITO`,
      description: `${fit.ko} 핏 · 사이즈별 상세 실측 제공`,
      type: "website",
      // TODO(고객확인) 제품 촬영본이 오면 대표 이미지를 지정한다.
      // metadataBase(layout.tsx)가 없으면 상대경로로 나가 카톡이 못 읽는다.
      images: product.images.length > 0 ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();

  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-15 md:py-20">
          {/*
            모바일은 세로로 쌓고, 데스크톱은 이미지 : 정보 = 대략 7 : 5.
            정보 컬럼이 좁으면 실측표가 가로 스크롤을 타게 되어 핵심 정보가 묻힌다.
          */}
          <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20">
            <Reveal>
              <ProductGallery images={product.images} />
            </Reveal>
            <Reveal delay={140}>
              <PurchasePanel product={product} />
            </Reveal>
          </div>
        </div>

        {/* 상세 설명 — 한국 커머스 관례상 긴 이미지 시퀀스가 온다 */}
        <section
          className="border-subtle border-t"
          aria-labelledby="detail-heading"
        >
          <div className="mx-auto max-w-[1320px] px-5 py-24 text-center md:px-15 md:py-32">
            <Reveal>
              <p className="text-muted text-2xs tracking-label">DETAIL</p>
            </Reveal>
            <Reveal delay={100}>
              <h2
                id="detail-heading"
                className="font-display text-primary mt-3 text-3xl leading-display tracking-display md:text-4xl"
              >
                제품 상세
              </h2>
            </Reveal>

            <Reveal delay={180}>
              {/* 사진 자리다. 실제 촬영본 배경이 버건디라 그 톤을 미리 보여준다 */}
              <div className="border-subtle bg-band/50 shadow-soft mx-auto mt-12 max-w-[900px] rounded-[2rem] border p-2">
                <div
                  className="flex aspect-[9/7] items-center justify-center rounded-[calc(2rem-0.5rem)]"
                  style={{
                    background:
                      "linear-gradient(155deg, #4E0C17 0%, #7B1526 55%, #2A0A11 100%)",
                  }}
                >
                  <p className="px-6 text-center text-sm text-white/55">
                    상세 컷 · 원단 클로즈업 · 착용 컷 준비 중
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <ProductNoticeTable notice={product.notice} />
      </main>

      <Footer />
    </>
  );
}

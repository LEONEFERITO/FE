import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/motion/Reveal";
import { ProductNoticeTable } from "@/components/product/ProductNoticeTable";
import { ProductTop } from "@/components/product/ProductTop";
import { SizeChart } from "@/components/product/SizeChart";
import { getCatalog, getCatalogProduct } from "@/lib/catalog";
import { openGraphBase } from "@/lib/metadata";
import { JsonLd, productStructuredData } from "@/lib/structuredData";
import { CATEGORY_LABEL, LINE_LABEL } from "@/types/product";

/**
 * 상품 상세.
 *
 * 정적 내보내기(output: "export")라 동적 경로는 빌드 시점에 목록이 필요하다.
 * 목록은 서버(BE)의 공개 상품이다 — lib/catalog.ts.
 */

export async function generateStaticParams() {
  const products = await getCatalog();
  /*
    공개 상품이 하나도 없어도 빌드는 돼야 한다 (오픈 직전, 관리자가 전부 내린 경우).
    정적 내보내기는 빈 목록을 받아 주지 않아서 자리표시 하나를 만든다 — 그 주소는 404 다.
  */
  return products.length > 0 ? products.map((p) => ({ slug: p.slug })) : [{ slug: "none" }];
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
  const product = await getCatalogProduct(slug);
  if (!product) return {};

  const name = product.name ?? "제품 준비 중";
  const fit = LINE_LABEL[product.line];

  // 2026-10-26 SEO: 설명 앞에 상품 이름 · 라인 · 분류를 두고, 요약(관리자 입력)이 있으면 그 뒤에 잇는다
  const category = CATEGORY_LABEL[product.category];
  const description = `${name} — ${fit.ko} ${category.ko}. ${
    product.summary?.trim() || fit.description
  } 사이즈별 상세 실측(어깨·가슴·허리·총장)과 모델 착용 정보를 공개합니다.`;
  return {
    title: name,
    description,
    alternates: { canonical: `/products/${product.slug}/` },
    /*
     * og 는 교체되는 키다 — 루트(layout.tsx)의 값이 섞여 들어오지 않으므로
     * siteName · locale 을 openGraphBase() 로 다시 얹는다. 빠뜨리면 카톡 카드에서
     * 브랜드명이 사라진다.
     *
     * 대표 사진이 없으면 openGraphBase 가 브랜드 기본 이미지로 메운다. 도메인이 아직 없고
     * 사진 주소가 상대경로면 이미지를 아예 넣지 않는다 — localhost 주소가 박힌 깨진 카드보다
     * 글자만 있는 카드가 낫다 (lib/metadata.ts).
     *
     * TODO(고객확인) 제품 촬영본이 오면 공유용 대표 컷을 따로 지정한다.
     */
    openGraph: {
      ...openGraphBase(product.images[0]?.url),
      title: `${name} | LEONE FERITO`,
      description: `${fit.ko} 핏 · 사이즈별 상세 실측 제공`,
      url: `/products/${product.slug}/`,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) notFound();


  return (
    <>
      <Header />
      {/* 상품 · 가격 · 재고 · 이동 경로 구조화 데이터 (lib/structuredData) */}
      <JsonLd data={productStructuredData(product)} />

      <main id="main" className="flex-1">
        {/*
          2026-10-06 고객 요청(피그마 "변경 요청 사항" — 이 상세 페이지 캡처): **페이지 전체 흰 바탕**.
          아래 예전 설명의 크림 · 와인 면 구분은 걷었다 — 구매 판 · 제품 상세 · 상세 사이즈가 모두 흰 면이다.
          면 순서 (색 시안 · 상세): 사는 곳은 크림, 보는 곳은 와인.
          가격 · 사이즈 · 버튼이 있는 구매 판은 가장 또렷해야 해서 크림.
          아래 "제품 상세" 사진 구간은 와인 — 버건디 배경 원본 사진과 한 공기가 된다.
          그 아래 상세 사이즈 · 고시는 다시 크림(읽는 곳).
        */}
        <div className="on-cream on-white">
        {/* PC 위 여백을 줄였다 — 바로 구매 버튼까지 한 화면(2026-10-31) */}
        <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-15 md:py-20 lg:pt-10">
          {/* 큰 사진 + 구매 판 — 작은 사진 줄 · 버튼 정렬은 ProductTop (2026-10-28 디자이너 시안) */}
          <ProductTop product={product} />
        </div>
        </div>

        {/*
          제품 상세 — 한국 쇼핑몰식 긴 상세 이미지(관리자 "상세 이미지").
          여러 장을 **간격 없이** 이어 붙인다: 한 장으로 만든 상세페이지를 잘라 올려도 이음매가 보이지 않게.
            · 이미지마다 display:block — 인라인 이미지 아래 생기는 글자 줄 틈(몇 px)을 없앤다
            · 둥근 모서리 · 테두리 · 그림자 없음 — 이미지 자체가 디자인이다
            · 폭은 860px 가운데 (상세페이지 제작 표준 폭). 모바일은 화면 끝까지
            · 크기를 알면 width/height 를 줘서 늦게 떠도 아래가 밀리지 않게 한다
            · 첫 장만 바로, 나머지는 스크롤해서 다가올 때 받는다(lazy)
          상세 이미지가 없으면 자리표시자를 둔다(촬영본 준비 중).
        */}
        <section className="on-cream on-white pt-16 md:pt-24" aria-label="제품 상세">
          {/* "DETAIL 제품 상세" 제목은 2026-10-28 디자이너 요청으로 걷었다 — 상세 이미지가 바로 이어진다 */}

          {product.story.length > 0 ? (
            <div className="mx-auto flex w-full max-w-[860px] flex-col pb-24 md:pb-32">
              {product.story.map((photo, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.url}
                  src={photo.url}
                  alt={photo.alt || `${product.name ?? "제품"} 상세 이미지 ${i + 1}`}
                  width={photo.width ?? undefined}
                  height={photo.height ?? undefined}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="block h-auto w-full"
                />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-[1320px] px-5 pb-24 md:px-15 md:pb-32">
              <Reveal delay={180}>
                {/* 사진 자리다. 실제 촬영본 배경이 버건디라 그 톤을 미리 보여준다 */}
                <div className="mx-auto max-w-[860px]">
                  <div
                    className="flex aspect-[9/7] items-center justify-center rounded-none"
                    style={{
                      background:
                        "linear-gradient(155deg, #4E0C17 0%, #7B1526 55%, #2A0A11 100%)",
                    }}
                  >
                    <p className="px-6 text-center text-sm text-white/55">상세 이미지 준비 중</p>
                  </div>
                </div>
              </Reveal>
            </div>
          )}
        </section>

        {/*
          상세 사이즈 — 고객 요청으로 구매 판에서 이 자리로 내려왔다(2026-09-30).
          구매 판의 "상세 사이즈 보기" 가 여기로 온다. scroll-mt 는 고정 헤더 높이만큼
          띄우는 값이다 — 없으면 제목이 헤더 밑에 가려진 채로 멈춘다.
          모델 정보도 함께 왔다. 둘 다 "내 몸에 맞는가" 를 판단하는 재료다.
        */}
        <div className="on-cream on-white">
        <section id="size-detail" className="scroll-mt-24" aria-label="상세 사이즈">
          <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-15 md:py-16">
            {/* "SIZE 상세 사이즈" 제목 · 크게 보기 · 측정 기준 · 모델 정보는 2026-10-28 디자이너 요청으로 걷었다 — 차트 이미지만 */}
            <div className="mx-auto flex max-w-[900px] min-w-0 flex-col">
              <SizeChart chart={product.sizeChart} />
            </div>
          </div>
        </section>

        <ProductNoticeTable notice={product.notice} />
        </div>
      </main>

      <Footer />
    </>
  );
}

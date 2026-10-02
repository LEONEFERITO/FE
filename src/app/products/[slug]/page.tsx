import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/motion/Reveal";
import { ModelInfo } from "@/components/product/ModelInfo";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductNoticeTable } from "@/components/product/ProductNoticeTable";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { SizeChart } from "@/components/product/SizeChart";
import { getCatalog, getCatalogProduct } from "@/lib/catalog";
import { LINE_LABEL, type Product } from "@/types/product";

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

  return {
    title: name,
    description:
      product.summary ??
      `${fit.ko} 핏 · ${fit.description} 사이즈별 상세 실측과 모델 착용 정보를 함께 제공합니다.`,
    openGraph: {
      title: `${name} | LEONE FERITO`,
      description: `${fit.ko} 핏 · 사이즈별 상세 실측 제공`,
      type: "website",
      // TODO(고객확인) 제품 촬영본이 오면 대표 이미지를 지정한다.
      // metadataBase(layout.tsx)가 없으면 상대경로로 나가 카톡이 못 읽는다.
      images: product.images.length > 0 ? [product.images[0].url] : undefined,
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

      <main id="main" className="flex-1">
        {/*
          면 순서 (색 시안 · 상세): 사는 곳은 크림, 보는 곳은 와인.
          가격 · 사이즈 · 버튼이 있는 구매 판은 가장 또렷해야 해서 크림.
          아래 "제품 상세" 사진 구간은 와인 — 버건디 배경 원본 사진과 한 공기가 된다.
          그 아래 상세 사이즈 · 고시는 다시 크림(읽는 곳).
        */}
        <div className="on-cream">
        <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-15 md:py-20">
          {/*
            모바일은 세로로 쌓고, 데스크톱은 이미지 : 정보 = 대략 7 : 5.
            정보 컬럼이 좁으면 실측표가 가로 스크롤을 타게 되어 핵심 정보가 묻힌다.
          */}
          <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20">
            {/*
              min-w-0 이 필요하다. grid 자식의 기본 min-width 는 auto 라
              "내용보다 작아지지 않는다" 가 기본이고, 정보 컬럼 안의 실측표가
              min-w-[420px] 를 갖고 있어서 375px 화면에서 컬럼을 434px 로 밀어냈다.
              (실측표 자체는 이미 overflow-x-auto 로 감싸져 있는데, 그걸 감싼
               이 래퍼가 못 줄어들면 소용이 없다 — 페이지가 통째로 가로 스크롤을 탄다)
            */}
            <Reveal className="min-w-0">
              <ProductGallery photos={product.images} name={product.name} />
            </Reveal>
            <Reveal delay={140} className="min-w-0">
              <PurchasePanel product={product} />
            </Reveal>
          </div>

          <ProductStory product={product} />
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
        <section className="bg-stage" aria-labelledby="detail-heading">
          <div className="mx-auto max-w-[1320px] px-5 pt-24 text-center md:px-15 md:pt-32">
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
          </div>

          {product.story.length > 0 ? (
            <div className="mx-auto mt-12 flex w-full max-w-[860px] flex-col pb-24 md:pb-32">
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
                <div className="border-subtle bg-band/50 shadow-soft mx-auto mt-12 max-w-[860px] rounded-[2rem] border p-2">
                  <div
                    className="flex aspect-[9/7] items-center justify-center rounded-[calc(2rem-0.5rem)]"
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
        <div className="on-cream">
        <section
          id="size-detail"
          className="scroll-mt-24"
          aria-labelledby="size-detail-heading"
        >
          <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-15 md:py-32">
            <div className="text-center">
              <Reveal>
                <p className="text-muted text-2xs tracking-label">SIZE</p>
              </Reveal>
              <Reveal delay={100}>
                <h2
                  id="size-detail-heading"
                  className="font-display text-primary mt-3 text-3xl leading-display tracking-display md:text-4xl"
                >
                  상세 사이즈
                </h2>
              </Reveal>
            </div>

            <div className="mx-auto mt-12 flex max-w-[900px] min-w-0 flex-col gap-6">
              <SizeChart
                chart={product.sizeChart}
                basis={product.measurements.basis}
                tolerance={product.measurements.tolerance}
                headingId="size-detail-heading"
              />
              <ModelInfo model={product.model} />
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

/**
 * 제품 이야기 — 설명 · 디자인 의도 · 특징. 관리자가 적은 글이다.
 *
 * 셋 다 비어 있으면 구간을 그리지 않는다. 빈 제목만 남으면 "준비 안 된 가게" 로 보인다.
 * 문단은 빈 줄로 나눈다 — 관리자 화면의 여러 줄 입력이 그대로 문단이 된다.
 */
function ProductStory({ product }: { product: Product }) {
  const blocks = [
    { key: "description", title: "제품 설명", text: product.description },
    { key: "intent", title: "디자인 의도", text: product.intent },
    { key: "features", title: "특징", text: product.features },
  ].filter((b): b is { key: string; title: string; text: string } => !!b.text?.trim());

  if (blocks.length === 0) return null;

  return (
    <section aria-label="제품 설명" className="border-subtle mt-16 grid gap-10 border-t pt-12 md:grid-cols-3 md:gap-12">
      {blocks.map((b) => (
        <div key={b.key} className="min-w-0">
          <h2 className="text-primary text-sm font-medium">{b.title}</h2>
          <div className="text-secondary mt-3 flex flex-col gap-3 text-sm leading-relaxed">
            {b.text
              .split(/\n\s*\n/)
              .map((para, i) => (
                <p key={i} className="whitespace-pre-line">
                  {para.trim()}
                </p>
              ))}
          </div>
        </div>
      ))}
    </section>
  );
}

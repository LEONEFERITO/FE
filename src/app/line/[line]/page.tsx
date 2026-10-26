import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/product/ProductCard";
import { BackButton } from "@/components/ui/BackButton";
import { LINE_INTRO } from "@/data/brand";
import { getCatalog } from "@/lib/catalog";
import { getSiteImages, lineSlots } from "@/lib/siteImages";
import { shareMetadata } from "@/lib/metadata";
import { CATEGORY_LABEL, LINE_LABEL, type Category, type ProductLine } from "@/types/product";

/**
 * 라인 페이지 — 레오네 · 페리토 (2026-10-05 고객 디자인 가이드 → 2026-10-17 디자이너 수정본).
 *
 * 메인의 두 라인 카드를 누르면 온다. 구성:
 *   1 머리      뒤로 가기(왼쪽 위) · 작은 라벨(CLASSIC LINE / ATHLETIC LINE) · 라인 이름 · 한 줄 제목 · 소개 세 줄
 *   2 사진 흐름  사진이 가로로 천천히 흐른다(2026-10-19 디자이너 요청 · 레퍼런스 mycel.earth/pclm 맨 아래) — 사이 10px
 *   3 상품      분류별로 쭉 — 수트 · 셔츠 · 팬츠 · 자켓 순. 분류 이름은 영문(SHIRT · TROUSERS …)
 *
 * ── 2026-10-17 디자이너 피그마 댓글로 바뀐 것 ───────────────
 * 2026-10-17 에는 페이지 전체가 검정이었는데("흰 부분 블랙으로"), 2026-10-20 디자이너가 다시 정리했다: 첫 화면(머리 + 사진 흐름)만
 * 검정이고 상품 목록은 흰 바탕. 헤더(와인)는 이제 메인을 뺀 모든 페이지의 기본이다(Header 참고).
 * GNB 는 와인(#5E1F21, Header tone="wine"). 라인 이름 글자색은 2026-10-20 디자이너 참고 시안의 빨강 #B84040 —
 * 전의 #5E1F21 은 검정 위에서 1.7:1 이라 안 보였고 "정렬이 너무 달라 보인다" 는 지적을 받았다. 크기도 시안 비율로:
 * 작은 줄 16 · 이름 96(PC) · 한 줄 제목 28 굵게, 그 사이 여백도 시안대로 넓게.
 * 소개 문안은 디자이너가 적어 준 원문(data/brand.ts LINE_INTRO) — "확인 중" 자리 표시는 끝났다.
 * 뺀 것: 분류 위 눈썹 선, 다섯 칸 아래 "페인포인트와 니즈 포인트", 맨 아래 선 + "다른 라인 보기" 버튼.
 *
 * 사진은 관리자가 올린다(/admin/display/line — 서버 site_image LINE_*_1~5, V22). 비운 칸은 그 라인
 * 상품의 사진을 앞에서부터 채운다.
 *
 * ── 2026-10-19 디자이너 요청 ───────────────────────────
 * 텍스트를 뺀 자리만큼 사진을 키운다(시안 287×392 → 높이 540, 폰 360 · 비율 그대로). 사이는 10px 그대로.
 * 사진이 가로로 흐른다 — 레퍼런스처럼 스크롤과 상관없이 저절로, 1초에 약 66px. 같은 줄을 두 번 이어 붙이고
 * 절반(-50%)만큼 옮긴 뒤 처음으로 돌아가 끊김이 없다. 마우스를 올리면 멈춘다. 움직임 줄이기면 멈춘 채 옆으로 넘겨 본다.
 * 빈칸은 회색으로 두지 않는다 — 있는 사진을 돌려 채운다(한 줄이 화면보다 길어야 흐름이 끊기지 않아 최소 8장).
 * 사진이 한 장도 없을 때만 시안의 회색 칸을 멈춘 채 둔다.
 */

const LINE_BY_SLUG: Record<string, ProductLine> = { leone: "LEONE", ferito: "FERITO" };

/** 가이드가 적은 순서(수트 · 셔츠 · 팬츠 · 자켓) 뒤에 나머지 분류를 잇는다. */
const CATEGORY_ORDER: Category[] = ["SUIT", "SHIRT", "TROUSERS", "JACKET", "SHOES", "ACCESSORIES"];

const TILE_COUNT = 5;
/** 흐르는 줄 한 벌의 최소 장수 — 넓은 화면(2560)보다 길어야 이어 붙인 자리가 보이지 않는다 */
const FLOW_MIN = 8;
/** 한 장(사진 + 10px)이 지나가는 시간(초) — 넓은 화면에서 1초에 약 66px(레퍼런스와 같은 속도) */
const FLOW_SECONDS_PER_TILE = 6;

export function generateStaticParams() {
  return Object.keys(LINE_BY_SLUG).map((line) => ({ line }));
}

export async function generateMetadata({ params }: PageProps<"/line/[line]">): Promise<Metadata> {
  const { line } = await params;
  const key = LINE_BY_SLUG[line];
  if (!key) return {};
  const label = LINE_LABEL[key];
  return shareMetadata({
    title: `${label.en} · ${label.ko}`,
    description: `레오네페리토 ${label.kind} 라인 ${label.en}(${label.ko}) — ${LINE_INTRO[key].tagline}. ${LINE_INTRO[key].body[0]}`,
    path: `/line/${line}/`,
  });
}

export default async function LinePage({ params }: PageProps<"/line/[line]">) {
  const { line } = await params;
  const key = LINE_BY_SLUG[line];
  if (!key) notFound();

  const label = LINE_LABEL[key];
  const intro = LINE_INTRO[key];
  const products = (await getCatalog()).filter((p) => p.line === key);
  // 다섯 칸: 관리자가 올린 사진(/admin/display/line, V22) 먼저, 빈 칸은 그 라인 상품 사진으로, 그것도 없으면 회색 칸
  const slots = lineSlots(await getSiteImages(), key);
  const fallback = products.flatMap((p) => p.images);
  let used = 0;
  const photos = slots.map((s) => s ?? fallback[used++] ?? null);
  // 흐르는 줄 — 빈칸 없이 있는 사진을 돌려 최소 FLOW_MIN 장으로
  const real = photos.filter((p): p is NonNullable<(typeof photos)[number]> => p !== null);
  const flow = real.length === 0 ? [] : Array.from({ length: Math.max(FLOW_MIN, real.length) }, (_, i) => real[i % real.length]);
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: products.filter((p) => p.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <Header tone="wine" />

      {/* 페이지 전체가 검정 — on-black 이 글자 · 선 토큰을 검정 위 값으로 맞춘다(globals.css) */}
      {/* 첫 화면(머리 + 사진 흐름)만 검정, 상품 목록은 흰 바탕 — 2026-10-20 디자이너 "타고 들어왔을 때 이 부분은 배경이 흰색" */}
      <main id="main" className="flex-1">
        {/* ── 1 머리 + 2 사진 흐름 — 검정 ── */}
        <section aria-labelledby="line-heading" className="on-black">
          {/* 뒤로 가기 — 헤더 바로 아래 왼쪽 끝(시안의 화살표 자리). 헤더와 같은 옆 여백 */}
          <div className="px-3 pt-4 md:px-8 md:pt-6">
            <BackButton />
          </div>

          <div className="mx-auto max-w-[1320px] px-5 pb-12 text-center md:px-15 md:pb-16">
            {/* 작은 라벨 — 시안: 라인 이름과 같은 글꼴, 굵게, 10px 대문자 */}
            <p className="font-display text-primary text-[12px] uppercase tracking-[0.2em] md:text-[16px]">{intro.label}</p>
            <h1
              id="line-heading"
              className="font-display tracking-display mt-4 text-[56px] leading-none text-[#B84040] md:mt-7 md:text-[80px] lg:text-[96px]"
            >
              {label.en}
            </h1>
            {/* 한 줄 제목 — 시안처럼 크고 굵게(20 · PC 28), 이름과 사이를 넓게. 소개 14px 가늘게 · 행간 25px 은 그대로 */}
            <p className="font-display text-primary mt-12 text-[20px] leading-none md:mt-24 md:text-[28px]">{intro.tagline}</p>
            <p className="text-primary mt-3 text-[14px] font-light leading-[25px]">
              {intro.body.map((sentence) => (
                <span key={sentence} className="md:block">
                  {sentence}{" "}
                </span>
              ))}
            </p>
          </div>

          {/*
            사진 흐름 — 같은 줄을 두 번 이어 붙여 -50% 까지 옮기고 되돌아간다(globals.css .line-flow).
            사이 10px 은 칸마다 오른쪽 여백으로 준다 — flex gap 이면 이어 붙인 자리에서 한 번 빠져 이음매가 보인다.
            뒤쪽 한 벌은 화면 낭독기에 숨긴다(같은 사진을 두 번 읽지 않게).
          */}
          <div className="pb-16 md:pb-24">
            {flow.length > 0 ? (
              <div className="line-flow overflow-hidden" aria-label={`${label.en} 사진`}>
                <ul
                  className="line-flow-track flex w-max"
                  style={{ ["--line-flow-duration" as string]: `${flow.length * FLOW_SECONDS_PER_TILE}s` }}
                >
                  {[...flow, ...flow].map((photo, i) => {
                    const copy = i >= flow.length;
                    return (
                      <li key={i} aria-hidden={copy || undefined} data-copy={copy || undefined} className="shrink-0 pr-2.5">
                        <figure className="relative aspect-[287/392] h-[360px] overflow-hidden bg-[#D9D9D9] md:h-[540px]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={copy ? "" : photo.alt}
                            loading={i < 6 ? "eager" : "lazy"}
                            className="absolute inset-0 h-full w-full object-cover object-top"
                          />
                        </figure>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              /* 사진이 한 장도 없을 때 — 시안의 회색 칸, 멈춘 채 */
              <ul className="flex justify-center gap-2.5 overflow-hidden px-5">
                {Array.from({ length: TILE_COUNT }, (_, i) => (
                  <li key={i} className="shrink-0">
                    <div className="aspect-[287/392] h-[360px] bg-[#D9D9D9] md:h-[540px]" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── 3 상품 — 분류별로 쭉, 흰 바탕 위에 ── */}
        <div className="on-cream on-white">
        <div className="mx-auto max-w-[1320px] px-5 py-16 md:px-15 md:py-24">
          {groups.length > 0 ? (
            <div className="flex flex-col gap-20">
              {groups.map(({ category, items }) => (
                <section key={category} aria-labelledby={`line-${category}`}>
                  {/* 분류 이름은 영문 하나 — 눈썹 선 · 한글 이름은 뺐다 (2026-10-17) */}
                  <h2
                    id={`line-${category}`}
                    className="font-display text-primary leading-display tracking-display text-3xl"
                  >
                    {CATEGORY_LABEL[category].en}
                  </h2>
                  <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
                    {items.map((p) => (
                      <li key={p.slug}>
                        <ProductCard product={p} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
              <h2 className="text-secondary text-sm font-normal">{label.ko}의 상품을 준비하고 있습니다.</h2>
              <Link
                href="/products/"
                className="border-interactive text-accent hover:border-accent hover:bg-accent-tint ease-fluid tracking-button inline-flex min-h-11 items-center rounded-full border px-6 text-xs transition-all duration-500"
              >
                전체 제품 보기
              </Link>
            </div>
          )}
        </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

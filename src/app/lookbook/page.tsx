import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CATEGORY_NAV, CATEGORY_SUBS, categoryHref, subHref } from "@/data/categories";
import { getCatalog } from "@/lib/catalog";
import { getSiteImages } from "@/lib/siteImages";
import { shareMetadata } from "@/lib/metadata";
import type { Category, Product, ProductLine } from "@/types/product";

/**
 * 룩북 (요구사항 2-3).
 *
 * 사진이 주인공이고 글자는 최소다. 와인 면 위에 버건디 촬영 원본이 놓인다 — 한 공기.
 *
 * ── 격자는 잠정이다 ─────────────────────────────────────
 * "큰 컷 + 작은 컷" 의 리듬만 잡아 둔 것이다. 룩북 촬영본이 오면 컷의 비율과 수량을
 * 보고 다시 짠다. 지금 사진은 제품 촬영본으로 자리를 채운 것이다.
 *
 * ── THE LOOKBOOK (2026-10-06 고객 사이트 구조표) ──────────
 * 두 컬렉션으로 나눈다 — 헤더 드롭다운이 각 구간(#leone · #ferito)으로 바로 온다.
 * 컬렉션 이름과 설명은 구조표 그대로다.
 *
 * ── 컷 위에 마우스를 올리면 (2026-10-05 디자인 가이드) ──────
 * "마우스 올리면 약간 어두워지면서 해당 이미지의 제품 카테고리가 보여짐" · "클릭하면 해당 제품 판매 페이지로 이동".
 * 가이드 그림 그대로 사진이 어두워지며 **카테고리 목록**(수트 · 셔츠 · 자켓 · 팬츠 · acc + 화살표)이 나온다.
 * 각 줄은 그 룩에 그 분류의 상품이 연결돼 있으면 **그 상품 판매 페이지**, 아직 없으면 **그 분류 페이지**로 간다
 * (수트 · 셔츠 · 자켓은 그 컬렉션의 라인 — 레오네=Classic, 페리토=Athletic — 으로 거른 주소).
 * 키보드로 초점이 들어와도 같은 판이 열린다.
 * 마우스가 없는 화면(휴대폰)은 올릴 수가 없으니, 사진 아래에 같은 목록을 작게 둔다.
 * 카탈로그에 없는(아직 공개 전) 상품은 목록에서 빠진다 — 눌러서 404 가 나면 고장으로 읽힌다.
 *
 * TODO(고객확인) 룩북 촬영본 · 엠버서더/모델 구분 · **컷마다 어떤 상품을 입었는지**(지금은 제품 촬영본이라
 * 그 사진의 상품만 이어 둔다).
 */

export const metadata: Metadata = shareMetadata({
  title: "룩북",
  description: "레오네 페리토 룩북 — LEONE · FERITO 컬렉션 스타일링.",
});

interface Cut {
  src: string;
  alt: string;
  span: string;
  /** 이 룩에 쓰인 상품 slug — 마우스를 올리면 분류가 보이고 누르면 그 상품으로 간다 */
  products: string[];
}

/** 컬렉션 둘 — 이름 · 설명은 구조표 그대로. 컷은 촬영본이 오기 전까지 제품 촬영본으로 자리를 잡는다 */
const COLLECTIONS: { id: string; key: ProductLine; title: string; line: string; description: string; cuts: Cut[] }[] = [
  {
    id: "leone",
    key: "LEONE",
    title: "LEONE COLLECTION",
    line: "레오네 라인",
    description: "전통적인 남성 포멀웨어의 기준과 클래식한 실루엣을 중심으로 한 라인.",
    cuts: [
      { src: "/products/photo-black-shirt.webp", alt: "레오네 클래식 룩 — 블랙 셔츠 전신", span: "md:col-span-7", products: ["black-shirt"] },
      { src: "/products/photo-white-shirt.webp", alt: "레오네 클래식 룩 — 화이트 셔츠 전신", span: "md:col-span-5", products: ["white-shirt"] },
    ],
  },
  {
    id: "ferito",
    key: "FERITO",
    title: "FERITO COLLECTION",
    line: "페리토 라인",
    description: "발달된 체형과 남성적인 실루엣을 강조하는 애슬레틱 포멀웨어 라인.",
    cuts: [
      { src: "/products/photo-brown-shirt.webp", alt: "페리토 애슬레틱 룩 — 브라운 셔츠 전신", span: "md:col-span-5", products: ["brown-cotton-shirt", "brown-shirt"] },
      { src: "/products/photo-grey-shirt.webp", alt: "페리토 애슬레틱 룩 — 그레이 셔츠 전신", span: "md:col-span-7", products: ["grey-shirt"] },
    ],
  },
];

/** 가이드에 그려진 순서와 표기 그대로 — 수트 · 셔츠 · 자켓 · 팬츠 · ACC */
const LOOK_CATEGORIES: { category: Category; label: string }[] = [
  { category: "SUIT", label: "수트" },
  { category: "SHIRT", label: "셔츠" },
  { category: "JACKET", label: "자켓" },
  { category: "TROUSERS", label: "팬츠" },
  { category: "ACCESSORIES", label: "ACC" },
];

/**
 * 룩 한 장의 카테고리 버튼 — 가이드 그림 그대로: 사진 가운데, 와인색 반투명 판 · 옅은 와인 테두리 ·
 * 살짝 둥근 모서리, 크림빛 금색 글자와 긴 화살표(⟶). 이 버튼만은 사이트의 직각 규칙의 예외다(2026-10-06 요청).
 * 주소는 lookLinks 가 정한다.
 */
function LookCategories({ links, tone }: { links: { label: string; href: string }[]; tone: "overlay" | "below" }) {
  return (
    // below(폰): 다섯 개를 한 줄에 — 같은 폭의 칸 다섯, 글자 · 화살표를 줄여 넣는다 (2026-10-08 고객 요청)
    <ul className={tone === "overlay" ? "flex w-36 flex-col gap-2.5 md:w-40" : "mt-3 grid grid-cols-5 gap-1.5"}>
      {links.map((l) => (
        <li key={l.label} className="min-w-0">
          <Link
            href={l.href}
            className={`ease-fluid group/item flex min-h-11 items-center justify-center rounded-[6px] border transition-colors duration-300 ${
              tone === "overlay"
                ? "gap-4 border-[#B0505C]/55 bg-[rgba(110,18,30,0.72)] px-4 text-[#F1DFB0] hover:border-[#D0707A]/80 hover:bg-[rgba(140,26,40,0.85)]"
                : "border-interactive text-secondary hover:border-accent hover:text-accent gap-1 px-1.5"
            }`}
          >
            <span className={tone === "overlay" ? "text-sm" : "text-xs"}>{l.label}</span>
            {/* 글리프(⟶)는 폴백 글꼴에서 색을 잃어 아이콘으로 그린다 — 글자색(currentColor)을 그대로 따른다 */}
            <ArrowRight
              size={tone === "overlay" ? 18 : 12}
              weight="light"
              aria-hidden="true"
              className="ease-fluid shrink-0 transition-transform duration-300 group-hover/item:translate-x-1"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function LookbookPage() {
  const catalog = await getCatalog();
  // 관리자가 올린 컷(사이트 사진 칸 LOOKBOOK_*, V23)이 있으면 그것, 없으면 코드의 임시 컷
  const site = await getSiteImages();
  const cutSrc = (line: ProductLine, i: number, c: Cut) => {
    const s = site[`LOOKBOOK_${line}_${i + 1}` as "LOOKBOOK_LEONE_1" | "LOOKBOOK_LEONE_2" | "LOOKBOOK_FERITO_1" | "LOOKBOOK_FERITO_2"];
    return s ? { src: s.url, alt: s.alt || c.alt } : { src: c.src, alt: c.alt };
  };
  const bySlug = new Map(catalog.map((p) => [p.slug, p]));
  /*
    카테고리마다 갈 곳: 그 룩에 연결한 상품 중 그 분류가 있으면 그 상품 페이지, 없으면 그 분류 페이지.
    (2026-10-07 Classic / Athletic 세부 메뉴를 빼서 분류 페이지는 거르지 않은 전체다. 컬렉션 이름에서도 그 단어를 뺐다)
    TODO(고객확인) 컷마다 실제로 입은 상품 slug — 채우면 그 줄이 상품 판매 페이지로 바로 간다.
  */
  const lookLinks = (c: Cut, line: ProductLine) => {
    const worn = c.products.map((slug) => bySlug.get(slug)).filter((p): p is Product => p !== undefined);
    return LOOK_CATEGORIES.map(({ category, label }) => {
      const product = worn.find((p) => p.category === category);
      if (product) return { label, href: `/products/${product.slug}/` };
      const nav = CATEGORY_NAV.find((n) => n.category === category)!;
      const sub = (CATEGORY_SUBS[category] ?? []).find((x) => x.line === line);
      return { label, href: sub ? subHref(nav.slug, sub.slug) : categoryHref(nav.slug) };
    });
  };


  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        {/* 와인 면 — 제목과 사진이 한 면에 있다. 룩북은 제목 띠를 따로 나누지 않는다. */}
        <section className="bg-stage" aria-labelledby="lookbook-heading">
          <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-15 md:py-16">
            <Eyebrow>THE LOOKBOOK</Eyebrow>
            <h1
              id="lookbook-heading"
              className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl"
            >
              룩북
            </h1>

            {COLLECTIONS.map((col, ci) => (
              <section
                key={col.id}
                id={col.id}
                aria-labelledby={`${col.id}-heading`}
                className="border-velvet/40 mt-12 scroll-mt-20 border-t pt-10 md:mt-16 md:scroll-mt-24 md:pt-14"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-10">
                  <div>
                    <p className="text-accent text-2xs tracking-label">{col.line}</p>
                    <h2
                      id={`${col.id}-heading`}
                      className="font-display text-primary leading-display tracking-display mt-2 text-2xl md:text-3xl"
                    >
                      {col.title}
                    </h2>
                  </div>
                  <p className="text-secondary max-w-[44ch] text-sm leading-relaxed">{col.description}</p>
                </div>

                <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-12">
                  {col.cuts.map((c, i) => {
                    const links = lookLinks(c, col.key);
                    return (
                      // 폰에서는 컬렉션마다 첫 컷 하나만 보인다 (2026-10-08 고객 요청) — PC 는 전부
                      <li key={c.src} className={`min-w-0 ${c.span} ${i > 0 ? "hidden md:block" : ""}`}>
                        <Reveal delay={i * 60}>
                          <div className="group/look bg-velvet-deep relative aspect-[4/5] overflow-hidden md:aspect-[4/3]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cutSrc(col.key, i, c).src}
                              alt={cutSrc(col.key, i, c).alt}
                              loading={ci === 0 ? "eager" : "lazy"}
                              className="ease-fluid absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover/look:scale-[1.03]"
                            />
                            {links.length > 0 && (
                              /* 마우스 · 키보드 초점이 들어오면 어두워지며 카테고리 목록이 나온다. 휴대폰은 아래 목록을 쓴다 */
                              <div className="ease-fluid pointer-events-none absolute inset-0 hidden flex-col items-center justify-center bg-[rgba(10,3,5,0)] p-5 opacity-0 transition-all duration-500 group-focus-within/look:pointer-events-auto group-focus-within/look:bg-[rgba(10,3,5,0.5)] group-focus-within/look:opacity-100 group-hover/look:pointer-events-auto group-hover/look:bg-[rgba(10,3,5,0.5)] group-hover/look:opacity-100 md:flex md:p-7">
                                <p className="sr-only">이 룩의 제품</p>
                                <LookCategories links={links} tone="overlay" />
                              </div>
                            )}
                          </div>
                          {links.length > 0 && (
                            <div className="md:hidden">
                              <LookCategories links={links} tone="below" />
                            </div>
                          )}
                        </Reveal>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            {/* TODO(고객확인) 룩북 촬영본이 오면 이 문장은 빠진다 */}
            <p className="text-secondary mt-8 text-xs">
              룩북 촬영 예정 · 지금 보이는 컷은 제품 촬영본입니다.
            </p>
          </div>
        </section>

        <div className="on-cream">
          <div className="mx-auto flex max-w-[1320px] flex-col items-start gap-4 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-15 md:py-16">
            <p className="text-secondary max-w-[46ch] text-sm leading-relaxed">
              룩에 쓰인 옷은 컬렉션에서 사이즈별 상세 실측과 함께 보실 수 있습니다.
            </p>
            <Link
              href="/products"
              className="bg-accent text-on-accent hover:bg-accent-hover shadow-button ease-fluid tracking-button inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm transition-all duration-500 hover:-translate-y-px"
            >
              컬렉션 보기
              <ArrowRight size={13} weight="light" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import { ChatCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { OfflineShop } from "@/components/home/OfflineShop";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/motion/Reveal";
import { Scene } from "@/components/motion/Scene";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SLOGAN } from "@/data/brand";
import { KAKAO_CHANNEL } from "@/data/business";
import { shareMetadata } from "@/lib/metadata";
import { getSiteImages } from "@/lib/siteImages";

/**
 * 브랜드 가치관 (요구사항 2-1) — 스크롤 스토리텔링.
 *
 * 정보를 전달하는 페이지가 아니라 **감정을 남기는 페이지**다. 그래서 한 화면에 한 가지만 두고,
 * 스크롤이 페이지를 넘기는 게 아니라 **장면을 진행**시킨다 (components/motion/Scene — 진행도 `--p`,
 * 움직임은 globals.css 의 .brand-* 규칙). 글은 전부 BRAND_BRIEF.md 1-1 의 고객 전달 문안 그대로다.
 *
 * THE MAISON (2026-10-06 고객 사이트 구조표) — 헤더 드롭다운이 이 페이지의 구간으로 바로 간다:
 *   #beginning   THE BEGINNING   브랜드가 시작된 배경        — TODO(고객확인) 본문. 지금은 자리만
 *   #philosophy  OUR PHILOSOPHY  브랜드의 철학과 가치관      — TODO(고객확인) 본문. 지금은 자리만
 *   #identity    OUR IDENTITY    브랜드가 추구하는 정체성    — 슬로건 · 키워드 · 사진 · 첫인상 (고객 전달 문안)
 *   #symbol      OUR SYMBOL      브랜드명 · 로고의 상징      — 모노그램 · 워드마크. TODO(고객확인) 의미 설명
 *   #tailoring   THE TAILORING   오프라인 테일러샵 안내      — OFFLINE SHOP (지도)
 * 구조표 순서는 TAILORING 이 SYMBOL 앞이지만, 지도는 페이지 맨 끝에 두기로 해서(2026-10-06) 마지막에 둔다.
 * 비어 있는 두 구간은 글을 지어 넣지 않는다 — 브랜드의 이야기는 고객이 정한다.
 *
 * 장면 순서
 *   1 빅 히어로   — 워드마크 · 사진 · 표제가 서로 다른 깊이에 있고 카메라가 밀고 들어간다. 마우스에도 기운다
 *   ─ THE BEGINNING · OUR PHILOSOPHY (자리)
 *   2 슬로건      — 두 문장의 낱말이 스크롤을 따라 금빛 잔불에서 크림으로 하나씩 켜진다
 *   3 키워드      — 열한 낱말이 두 줄 띠로 서로 반대 방향으로 흐른다 (크림)
 *   4 사진        — 깊이가 다른 사진 셋이 가리개를 걷으며 다른 속도로 지나간다
 *   5 첫인상      — "나도 저렇게 되고 싶다" 가 흩어진 자간을 모으며 깊은 곳에서 떠오른다
 *   6 맺음        — 모노그램 · 워드마크 · 컬렉션으로 · 카카오톡 채널 홈 안내
 *   7 매장        — OFFLINE SHOP. 고정된 구글 지도 · 주소 · 운영시간 · 방문 문의(카카오톡)
 *
 * 3D 는 CSS perspective 뿐이다 — 번들에 더해지는 것이 없다. 무거우면 globals.css 의 "3d" 줄만 지운다.
 * JS 가 없거나 움직임을 줄인 사용자에게는 핀 없이 완성된 장면이 차례로 보인다.
 *
 * TODO(고객확인) 브랜드 촬영본. 지금 사진은 제품 촬영본으로 자리를 잡아 둔 것이다.
 */

export const metadata: Metadata = shareMetadata({
  title: "브랜드",
  description:
    "상위 0.1%의 남자. 잘 관리된 몸매와 외모, 섹시한 핏으로 소화하는 럭셔리 스타일.",
});

// 슬로건 두 줄은 data/brand.ts — 메인의 브랜드 구간과 같은 문장을 쓴다.

/** 고객 전달 키워드 그대로. 순서도 그대로 — 앞 여섯은 윗줄, 뒤 다섯은 아랫줄. */
const KEYWORDS = [
  "남성성",
  "섹시함",
  "우월감",
  "동경심",
  "퇴폐미",
  "경외심",
  "럭셔리",
  "품격",
  "고급",
  "초연함",
  "담대함",
];

const WORD_COUNT = SLOGAN.reduce((n, line) => n + line.split(" ").length, 0);

/** 장면 4 의 사진 — 깊이(--dy · --tilt)가 다 다르다. 자리는 아래 격자 클래스가 정한다. */
const GALLERY = [
  {
    src: "/products/photo-white-shirt.webp",
    alt: "화이트 셔츠를 입은 남성 모델의 전신",
    depth: { "--dy": "-140px", "--tilt": "7deg" },
    className: "md:order-1 md:col-span-7",
  },
  {
    src: "/products/photo-black-shirt.webp",
    alt: "블랙 셔츠를 입은 남성 모델의 전신",
    depth: { "--dy": "-300px", "--tilt": "-9deg" },
    className: "md:order-3 md:col-span-4 md:col-start-2 md:-mt-28",
  },
  {
    src: "/products/photo-grey-shirt.webp",
    alt: "그레이 셔츠를 입은 남성 모델의 전신",
    depth: { "--dy": "-220px", "--tilt": "6deg" },
    className: "md:order-4 md:col-span-5 md:col-start-8 md:mt-16",
  },
];

const css = (v: Record<string, string | number>) => v as React.CSSProperties;

/**
 * THE MAISON 의 장 하나 — 본문이 아직 없는 구간(THE BEGINNING · OUR PHILOSOPHY).
 * 제목과 구조표의 설명은 보이고, 본문 자리에는 준비 중임을 적는다. 글을 지어 넣지 않는다.
 */
function Chapter({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="bg-base border-subtle scroll-mt-14 border-t md:scroll-mt-18">
      <div className="mx-auto grid max-w-[1320px] gap-6 px-5 py-20 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16 md:px-15 md:py-28">
        <Reveal>
          <Eyebrow>THE MAISON</Eyebrow>
          <h2
            id={`${id}-heading`}
            className="font-display text-primary leading-display tracking-display mt-4 text-3xl md:text-4xl"
          >
            {title}
          </h2>
        </Reveal>
        <Reveal delay={100} className="md:pt-10">
          <p className="text-secondary text-sm leading-relaxed md:text-(length:--fs-base)">{description}</p>
          {/* TODO(고객확인) 본문 — 받으면 이 자리에 넣는다 */}
          <p className="text-muted border-subtle mt-6 border-t pt-6 text-xs">본문을 준비하고 있습니다.</p>
        </Reveal>
      </div>
    </section>
  );
}

/** 핀 장면 오른쪽 아래의 진행 눈금 (CSS 가 --p 로 채운다) */
const Rail = () => <i aria-hidden="true" className="brand-rail" />;

export default async function BrandPage() {
  // 관리자가 올린 사진(사이트 사진 칸 BRAND_*, V23)이 있으면 그것, 없으면 제품 촬영본 임시 컷
  const site = await getSiteImages();
  const heroSrc = site.BRAND_HERO?.url ?? "/products/photo-brown-shirt.webp";
  const impressionSrc = site.BRAND_IMPRESSION?.url ?? "/brand/tailoring.webp";
  const gallery = GALLERY.map((g, i) => {
    const s = site[`BRAND_PHOTO_${i + 1}` as "BRAND_PHOTO_1" | "BRAND_PHOTO_2" | "BRAND_PHOTO_3"];
    return s ? { ...g, src: s.url, alt: s.alt || g.alt } : g;
  });

  let wordIndex = 0;

  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        {/* ── 1 · 빅 히어로 ─────────────────────────────── */}
        <Scene
          pin
          pointer
          height="220vh"
          className="bg-stage"
          stageClassName="brand-hero-stage"
          aria-labelledby="brand-heading"
        >
          <div aria-hidden="true" className="brand-hero-glow" />

          {/* 맨 뒤 — 워드마크. 장식이라 이름을 비운다(표제가 브랜드를 말한다). 안쪽 띠가 금속 광택이다 */}
          <div
            aria-hidden="true"
            className="brand-hero-layer brand-hero-mark text-accent flex items-center justify-center"
            style={css({ "--z": "-600px", "--kx": "-18px", "--ky": "-10px" })}
          >
            <Logo fluid label="" className="w-[92vw] max-w-none">
              <i className="brand-shine" />
            </Logo>
          </div>

          {/*
            가운데 — 사진 액자. 1024 이상에서는 오른쪽에 두고 표제가 왼쪽 가장자리만 겹친다 (소실점도 그쪽, globals.css).
            그 아래 폭(태블릿 세로 포함)은 사진 가운데 · 표제 아래로 쌓는다 — 768 에서 나란히 두면 표제가 사람을 가린다.
          */}
          <div
            className="brand-hero-layer flex items-center justify-center pb-[6svh] lg:justify-end lg:pb-0 lg:pr-[12vw]"
            style={css({ "--z": "-220px", "--kx": "12px", "--ky": "8px" })}
          >
            {/* 좁은 화면은 사진을 조금 올려 아래 표제 · 스크롤 안내와 겹치지 않게 한다 */}
            <div className="brand-hero-card relative aspect-[4/5] h-[50svh] max-h-[760px] max-w-[86vw] lg:h-[66svh]">
              <div aria-hidden="true" className="brand-hero-ghost" />
              <div className="brand-hero-frame border-accent/35 h-full w-full border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroSrc}
                  alt="버건디 배경 앞에 선 남성 모델 — 브라운 셔츠와 블랙 트라우저"
                  className="h-full w-full object-cover object-top"
                />
              </div>
            </div>
          </div>

          {/* 맨 앞 — 표제. 1024 아래는 사진 아래, 그 위는 왼쪽에서 사진 가장자리와 겹친다. 크기는 폭을 따라 흐른다 */}
          <div
            className="brand-hero-layer brand-hero-copy flex flex-col justify-end px-5 pb-[15svh] lg:justify-center lg:px-15 lg:pb-0"
            style={css({ "--z": "0px", "--kx": "26px", "--ky": "14px" })}
          >
            <div className="overflow-hidden">
              <div className="brand-in" style={css({ "--d": "0.15s" })}>
                <Eyebrow>BRAND</Eyebrow>
              </div>
            </div>
            <h1
              id="brand-heading"
              className="font-display text-primary leading-hero tracking-hero mt-5 overflow-hidden text-[clamp(2.75rem,6.6vw,6rem)]"
            >
              <span className="brand-in block" style={css({ "--d": "0.35s" })}>
                상위 0.1%의 남자
              </span>
            </h1>
          </div>

          <div aria-hidden="true" className="brand-hero-veil bg-base pointer-events-none absolute inset-0" />

          <p
            aria-hidden="true"
            className="brand-hero-cue text-muted text-2xs tracking-label pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-3"
          >
            SCROLL
            <i className="bg-accent block h-10 w-px" />
          </p>
          <Rail />
        </Scene>

        {/* ── THE BEGINNING · OUR PHILOSOPHY — 본문을 받으면 채운다 ── */}
        <Chapter id="beginning" title="THE BEGINNING" description="브랜드가 시작된 배경" />
        <Chapter id="philosophy" title="OUR PHILOSOPHY" description="브랜드의 철학과 가치관" />

        {/* ── 2 · 슬로건 — 여기부터 첫인상까지가 OUR IDENTITY ─────────── */}
        <Scene
          id="identity"
          pin
          height="260vh"
          className="bg-base scroll-mt-14 md:scroll-mt-18"
          stageClassName="flex items-center overflow-hidden"
          aria-labelledby="slogan-heading"
        >
          <div className="brand-tilt mx-auto w-full max-w-[1320px] px-5 md:px-15">
            <Eyebrow>OUR IDENTITY · 슬로건</Eyebrow>
            <h2 id="slogan-heading" className="sr-only">
              브랜드 슬로건
            </h2>
            {/* 문장마다 블록 + balance — 줄 끝에 낱말 하나만 남지 않는다 */}
            <p
              className="font-display text-primary tracking-display mt-8 max-w-[30ch] text-[1.75rem] leading-[1.32] md:mt-10 md:text-[2.9rem]"
              style={css({ "--n": WORD_COUNT })}
            >
              {SLOGAN.map((line, li) => (
                <span key={li} className={`block [text-wrap:balance] ${li > 0 ? "mt-[0.7em]" : ""}`}>
                  {line.split(" ").map((word) => {
                    const i = wordIndex++;
                    return (
                      <span key={i}>
                        <span className="brand-word" style={css({ "--i": i })}>
                          {word}
                        </span>{" "}
                      </span>
                    );
                  })}
                </span>
              ))}
            </p>
          </div>
          <Rail />
        </Scene>

        {/* ── 3 · 키워드 (크림) ───────────────────────────── */}
        <div className="on-cream">
          <Scene
            pin
            height="200vh"
            stageClassName="flex flex-col justify-center overflow-hidden"
            aria-labelledby="keywords-heading"
          >
            <div className="mx-auto w-full max-w-[1320px] px-5 md:px-15">
              <Eyebrow>02 · 키워드</Eyebrow>
              <h2
                id="keywords-heading"
                className="font-display text-primary leading-display tracking-display mt-3 text-2xl md:text-3xl"
              >
                이 브랜드가 지향하는 것
              </h2>
            </div>

            <div className="brand-ribbon mt-10 md:mt-16">
              <div className="brand-drift flex flex-col gap-2 px-5 md:gap-4 md:px-15">
                {[KEYWORDS.slice(0, 6), KEYWORDS.slice(6)].map((row, r) => (
                  <ul
                    key={r}
                    className={`brand-row ${r === 0 ? "brand-row-a" : "brand-row-b"} font-display text-primary leading-none tracking-display text-[3rem] md:text-[6.5rem]`}
                  >
                    {row.map((k, i) => (
                      <li key={k} className="flex items-baseline gap-[0.55em]">
                        {/* 낱말 사이 점 — 첫 낱말 앞에는 없다 */}
                        {i > 0 && (
                          <span aria-hidden="true" className="bg-accent inline-block h-[0.12em] w-[0.12em] shrink-0 rounded-full" />
                        )}
                        {k}
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
            <Rail />
          </Scene>
        </div>

        {/* ── 4 · 사진 — 사진마다 자기 장면(view) 이라 각자 화면을 지나는 진행도로 움직인다 ── */}
        <section className="bg-base" aria-labelledby="impression-heading">
          <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-15 md:py-40">
            <div className="grid gap-10 md:grid-cols-12 md:gap-x-8 md:gap-y-0">
              <div className="md:order-2 md:col-span-5 md:self-center md:pl-6">
                <Reveal>
                  <Eyebrow>03 · 입은 사람</Eyebrow>
                </Reveal>
                <Reveal delay={80}>
                  <h2
                    id="impression-heading"
                    className="font-display text-primary leading-display tracking-display mt-3 text-2xl md:text-[2.25rem]"
                  >
                    옷을 설명하는 대신,
                    <br />
                    입은 사람을 보여드립니다.
                  </h2>
                </Reveal>
              </div>

              {gallery.map((g) => (
                <Scene key={g.src} as="figure" className={`brand-float ${g.className}`} style={css(g.depth)}>
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.src} alt={g.alt} loading="lazy" className="h-full w-full object-cover" />
                    <div aria-hidden="true" className="brand-cover" />
                  </div>
                </Scene>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5 · 첫인상 ─────────────────────────────────── */}
        <Scene
          pin
          height="200vh"
          className="bg-stage"
          stageClassName="flex items-center overflow-hidden"
          aria-labelledby="quote-heading"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={impressionSrc}
            alt=""
            loading="lazy"
            className="brand-quote-bg absolute inset-0 h-full w-full object-cover"
          />
          {/* 사진을 가라앉혀 글자를 지킨다 — 가운데가 가장 어둡다 */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in srgb, var(--velvet-stage) 55%, transparent), color-mix(in srgb, var(--velvet-stage) 82%, transparent) 50%, color-mix(in srgb, var(--velvet-stage) 92%, transparent))",
            }}
          />

          <div className="brand-depth relative mx-auto w-full max-w-[1320px] px-5 md:px-15">
            <h2 id="quote-heading" className="sr-only">
              첫인상으로 남겨야 하는 것
            </h2>
            <div className="brand-surface" style={css({ "--from": 0, "--to": 0.16 })}>
              <Eyebrow>04 · 첫인상</Eyebrow>
            </div>
            <i aria-hidden="true" className="brand-line mt-7 md:mt-9" style={css({ "--from": 0.06, "--to": 0.26 })} />
            <blockquote className="font-display text-primary leading-display mt-7 text-[2.1rem] md:mt-9 md:text-[4.25rem]">
              <p className="brand-surface brand-surface-text" style={css({ "--from": 0.1, "--to": 0.4 })}>
                &ldquo;와, 나도 저렇게 되고 싶다.
              </p>
              <p className="brand-surface brand-surface-text" style={css({ "--from": 0.3, "--to": 0.6 })}>
                저 사람처럼 되고 싶다.&rdquo;
              </p>
            </blockquote>
            <p
              className="brand-surface text-secondary mt-8 max-w-[44ch] text-sm leading-relaxed md:mt-10 md:text-(length:--fs-base)"
              style={css({ "--from": 0.58, "--to": 0.82 })}
            >
              레오네 페리토가 남기려는 첫인상은 이 한 문장입니다.
            </p>
          </div>
          <Rail />
        </Scene>

        {/* ── 6 · 맺음 = OUR SYMBOL — 모노그램과 워드마크 ──────────────── */}
        <section
          id="symbol"
          className="bg-base border-subtle scroll-mt-14 border-t md:scroll-mt-18"
          aria-labelledby="closing-heading"
        >
          <div className="mx-auto flex max-w-[1320px] flex-col items-center px-5 py-24 text-center md:py-36">
            <Reveal>
              <Eyebrow className="mb-10 justify-center">OUR SYMBOL</Eyebrow>
            </Reveal>
            <Reveal>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/leoneferito-monogram.webp" alt="" width={64} height={72} className="h-[72px] w-auto" />
            </Reveal>
            <Reveal delay={80}>
              <h2 id="closing-heading" className="text-primary mt-8">
                <Logo width={240} />
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="text-secondary mt-6 max-w-[40ch] text-sm leading-relaxed md:text-(length:--fs-base)">
                운동으로 달라진 체형을 위한 남성 기성복.
              </p>
              {/* TODO(고객확인) 브랜드명(LEONE · FERITO) · LF 모노그램의 의미 — 받으면 이 자리에 */}
              <p className="text-muted mt-4 text-xs">브랜드명과 로고에 담긴 의미를 준비하고 있습니다.</p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link
                  href="/products/"
                  className="bg-accent text-on-accent hover:bg-accent-hover shadow-button hover:shadow-button-hover tracking-button ease-fluid inline-flex min-h-12 items-center rounded-full px-7 text-sm transition-all duration-500 hover:-translate-y-px active:scale-[0.98]"
                >
                  컬렉션 보기
                </Link>
                <Link
                  href="/guide"
                  className="tracking-button ease-fluid border-primary/45 text-primary hover:border-primary inline-flex min-h-12 items-center rounded-full border px-7 text-sm transition-all duration-500 active:scale-[0.98]"
                >
                  이용 안내
                </Link>
              </div>
            </Reveal>

            {/*
              카카오톡 채널 홈 안내 — 퀵메뉴 · QnA 는 1:1 채팅으로 바로 가지만, 여기는 브랜드를 다 본 사람에게
              "채널을 추가해 소식을 받으라" 는 자리라 채널 홈(소개 · 소식 · 친구 추가)으로 보낸다.
            */}
            <Reveal delay={320}>
              <div className="border-subtle mt-14 flex w-full max-w-md flex-col items-center gap-4 border-t pt-10">
                <p className="text-secondary text-sm leading-relaxed">
                  카카오톡 채널 <b className="text-primary">{KAKAO_CHANNEL.name}</b>을 추가하시면
                  <br />
                  새 소식을 받아보실 수 있습니다.
                </p>
                <a
                  href={KAKAO_CHANNEL.home}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ease-fluid inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#FEE500] px-6 text-sm font-medium text-[#191919] transition-all duration-500 hover:-translate-y-px hover:bg-[#F5DC00] active:scale-[0.98]"
                >
                  <ChatCircle size={18} weight="fill" aria-hidden="true" />
                  카카오톡 채널 바로가기
                  <span className="sr-only">(새 창)</span>
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── 7 · 매장 — 메인과 같은 OFFLINE SHOP 구간, 사진 대신 고정된 구글 지도 ── */}
        <div id="tailoring" className="on-cream scroll-mt-14 md:scroll-mt-18">
          <OfflineShop map />
        </div>
      </main>

      <Footer />
    </>
  );
}

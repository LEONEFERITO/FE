import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { Scene } from "@/components/motion/Scene";
import { CATEGORY_LABEL, LINE_LABEL, type Product, type ProductPhoto } from "@/types/product";

/**
 * 히어로 — 가운데 한 컷, 스크롤하면 양옆 디테일 컷이 밀려 들어오는 무대 (2026-10-04, 고객 레퍼런스: TNGT).
 *
 * ── 구성 ───────────────────────────────────────────────
 * 밝은 종이 위에 거대한 워드마크, 그 앞에 누끼 인물 한 명. 왼쪽 아래 · 오른쪽 위에 액자 컷 둘.
 * 레퍼런스처럼 액자가 인물과 살짝 겹친다 — 겹쳐야 한 장의 화보로 읽히고, 떨어뜨리면 썸네일 셋이 된다.
 *
 * ── 어떻게 움직이나 ─────────────────────────────────────
 * 처음에는 **인물만** 있다. 글자(이름·가격·버튼)는 처음부터 있다 — 첫 화면에 물건이 보여야 한다는
 * 분할형 히어로의 원칙은 그대로다. 움직이는 건 사진뿐이다.
 *
 * 구간은 Scene 이 붙잡아 둔다(pin). 래퍼는 220vh, 안쪽 무대는 한 화면에 머물고, 지나는 스크롤량이
 * `--p`(0~1) 다. 액자는 화면 아래에서 올라온다(페이드 없음) — 왼쪽이 0.06~0.42, 오른쪽이 0.30~0.68. 0.68 부터 1 까지는
 * 완성된 그림을 **들고 있다가** 래퍼가 끝나면 다음 구간으로 넘어간다 — "다 나올 때까지 홀드".
 * 연출 자체는 CSS 가 한다 (globals.css .hero-reveal-*). React 는 프레임마다 아무것도 안 한다.
 *
 * ── 디테일 컷은 어디서 오나 ─────────────────────────────
 * 서버 상품의 두 번째 · 세 번째 사진(WORN · DETAIL)이다. 아직 한 장뿐인 상품은 그 한 장을
 * 다른 위치로 잘라 쓴다 — 위(칼라·어깨)와 가운데(소매·허리). 레퍼런스의 액자 컷도 같은 촬영본의
 * 크롭이라 어색하지 않다. TODO(고객확인) 히어로용 디테일 컷 2장 (세로 4:5).
 *
 * ── 크림 면인 이유 ───────────────────────────────────────
 * 레퍼런스가 밝은 종이다. 누끼 인물은 어두운 와인 위에서는 배경과 싸우지만 크림 위에서는
 * 혼자 선다. 토큰은 .on-cream 으로 뒤집는다 — 아래 WHY 구간과 같은 방식이고, 색을 새로 만들지 않는다.
 * (면 순서: 히어로 크림 → WHY 크림 이 이어진다. 와인 면은 그 다음 카테고리에서 돌아온다.)
 *
 * ── JS 가 없거나 움직임을 줄인 사용자 ───────────────────
 * 핀을 걸지 않고 액자 둘 다 제자리에 있는 **완성된 한 화면**이다. 콘텐츠가 사라지는 연출은 없다.
 *
 * ── 넘기기(‹ ›)는 없다 ──────────────────────────────────
 * 분할형의 제품 넘기기는 여기 두지 않는다. 스크롤로 사진이 들어오는 도중에 제품이 바뀌면
 * 어느 사진이 어느 제품인지 흐트러진다. 한 룩을 보여주는 배너다 — 나머지 제품은 바로 아래 격자에 있다.
 */

const KRW = new Intl.NumberFormat("ko-KR");

/** 액자에 넣을 컷. 전용 사진이 없으면 대표 사진을 다른 자리로 잘라 쓴다. */
interface DetailCut {
  src: string;
  alt: string;
  /** object-position. 전용 컷은 가운데, 크롭 대체는 자리마다 다르다. */
  position: string;
}

function detailCuts(product: Product): [DetailCut, DetailCut] {
  const name = product.name ?? "제품";
  const [main, second, third] = product.images as (ProductPhoto | undefined)[];
  const fallback = main?.url ?? "";

  const left: DetailCut = second
    ? { src: second.url, alt: second.alt, position: "50% 50%" }
    : { src: fallback, alt: `${name} 디테일 — 칼라와 어깨선`, position: "50% 14%" };
  const right: DetailCut = third
    ? { src: third.url, alt: third.alt, position: "50% 50%" }
    : { src: fallback, alt: `${name} 디테일 — 소매와 허리선`, position: "50% 46%" };

  return [left, right];
}

function Frame({ cut, side, className }: { cut: DetailCut; side: "l" | "r"; className: string }) {
  return (
    <figure
      className={`hero-reveal-card hero-reveal-card-${side} bg-surface shadow-lift absolute aspect-[4/5] overflow-hidden p-1 md:p-1.5 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cut.src}
        alt={cut.alt}
        loading="eager"
        className="block h-full w-full object-cover"
        style={{ objectPosition: cut.position }}
      />
    </figure>
  );
}

export function HeroReveal({ product }: { product: Product }) {
  const name = product.name ?? "제품명 확인 중";
  const fit = LINE_LABEL[product.line];
  const figure = product.cutout ?? product.images[0]?.url;
  const [left, right] = detailCuts(product);

  return (
    /*
      래퍼의 음수 상단 마진은 헤더 높이만큼이다 (Hero.tsx 와 같은 이유). 끌어올린 만큼
      무대 안쪽 padding 으로 되돌린다. data-hero 는 헤더가 "히어로를 지났는가" 를 보는 표식 —
      값 "pin" 은 붙잡힌 무대라는 뜻 — 헤더는 무대가 풀려 위로 빠지기 시작하는 순간 원래 색으로 돌아온다
      (그 전에 돌아오지 않으면 빠져나가는 사진 위에 투명 헤더의 글자가 겹친다, 2026-10-07 모바일 점검).
    */
    <section data-hero="pin" className="on-cream -mt-[72px] md:-mt-[88px]">
      <Scene as="div" pin height="220vh" aria-label="대표 룩">
        <div className="relative flex h-full flex-col overflow-hidden px-5 pb-6 pt-[88px] md:px-10 md:pb-10 md:pt-[104px]">
          {/* 종이의 결 — 레퍼런스의 안개. 가운데가 아주 조금 밝다 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 42%, var(--bg-surface) 0%, transparent 70%)",
            }}
          />

          {/* 워드마크 — 인물 뒤. 화면보다 넓게 깔아 좌우가 살짝 잘린다(레퍼런스의 TNGT). */}
          <div
            aria-hidden="true"
            className="hero-reveal-mark pointer-events-none absolute inset-x-[-4%] top-[27%] text-primary opacity-[0.08] md:top-[21%]"
          >
            <Logo fluid label="" />
          </div>

          {/* 위 한 줄 — 이 페이지의 유일한 h1. 레퍼런스의 상단 영문 캡션 자리다. */}
          <h1 className="text-secondary relative z-10 text-center text-xs leading-relaxed md:text-sm">
            운동으로 달라진 체형을 위한 남성 기성복
          </h1>

          {/*
            이름 · 가격. 모바일은 h1 아래 가운데(인물과 겹치지 않게 무대 **밖**),
            데스크톱은 무대 왼쪽 중단 — 레퍼런스의 "사구싶은 가격" 자리. 인물과 액자 사이 여백이 넓다.
          */}
          <div className="relative z-10 mt-4 text-center md:absolute md:left-10 md:top-1/2 md:mt-0 md:max-w-[320px] md:-translate-y-[62%] md:text-left lg:left-[7%]">
            <p className="text-accent text-2xs tracking-label">
              {CATEGORY_LABEL[product.category].en}
              <span aria-hidden="true"> · </span>
              {fit.ko}
            </p>
            <p className="font-display text-primary leading-display tracking-display mt-2 line-clamp-2 text-xl md:mt-3 md:text-3xl lg:text-4xl">
              {name}
            </p>
            <p className="text-secondary mt-1.5 text-sm tabular-nums md:mt-3 md:text-lg">
              {product.priceKrw !== null ? <>{KRW.format(product.priceKrw)}원</> : "가격 문의"}
            </p>
          </div>

          {/* ── 무대. 인물 + 액자 둘. 남는 높이를 전부 쓴다 ──────────── */}
          <div className="relative z-10 mx-auto mt-4 min-h-0 w-full max-w-[1320px] flex-1 md:mt-0">
            {/* 인물 — 처음부터 있다. 그림자 · 발밑 타원은 걷었다(2026-10-06 그림자 전부 제거) */}
            <div className="absolute inset-x-0 bottom-0 flex h-full justify-center">
              <div className="relative h-full">
                {figure && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={figure}
                    alt={`${name} 착용 컷`}
                    loading="eager"
                    // 첫 화면의 가장 큰 그림 = LCP 후보. CSS 뒤로 밀리지 않게 우선순위를 올린다.
                    fetchPriority="high"
                    className="relative block h-full w-auto"
                  />
                )}
              </div>
            </div>

            {/* 액자 왼쪽 아래 · 오른쪽 위. 인물과 조금 겹친다 — 레퍼런스대로 */}
            {/* 모바일 폭은 레퍼런스 비율(화면의 약 1/3)에 맞췄다. 더 키우면 인물의 무릎·팔이 액자에 묻힌다 */}
            <Frame cut={left} side="l" className="bottom-[6%] left-0 w-[36%] md:bottom-[10%] md:left-[18%] md:w-[19%] lg:left-[22%]" />
            <Frame cut={right} side="r" className="right-0 top-[4%] w-[32%] md:right-[18%] md:top-[8%] md:w-[17%] lg:right-[22%]" />

            {/* 오른쪽 아래 캡션 — 레퍼런스의 "26FW 가을 아우터". 좁은 화면에서는 신발과 겹쳐 뺀다 */}
            <p className="text-secondary absolute bottom-0 right-0 hidden text-right text-xs leading-relaxed md:block lg:right-[4%]">
              <span className="font-display text-primary block text-lg">LEONE FERITO</span>
              {/* fit.ko 가 이미 "페리토 라인" 이다 — 뒤에 "라인" 을 또 붙이면 "라인 라인" 이 된다 */}
              {fit.ko} · {fit.kind}
            </p>
          </div>

          {/* 문 두 개. 모바일은 무대 아래 가운데, 데스크톱은 이름 블록 아래 왼쪽. 높이를 같게 고정한다(2026-10-06 요청 — 원형 화살표 때문에 왼쪽이 더 컸다) */}
          <div data-quick-avoid="" className="relative z-10 mt-5 flex flex-wrap items-center justify-center gap-3 md:absolute md:bottom-10 md:left-10 md:mt-0 md:justify-start lg:left-[7%]">
            <Link
              href={`/products/${product.slug}`}
              className="group bg-accent text-on-accent hover:bg-accent-hover shadow-button hover:shadow-button-hover tracking-button ease-fluid inline-flex h-11 items-center gap-2 rounded-full pl-5 pr-1.5 text-xs transition-all duration-500 hover:-translate-y-px active:scale-[0.98] md:h-12 md:gap-3 md:pl-6 md:pr-2 md:text-sm"
            >
              자세히 보기
              <span className="bg-on-accent/12 ease-fluid flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-500 group-hover:-translate-y-px group-hover:translate-x-1 group-hover:scale-105 md:h-8 md:w-8">
                <ArrowUpRight size={11} weight="light" aria-hidden="true" />
              </span>
            </Link>
            <Link
              href="/products"
              className="tracking-button ease-fluid border-strong hover:border-accent hover:text-accent hover:shadow-soft inline-flex h-11 items-center rounded-full border px-5 text-xs text-primary transition-all duration-500 active:scale-[0.98] md:h-12 md:px-6 md:text-sm"
            >
              전체 제품
            </Link>
          </div>

          {/* 스크롤 안내 — 움직이기 시작하면 걷힌다. JS 가 없으면 안내할 게 없다 */}
          <div
            aria-hidden="true"
            className="hero-reveal-cue text-muted pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-[0.65rem] tracking-label md:flex"
          >
            SCROLL
            <span className="bg-current block h-6 w-px" />
          </div>
        </div>
      </Scene>
    </section>
  );
}

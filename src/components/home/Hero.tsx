"use client";

import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/brand/Logo";

/**
 * 메인 히어로 — 워드마크가 바닥이 되는 무대.
 *
 * 구성: 거대한 워드마크가 인물의 정강이 뒤를 가로지르고, 신발은 글자 **아래**에 놓인다.
 * 그래서 글자가 배경이 아니라 인물이 딛고 선 바닥처럼 읽힌다.
 * 좌측에는 모노그램과 진입 버튼 하나만 둔다. 문이 여러 개면 아무 데도 안 들어간다.
 *
 * 워드마크를 키운 이유: 작게 두면 인물에 가려진 순간 브랜드가 읽히지 않는다.
 * 화면 폭만큼 키우면 일부가 가려져도 LEONE FERITO 로 읽힌다.
 *
 * 워드마크 색은 벨벳(버건디)이 아니라 **고동색**이다. 같은 계열의 어두운 버건디로
 * 두면 배경에 녹아 사라지고, 붉기가 없는 고동색이어야 색상 자체로 갈린다.
 *
 * 레이어(뒤 → 앞): 무대광 → 워드마크 → 접지 그림자 → 인물 → 바닥/비네트
 *
 * ── 스크롤 감지 ────────────────────────────────────────────
 * scroll 리스너를 쓰지 않는다. 한 번의 스크롤에 수십 번 발화하고,
 * 그 값을 React state 로 받으면 프레임마다 트리가 다시 렌더된다.
 *
 * 대신 핀 구간 안에 보이지 않는 표식(sentinel)을 심고, 그것이 화면 위로
 * 빠져나가는 것을 IntersectionObserver 가 알려준다.
 * 브라우저가 합성 단계에서 처리하므로 메인 스레드에 부담이 없다.
 *
 * 연출: **두 인물은 처음부터 그대로 있다.** 스크롤하면 나머지가 한꺼번에 올라온다 —
 * 좌측 블록(모노그램·버튼·문구)과 하단 워드마크.
 *
 * 인물을 하나씩 등장시켜 보았으나 버렸다. 이 구도에서 둘은 나란한 한 쌍이지
 * 주연과 조연이 아니다. 하나를 빼면 첫 화면이 왼쪽이 빈 미완성 그림이 된다.
 * 연출은 완성된 그림에 **더하는** 것이어야지, 깨진 그림을 보여주다 맞추는 게 아니다.
 */

/**
 * 나머지가 떠오르는 지점(핀 구간 진행도 0~1). 그 뒤는 여운이다.
 *
 * 0.3 은 너무 늦었다. 165vh 구간의 30% 면 한 화면 가까이 스크롤하는 동안
 * 아무 일도 안 일어나서 "안 나오는 것" 처럼 읽힌다.
 */
const STAGE_AT = [0.12];

/**
 * 누끼 컷 + 접지 그림자.
 *
 * 이미지는 **고객이 준 누끼 원본**을 그대로 쓴다. 배경을 따로 지우지 않는다.
 * (알파 여백만 잘라냈다 — 여백이 남으면 CSS 높이가 빈 공간까지 포함해서
 *  두 컷의 발 선이 어긋난다)
 *
 * drop-shadow 는 사각형이 아니라 **몸 실루엣을 따라** 떨어지고, 빛이 뒤에 있으므로
 * 앞(아래)으로 쏠린다. 하지만 그것만으로는 인물이 글자 위에 떠 보인다.
 * 발밑의 납작한 타원 하나가 "바닥에 닿았다" 를 만든다.
 *
 * img 에 block 이 없으면 inline 이라 baseline 아래 여백이 생겨 발 선이 어긋난다.
 *
 * 높이 단위는 **dvh** 다. 바깥 무대는 min-h-[100dvh] 인데 인물만 vh 를 쓰면,
 * 주소창이 펼쳐진 모바일에서 vh(큰 뷰포트) > dvh(작은 뷰포트) 라 인물이
 * 무대보다 커진다. overflow-hidden 이 그 차이만큼 발을 잘라낸다.
 */
function Cutout({
  src,
  alt,
  width,
  height,
  staged,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  staged?: "true";
}) {
  return (
    <div
      className="stage-in relative h-[44dvh] max-h-[460px] shrink-0 md:h-[70dvh] md:max-h-[720px]"
      data-staged={staged}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-[-10%] bottom-[-1%] h-[2.2%] rounded-[50%] bg-[rgba(10,1,4,0.45)] blur-[7px]"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="eager"
        className="relative block h-full w-auto [filter:drop-shadow(0_26px_34px_rgba(16,2,6,0.62))]"
      />
    </div>
  );
}

export function Hero() {
  const wrapRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;

    const marks = Array.from(
      root.querySelectorAll<HTMLElement>("[data-stage-mark]"),
    );
    if (!marks.length) return;

    const passed = new Set<number>();
    let observerRan = false;

    const io = new IntersectionObserver(
      (entries) => {
        observerRan = true;
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.stageMark);
          // 표식이 화면 위로 빠져나간 순간이 기준점이다.
          // (아래로 빠져 있을 때는 top > 0 이라 어느 쪽도 걸리지 않는다)
          if (e.isIntersecting) passed.delete(i);
          else if (e.boundingClientRect.top <= 0) passed.add(i);
        }
        setStage(passed.size);
      },
      /*
        루트를 건드리지 않는다.

        앞서 rootMargin: "0px 0px -100% 0px" 로 화면을 맨 위 띠로 좁혔었는데,
        -100% 는 루트 사각형의 **높이를 0 으로** 만든다. 높이 0 짜리 루트와는
        교차 면적이 영원히 0 이라 threshold 0 을 넘나드는 일이 없고,
        그래서 관찰자가 최초 1회 말고는 **다시 발화하지 않는다.**
        연출이 영영 시작되지 않던 원인이다.

        기본 루트(뷰포트)면 표식이 들어오고 나가는 것이 정상적으로 잡힌다.
      */
      { threshold: 0 },
    );

    marks.forEach((m) => io.observe(m));

    /*
      안전망 — 관찰자가 한 번도 돌지 않는 환경이 실제로 있다.
      (탭이 background 로 취급되는 임베드 미리보기에서는 IntersectionObserver 가
       초기 콜백조차 주지 않고 scroll 이벤트도 오지 않는다. 둘 다 죽어 있다)

      그러면 로고·버튼·문구가 **영영 보이지 않는다.**
      연출이 실패하는 건 괜찮지만 콘텐츠가 사라지는 건 안 된다.

      정상 환경에서 관찰자는 observe() 직후 한 프레임 안에 반드시 한 번 발화한다.
      1.5초가 지나도 소식이 없다면 그 환경에서는 연출이 불가능하다고 보고 전부 띄운다.
      scroll 리스너로 받지 않는 이유: 그 이벤트도 같이 죽는 환경이라 안전망이 못 된다.
    */
    const rescue = window.setTimeout(() => {
      if (!observerRan) setStage(STAGE_AT.length);
    }, 1500);

    return () => {
      io.disconnect();
      window.clearTimeout(rescue);
    };
  }, []);

  /** n번째 단계가 지났으면 data-staged 를 붙인다 (CSS 가 이걸 보고 띄운다). */
  const at = (n: number) => (stage > n ? "true" : undefined);

  return (
    /*
      래퍼의 음수 상단 마진은 헤더 높이만큼이다. 헤더가 sticky(= 흐름 안)라
      그냥 두면 첫 화면이 "헤더 + 100dvh" 가 되어 시작부터 잘린다.
      끌어올린 만큼 안쪽 padding 으로 되돌려 내용이 헤더에 가리지 않게 한다.

      data-hero 는 헤더가 "히어로 구간을 지났는가" 를 판단하는 표식이다.
    */
    <section
      ref={wrapRef}
      data-hero=""
      className="hero-pin -mt-[72px] md:-mt-[88px]"
    >
      {/* 단계 표식 — 보이지 않는다. 핀 구간을 비율로 나눠 심는다. */}
      {STAGE_AT.map((t, i) => (
        <span
          key={t}
          aria-hidden="true"
          data-stage-mark={i}
          className="pointer-events-none absolute left-0 h-px w-px"
          style={{ top: `${t * 100}%` }}
        />
      ))}

      {/* 100vh 가 아니라 100dvh — iOS 사파리는 주소창이 접히며 vh 가 바뀌어 화면이 튄다 */}
      <div className="bg-velvet sticky top-0 flex min-h-[100dvh] flex-col justify-center overflow-hidden px-5 pb-[4vh] pt-[96px] md:px-10 md:pb-[2vh] md:pt-[104px]">
        {/*
          무대광 — 워드마크 뒤에서 오는 빛. 중심을 인물 쪽(46%)에 둔다.
          인물은 빛을 받고, 그 아래 글자는 빛을 등진 실루엣으로 읽힌다.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 62% 50% at 50% 46%, rgba(255,216,184,0.17) 0%, rgba(255,186,146,0.075) 42%, rgba(255,170,130,0) 72%)",
          }}
        />

        <div className="relative mx-auto w-full max-w-[1320px]">
          {/*
            LF 모노그램.

            모바일: 인물 **뒤 · 위쪽 가운데.** 머리가 글자 아랫부분을 덮으면서
            모노그램이 배경이 아니라 무대 뒤 간판처럼 읽힌다.
            데스크톱: 좌측 기둥 맨 위로 간다.

            DOM 상 인물보다 먼저 와서 z-index 없이도 뒤에 깔린다.

            TODO(고객확인) 모노그램 원본 파일.
            지금 파일은 카카오톡으로 받은 **크롭본**이라 L 의 왼쪽 기둥과 아랫단이
            잘려 있다. 온전한 원본(SVG 우선)을 받아 교체해야 한다.
          */}
          <div
            className="stage-in absolute inset-x-0 -top-24 z-0 flex justify-center md:inset-x-auto md:left-0 md:top-1/2 md:block md:-translate-y-[138px]"
            data-staged={at(0)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/leoneferito-monogram.webp"
              alt=""
              aria-hidden="true"
              width={376}
              height={424}
              className="block h-auto w-[8.5rem] md:w-[84px]"
            />
          </div>

          {/*
            워드마크 + 인물.

            래퍼의 바닥 = 인물의 발 선이다(items-end). 워드마크를 그 선보다
            살짝 위(bottom-[3%])에 절대 배치하면 글자는 정강이 뒤를 지나가고
            신발은 글자 아래에 놓인다 — 인물이 글자를 딛고 선 것처럼 보인다.
          */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="text-accent stage-in pointer-events-none absolute inset-x-0 bottom-[3%]"
              data-staged={at(0)}
            >
              <Logo fluid label="" />
            </div>

            {/* 두 인물은 화면 정중앙에 둔다 — 좌측 기둥 쪽으로 밀지 않는다 */}
            <div className="relative z-10 flex items-end justify-center gap-4 md:gap-20">
              <Cutout
                src="/products/cutout-brown-shirt.webp"
                alt="브라운 셔츠와 블랙 와이드 슬랙스를 착용한 측면 컷"
                width={670}
                height={1600}
                staged="true"
              />

              <Cutout
                src="/products/cutout-white-shirt.webp"
                alt="화이트 셔츠와 블랙 타이, 슬랙스를 착용한 정면 컷"
                width={536}
                height={1600}
                staged="true"
              />
            </div>
          </div>

          {/*
            문구 + 진입 버튼.

            모바일은 인물 아래 가운데, 데스크톱은 좌측 기둥(모노그램 아래)에 절대 배치.
            DOM 순서는 h1 → 버튼이다. 읽는 순서가 그래야 맞다.
            데스크톱에서만 flex-col-reverse 로 버튼을 위로 올린다 — 시각 순서만 바뀐다.
          */}
          <div
            className="stage-in relative z-20 mt-8 flex flex-col items-center gap-5 md:absolute md:left-0 md:top-1/2 md:mt-0 md:max-w-[370px] md:translate-y-[6px] md:flex-col-reverse md:items-start md:gap-7"
            data-staged={at(0)}
          >
            {/*
              시안에는 없던 한 줄. 이 페이지의 **유일한 h1** 이다.
              글자가 하나도 없는 메인은 검색 결과에서 "제목 없음" 으로 잡히고,
              스크린리더로는 빈 화면이 된다. 조용하게 두되 빼지는 않는다.
            */}
            <h1 className="text-center text-sm leading-relaxed text-primary/70 md:text-left">
              운동으로 달라진 체형을 위한 남성 기성복
            </h1>

            {/*
              문 두 개. 채운 알약이 주 동선(컬렉션), 테두리만 있는 쪽이 부 동선이다.
              둘 다 같은 무게로 두면 시선이 갈라져 둘 다 안 눌린다.
            */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Link
                href="/collection"
                className="group text-accent tracking-button ease-fluid inline-flex items-center gap-2 rounded-full bg-primary py-2.5 pl-5 pr-1.5 text-xs shadow-[0_14px_30px_-14px_rgba(18,2,7,0.9)] transition-all duration-500 hover:bg-white active:scale-[0.98] md:gap-3 md:py-3 md:pl-6 md:pr-2 md:text-sm"
              >
                COLLECTION
                <span className="bg-velvet/10 ease-fluid flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-500 group-hover:-translate-y-px group-hover:translate-x-1 group-hover:scale-105 md:h-8 md:w-8">
                  <ArrowUpRight size={11} weight="light" aria-hidden="true" />
                </span>
              </Link>

              <Link
                href="/fit"
                className="tracking-button ease-fluid inline-flex items-center rounded-full border border-primary/45 px-5 py-2.5 text-xs text-primary transition-all duration-500 hover:border-primary active:scale-[0.98] md:px-6 md:py-3 md:text-sm"
              >
                LEONE · FERITO
              </Link>
            </div>
          </div>
        </div>

        {/* 무대 바닥 — 빛이 닿지 않아 아래로 갈수록 어두워진다. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4"
          style={{
            background:
              "linear-gradient(to bottom, rgba(24,3,9,0) 0%, rgba(24,3,9,0.55) 100%)",
          }}
        />

        {/* 비네트 — 가장자리를 떨어뜨려 시선을 가운데로 모은다 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 78% 70% at 50% 50%, rgba(0,0,0,0) 46%, rgba(20,2,7,0.42) 100%)",
          }}
        />
      </div>
    </section>
  );
}

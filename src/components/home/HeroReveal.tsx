import { HeroSlides } from "@/components/home/HeroSlides";
import { Logo } from "@/components/brand/Logo";
import { Scene } from "@/components/motion/Scene";
import type { HeroSlide } from "@/lib/heroSlide";

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
 * ── 무엇을 그리나 (2026-10-12 메인 배너 목록) ──────────────
 * 이 컴포넌트는 "장면(HeroSlide)" 목록을 받는다. 장면은 관리자 "메인 배너" 목록에서 온다(lib/heroSlide pickHeroSlides):
 *   상품 정보 가져오기  상품의 누끼샷 · 착용샷 · 디테일컷 · 이름 · 가격 (문구를 적으면 그 문구)
 *   직접 등록           관리자가 올린 인물 · 액자 사진과 문구 · 버튼
 *   이미지 한 장 · 영상  사진(영상)이 화면 전체를 덮는다 — 액자가 올라오는 구간 없이 짧게(115svh)
 * 나가는 배너가 없으면 진열 순서 맨 앞 상품 한 장. 모양 · 움직임은 셋 다 같다.
 *
 * ── 여러 장이면 넘어간다 — 맨 위에서만 ─────────────────────
 * 장면 넘기기는 HeroSlides 가 한다. 스크롤로 액자가 들어오는 도중에는 넘기지 않는다 — 어느 사진이
 * 어느 제품인지 흐트러진다. 맨 위에 머무는 동안만 6초마다 넘어가고, 버튼(‹ › · 멈춤)으로도 넘긴다.
 */

/** {@code autoplay} — 관리자 미리보기는 넘기지 않는다(한 장만 그린다). */
export function HeroReveal({ slides, autoplay = true }: { slides: HeroSlide[]; autoplay?: boolean }) {
  // 누끼 장면이 하나라도 있으면 액자가 올라오는 스크롤 구간(220vh)을 둔다. 전부 이미지 한 장이면 오래 붙잡을 이유가 없다 —
  // 조금만(115svh) 둔다. 화면 높이와 똑같으면 헤더가 처음부터 "히어로를 지났다" 로 보고 검게 굳어 사진 위를 덮는다.
  const reveal = slides.some((s) => s.layout === "cutout");
  return (
    /*
      래퍼의 음수 상단 마진은 헤더 높이만큼이다 (Hero.tsx 와 같은 이유). 끌어올린 만큼
      무대 안쪽 padding 으로 되돌린다. data-hero 는 헤더가 "히어로를 지났는가" 를 보는 표식 —
      값 "pin" 은 붙잡힌 무대라는 뜻 — 헤더는 무대가 풀려 위로 빠지기 시작하는 순간 원래 색으로 돌아온다
      (그 전에 돌아오지 않으면 빠져나가는 사진 위에 투명 헤더의 글자가 겹친다, 2026-10-07 모바일 점검).
    */
    // 끌어올리는 높이 = 헤더 높이(56 · 72) + 아래 경계 1px. 예전 헤더(72 · 88) 기준이 남아 16px 더 올라가 있었고,
    // 그만큼 화면 아래에 다음 구간이 비쳤다 — 사진 한 장 배너가 화면을 끝까지 덮지 못했다(2026-10-13). 글자 자리는 그대로다.
    <section data-hero="pin" className="on-cream -mt-[57px] md:-mt-[73px]">
      <Scene as="div" pin height={reveal ? "220vh" : "115svh"} aria-label="대표 룩">
        {/*
          min-h-[100svh] — 무대(.scene-stage)는 핀이 걸렸을 때만 높이가 100svh 로 정해진다. 기기의 «동작 줄이기» 가 켜졌거나
          스크립트가 아직 안 돈 때는 무대가 auto 높이라 h-full 이 풀리고, 안쪽이 글자 높이만큼(사진 233px)으로 줄어 나머지가
          비었다(2026-10-20 아이폰 캡처 — 버튼을 끄고 글자만 남으니 더 눈에 띄었다). 안쪽이 스스로 한 화면을 채우게 한다.
        */}
        <div className="relative flex h-full min-h-[100svh] flex-col overflow-hidden px-5 pb-6 pt-[73px] md:px-10 md:pb-10 md:pt-[89px]">
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

          {/* 위 한 줄(이 페이지의 유일한 h1) · 이름 · 무대 · 버튼 — 장면마다. 여러 장이면 넘어간다.
              h1 은 HeroSlides 가 그린다 — 사진 한 장 장면 위에서는 글자를 밝게 바꿔야 해서 */}
          <HeroSlides slides={slides} autoplay={autoplay} />

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

import { Reveal } from "@/components/motion/Reveal";
import { LINE_GUIDE } from "@/data/lineGuide";

/**
 * 메인 "Find your Fit" — 배너 바로 다음 (2026-10-28 디자이너 시안, 예전 WHY 구간 자리).
 *
 * 검은 바탕 가운데: 제목 · 한 줄 · 소개 두 줄 → "LEONE FERITO" 에서 두 갈래로 내려오는 선 → 라인 상자 둘
 * (와인 머리 + 회색 몸통, 특징과 추천 체형 사이 점선). 폰에서는 상자가 위아래로 쌓이고 갈래 선은 숨긴다.
 * 글은 가이드 페이지와 같은 곳(data/lineGuide)에서 온다.
 *
 * 스크롤 연출(2026-10-28 디자이너 "스크롤하면 인터랙션으로"): 도표 묶음이 화면에 들어오면(Reveal)
 * "LEONE FERITO" → 가운데서 두 갈래 선이 그려지고 → 왼쪽 · 오른쪽 상자가 차례로 올라온다.
 * 순서 · 시간은 globals.css .fit-*. transform · opacity · stroke-dashoffset 만 움직인다. 동작 줄이기면 바로 다 보인다.
 *
 * 예전 WHY 구간(관리자 › 메인 WHY 구간에서 고치던 사진 · 글)은 메인에서 빠졌다 — 컴포넌트(WhyScroll)와 관리자 화면은 남아 있다.
 */
export function FindYourFit() {
  return (
    <section aria-labelledby="fit-heading" className="on-black bg-[#000000]">
      <div className="mx-auto max-w-[900px] px-5 py-24 text-center md:px-10 md:py-32">
        <Reveal>
          <h2 id="fit-heading" className="font-display text-[34px] leading-tight text-[#F7F1EA] md:text-[44px]">
            Find your Fit
          </h2>
          <p className="mt-2 text-[13px] text-[#CDBAB0] md:text-sm">자신에게 가장 잘 맞는 핏을 찾아가는 과정</p>
          <p className="mx-auto mt-8 text-[13px] leading-relaxed text-[#CDBAB0] md:mt-10 md:text-sm">
            레오네 페리토는 각기 다른 특징과 역할을 지닌 두 가지 라인으로 구성되어 있습니다.
            <br className="hidden md:block" /> 자신의 스타일과 니즈에 맞는 라인을 선택해 나에게 가장 잘 맞는 제품을 만나보세요.
          </p>
        </Reveal>

        <Reveal delay={120} className="fit-diagram">
          <p className="font-display mt-14 text-[26px] text-[#5A5450] md:mt-20 md:text-[34px]">LEONE FERITO</p>
          {/*
            가운데 이름에서 두 상자로 갈라지는 선 — PC 만. 선마다 길이를 1 로 두고(pathLength) 그 길이만큼 지웠다 그려 낸다.
            가로 · 세로 배율이 거의 같아(1000×60 → 약 820×48) 굵기가 고르게 보인다.
          */}
          <svg aria-hidden="true" viewBox="0 0 1000 60" preserveAspectRatio="none" className="mt-1 hidden h-12 w-full md:block">
            <path className="fit-line" d="M500 2 L242 58" pathLength={1} stroke="#8A817C" strokeWidth="1.2" fill="none" />
            <path className="fit-line" d="M500 2 L758 58" pathLength={1} stroke="#8A817C" strokeWidth="1.2" fill="none" />
          </svg>

          <ul className="mt-6 grid gap-5 md:mt-0 md:grid-cols-2 md:gap-6">
            {LINE_GUIDE.map((l) => (
              <li key={l.name} className="fit-box flex flex-col text-left">
                <p className="font-display bg-[#5E1F21] py-3 text-center text-[16px] tracking-[0.04em] text-[#F7F1EA]">{l.name}</p>
                <div className="flex flex-1 flex-col bg-[#3A3A3A] px-5 text-center text-[13px] text-[#F7F1EA]">
                  <p className="mx-auto flex max-w-[24em] flex-1 items-center justify-center py-5 leading-relaxed">
                    <span className="sr-only">특징: </span>
                    {l.feature}
                  </p>
                  <p className="flex items-center justify-center border-t border-dashed border-[#8A817C] py-5 leading-relaxed">
                    <span className="sr-only">추천 체형: </span>
                    {l.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

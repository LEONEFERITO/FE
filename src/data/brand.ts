import type { ProductLine } from "@/types/product";

/**
 * 브랜드 문장 — 고객 전달 원문 그대로다. 손대지 않는다.
 *
 * 브랜드 페이지(/brand)와 메인의 브랜드 구간이 같은 두 줄을 쓴다. 한쪽에만 적어 두면
 * 문구가 바뀌는 날 한쪽만 고쳐진다.
 */
export const SLOGAN = [
  "잘 관리된 몸매와 외모 그리고 섹시한 핏으로 소화하는 럭셔리 스타일",
  "담대하고 우월한 태도까지 갖춘 모두의 워너비이자 상위 0.1%의 남자상",
] as const;

/**
 * 라인 페이지(/line/leone · /line/ferito) 머리 문안 — 2026-10-17 디자이너(윤지민) 피그마 수정본 원문 그대로다.
 * 줄바꿈도 시안의 줄 그대로(문장마다 한 줄). 라벨은 시안의 대문자 표기.
 */
export const LINE_INTRO: Record<ProductLine, { label: string; tagline: string; body: readonly string[] }> = {
  LEONE: {
    label: "CLASSIC LINE",
    tagline: "여유로운 균형, 시대를 타지 않는 멋",
    body: [
      "과거의 클래식 수트에서 영감을 받아 여유로운 볼륨과 자연스러운 흐름을 담아낸 실루엣.",
      "몸을 많이 조이지 않고 원단의 드레이프와 전체적인 균형으로 멋을 표현합니다.",
      "과거의 클래식 수트를 더맨리만의 시선으로 재해석했습니다.",
    ],
  },
  FERITO: {
    label: "ATHLETIC LINE",
    tagline: "입체적인 실루엣, 선명한 존재감",
    body: [
      "체형의 장점을 살려 어깨와 가슴은 강조하고, 허리 라인은 날렵하게 잡아낸 실루엣.",
      "신체의 균형과 입체감을 살려 수트 본연의 남성적인 매력을 표현합니다.",
      "더맨리가 추구해 온 선명하고 입체적인 핏을 담았습니다.",
    ],
  },
};

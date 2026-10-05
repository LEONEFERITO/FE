import type { WhyContent } from "@/lib/why";

/**
 * 메인 WHY 구간의 기본 문구 — 서버가 없는 화면 확인 단계에서 쓴다.
 * 서버가 있으면 관리자가 고친 내용(V18 why_section)이 이 자리를 대신한다.
 * V18 이 심은 기본 행과 같은 문구다 — 두 곳이 어긋나면 "서버 연결 전후가 다르다" 로 보인다.
 */
export const WHY_FALLBACK: WhyContent = {
  eyebrow: "WHY LEONE FERITO",
  title: "사진이 아니라 치수로 고르세요",
  intro:
    "어깨·가슴·허벅지는 끼는데 허리는 남는 옷을 입어 오셨다면,\n문제는 체형이 아니라 패턴입니다.\n모든 상품에 사이즈별 상세 실측과 모델 착용 정보를 공개합니다.",
  items: [
    {
      title: "두 개의 라인",
      body: "레오네(클래식)와 페리토(애슬레틱)로 패턴을 나눠 제작합니다. 상품마다 어느 라인인지 표시합니다.",
      imageUrl: null,
    },
    {
      title: "상세 실측",
      body: "사이즈별 어깨·가슴·허리·소매·총장을 전부 공개합니다. 측정 기준과 허용 오차까지 밝힙니다.",
      imageUrl: null,
    },
    {
      title: "모델 체형",
      body: "모델의 키·몸무게·착용 사이즈를 함께 표기해 내 체형과 비교할 수 있게 합니다.",
      imageUrl: null,
    },
  ],
};

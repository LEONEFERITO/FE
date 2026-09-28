/**
 * 상품 도메인 타입.
 *
 * BE(Phase 2)의 응답 형태를 먼저 FE 쪽에서 정의해 둔다. 실제 API 가 생기면
 * 이 타입에 맞추거나, 다르면 여기를 고친다 — 어느 쪽이든 화면이 기대하는 모양이 문서로 남는다.
 */

/** 핏 종류. 이 사이트의 존재 이유이므로 문자열이 아니라 열거형으로 고정한다. */
export type FitType = "ATHLETIC" | "REGULAR";

export const FIT_LABEL: Record<
  FitType,
  { en: string; ko: string; description: string }
> = {
  ATHLETIC: {
    en: "ATHLETIC FIT",
    ko: "운동체형",
    description: "어깨·가슴·허벅지는 넉넉하게, 허리는 잡아주는 패턴입니다.",
  },
  REGULAR: {
    en: "REGULAR FIT",
    ko: "일반체형",
    description: "표준 체형 기준으로 전체 균형을 맞춘 패턴입니다.",
  },
};

/**
 * 실측 항목 정의.
 *
 * **카테고리마다 항목이 다르다.**
 *   자켓 → 어깨 · 가슴 · 소매 · 총장
 *   팬츠 → 허리 · 허벅지 · 밑단 · 총장
 *
 * 그래서 `shoulder: number` 처럼 고정 컬럼으로 못 짠다. 항목 목록 자체가 데이터다.
 * (BE 에서 PostgreSQL JSONB 를 고른 이유 — docs/DECISIONS.md D4)
 */
export interface MeasurementField {
  /** 저장 키. 예: "shoulder" */
  key: string;
  /** 화면 표기. 예: "어깨" */
  label: string;
}

export interface MeasurementRow {
  /** 사이즈 라벨. 예: "100" */
  size: string;
  /**
   * 항목별 실측값(cm). 값이 없으면 null —
   * **추측해서 채우지 않는다.** 틀린 치수는 교환을 늘린다. 빈칸이 낫다.
   */
  values: Record<string, number | null>;
}

export interface MeasurementTable {
  fields: MeasurementField[];
  rows: MeasurementRow[];
  /**
   * 측정 기준. 둘레인지 단면인지에 따라 값이 2배 차이 난다 —
   * 이게 없으면 실측표가 오히려 교환을 늘린다.
   */
  basis: string | null;
  /** 허용 오차 안내. 예: "±1cm" */
  tolerance: string | null;
}

/** 재고 단위. 사이즈 × 컬러 조합마다 하나. 재고는 여기에 붙는다. */
export interface Sku {
  id: string;
  size: string;
  color: string | null;
  /** 0 이면 품절. 품절도 숨기지 않고 비활성으로 노출한다. */
  stock: number;
}

/** 모델 착용 정보. "이 모델과 내 체형이 비슷한가" 가 사이즈 판단의 마지막 근거다. */
export interface ModelInfo {
  heightCm: number | null;
  weightKg: number | null;
  wearingSize: string | null;
}

/**
 * 상품정보제공고시(의류).
 *
 * 전자상거래 고시상 **텍스트로** 제공해야 하는 항목이다.
 * 이미지로만 넣으면 위반이고 스크린리더도 읽지 못한다.
 */
export interface ProductNotice {
  material: string | null;
  color: string | null;
  size: string | null;
  manufacturer: string | null;
  countryOfOrigin: string | null;
  washingInstruction: string | null;
  manufacturedAt: string | null;
  warranty: string | null;
  asContact: string | null;
}

export interface Product {
  slug: string;
  name: string | null;
  category: string;
  fitType: FitType;
  /** 판매가(원). 서버가 계산한 값만 신뢰한다 — 화면은 표시만 한다. */
  priceKrw: number | null;
  /** 정가(원). 할인 중이 아니면 null. */
  listPriceKrw: number | null;
  images: string[];
  /**
   * 배경을 뺀 누끼 컷. 없으면 null.
   * 사진(images)과 따로 두는 이유: 쓰이는 자리가 다르다. 카드·상세는 촬영 원본을 쓰고,
   * 모바일 히어로처럼 **단색 면 위에 인물만** 세워야 하는 곳에서만 누끼를 쓴다.
   */
  cutout: string | null;
  skus: Sku[];
  measurements: MeasurementTable;
  model: ModelInfo;
  notice: ProductNotice;
}

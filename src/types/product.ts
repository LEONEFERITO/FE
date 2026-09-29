/**
 * 상품 도메인 타입.
 *
 * BE(Phase 2)의 응답 형태를 먼저 FE 쪽에서 정의해 둔다. 실제 API 가 생기면
 * 이 타입에 맞추거나, 다르면 여기를 고친다 — 어느 쪽이든 화면이 기대하는 모양이 문서로 남는다.
 */

/**
 * 제품 라인. 브랜드 이름이 곧 라인 이름이다 (2026-09-28 고객 확정).
 *
 *   레오네 = 클래식 기반의 정제된 포멀
 *   페리토 = 운동형 체형을 고려한 섹시한 포멀
 *
 * `ATHLETIC`/`REGULAR` 같은 일반 명사로 두지 않는다. 그렇게 두면 화면에는
 * 브랜드 이름이 나오는데 코드에는 없어서, 나중에 둘이 어긋나도 아무도 모른다.
 */
export type ProductLine = "LEONE" | "FERITO";

export const LINE_LABEL: Record<
  ProductLine,
  { en: string; ko: string; kind: string; description: string }
> = {
  LEONE: {
    en: "LEONE",
    ko: "레오네 라인",
    kind: "클래식",
    description: "클래식을 기반으로 정제한 포멀 실루엣입니다.",
  },
  FERITO: {
    en: "FERITO",
    ko: "페리토 라인",
    kind: "애슬레틱",
    description: "운동으로 발달한 체형을 고려한, 섹시한 포멀 실루엣입니다.",
  },
};

/** 제품 분류. 목록 필터와 내비게이션이 같은 값을 본다. */
export type Category = "JACKET" | "TROUSERS" | "SHIRT" | "SHOES";

export const CATEGORY_LABEL: Record<Category, { en: string; ko: string }> = {
  JACKET: { en: "JACKET", ko: "자켓" },
  TROUSERS: { en: "TROUSERS", ko: "트라우저" },
  SHIRT: { en: "SHIRT", ko: "셔츠" },
  SHOES: { en: "SHOES", ko: "구두 · 로퍼" },
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

/**
 * 상세 사이즈 차트 이미지.
 *
 * 고객이 만든 차트를 그대로 올린다(2026-09-29 결정). 카테고리마다 재는 곳이 달라
 * 브랜드 쪽에서 쓰는 표를 그대로 쓰고 싶다는 요구다.
 *
 * `alt` 가 필수인 이유: 표를 그림으로 만들면 **스크린리더에게는 이 문장이 유일한
 * 정보원**이다. 비어 있으면 그 사용자에게 사이즈 구간이 통째로 존재하지 않는다.
 *
 * `width`/`height` 는 자리를 미리 잡기 위한 것이다. 없으면 이미지가 도착하는 순간
 * 아래 구매 버튼이 밀린다.
 */
export interface SizeChartImage {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

/**
 * 숫자 실측표.
 *
 * ⚠️ 화면에서는 지금 쓰지 않는다. 상세 사이즈는 {@link SizeChartImage} 로 보여준다.
 * 그래도 타입과 DB 테이블을 지우지 않는 이유는, 숫자가 있어야만 되는 것들이
 * 언제든 다시 필요해지기 때문이다 — 목록 카드의 실측 요약, 사이즈 추천, 상품 간 비교.
 * 값이 들어오는 날 표를 다시 켜면 된다.
 */
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
  category: Category;
  line: ProductLine;
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
  /** 상세 사이즈 차트 이미지. 없으면 그 자리를 비운다. */
  sizeChart: SizeChartImage | null;
  model: ModelInfo;
  notice: ProductNotice;
}

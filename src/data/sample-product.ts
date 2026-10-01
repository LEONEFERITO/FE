import type { Product } from "@/types/product";

/**
 * 화면 개발용 임시 데이터.
 *
 * BE 상품 API(Phase 2)가 생기면 이 파일은 사라진다.
 *
 * 주의: **확인되지 않은 값은 전부 null 이다.** 치수·가격·소재를 그럴듯하게 채워 넣으면
 * 화면은 완성돼 보이지만, 그 값이 실제와 다르다는 걸 아무도 눈치채지 못한 채
 * 오픈까지 갈 수 있다. null 은 화면에서 "확인 필요" 로 보이므로 잊히지 않는다.
 *
 * 채워야 할 값은 docs/CLIENT_QUESTIONS.md 의 B-2 · B-3 · B-4 · B-5 · B-6 에 있다.
 */
export const SAMPLE_PRODUCT: Product = {
  slug: "sample",
  name: null, // TODO(고객확인) F-2 / B-1
  category: "JACKET", // TODO(고객확인) B-1 실제 분류. 셋업이면 상·하의를 나눌지 정해야 한다
  line: "FERITO",
  priceKrw: null, // TODO(고객확인)
  listPriceKrw: null, // TODO(고객확인)
  summary: null,
  description: null,
  intent: null,
  features: null,
  leadTimeDays: null, // TODO(고객확인) 제작 기간
  images: [], // TODO(고객확인) 제품 촬영본
  cutout: null,

  // TODO(고객확인) B-3: 사이즈 체계(95/100/105 인지 S/M/L 인지)가 확정되면 교체.
  // 주문 불가(orderable: false)는 숨기지 않고 비활성으로 노출한다 — 숨기면 "내 사이즈가 원래 없는
  // 브랜드" 로 보이고, 보여주면 "이번에 품절" 로 읽힌다.
  skus: [
    { id: "sku-95", size: "95", color: null, orderable: true },
    { id: "sku-100", size: "100", color: null, orderable: true },
    { id: "sku-105", size: "105", color: null, orderable: true },
    { id: "sku-110", size: "110", color: null, orderable: false },
  ],

  // 차트 이미지는 관리자가 올린다. 아직 없다.
  sizeChart: null,
  // 인스타그램 게시물이 있는 상품만 채운다. 없으면 상세에서 버튼을 숨긴다.
  instagramUrl: null,
  measurements: {
    // 항목 목록 자체가 카테고리별 데이터다 (자켓과 팬츠가 다르다).
    fields: [
      { key: "shoulder", label: "어깨" },
      { key: "chest", label: "가슴" },
      { key: "waist", label: "허리" },
      { key: "sleeve", label: "소매" },
      { key: "length", label: "총장" },
    ],
    // TODO(고객확인) B-4: 이 사이트의 존재 이유가 되는 데이터.
    rows: [
      {
        size: "95",
        values: {
          shoulder: null,
          chest: null,
          waist: null,
          sleeve: null,
          length: null,
        },
      },
      {
        size: "100",
        values: {
          shoulder: null,
          chest: null,
          waist: null,
          sleeve: null,
          length: null,
        },
      },
      {
        size: "105",
        values: {
          shoulder: null,
          chest: null,
          waist: null,
          sleeve: null,
          length: null,
        },
      },
      {
        size: "110",
        values: {
          shoulder: null,
          chest: null,
          waist: null,
          sleeve: null,
          length: null,
        },
      },
    ],
    basis: null, // TODO(고객확인) 예) "평평히 놓고 잰 단면 기준"
    tolerance: null, // TODO(고객확인) 예) "±1cm"
  },

  model: {
    heightCm: null, // TODO(고객확인) B-5
    weightKg: null,
    wearingSize: null,
  },

  // TODO(고객확인) B-6: 전자상거래 고시상 표기 의무 항목. 전부 채워야 오픈 가능.
  notice: {
    material: null,
    color: null,
    size: null,
    manufacturer: null,
    countryOfOrigin: null,
    washingInstruction: null,
    manufacturedAt: null,
    warranty: null,
    asContact: null,
  },
};

import type { ProductLine } from "@/types/product";

/**
 * 핏 비교 · 사이즈 기준표.
 *
 * 주의: **숫자는 비어 있다.** 지금 이 브랜드의 실측값(B-4)과 사이즈 체계(B-3)가 미확정이다.
 * 비교표에 그럴듯한 숫자를 채워 넣으면 화면은 완성돼 보이지만, 그 숫자를 보고 산 사람이
 * 안 맞는 옷을 받는다. 커머스에서 지어낸 치수는 버그가 아니라 사고다.
 *
 * 대신 **지금 아는 것** 은 보여준다: 고객이 말한 패턴의 방향("어깨·가슴·허벅지는 넉넉하게,
 * 허리는 잡아주는")이다. 방향만으로도 "왜 핏을 나누는가" 는 전달된다.
 * 수치가 들어오면 cm 만 채우면 표가 완성된다.
 */

/** 표준 대비 어느 쪽으로 움직인 패턴인가. 화면에서는 아이콘 + 이 낱말로 함께 읽힌다. */
export type FitDirection = "wider" | "narrower" | "standard";

export const DIRECTION_LABEL: Record<FitDirection, { text: string }> = {
  wider: { text: "넉넉하게" },
  narrower: { text: "잡아주게" },
  standard: { text: "표준" },
};

export interface FitComparisonRow {
  key: string;
  label: string;
  /** 어디를 재는지. 기준이 없으면 숫자가 와도 해석이 갈린다. */
  how: string;
  direction: Record<ProductLine, FitDirection>;
  /** 같은 사이즈 기준 실측(cm). TODO(고객확인) B-4 */
  cm: Record<ProductLine, number | null>;
}

/** 비교 기준이 되는 사이즈. TODO(고객확인) B-3 (95/100/105 인지 S/M/L 인지) */
export const FIT_COMPARISON_BASIS: string | null = null;

export const FIT_COMPARISON: FitComparisonRow[] = [
  {
    key: "shoulder",
    label: "어깨",
    how: "어깨 끝점에서 반대쪽 끝점까지",
    direction: { FERITO: "wider", LEONE: "standard" },
    cm: { FERITO: null, LEONE: null },
  },
  {
    key: "chest",
    label: "가슴",
    how: "겨드랑이 아래 한 바퀴",
    direction: { FERITO: "wider", LEONE: "standard" },
    cm: { FERITO: null, LEONE: null },
  },
  {
    key: "waist",
    label: "허리",
    how: "가장 잘록한 지점 한 바퀴",
    direction: { FERITO: "narrower", LEONE: "standard" },
    cm: { FERITO: null, LEONE: null },
  },
  {
    key: "thigh",
    label: "허벅지",
    how: "가랑이 아래 가장 굵은 지점",
    direction: { FERITO: "wider", LEONE: "standard" },
    cm: { FERITO: null, LEONE: null },
  },
];

/**
 * 브랜드 사이즈 기준표 — "내 어깨가 45cm 면 몇 사이즈인가" 를 답하는 데 쓴다.
 *
 * 상품별 실측표(Product.measurements)와 다르다. 그건 **옷의 치수** 고 이건 **몸의 치수** 다.
 * 둘을 섞으면 "가슴 104 옷" 과 "가슴 104 사람" 이 같은 칸에 들어가 버린다.
 *
 * TODO(고객확인) B-3 · B-4 가 오면 채운다. 비어 있는 동안 사이즈 찾기는
 * 계산하지 않고 "준비 중" 으로 남는다 — 틀린 추천보다 없는 추천이 낫다.
 */
export interface BodySizeRow {
  size: string;
  /** 이 사이즈를 권하는 몸 치수 범위(cm). [최소, 최대] */
  shoulder: [number, number] | null;
  chest: [number, number] | null;
}

export const BODY_SIZE_CHART: Record<ProductLine, BodySizeRow[]> = {
  FERITO: [],
  LEONE: [],
};

/** 몸 치수를 재는 법. 기준표가 비어 있어도 이 안내는 지금 바로 쓸모가 있다. */
export const MEASURE_GUIDE = [
  {
    key: "shoulder",
    label: "어깨",
    body: "등 뒤에서, 한쪽 어깨 끝점에서 반대쪽 끝점까지 일자로 잽니다. 팔이 시작되는 뼈가 만져지는 지점이 끝점입니다.",
  },
  {
    key: "chest",
    label: "가슴",
    body: "겨드랑이 바로 아래를 지나 한 바퀴 두릅니다. 숨을 편하게 내쉰 상태로 재세요.",
  },
] as const;

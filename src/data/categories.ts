import type { Category, Product, ProductLine, ProductStyle } from "@/types/product";

/**
 * 카테고리 대표컷.
 *
 * ── 제품 상세컷과 다른 사진이다 ─────────────────────────
 * 상세컷은 **그 제품 한 점**을 보여준다. 대표컷은 **카테고리 전체**를 대표한다.
 * 같은 걸로 여기면 나중에 한 번 더 찍어야 한다. (BRAND_BRIEF.md 7장)
 *
 * ── 카테고리마다 찍는 거리가 다르다 ─────────────────────
 * 레퍼런스(2026-09-28 고객 전달)에서 가장 중요한 건 격자 모양이 아니라
 * 칸마다 **피사체와의 거리가 다르다**는 점이었다:
 *
 *   자켓 · 트라우저 · 셔츠  →  착장.   실루엣이 상품이다. 몸에 걸쳐야 판단된다
 *   구두 · 로퍼             →  단독.   형태가 상품이다. 사람이 들어가면 신발이 작아진다
 *
 * 전부 착장으로 통일하면 구두 코가 안 보이고, 전부 단독으로 통일하면 실루엣이 사라진다.
 * 그래서 이 파일이 사진 경로만 갖지 않고 `framing` 을 함께 갖는다 —
 * 격자의 칸 크기가 여기서 나온다. 사진이 바뀌면 레이아웃도 따라온다.
 *
 * ── cover 가 null 인 동안 ───────────────────────────────
 * 사진이 없는 칸은 **글자 타일**로 그린다. "준비 중" 딱지를 붙이지 않는다.
 * 네 칸 중 셋에 준비 중이 붙으면 카테고리가 4개인 게 아니라
 * 제품이 4개뿐인 가게로 보인다. 글자 타일은 그 자체로 성립하는 편집 디자인이고,
 * 촬영본이 오면 이 파일에서 경로 한 줄만 채우면 사진으로 바뀐다.
 */
export interface CategoryCover {
  category: Category;
  /** 촬영본 경로. null 이면 글자 타일로 그린다. */
  cover: string | null;
  /** figure = 사람이 입은 세로 컷 · object = 제품 단독 가로 컷 */
  framing: "figure" | "object";
  /** 타일에 얹는 한 줄. 카테고리 이름만으로는 무엇이 다른지 안 보인다. */
  note: string;
}

export const CATEGORY_COVERS: CategoryCover[] = [
  {
    category: "JACKET",
    cover: null, // TODO(고객확인) 자켓 착장 대표컷
    framing: "figure",
    note: "어깨와 가슴에서 갈리는 라인",
  },
  {
    category: "TROUSERS",
    cover: null, // TODO(고객확인) 트라우저 착장 대표컷
    framing: "figure",
    note: "허벅지와 밑단이 만드는 선",
  },
  {
    category: "SHIRT",
    // 현재 카탈로그에 실제로 있는 유일한 카테고리라 촬영본이 있다.
    cover: "/products/photo-brown-shirt.webp",
    framing: "figure",
    note: "몸을 따라 떨어지는 포멀",
  },
  {
    category: "SHOES",
    cover: null, // TODO(고객확인) 구두·로퍼 단독 대표컷
    framing: "object",
    note: "마무리를 결정하는 한 켤레",
  },
];

/**
 * 헤더 내비와 카테고리 페이지(/category/{slug}/)의 목록.
 *
 * 순서와 표기는 고객 지정이다 — 2026-10-06 고객 사이트 구조표(브랜드웹사이트상세정보.xlsx):
 * SHIRTS · TROUSERS · JACKET · SUIT · FOOTWEAR. ACCESSORIES 는 구조표에 없지만 그대로 두기로 했다(2026-10-06).
 * slug 는 주소에 쓰는 소문자 영문이고, title 은 페이지 제목에 쓰는 표기다.
 * 상품이 아직 없는 분류도 페이지는 있다 — 내비에서 눌렀는데 404 면 고장으로 읽힌다.
 */
export const CATEGORY_NAV: { category: Category; slug: string; label: string; title: string; description: string }[] = [
  { category: "SHIRT", slug: "shirts", label: "SHIRTS", title: "Shirts", description: "셔츠류 전체" },
  { category: "TROUSERS", slug: "trousers", label: "TROUSERS", title: "Trousers", description: "트라우저류 전체" },
  { category: "JACKET", slug: "jacket", label: "JACKET", title: "Jacket", description: "자켓류 전체" },
  { category: "SUIT", slug: "suit", label: "SUIT", title: "Suit", description: "수트류 전체" },
  { category: "SHOES", slug: "footwear", label: "FOOTWEAR", title: "Footwear", description: "신발류" },
  { category: "ACCESSORIES", slug: "accessories", label: "ACCESSORIES", title: "Accessories", description: "액세서리" },
];

export const categoryHref = (slug: string) => `/category/${slug}/`;

/**
 * 분류 안의 세부 메뉴 (2026-10-06 구조표). 카테고리 페이지의 칩과 헤더 드롭다운이 같은 목록을 본다.
 *
 * 트라우저 핏 · 신발 종류는 상품의 **세부 분류**(style)로 거른다. 관리자가 상품마다 고른다.
 *
 * 2026-10-07: 셔츠 · 자켓 · 수트의 Classic / Athletic(라인으로 거르던 세부 메뉴)은 쓰지 않기로 해서 뺐다 —
 * "그냥 셔츠로 사용하자". 그 세 분류는 세부 메뉴 없이 분류 페이지 하나다(헤더 드롭다운 · 칩도 안 나온다).
 * `line` 거르기 자체는 남겨 둔다 — 다시 쓰게 되면 항목만 되살리면 된다.
 * 표기는 구조표 그대로 두되 철자만 바로잡았다(구조표의 "Atheletic" → Athletic).
 */
export interface CategorySub {
  /** 주소 쿼리 값: /category/{slug}/?sub={이 값} */
  slug: string;
  label: string;
  /** 구조표의 설명 칸 */
  description: string;
  line?: ProductLine;
  style?: ProductStyle;
}

export const CATEGORY_SUBS: Partial<Record<Category, CategorySub[]>> = {
  TROUSERS: [
    { slug: "regular", label: "Regular Fit", description: "레귤러핏 트라우저류", style: "REGULAR" },
    { slug: "straight", label: "Straight Fit", description: "스트레이트핏 트라우저류", style: "STRAIGHT" },
    { slug: "flare", label: "Flare Fit", description: "플레어핏 트라우저류", style: "FLARE" },
  ],
  SHOES: [
    { slug: "oxfords", label: "Oxfords", description: "옥스퍼드 구두류", style: "OXFORD" },
    { slug: "loafers", label: "Loafers", description: "로퍼류", style: "LOAFER" },
  ],
};

export const subHref = (categorySlug: string, subSlug: string) => `/category/${categorySlug}/?sub=${subSlug}`;

/** 상품이 세부 메뉴에 들어가는가 */
export const matchesSub = (p: Pick<Product, "line" | "style">, sub: CategorySub) =>
  (sub.line === undefined || p.line === sub.line) && (sub.style === undefined || p.style === sub.style);

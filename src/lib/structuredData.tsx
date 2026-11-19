import { BUSINESS, KAKAO_CHANNEL, OFFLINE_SHOP, SNS } from "@/data/business";
import { SHIPPING } from "@/data/shipping";
import { SITE_URL } from "@/lib/site";
import { displayPrice } from "@/lib/suit";
import { CATEGORY_LABEL, LINE_LABEL, type Product } from "@/types/product";

/**
 * 구조화 데이터(JSON-LD, schema.org) — 2026-10-26 SEO · GEO 설정.
 *
 * 검색엔진(구글 · 네이버)과 AI 검색(ChatGPT · Perplexity 등)은 화면 글자보다 이 데이터를 먼저 믿는다.
 * "이 페이지는 상품이고, 값은 얼마, 매장은 어디, 몇 시에 연다" 를 기계가 읽는 꼴로 적는다.
 * 값은 전부 화면에 실제로 보이는 것과 같은 곳(data/business · 상품 API)에서 온다 — 화면과 다른 값을 적으면
 * 구글이 스팸으로 본다.
 *
 * 도메인(SITE_URL)이 없으면 아무것도 내지 않는다 — 상대 주소로 된 구조화 데이터는 쓸모가 없다.
 */

const BRAND = "LEONE FERITO";
const BRAND_KO = "레오네페리토";

const abs = (path: string) => (SITE_URL ? new URL(path, SITE_URL).toString() : path);

/** <script type="application/ld+json"> — `<` 를 막아 본문 문자열이 스크립트를 닫지 못하게 한다 */
export function JsonLd({ data }: { data: object | null }) {
  if (!data || !SITE_URL) return null;
  return (
    <script
      type="application/ld+json"
      // JSON-LD 는 문자열로만 넣을 수 있다. < 는 \u003c 로 바꿔 스크립트를 닫지 못하게 했다
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** "오전 10시" 같은 사람 글 대신 기계용 시간 — data/business 의 영업시간 문구와 같은 값이다 */
const OPENING_HOURS = [
  { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Thursday", "Friday"], opens: "10:00", closes: "21:00" },
  { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday", "Sunday"], opens: "12:00", closes: "21:00" },
];

/** 대표 전화 — "010-2434-7794 · 010-9291-0518" 의 첫 번호를 국제 표기(+82-10-…)로. 없으면 null */
const TELEPHONE = (() => {
  const first = BUSINESS.phone?.split("·")[0]?.trim();
  return first && /^0\d{1,2}-\d{3,4}-\d{4}$/.test(first) ? `+82-${first.slice(1)}` : null;
})();

/**
 * 배송 · 반품 — 구글 판매자 목록(상품 리치 결과)이 Offer 에서 읽는다. 없으면 서치콘솔이 "누락된 필드" 경고를 낸다.
 * 값은 안내 문구와 같은 data/shipping(= 서버 app.order · app.returns). 도착까지 걸리는 날은 정한 값이 없어 적지 않는다.
 */
function shippingDetails(priceKrw: number) {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: priceKrw >= SHIPPING.freeThresholdKrw ? 0 : SHIPPING.feeKrw, currency: "KRW" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "KR" },
  };
}

const RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "KR",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: SHIPPING.changeOfMindDays,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/ReturnShippingFees",
  returnShippingFeesAmount: { "@type": "MonetaryAmount", value: SHIPPING.changeOfMindRoundTripKrw, currency: "KRW" },
};

/** 메인 — 브랜드(Organization) · 사이트(WebSite) · 오프라인 매장(ClothingStore) */
export function homeStructuredData() {
  if (!SITE_URL) return null;
  const sameAs = [SNS.instagram, SNS.youtube, KAKAO_CHANNEL.home].filter((u): u is string => !!u);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": abs("/#organization"),
        name: BRAND,
        alternateName: [BRAND_KO, "레오네 페리토", "LEONEFERITO"],
        url: abs("/"),
        logo: abs("/icon.png"),
        description: "운동으로 달라진 체형을 위한 남성 기성복 브랜드. 모든 제품의 사이즈별 실측을 공개합니다.",
        sameAs,
        ...(TELEPHONE
          ? { contactPoint: { "@type": "ContactPoint", telephone: TELEPHONE, contactType: "customer service", areaServed: "KR", availableLanguage: "Korean" } }
          : {}),
      },
      {
        "@type": "WebSite",
        "@id": abs("/#website"),
        name: BRAND,
        alternateName: BRAND_KO,
        url: abs("/"),
        inLanguage: "ko-KR",
        publisher: { "@id": abs("/#organization") },
      },
      {
        "@type": "ClothingStore",
        "@id": abs("/#store"),
        name: OFFLINE_SHOP.name,
        url: abs("/brand/"),
        image: abs("/brand/tailoring.webp"),
        parentOrganization: { "@id": abs("/#organization") },
        ...(TELEPHONE ? { telephone: TELEPHONE } : {}),
        address: {
          "@type": "PostalAddress",
          streetAddress: "매영로425번길 1, 1층",
          addressLocality: "수원시 영통구",
          addressRegion: "경기도",
          addressCountry: "KR",
        },
        openingHoursSpecification: OPENING_HOURS,
        ...(OFFLINE_SHOP.mapUrl ? { hasMap: OFFLINE_SHOP.mapUrl } : {}),
      },
    ],
  };
}

/** 상품 상세 — Product + Offer(가격 · 재고) + 이동 경로(BreadcrumbList) */
export function productStructuredData(product: Product) {
  if (!SITE_URL || !product.name) return null;
  const url = abs(`/products/${product.slug}/`);
  const category = CATEGORY_LABEL[product.category];
  const line = product.line ? LINE_LABEL[product.line] : null; // 라인 없는 상품(V48)
  const inStock = product.skus.some((s) => s.orderable);
  const color = product.notice?.color ?? null;
  const price = displayPrice(product).priceKrw;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        url,
        sku: product.slug,
        image: product.images.map((i) => abs(i.url)),
        description: product.summary?.trim() || (line ? `${line.ko} ${category.ko}. ${line.description}` : category.ko),
        brand: { "@type": "Brand", name: BRAND },
        category: category.ko,
        ...(color ? { color } : {}),
        // 값은 상세에 처음 보이는 값과 같아야 한다 — 3피스 수트는 2피스 값(lib/suit displayPrice · suitDefaults, 2026-11-19)
        ...(price !== null
          ? {
              offers: {
                "@type": "Offer",
                url,
                priceCurrency: "KRW",
                price,
                availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                itemCondition: "https://schema.org/NewCondition",
                seller: { "@type": "Organization", name: BRAND },
                shippingDetails: shippingDetails(price),
                hasMerchantReturnPolicy: RETURN_POLICY,
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: BRAND, item: abs("/") },
          { "@type": "ListItem", position: 2, name: "제품", item: abs("/products/") },
          { "@type": "ListItem", position: 3, name: product.name, item: url },
        ],
      },
    ],
  };
}

/** 자주 묻는 질문 — 화면의 질문 · 답 그대로 */
export function faqStructuredData(items: { q: string; a: string }[]) {
  if (!SITE_URL || items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

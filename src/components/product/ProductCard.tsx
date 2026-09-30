import Link from "next/link";

import { LineBadge } from "@/components/product/LineBadge";
import { CATEGORY_LABEL } from "@/types/product";
import type { Product } from "@/types/product";

/**
 * 목록용 상품 카드.
 *
 * ── 이 카드가 보여주는 것의 순서 ─────────────────────────
 * 사진 → 핏 → 이름 → **실측 요약** → 사이즈 → 가격
 *
 * 실측 요약을 가격보다 위에 둔다. 이 사이트에서 구매를 막는 건 가격이 아니라
 * "나한테 맞나" 이고, 그 판단 재료를 목록에서부터 준다는 게 이 브랜드의 약속이다.
 *
 * ── D1(판매 범위)이 아직 미확정인 것에 대한 대응 ──────────
 * 가격이 null 이면 "가격 문의" 로 표시한다. 카탈로그+문의로 확정되면 이 카드를
 * 고칠 필요가 없고, 판매로 확정되면 값이 채워지면서 자연스럽게 가격이 뜬다.
 * 그래서 D1 을 기다리지 않고 목록을 만들 수 있다.
 */

const KRW = new Intl.NumberFormat("ko-KR");

/** 실측표에서 대표 항목의 최소~최대를 뽑는다. 값이 하나도 없으면 null. */
function range(product: Product, key: string): string | null {
  const values = product.measurements.rows
    .map((r) => r.values[key])
    .filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min}` : `${min}~${max}`;
}

export function ProductCard({ product }: { product: Product }) {
  const name = product.name ?? "제품명 확인 중";
  const image = product.images[0];
  const inStock = product.skus.filter((s) => s.stock > 0).length;
  const allSoldOut = inStock === 0;

  const shoulder = range(product, "shoulder");
  const chest = range(product, "chest");

  return (
    <article className="group">
      <Link href={`/products/${product.slug}`} className="block">
        {/*
          바깥 껍데기 + 안쪽 알맹이. 카드를 배경에 납작하게 얹지 않는다 —
          베이지 헤어라인 쟁반 위에 사진이 놓인 구조라 물성이 생긴다.
          그림자는 검정이 아니라 고동색 그늘이고, hover 에서 조금 들리며 그늘이 길어진다.

          사진은 **촬영 원본 그대로** 쓴다(누끼 아님). 벨벳 배경·조명·바닥 그림자가
          이미 사진 안에 있어서 카드가 무대를 흉내 낼 필요가 없고, 흉내 낸 것보다 자연스럽다.
          비율 2:3 은 촬영 원본 비율이다 — 3:4 로 자르면 머리나 발이 잘린다.
          누끼는 히어로에서만 쓴다. 거기는 인물이 글자를 딛고 서야 해서 배경이 없어야 한다.
        */}
        <div className="border-subtle bg-band/50 shadow-soft group-hover:shadow-lift ease-fluid rounded-[1.25rem] border p-1.5 transition-all duration-700 group-hover:-translate-y-1">
          <div className="bg-velvet relative aspect-[2/3] overflow-hidden rounded-[calc(1.25rem-0.375rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                loading="lazy"
                className="ease-fluid absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            ) : (
              /*
                버건디 면 위 글자는 크림으로 **고정**한다. 이 면은 UI 가 아니라 사진(촬영 배경)이라
                크림 구간(.on-cream) 안에서도 어두운 채로 남는데, 토큰(text-primary)을 쓰면
                거기서 딥 와인 글자가 되어 1.9:1 로 사라진다.
              */
              <span className="text-2xs tracking-label absolute inset-0 flex items-center justify-center text-[#F7F1EA]/60">
                촬영본 준비 중
              </span>
            )}

            {allSoldOut && (
              <span className="text-2xs tracking-label absolute left-3 top-3 rounded-full bg-[#F7F1EA] px-3 py-1 text-[#2E2925] shadow-soft">
                SOLD OUT
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <LineBadge line={product.line} />
            <h3 className="text-primary ease-fluid group-hover:text-accent mt-2 text-sm font-medium transition-colors duration-500">
              {name}
            </h3>
            <p className="text-muted text-2xs tracking-label mt-1">
              {CATEGORY_LABEL[product.category].en}
            </p>
          </div>
        </div>
      </Link>

      {/*
        실측 요약. 값이 없으면 숨기지 않고 **없다고 말한다** —
        숨기면 "이 브랜드는 실측을 안 준다" 로 읽히고, 말하면 "아직 등록 전" 으로 읽힌다.
      */}
      <p className="text-secondary mt-3 text-2xs tabular-nums">
        {shoulder || chest ? (
          <>
            {shoulder && <span>어깨 {shoulder}</span>}
            {shoulder && chest && <span className="text-muted"> · </span>}
            {chest && <span>가슴 {chest}</span>}
            <span className="text-muted"> cm</span>
          </>
        ) : (
          <span className="text-muted">실측 등록 전</span>
        )}
      </p>

      {/* 사이즈 — 품절은 지우지 않고 비활성으로 남긴다 */}
      <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="사이즈">
        {product.skus.map((sku) => (
          <li
            key={sku.id}
            className={`text-2xs rounded border px-2 py-0.5 tabular-nums ${
              sku.stock > 0
                ? "border-subtle text-secondary"
                : "border-subtle/60 text-muted line-through"
            }`}
          >
            {sku.size}
          </li>
        ))}
      </ul>

      <p className="text-primary mt-3 text-sm tabular-nums">
        {product.priceKrw !== null ? (
          <>
            {KRW.format(product.priceKrw)}원
            {product.listPriceKrw !== null &&
              product.listPriceKrw > product.priceKrw && (
                <span className="text-muted ml-2 text-2xs line-through">
                  {KRW.format(product.listPriceKrw)}원
                </span>
              )}
          </>
        ) : (
          // D1 이 카탈로그+문의로 확정되면 이 표시가 정상 상태가 된다.
          <span className="text-muted">가격 문의</span>
        )}
      </p>
    </article>
  );
}

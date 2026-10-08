import type { SiteImage } from "@/lib/siteImages";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { LINE_LABEL, type Product, type ProductLine } from "@/types/product";

/**
 * 메인 셋째 화면 — 레오네 · 페리토 두 라인 (2026-10-05 고객 디자인 가이드).
 *
 * 시안: 검은 바탕에 제목, 빨간 카드 둘(LEONE 클래식 / FERITO 에슬레틱), 아래 "맞춤 정장 →".
 * 카드는 각 라인 페이지(/line/leone · /line/ferito)로 간다.
 *
 * ── 시안의 색을 그대로 쓰지 않는다 ──────────────────────
 * 시안의 빨강(#A83232 근처) 위 검정 글자는 3.9:1 로 본문 기준(4.5:1)에 못 미친다. 와이어프레임의 색은
 * 자리 표시다 — 이 사이트의 버건디(--velvet-base) 위 크림 글자(9.47:1)로 옮긴다. 제목은 골드다.
 *
 * ── 카드 사진 ──────────────────────────────────────────
 * 관리자가 올린 카드 사진(MAIN_LINE_*) → 없으면 룩북이 그 라인의 대표로 쓰는 촬영본(public/products) → 그것도
 * 없으면 그 라인의 첫 상품 사진. 2026-10-08 전에는 바로 상품 사진으로 갔는데, 페리토의 상품 사진이 단색 시험
 * 이미지라 두 카드가 한 쌍으로 안 읽혔다(폰 점검) — 라인을 대표하는 사진은 룩북과 같은 컷이 맞다.
 * TODO(고객확인) 라인 대표 컷(레오네 · 페리토 각 1장) — 관리자 "메인 라인 카드" 에 올리면 그것이 먼저다.
 *
 * ── 폰 구성 (2026-10-08 리디자인) ───────────────────────
 * 폰에서는 두 카드를 **나란히** 둔다 — 한 화면에서 두 라인을 비교하는 것이 이 구간의 일이다. 세로로 쌓으면
 * 카드 하나가 화면 하나라 비교가 안 됐다. 글자는 사진 **아래** 띠에 둔다: 사진은 온전히 보이고 글자 대비는
 * 검정 바탕이 지킨다(전에는 사진 위에 얹혀 인물과 글자가 서로 가렸다).
 * 데스크톱(md 이상)은 전처럼 큰 카드 위에 글자를 얹는다 — 폭이 넓어 사진과 글자가 겹치지 않는다.
 *
 * 설명 문구는 types/product.ts 의 LINE_LABEL 을 쓴다. 상품 카드의 라인 배지 · 핏 비교와 같은 말이어야 한다.
 */

const LINES: ProductLine[] = ["LEONE", "FERITO"];

/** 관리자 사진이 없을 때의 라인 대표 컷 — 룩북(app/lookbook)의 첫 컷과 같다 */
const LINE_COVER_FALLBACK: Record<ProductLine, { url: string; alt: string }> = {
  LEONE: { url: "/products/photo-black-shirt.webp", alt: "" },
  FERITO: { url: "/products/photo-brown-shirt.webp", alt: "" },
};

export const lineHref = (line: ProductLine) => `/line/${line.toLowerCase()}/`;

export function LineChooser({
  products,
  covers = {},
}: {
  products: Product[];
  /** 관리자가 올린 카드 사진(사이트 사진 칸 MAIN_LINE_*, V23). 없으면 룩북 대표 컷, 그다음 첫 상품 사진 */
  covers?: Partial<Record<ProductLine, SiteImage | null>>;
}) {
  const photoOf = (line: ProductLine): { url: string } | null =>
    covers[line] ??
    LINE_COVER_FALLBACK[line] ??
    products.find((p) => p.line === line && p.images.length > 0)?.images[0] ??
    null;

  return (
    // 2026-10-06 고객 요청: 이 구간 바탕은 검정 — 라인 페이지(검정 · 빨강)와 한 공기
    <section aria-labelledby="lines-heading" className="bg-[#000000]">
      <div className="mx-auto max-w-[1320px] px-5 py-16 md:px-15 md:py-32">
        <h2
          id="lines-heading"
          className="font-display text-accent leading-display tracking-display text-center text-2xl md:text-4xl"
        >
          레오네 · 페리토, 두 가지 라인
        </h2>

        <ul className="mt-8 grid grid-cols-2 gap-3 md:mt-16 md:gap-8">
          {LINES.map((line) => {
            const label = LINE_LABEL[line];
            const photo = photoOf(line);
            return (
              <li key={line} className="min-w-0">
                <Link
                  href={lineHref(line)}
                  className="group bg-velvet ease-fluid relative flex flex-col transition-transform duration-700 hover:-translate-y-1 md:min-h-[560px] md:justify-end md:overflow-hidden"
                >
                  {/* 사진 — 폰은 4:5 한 장, 데스크톱은 카드 전체 */}
                  <span className="relative block aspect-[4/5] overflow-hidden md:absolute md:inset-0 md:aspect-auto">
                    {photo && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={photo.url}
                        alt=""
                        loading="lazy"
                        className="ease-fluid absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[1200ms] group-hover:scale-[1.03]"
                      />
                    )}
                    {/* 데스크톱만: 글자 자리를 눌러 준다. 사진이 밝아도 아래 3분의 1 은 버건디로 가라앉는다 */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 hidden md:block"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(40,6,12,0.94) 0%, rgba(40,6,12,0.72) 30%, rgba(40,6,12,0) 62%)",
                      }}
                    />
                  </span>

                  {/* 글자 — 폰은 사진 아래 띠(왼쪽 정렬), 데스크톱은 사진 위 가운데 */}
                  <span className="bg-[#000000] relative flex flex-col pt-4 md:items-center md:bg-transparent md:px-6 md:pb-12 md:pt-24 md:text-center">
                    <span className="font-display tracking-display text-2xl text-[#F7F1EA] md:text-5xl">{label.en}</span>
                    <span className="text-2xs tracking-label text-accent mt-1.5 md:mt-4 md:text-[#F7F1EA]/85">
                      {label.kind} 라인
                    </span>
                    <span className="mt-2.5 text-xs leading-relaxed text-[#F7F1EA]/75 md:mt-3 md:max-w-sm md:text-sm md:text-[#F7F1EA]/90">
                      {label.description}
                    </span>
                    <span className="text-2xs tracking-button ease-fluid mt-4 inline-flex items-center gap-1.5 text-[#F7F1EA] transition-transform duration-500 group-hover:translate-x-0.5 md:mt-6 md:gap-2">
                      라인 보기
                      <ArrowRight size={13} weight="light" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* 맞춤 정장 — 기성복 두 라인 밖의 길. 이용 안내의 "맞춤 제작" 카드로 간다(테일러샵 방문 안내) */}
        <div className="mt-10 flex justify-center md:mt-12">
          <Link
            href="/guide/#custom"
            className="group tracking-button ease-fluid inline-flex min-h-11 items-center gap-3 rounded-full border border-primary/45 px-7 text-sm text-primary transition-all duration-500 hover:border-accent hover:text-accent"
          >
            맞춤 정장
            <ArrowRight
              size={14}
              weight="light"
              aria-hidden="true"
              className="ease-fluid transition-transform duration-500 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

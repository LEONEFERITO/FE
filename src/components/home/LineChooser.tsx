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
 * ── 카드에 사진을 깐다 ──────────────────────────────────
 * 그 라인의 상품 사진이 있으면 카드 바탕에 깔고, 글자 아래를 어둡게 눌러 읽히게 한다.
 * 사진이 없으면 버건디 면만 남는다 — 그것도 시안과 같은 모습이라 비어 보이지 않는다.
 * TODO(고객확인) 라인 대표 컷(레오네 · 페리토 각 1장).
 *
 * 설명 문구는 types/product.ts 의 LINE_LABEL 을 쓴다. 상품 카드의 라인 배지 · 핏 비교와 같은 말이어야 한다.
 */

const LINES: ProductLine[] = ["LEONE", "FERITO"];

export const lineHref = (line: ProductLine) => `/line/${line.toLowerCase()}/`;

export function LineChooser({ products }: { products: Product[] }) {
  const photoOf = (line: ProductLine) =>
    products.find((p) => p.line === line && p.images.length > 0)?.images[0] ?? null;

  return (
    <section aria-labelledby="lines-heading">
      <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-15 md:py-32">
        <h2
          id="lines-heading"
          className="font-display text-accent leading-display tracking-display text-center text-3xl md:text-4xl"
        >
          레오네 · 페리토, 두 가지 라인
        </h2>

        <ul className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2 md:gap-8">
          {LINES.map((line) => {
            const label = LINE_LABEL[line];
            const photo = photoOf(line);
            return (
              <li key={line}>
                <Link
                  href={lineHref(line)}
                  className="group bg-velvet shadow-lift ease-fluid relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-[1.75rem] transition-transform duration-700 hover:-translate-y-1 md:min-h-[560px]"
                >
                  {photo && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={photo.url}
                      alt=""
                      loading="lazy"
                      className="ease-fluid absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[1200ms] group-hover:scale-[1.03]"
                    />
                  )}
                  {/* 글자 자리를 눌러 준다. 사진이 밝아도 아래 3분의 1 은 버건디로 가라앉는다 */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(40,6,12,0.94) 0%, rgba(40,6,12,0.72) 30%, rgba(40,6,12,0) 62%)",
                    }}
                  />
                  <span className="relative flex flex-col items-center px-6 pb-10 pt-24 text-center md:pb-12">
                    <span className="font-display tracking-display text-4xl text-[#F7F1EA] md:text-5xl">
                      {label.en}
                    </span>
                    <span className="text-2xs tracking-label mt-4 text-[#F7F1EA]/85">{label.kind} 라인</span>
                    <span className="mt-3 max-w-sm text-sm leading-relaxed text-[#F7F1EA]/90">
                      {label.description}
                    </span>
                    <span className="text-2xs tracking-button ease-fluid mt-6 inline-flex items-center gap-2 text-[#F7F1EA] transition-transform duration-500 group-hover:translate-x-0.5">
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

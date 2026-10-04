import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/motion/Reveal";
import { PageBand } from "@/components/ui/PageBand";
import { MEASURE_GUIDE } from "@/data/fit";
import { shareMetadata } from "@/lib/metadata";
import { pendingHint, pendingLabel } from "@/lib/pending";
import { LINE_LABEL } from "@/types/product";

/**
 * 브랜드 이용 메뉴얼 (요구사항 2-2).
 *
 * 고객이 요구한 여섯 가지를 한 페이지에: 주문 후 제작 · 라인별 핏 · 사이즈 고르는 법 ·
 * 수령 후 수선 · 관리법 · 맞춤 제작 시 테일러샵 안내.
 *
 * ── 01 이 가장 먼저 오는 이유 ───────────────────────────
 * '주문 후 제작' 은 단순 안내가 아니다. 제작 기간과 청약철회 제한을 **결제 전에**
 * 고지해야 법적으로 성립한다 (BRAND_BRIEF.md 3장). 결제 화면에도 다시 나오지만,
 * 여기서 먼저 읽은 사람은 결제에서 놀라지 않는다.
 *
 * TODO(고객확인) 제작 기간 · 수선 정책 · 관리법 문안 · 더맨리 네이버플레이스 링크.
 */

export const metadata: Metadata = shareMetadata({
  title: "이용 안내",
  description:
    "주문 후 제작 방식, 레오네·페리토 라인의 핏, 사이즈 고르는 법, 수선과 관리, 맞춤 제작 안내.",
});

const STEPS = ["주문", `제작 · ${pendingLabel("기간")}`, "발송", "수령"];

function Card({
  num,
  title,
  children,
  className = "",
}: {
  num: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`border-subtle bg-surface flex min-w-0 flex-col rounded-2xl border p-6 md:p-8 ${className}`}
    >
      <p className="text-accent text-2xs tracking-label">{num}</p>
      <h2 className="font-display text-primary leading-display mt-2 text-xl md:text-2xl">
        {title}
      </h2>
      <div className="text-secondary mt-4 flex flex-col gap-4 text-sm leading-relaxed">
        {children}
      </div>
    </article>
  );
}

export default function GuidePage() {
  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        <PageBand
          eyebrow="GUIDE"
          title="이용 안내"
          description="주문부터 수령, 수선과 관리까지. 궁금해하실 여섯 가지를 한 페이지에 모았습니다."
        />

        <div className="on-cream">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-5 py-12 md:px-15 md:py-16">
            {/* ── 01 주문 후 제작 ──────────────────────────── */}
            <Reveal>
              <Card num="01 · 가장 먼저" title="주문 후 제작됩니다">
                <p>
                  만들어 둔 옷을 파는 것이 아니라, 주문을 확인한 뒤 한 벌씩 제작합니다.
                  그래서 재고 대신 <b className="text-primary">제작 기간</b>이 표시됩니다.
                </p>
                <ol className="flex flex-wrap items-center gap-2" aria-label="주문 절차">
                  {STEPS.map((s, i) => (
                    <li key={s} className="flex items-center gap-2">
                      <span className="border-strong bg-surface text-secondary rounded-xl border px-4 py-2.5 text-xs">
                        {s}
                      </span>
                      {i < STEPS.length - 1 && (
                        <ArrowRight size={13} weight="light" aria-hidden="true" className="text-muted" />
                      )}
                    </li>
                  ))}
                </ol>
                <p className="border-accent border-l-2 pl-4 text-xs leading-relaxed">
                  제작이 시작된 뒤에는 단순 변심에 의한 취소·반품이 어렵습니다(전자상거래법
                  제17조 2항 5호). 다만 제품 하자나 오배송은 예외로, 교환·반품이 가능합니다.
                  결제 전에 이 내용을 다시 안내하고 동의를 받습니다.
                </p>
              </Card>
            </Reveal>

            {/* ── 02 · 03 고르는 법 ─────────────────────────── */}
            <div className="grid gap-5 md:grid-cols-2">
              <Reveal delay={60}>
                <Card num="02" title="레오네 · 페리토 — 어느 라인인가" className="h-full">
                  <div className="grid grid-cols-2 gap-3">
                    {(["LEONE", "FERITO"] as const).map((line) => (
                      <figure key={line} className="min-w-0">
                        <div className="border-subtle bg-band/50 relative aspect-[4/5] overflow-hidden rounded-xl border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={line === "LEONE" ? "/products/photo-black-shirt.webp" : "/products/photo-brown-shirt.webp"}
                            alt={`${LINE_LABEL[line].ko} 착용 컷`}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover object-top"
                          />
                        </div>
                        <figcaption className="text-primary mt-2 text-xs">
                          {LINE_LABEL[line].ko} · {LINE_LABEL[line].kind}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                  <p>
                    <b className="text-primary">레오네</b>는 {LINE_LABEL.LEONE.description}{" "}
                    <b className="text-primary">페리토</b>는 {LINE_LABEL.FERITO.description} 어깨·가슴·허벅지는
                    넉넉하게, 허리는 잡아주는 패턴이 페리토입니다.
                  </p>
                </Card>
              </Reveal>

              <Reveal delay={120}>
                <Card num="03" title="내게 맞는 사이즈 고르는 법" className="h-full">
                  <p>
                    사진이 아니라 치수로 고르세요. 아래처럼 몸을 잰 뒤, 각 상품 페이지의{" "}
                    <b className="text-primary">상세 사이즈 차트</b>와 견줍니다.
                  </p>
                  <dl className="flex flex-col gap-3">
                    {MEASURE_GUIDE.map((m) => (
                      <div key={m.key} className="border-subtle border-t pt-3">
                        <dt className="text-primary text-xs font-medium">{m.label}</dt>
                        <dd className="mt-1 text-xs leading-relaxed">{m.body}</dd>
                      </div>
                    ))}
                  </dl>
                  <Link
                    href="/products"
                    className="text-accent hover:text-accent-hover ease-fluid inline-flex min-h-11 w-fit items-center gap-1.5 text-xs underline underline-offset-4 transition-colors duration-300"
                  >
                    상품별 사이즈 차트 보러 가기
                    <ArrowRight size={12} weight="light" aria-hidden="true" />
                  </Link>
                </Card>
              </Reveal>
            </div>

            {/* ── 04 · 05 · 06 받은 뒤 ───────────────────────── */}
            <div className="grid gap-5 md:grid-cols-3">
              <Reveal delay={60}>
                <Card num="04" title="수령 후 수선" className="h-full">
                  {/* TODO(고객확인) 수선 정책 — 가능 범위 · 비용 · 기간 */}
                  <p className="text-muted">{pendingHint("수선 안내", "기장 · 허리 수선 가능 여부와 비용")}</p>
                </Card>
              </Reveal>
              <Reveal delay={120}>
                <Card num="05" title="관리법" className="h-full">
                  {/* TODO(고객확인) 원단별 세탁·보관 안내 */}
                  <p className="text-muted">{pendingHint("관리 안내", "드라이클리닝 · 보관 · 다림질")}</p>
                </Card>
              </Reveal>
              <Reveal delay={180}>
                <Card num="06" title="맞춤 제작을 원하시면" className="border-accent/40 h-full">
                  <p>
                    기성복으로 부족하다면 테일러샵 <b className="text-primary">더맨리</b>에서 맞춤
                    제작을 안내해 드립니다.
                  </p>
                  {/* TODO(고객확인) 네이버플레이스 링크 — 오면 여기 버튼이 된다 */}
                  <p className="text-muted text-xs">{pendingLabel("네이버플레이스 링크")}</p>
                </Card>
              </Reveal>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

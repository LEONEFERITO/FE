import type { Metadata } from "next";
import Link from "next/link";

import { CaretDown, ChatCircle } from "@phosphor-icons/react/dist/ssr";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/motion/Reveal";
import { PageBand } from "@/components/ui/PageBand";
import { pendingLabel } from "@/lib/pending";
import { LINE_LABEL } from "@/types/product";

/**
 * QnA (요구사항 3).
 *
 * 자주 묻는 질문 + 카카오톡 채널로 바로 묻는 길. 채널 ID 가 아직 없어서
 * 버튼 자리만 잡아 둔다 (BRAND_BRIEF.md 4장).
 *
 * ── 아코디언은 <details> 다 ─────────────────────────────
 * 열고 닫기·키보드·스크린리더를 브라우저가 해 준다. 손으로 만들면 그중 하나는 빠진다.
 * 첫 항목만 열어 둔다 — 전부 닫혀 있으면 어떻게 여는지부터 찾아야 한다.
 *
 * TODO(고객확인) 제작 기간 · 배송비 · 교환 조건 · 카카오톡 채널 ID · 더맨리 링크.
 */

export const metadata: Metadata = {
  title: "QnA",
  description: "주문·제작, 사이즈, 배송·교환에 대해 자주 묻는 질문.",
};

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "주문하면 언제 받을 수 있나요?",
    a: (
      <>
        주문을 확인한 뒤 제작에 들어갑니다. 제작 기간은 상품마다 다르며, 각 상품 페이지와
        결제 전에 표시됩니다. <span className="text-muted">{pendingLabel("제작 기간")}</span>
      </>
    ),
  },
  {
    q: "레오네와 페리토, 어떤 걸 골라야 하나요?",
    a: (
      <>
        <b className="text-primary">레오네</b>는 {LINE_LABEL.LEONE.description}{" "}
        <b className="text-primary">페리토</b>는 {LINE_LABEL.FERITO.description} 운동으로
        어깨·가슴·허벅지가 발달했는데 기성복 허리가 남는다면 페리토입니다.
      </>
    ),
  },
  {
    q: "사이즈가 안 맞으면 교환되나요?",
    a: (
      <>
        사이즈가 맞지 않으면 교환해 드립니다. 교환 가능 기간과 배송비 부담은 정책이 확정되는
        대로 안내합니다. <span className="text-muted">{pendingLabel("교환 조건")}</span>
      </>
    ),
  },
  {
    q: "주문 제작인데 취소할 수 있나요?",
    a: (
      <>
        제작이 시작되기 전에는 취소할 수 있습니다. 주문에 따라 제작하는 상품은 주문 전에 따로
        알려 드리고 동의를 받은 경우에 한해, 제작이 시작된 뒤 단순 변심에 의한 취소·반품이
        제한됩니다(전자상거래법 제17조 제2항, 같은 법 시행령 제21조). 제품 하자나 오배송은
        교환·반품이 가능합니다. 자세한 기준은{" "}
        <Link
          href="/terms#article-16"
          className="text-accent hover:text-accent-hover underline underline-offset-4"
        >
          이용약관 제16조
        </Link>
        에 있습니다.
      </>
    ),
  },
  {
    q: "수선은 어디서 받나요?",
    a: (
      <>
        기장·허리처럼 정교한 수선이 필요하면 테일러샵 <b className="text-primary">더맨리</b>로
        안내해 드립니다. <span className="text-muted">{pendingLabel("네이버플레이스 링크")}</span>
      </>
    ),
  },
  {
    q: "배송비는 얼마인가요?",
    a: <span className="text-muted">{pendingLabel("배송비 정책")}</span>,
  },
];

export default function QnaPage() {
  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        <PageBand
          eyebrow="QNA"
          title="자주 묻는 질문"
          description="여기서 답을 못 찾으시면 카카오톡 채널로 바로 물어보실 수 있습니다."
        />

        <div className="on-cream">
          <div className="mx-auto grid max-w-[1320px] gap-8 px-5 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] md:gap-10 md:px-15 md:py-16">
            <Reveal className="min-w-0">
              <div className="border-subtle bg-surface divide-subtle divide-y rounded-2xl border px-5 md:px-7">
                {FAQ.map((item, i) => (
                  <details key={item.q} open={i === 0} className="group py-1">
                    <summary className="text-primary flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                      <span>{item.q}</span>
                      <CaretDown
                        size={14}
                        weight="light"
                        aria-hidden="true"
                        className="text-accent ease-fluid shrink-0 transition-transform duration-300 group-open:rotate-180"
                      />
                    </summary>
                    <p className="text-secondary pb-5 text-sm leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>
            </Reveal>

            <div className="flex min-w-0 flex-col gap-4">
              <Reveal delay={100}>
                <div className="border-subtle bg-surface flex flex-col gap-4 rounded-2xl border p-6">
                  <h2 className="font-display text-primary text-xl">답을 못 찾으셨나요</h2>
                  <p className="text-secondary text-sm leading-relaxed">
                    카카오톡 채널로 바로 문의하실 수 있습니다.
                  </p>
                  {/*
                    TODO(고객확인) 카카오톡 채널 ID — 오면 이 자리가 pf.kakao.com 링크가 된다.
                    링크가 없는 동안은 버튼처럼 보이는 것을 두지 않는다. 눌러서 아무 일도 없으면 고장으로 읽힌다.
                  */}
                  <p className="border-subtle bg-band/60 text-muted flex items-center gap-2 rounded-xl border px-4 py-3 text-xs">
                    <ChatCircle size={15} weight="light" aria-hidden="true" />
                    카카오톡 채널 연결 준비 중
                  </p>
                </div>
              </Reveal>

              <Reveal delay={160}>
                <div className="border-strong rounded-2xl border border-dashed p-6">
                  <h2 className="text-primary text-sm font-medium">테일러샵 방문</h2>
                  <p className="text-secondary mt-2 text-sm leading-relaxed">
                    정교한 맞춤을 원하시면 <b className="text-primary">더맨리</b>로 안내해
                    드립니다.
                  </p>
                  <Link
                    href="/guide"
                    className="text-accent hover:text-accent-hover ease-fluid mt-3 inline-flex min-h-11 items-center text-xs underline underline-offset-4 transition-colors duration-300"
                  >
                    이용 안내에서 더 보기
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

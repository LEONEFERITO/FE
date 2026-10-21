import type { Metadata } from "next";

import { ChatCircle } from "@phosphor-icons/react/dist/ssr";

import { FaqAccordion } from "@/components/content/FaqAccordion";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/motion/Reveal";
import { PageBand } from "@/components/ui/PageBand";
import { KAKAO_CHANNEL, TAILOR_SHOP_URL } from "@/data/business";
import { shareMetadata } from "@/lib/metadata";

/**
 * QnA (요구사항 3).
 *
 * 자주 묻는 질문 + 카카오톡 채널로 바로 묻는 길.
 * 질문은 관리자 FAQ 관리에서 고친다. 하나도 등록하지 않았으면 아래 기본 질문(FAQ)이 나간다.
 * 2026-10-06 구조표의 FAQ "AI 답변형식 정해진 답변" — 채팅처럼 묻고 답하는 화면(FaqChat). 답은 관리자가 적은 그대로다.
 * 채널은 더맨리 카카오톡 채널이다(data/business.ts KAKAO_CHANNEL) — 버튼은 1:1 채팅을 바로 연다.
 *
 * ── 아코디언은 <details> 다 ─────────────────────────────
 * 열고 닫기·키보드·스크린리더를 브라우저가 해 준다. 손으로 만들면 그중 하나는 빠진다.
 * 첫 항목만 열어 둔다 — 전부 닫혀 있으면 어떻게 여는지부터 찾아야 한다.
 *
 * TODO(고객확인) 제작 기간 · 배송비 · 교환 조건 · 더맨리 링크.
 */

export const metadata: Metadata = shareMetadata({
  title: "QnA",
  description: "주문·제작, 사이즈, 배송·교환에 대해 자주 묻는 질문.",
});

/** 기본 질문 — 2026-10-21 디자이너가 보낸 문안 그대로. 관리자 FAQ 에 질문을 올리면 그쪽이 나온다 */
const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "기성 수트와 맞춤 수트 중 어떤 것이 더 좋나요?",
    a: "두 방식 모두 장점이 있습니다. 기성 수트는 정해진 사이즈 중에서 선택해 비교적 간편하게 구매할 수 있고, 맞춤 수트는 개인의 체형과 취향을 더욱 세밀하게 반영할 수 있습니다. 예산과 착용 목적, 원하는 핏에 따라 적합한 방식을 선택하시는 것이 좋습니다.",
  },
  {
    q: "기성 수트도 수선해서 입을 수 있나요?",
    a: "네. 제품의 디자인과 봉제 구조에 따라 소매 길이, 바지 길이, 허리둘레 등 일부 항목은 수선이 가능합니다. 다만 수선 가능 범위는 제품마다 다를 수 있습니다.",
  },
  {
    q: "온라인으로 구매해도 사이즈를 선택하기 어렵지 않을까요?",
    a: "평소 착용하시는 수트 사이즈와 신체 치수, 원하시는 핏을 참고해 사이즈 선택을 도와드릴 수 있습니다. 평소 잘 맞는 수트의 사이즈나 착용 사진을 함께 보내주시면 더욱 구체적인 안내가 가능합니다.",
  },
  {
    q: "제품 교환이나 반품은 어떻게 진행되나요?",
    a: "교환 및 반품은 구매 경로와 제품 상태, 적용되는 판매 정책에 따라 안내해 드립니다. 구매 전 상세 정책을 확인해 주시고, 관련 문의는 주문 정보와 함께 채널로 남겨주시면 안내해 드리겠습니다.",
  },
];

export default function QnaPage() {
  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        <PageBand
          eyebrow="CLIENT SERVICES · FAQ"
          title="자주 묻는 질문"
          description="여기서 답을 못 찾으시면 카카오톡 채널로 바로 물어보실 수 있습니다."
        />

        {/* 2026-10-21 디자이너 시안: 왼쪽 "LEONE FERITO 안내" 아코디언, 오른쪽 카카오톡 상자 + 더맨리 상자(상자 전체가 링크) */}
        <div className="on-cream on-white">
          <div className="mx-auto grid max-w-[1320px] gap-8 px-5 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] md:gap-12 md:px-15 md:py-16">
            <Reveal className="min-w-0">
              <h2 className="font-display text-primary flex items-center gap-3 text-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/leoneferito-monogram.webp" alt="" aria-hidden="true" className="h-6 w-6 object-contain" />
                LEONE FERITO 안내
              </h2>
              <div className="mt-5">
                <FaqAccordion fallback={FAQ} />
              </div>
            </Reveal>

            <div className="flex min-w-0 flex-col gap-4">
              <Reveal delay={100}>
                <div className="border-subtle flex flex-col gap-4 border bg-white p-6 text-center">
                  <p className="text-secondary text-sm leading-relaxed">
                    카카오톡 채널 <b className="text-primary">{KAKAO_CHANNEL.name}</b>로 바로 문의하실 수 있습니다.
                  </p>
                  {/* 카카오 노랑 — 손님이 "카카오로 간다" 를 색으로 먼저 읽는다 */}
                  <a
                    href={KAKAO_CHANNEL.chat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ease-fluid inline-flex min-h-12 items-center justify-center gap-2 bg-[#FEE500] px-5 text-sm font-medium text-[#191919] transition-colors duration-300 hover:bg-[#F5DC00] active:scale-[0.98]"
                  >
                    <ChatCircle size={18} weight="fill" aria-hidden="true" />
                    카카오톡으로 문의하기
                    <span className="sr-only">(새 창)</span>
                  </a>
                  <a
                    href={KAKAO_CHANNEL.home}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:text-primary ease-fluid -mt-1 inline-flex min-h-11 items-center justify-center text-xs underline underline-offset-4 transition-colors duration-300"
                  >
                    채널 추가하고 소식 받기<span className="sr-only">(새 창)</span>
                  </a>
                </div>
              </Reveal>

              <Reveal delay={160}>
                {/* 더맨리 상자 — 상자 어디를 눌러도 더맨리로 (2026-10-21 디자이너 "이 네모 영역 전체 어디를 눌러도 연결") */}
                <a
                  href={TAILOR_SHOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-subtle hover:border-accent ease-fluid flex flex-col items-center gap-4 border bg-white p-8 text-center transition-colors duration-300"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {/* 더맨리 사자 로고(금색, 투명 바탕) — 2026-10-21 고객 전달 */}
                  <img src="/brand/themanly-lion.webp" alt="" aria-hidden="true" className="h-16 w-auto object-contain" />
                  <p className="text-secondary text-sm leading-relaxed">
                    개인의 몸에 꼭 맞는 맞춤 정장을 원하시면
                    <br />
                    <b className="text-primary">더맨리</b>로 안내해 드립니다.
                  </p>
                  <span className="sr-only">(더맨리, 새 창)</span>
                </a>
              </Reveal>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

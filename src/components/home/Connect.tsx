import Link from "next/link";

import { KAKAO_CHANNEL, SNS } from "@/data/business";
import { pendingLabel } from "@/lib/pending";

/**
 * 메인 다섯째 화면 — 큐앤에이 · 카카오톡 채널 · 인스타/유튜브 (2026-10-05 고객 디자인 가이드).
 *
 * 시안은 세 줄의 메모다: "큐앤에이 / 카카오톡 채널 연결 / 인스타랑 유튜브 등 링크 연결".
 * 네 칸으로 푼다 — 사이트 안에서 답을 찾는 길(QnA) 하나, 밖으로 나가는 길 셋.
 *
 * ── 주소가 없는 채널 ────────────────────────────────────
 * 인스타그램 · 유튜브 주소는 아직 받지 못했다(data/business.ts SNS). 그 칸은 **링크가 아닌 칸**으로 두고
 * "확인 중" 을 보여준다. 빼 버리면 요청한 것이 안 된 것으로 보이고, 가짜 주소를 걸면 눌렀을 때 고장으로 읽힌다.
 * 주소가 들어오면 그 칸이 저절로 링크가 된다.
 *
 * 밖으로 나가는 링크는 새 창으로 연다 — 둘러보던 사람이 사이트를 잃지 않게. 새 창임은 화면낭독기에도 알린다.
 *
 * ── 2026-10-07 고객 요청 ────────────────────────────────
 * 위의 "— CONTACT" 꼬리표를 뺐고, 구간 바탕은 흰색(page.tsx 에서 on-white), 칸은 테두리 없는 옅은 면이다.
 * 처음에는 고객 요청대로 모서리를 둥글렸다가 같은 날 다시 직각으로 — 사이트 전체와 같다.
 */

interface Channel {
  key: string;
  label: string;
  note: string;
  href: string | null;
  external: boolean;
}

const CHANNELS: Channel[] = [
  { key: "qna", label: "Q&A", note: "주문 · 제작, 사이즈, 배송 · 교환에 대해 자주 묻는 질문", href: "/qna/", external: false },
  { key: "kakao", label: "Kakao Talk", note: `${KAKAO_CHANNEL.name} 채널로 1:1 문의`, href: KAKAO_CHANNEL.chat, external: true },
  { key: "instagram", label: "Instagram", note: "착장과 새 소식", href: SNS.instagram, external: true },
  { key: "youtube", label: "YouTube", note: "영상으로 보는 레오네페리토", href: SNS.youtube, external: true },
];

/**
 * 2026-10-20 디자이너 목업: 제목 "문의 및 채널" 가운데, 그 아래 와인(#5E1F21) 상자 넷이 한 줄 — 상자 안에는 이름만.
 * 설명(note)은 화면 낭독기에만 남긴다. 주소를 아직 못 받은 채널은 흐린 상자로 두고 누르지 못한다.
 */
// 모서리는 둥글게 — 2026-10-20 디자이너 "각지게 말고 rounded 로".
// rounded-xl 은 쓰면 안 된다: globals.css 가 사이트 전체 모서리를 직각으로 고정해(--radius-* = 0, 2026-10-06 고객 요청)
// 토큰 클래스는 0 으로 풀린다. 그래서 토큰을 타지 않는 값(rounded-[12px])을 직접 쓴다 — 이 상자만 둥글다.
// 2026-10-28 디자이너: 상자를 더 높게, 글자는 상자 정가운데. 줄 높이를 글자 높이에 맞춰(leading-none) 위아래 여백이 똑같게 한다
const TILE =
  "font-display flex min-h-[72px] w-full items-center justify-center rounded-[12px] px-3 text-center text-sm leading-none tracking-[0.04em] md:min-h-[104px] md:text-base";

export function Connect() {
  return (
    <section aria-labelledby="connect-heading" className="mx-auto max-w-[1320px] px-5 py-20 md:px-15 md:py-28">
      <h2
        id="connect-heading"
        className="font-display text-primary leading-display tracking-display text-center text-3xl md:text-4xl"
      >
        문의 및 채널
      </h2>

      <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {CHANNELS.map((channel) => {
          const live = channel.href !== null;
          const body = (
            <>
              {channel.label}
              <span className="sr-only"> — {live ? channel.note : pendingLabel("주소")}</span>
            </>
          );
          return (
            <li key={channel.key}>
              {!live ? (
                <div className={`${TILE} bg-[#5E1F21]/40 text-[#F7F1EA]/70`} aria-disabled="true">
                  {body}
                </div>
              ) : channel.external ? (
                <a
                  href={channel.href ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${TILE} ease-fluid bg-[#5E1F21] text-[#F7F1EA] transition-colors duration-500 hover:bg-[#4a1719]`}
                >
                  {body}
                  <span className="sr-only">(새 창)</span>
                </a>
              ) : (
                <Link
                  href={channel.href ?? "/"}
                  className={`${TILE} ease-fluid bg-[#5E1F21] text-[#F7F1EA] transition-colors duration-500 hover:bg-[#4a1719]`}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

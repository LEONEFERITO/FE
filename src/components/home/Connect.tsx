import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
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
  { key: "qna", label: "QnA", note: "주문 · 제작, 사이즈, 배송 · 교환에 대해 자주 묻는 질문", href: "/qna/", external: false },
  { key: "kakao", label: "카카오톡 채널", note: `${KAKAO_CHANNEL.name} 채널로 1:1 문의`, href: KAKAO_CHANNEL.chat, external: true },
  { key: "instagram", label: "Instagram", note: "착장과 새 소식", href: SNS.instagram, external: true },
  { key: "youtube", label: "YouTube", note: "영상으로 보는 레오네페리토", href: SNS.youtube, external: true },
];

const TILE =
  "bg-band flex h-full min-h-[148px] flex-col justify-between gap-6 p-6 md:p-7";

function Body({ channel, live }: { channel: Channel; live: boolean }) {
  return (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className={`font-display text-xl ${live ? "text-primary" : "text-muted"}`}>{channel.label}</span>
        {live && (
          <ArrowUpRight
            size={16}
            weight="light"
            aria-hidden="true"
            className="text-accent ease-fluid mt-1 shrink-0 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        )}
      </span>
      <span className={`text-sm leading-relaxed ${live ? "text-secondary" : "text-muted"}`}>
        {live ? channel.note : pendingLabel("주소")}
      </span>
    </>
  );
}

export function Connect() {
  return (
    <section aria-labelledby="connect-heading" className="mx-auto max-w-[1320px] px-5 py-24 md:px-15 md:py-32">
      <h2
        id="connect-heading"
        className="font-display text-primary leading-display tracking-display text-3xl md:text-4xl"
      >
        문의 · 채널
      </h2>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CHANNELS.map((channel) => {
          const live = channel.href !== null;
          return (
            <li key={channel.key}>
              {!live ? (
                <div className={TILE}>
                  <Body channel={channel} live={false} />
                </div>
              ) : channel.external ? (
                <a
                  href={channel.href ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group ease-fluid hover:bg-accent-tint transition-colors duration-500 ${TILE}`}
                >
                  <Body channel={channel} live />
                  <span className="sr-only">(새 창)</span>
                </a>
              ) : (
                <Link
                  href={channel.href ?? "/"}
                  className={`group ease-fluid hover:bg-accent-tint transition-colors duration-500 ${TILE}`}
                >
                  <Body channel={channel} live />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

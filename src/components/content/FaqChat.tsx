"use client";

import { ChatCircle, PaperPlaneRight } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";

import { KAKAO_CHANNEL } from "@/data/business";
import { publicFaqs, type Faq } from "@/lib/console";
import { SHOP_CONNECTED } from "@/lib/shop";

/**
 * FAQ — 채팅처럼 묻고 답하는 화면 (2026-10-06 고객 사이트 구조표 "AI 답변형식 정해진 답변").
 *
 * 생김새만 채팅이다. 손님이 질문 칩을 누르면 그 질문이 말풍선으로 올라가고, 잠깐 입력 중 표시 뒤에
 * **관리자가 적어 둔 답**이 돌아온다. AI 가 지어내는 답은 없다 — 주문 · 교환 같은 안내는 틀리면 안 되고,
 * 정해진 답만 나가면 관리자가 쓴 문장 그대로 책임질 수 있다. 화면에도 그렇게 적는다.
 * 자유 입력 칸은 두지 않는다 — 입력을 받으면 "알아듣는다" 고 기대하게 된다. 칩에 없는 질문은 카카오톡으로 잇는다.
 *
 * 질문 · 답의 출처: 관리자 FAQ 가 하나라도 있으면 그것, 없으면 QnA 페이지 코드의 기본 질문(예전 아코디언 FaqList 를 대신한다).
 *
 * ── 검색엔진 · JS 없는 환경 ───────────────────────────────
 * 대화는 누른 뒤에야 생기므로, 아래에 "전체 질문 보기"(<details>)로 질문과 답 전부를 HTML 에 함께 둔다.
 *
 * ── 접근성 ─────────────────────────────────────────────
 * 대화 기록은 role="log" + aria-live 라 새 답이 오면 화면낭독기가 읽는다. 칩은 버튼이다.
 * 움직임을 줄인 사용자에게는 입력 중 표시를 짧게 줄인다(전역 규칙이 점 애니메이션도 끈다).
 */

interface Item {
  key: string;
  q: string;
  a: React.ReactNode;
}

type Message = { id: number; from: "guest" | "brand"; body: React.ReactNode };

const GREETING = "안녕하세요, LEONE FERITO 입니다. 궁금하신 질문을 아래에서 골라 주세요.";

export function FaqChat({ fallback }: { fallback: { q: string; a: React.ReactNode }[] }) {
  const [fromServer, setFromServer] = useState<Faq[] | null>(null);
  const [messages, setMessages] = useState<Message[]>([{ id: 0, from: "brand", body: GREETING }]);
  const [typing, setTyping] = useState(false);
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const logRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    publicFaqs()
      .then((list) => alive && list.length > 0 && setFromServer(list))
      .catch(() => {
        // 기본 질문이 이미 보이고 있다 — 조용히 그대로 둔다
      });
    return () => {
      alive = false;
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  // 새 말풍선이 생기면 대화창 안에서만 맨 아래로 — 페이지 전체를 끌어내리지 않는다
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const items: Item[] = fromServer
    ? fromServer.map((f) => ({ key: f.id, q: f.question, a: <span className="whitespace-pre-line">{f.answer}</span> }))
    : fallback.map((f) => ({ key: f.q, q: f.q, a: f.a }));

  function ask(item: Item) {
    if (typing) return;
    const push = (from: Message["from"], body: React.ReactNode) =>
      setMessages((m) => [...m, { id: nextId.current++, from, body }]);
    push("guest", item.q);
    setAsked((s) => new Set(s).add(item.key));
    setTyping(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = window.setTimeout(
      () => {
        setTyping(false);
        push("brand", item.a);
      },
      reduce ? 150 : 700,
    );
  }

  function reset() {
    if (timer.current) window.clearTimeout(timer.current);
    setTyping(false);
    setAsked(new Set());
    setMessages([{ id: nextId.current++, from: "brand", body: GREETING }]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border-subtle bg-surface flex flex-col border">
        {/* 머리 — 누가 답하는지, 어떤 답인지 */}
        <div className="border-subtle flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/leoneferito-monogram.webp" alt="" width={22} height={25} className="h-[25px] w-auto" />
            <div>
              <p className="text-primary text-sm font-medium">LEONE FERITO 안내</p>
              <p className="text-muted text-2xs">자주 묻는 질문에 정해진 답을 드립니다</p>
            </div>
          </div>
          {messages.length > 1 && (
            <button
              type="button"
              onClick={reset}
              className="text-muted hover:text-accent ease-fluid min-h-11 text-xs underline underline-offset-4 transition-colors duration-300"
            >
              처음으로
            </button>
          )}
        </div>

        {/* 대화 기록 */}
        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-label="질문과 답변"
          className="flex h-[min(52vh,460px)] flex-col gap-3 overflow-y-auto px-4 py-5 md:px-6"
        >
          {messages.map((m) =>
            m.from === "brand" ? (
              <div key={m.id} className="flex max-w-[88%] items-end gap-2 md:max-w-[78%]">
                <span aria-hidden="true" className="bg-stage mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/leoneferito-monogram.webp" alt="" width={12} height={14} className="h-[14px] w-auto" />
                </span>
                <div className="bg-band text-secondary faq-bubble px-4 py-3 text-sm leading-relaxed">{m.body}</div>
              </div>
            ) : (
              <div key={m.id} className="faq-bubble bg-accent text-on-accent ml-auto max-w-[80%] px-4 py-3 text-sm leading-relaxed md:max-w-[70%]">
                {m.body}
              </div>
            ),
          )}
          {typing && (
            <div className="flex items-end gap-2" aria-label="답변을 준비하고 있습니다">
              <span aria-hidden="true" className="bg-stage flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/leoneferito-monogram.webp" alt="" width={12} height={14} className="h-[14px] w-auto" />
              </span>
              <span className="bg-band flex gap-1 px-4 py-4" aria-hidden="true">
                {[0, 150, 300].map((d) => (
                  <i key={d} className="faq-dot bg-muted block h-1.5 w-1.5 rounded-full" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
            </div>
          )}
        </div>

        {/* 질문 칩 — 이미 물은 질문은 흐리게 두되 다시 누를 수 있다 */}
        <div className="border-subtle border-t px-4 py-4 md:px-6">
          <p className="text-muted text-2xs mb-3 flex items-center gap-1.5">
            <PaperPlaneRight size={12} weight="light" aria-hidden="true" />
            질문을 눌러 주세요
          </p>
          <ul className="flex flex-wrap gap-2">
            {items.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => ask(item)}
                  disabled={typing}
                  className={`border-interactive hover:border-accent hover:text-accent ease-fluid min-h-11 border px-4 text-left text-xs transition-colors duration-300 disabled:cursor-wait ${
                    asked.has(item.key) ? "text-muted" : "text-primary"
                  }`}
                >
                  {item.q}
                </button>
              </li>
            ))}
            <li>
              <a
                href={KAKAO_CHANNEL.chat}
                target="_blank"
                rel="noopener noreferrer"
                data-quick-avoid=""
                className="ease-fluid inline-flex min-h-11 items-center gap-1.5 bg-[#FEE500] px-4 text-xs font-medium text-[#191919] transition-colors duration-300 hover:bg-[#F5DC00]"
              >
                <ChatCircle size={14} weight="fill" aria-hidden="true" />
                찾는 질문이 없어요 — 카카오톡으로 문의
                <span className="sr-only">(새 창)</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* 전체 질문 — 검색엔진 · JS 없는 환경에도 질문과 답이 전부 있다 */}
      <details className="border-subtle bg-surface group border px-5 md:px-7">
        <summary className="text-secondary flex min-h-12 cursor-pointer list-none items-center justify-between text-xs [&::-webkit-details-marker]:hidden">
          전체 질문 한눈에 보기
          <span aria-hidden="true" className="text-accent transition-transform duration-300 group-open:rotate-45">
            +
          </span>
        </summary>
        <dl className="divide-subtle divide-y pb-2">
          {items.map((item) => (
            <div key={item.key} className="py-4">
              <dt className="text-primary text-sm font-medium">{item.q}</dt>
              <dd className="text-secondary mt-2 text-sm leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}

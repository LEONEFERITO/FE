"use client";

import { useEffect, useState } from "react";

import { publicFaqs, type Faq } from "@/lib/console";
import { SHOP_CONNECTED } from "@/lib/shop";

/**
 * 자주 묻는 질문 — 아코디언 (2026-10-21 디자이너 시안 "누르면 아래에 답변이 보이도록").
 * 줄마다 왼쪽에 와인 띠 · 옅은 그림자, 앞에 Q. 누르면 그 줄 아래로 답이 펼쳐진다(한 번에 하나).
 * 관리자 FAQ(/admin/faq)에 질문이 있으면 그것, 없으면 페이지가 준 기본 질문.
 */
interface Item {
  key: string;
  q: string;
  a: React.ReactNode;
}

export function FaqAccordion({ fallback }: { fallback: { q: string; a: React.ReactNode }[] }) {
  const [fromServer, setFromServer] = useState<Faq[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    publicFaqs()
      .then((list) => alive && list.length > 0 && setFromServer(list))
      .catch(() => {
        // 기본 질문이 이미 보인다 — 그대로 둔다
      });
    return () => {
      alive = false;
    };
  }, []);

  const items: Item[] = fromServer
    ? fromServer.map((f) => ({ key: f.id, q: f.question, a: f.answer }))
    : fallback.map((f) => ({ key: f.q, q: f.q, a: f.a }));

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => {
        const on = open === item.key;
        const panel = `faq-panel-${i}`;
        return (
          <li key={item.key} className="border-l-4 border-[#5E1F21] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
            <button
              type="button"
              aria-expanded={on}
              aria-controls={panel}
              onClick={() => setOpen(on ? null : item.key)}
              className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span aria-hidden="true" className="font-display shrink-0 text-lg leading-none text-[#170A0E]">
                Q
              </span>
              <span className="text-primary flex-1 text-sm font-bold leading-snug">{item.q}</span>
            </button>
            {on && (
              <div id={panel} className="text-secondary px-4 pb-4 pl-[2.6rem] text-sm leading-relaxed whitespace-pre-line">
                {item.a}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

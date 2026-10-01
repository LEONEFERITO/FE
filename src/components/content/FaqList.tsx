"use client";

import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { publicFaqs, type Faq } from "@/lib/console";
import { SHOP_CONNECTED } from "@/lib/shop";

/**
 * QnA 아코디언.
 *
 * 관리자가 FAQ 를 하나라도 등록했으면 그것을, 없으면(또는 서버가 없으면) 코드에 있는 기본 질문을 보여 준다.
 * 기본 질문을 먼저 그려 둔다 — 정적 HTML 에도 내용이 있어야 하고, 서버를 기다리는 동안 빈 화면이 되지 않는다.
 *
 * 아코디언은 <details> 다. 열고 닫기 · 키보드 · 스크린리더를 브라우저가 해 준다. 첫 항목만 열어 둔다.
 */
export function FaqList({ fallback }: { fallback: { q: string; a: React.ReactNode }[] }) {
  const [fromServer, setFromServer] = useState<Faq[] | null>(null);

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
    };
  }, []);

  const items = fromServer
    ? fromServer.map((f) => ({ key: f.id, q: f.question, a: <span className="whitespace-pre-line">{f.answer}</span> }))
    : fallback.map((f) => ({ key: f.q, q: f.q, a: f.a }));

  return (
    <div className="border-subtle bg-surface divide-subtle divide-y rounded-2xl border px-5 md:px-7">
      {items.map((item, i) => (
        <details key={item.key} open={i === 0} className="group py-1">
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
  );
}

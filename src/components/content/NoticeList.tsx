"use client";

import { CaretLeft, CaretRight, PushPin } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

import { day, publicNotices, type PublicNoticePage } from "@/lib/console";
import { SHOP_CONNECTED } from "@/lib/shop";

/**
 * 손님 공지 목록. 브라우저에서 바로 읽는다 — 올린 공지가 재빌드를 기다리지 않고 보인다.
 * 서버가 연결되지 않은 단계(화면 확인)에서는 "아직 없음" 으로 보인다.
 */

type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; page: PublicNoticePage };

export function NoticeList() {
  const [page, setPage] = useState(0);
  const [state, setState] = useState<State>(
    SHOP_CONNECTED ? { kind: "loading" } : { kind: "ready", page: { items: [], page: 0, totalPages: 0, totalElements: 0 } },
  );

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    publicNotices(page)
      .then((p) => alive && setState({ kind: "ready", page: p }))
      .catch(() => alive && setState({ kind: "error" }));
    return () => {
      alive = false;
    };
  }, [page]);

  if (state.kind === "loading") return <p aria-busy="true" className="text-muted text-sm">불러오는 중</p>;
  if (state.kind === "error") {
    return <p role="alert" className="text-error text-sm">공지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>;
  }
  const p = state.page;
  if (p.items.length === 0) {
    return (
      <div className="border-subtle bg-band/60 rounded-2xl border px-6 py-12 text-center">
        <p className="text-primary text-sm">등록된 공지가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ul className="border-subtle divide-subtle divide-y border-y">
        {p.items.map((n) => (
          <li key={n.id}>
            <Link href={`/notice/view/?id=${encodeURIComponent(n.id)}`}
              className="group hover:bg-band/60 ease-fluid flex min-h-14 min-w-0 items-center justify-between gap-6 px-1 py-4 transition-colors duration-300 md:px-3">
              <span className="flex min-w-0 items-center gap-2">
                {n.pinned && <PushPin size={14} weight="fill" aria-label="중요" className="text-accent shrink-0" />}
                <span className={`group-hover:text-accent truncate text-sm ${n.pinned ? "text-primary font-medium" : "text-primary"}`}>{n.title}</span>
              </span>
              <span className="text-muted text-2xs shrink-0 tabular-nums">{day(n.publishedAt)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {p.totalPages > 1 && (
        <nav aria-label="쪽 이동" className="flex items-center justify-center gap-4">
          <button type="button" disabled={p.page === 0} onClick={() => setPage(page - 1)}
            className="border-interactive text-secondary inline-flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40">
            <CaretLeft size={16} weight="light" aria-hidden="true" />
            <span className="sr-only">이전 쪽</span>
          </button>
          <span className="text-secondary text-sm tabular-nums">{p.page + 1} / {p.totalPages}</span>
          <button type="button" disabled={p.page + 1 >= p.totalPages} onClick={() => setPage(page + 1)}
            className="border-interactive text-secondary inline-flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40">
            <CaretRight size={16} weight="light" aria-hidden="true" />
            <span className="sr-only">다음 쪽</span>
          </button>
        </nav>
      )}
    </div>
  );
}

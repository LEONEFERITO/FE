"use client";

import { Plus, PushPin } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/admin/AdminMemberList";
import { ErrorNotice } from "@/components/admin/AdminProductList";
import { adminNotices, day, type Notice } from "@/lib/console";
import { SHOP_CONNECTED, ShopError } from "@/lib/shop";

/** 관리자 공지 목록 — 고정 먼저, 최근에 만든 순. 공개 여부가 한눈에 보이게 배지를 단다. */

type State = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready"; items: Notice[] };

export function AdminNoticeList() {
  const [state, setState] = useState<State>(
    SHOP_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    adminNotices()
      .then((items) => alive && setState({ kind: "ready", items }))
      .catch((e) => {
        if (!alive) return;
        const code = e instanceof ShopError ? (e.status === 401 ? "UNAUTHENTICATED" : e.status === 403 ? "FORBIDDEN" : e.code) : "UNKNOWN";
        setState({ kind: "error", code, message: e instanceof ShopError ? e.message : "불러오지 못했습니다." });
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/notices/edit/"
        className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 w-fit items-center gap-2 rounded-full px-6 text-sm transition-colors duration-300">
        <Plus size={15} weight="light" aria-hidden="true" />
        새 공지
      </Link>

      {state.kind === "loading" && <p aria-busy="true" className="text-muted text-sm">불러오는 중</p>}
      {state.kind === "error" && <ErrorNotice code={state.code} message={state.message} />}
      {state.kind === "ready" && (state.items.length === 0 ? (
        <div className="border-subtle bg-band/60 rounded-2xl border px-6 py-12 text-center">
          <p className="text-primary text-sm">아직 공지가 없습니다.</p>
          <p className="text-muted text-2xs mt-1">배송 일정 · 휴무 · 정책 변경처럼 손님이 알아야 할 일을 올립니다.</p>
        </div>
      ) : (
        <ul className="border-subtle divide-subtle divide-y border-y">
          {state.items.map((n) => (
            <li key={n.id}>
              <Link href={`/admin/notices/edit/?id=${encodeURIComponent(n.id)}`}
                className="group hover:bg-band/60 ease-fluid flex min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-1 px-1 py-4 transition-colors duration-300 md:px-3">
                <span className="flex min-w-0 items-center gap-2">
                  {n.pinned && <PushPin size={14} weight="fill" aria-label="고정" className="text-accent shrink-0" />}
                  <span className="text-primary group-hover:text-accent truncate text-sm">{n.title}</span>
                  <Badge tone={n.published ? "accent" : "muted"}>{n.published ? "공개" : "비공개"}</Badge>
                </span>
                <span className="text-muted text-2xs tabular-nums">
                  {n.publishedAt ? `${day(n.publishedAt)} 공개` : `${day(n.createdAt)} 작성`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

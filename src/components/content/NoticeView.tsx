"use client";

import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { day, publicNotice, type Notice } from "@/lib/console";
import { SHOP_CONNECTED, ShopError } from "@/lib/shop";

/** 공지 하나. `?id=`. 본문은 글자 그대로 — 줄바꿈만 살린다(HTML 을 받지 않는다). */

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; n: Notice };

export function NoticeView() {
  const id = useSyncExternalStore<string | null | undefined>(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("id"),
    () => undefined,
  );
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!id || !SHOP_CONNECTED) return;
    let alive = true;
    publicNotice(id)
      .then((n) => alive && setState({ kind: "ready", n }))
      .catch((e) => alive && setState({
        kind: "error",
        message: e instanceof ShopError && e.status === 404 ? "공지를 찾을 수 없습니다. 내려간 공지일 수 있습니다." : "공지를 불러오지 못했습니다.",
      }));
    return () => {
      alive = false;
    };
  }, [id]);

  const back = (
    <Link href="/notice/" className="text-muted hover:text-accent inline-flex min-h-11 items-center gap-2 text-xs">
      <ArrowLeft size={14} weight="light" aria-hidden="true" />
      공지 목록
    </Link>
  );

  if (id === null || !SHOP_CONNECTED) return <>{back}<p className="text-secondary mt-6 text-sm">공지를 목록에서 골라 주세요.</p></>;
  if (id === undefined || state.kind === "loading") return <>{back}<p aria-busy="true" className="text-muted mt-6 text-sm">불러오는 중</p></>;
  if (state.kind === "error") return <>{back}<p role="alert" className="text-error mt-6 text-sm">{state.message}</p></>;

  return (
    <article className="flex flex-col gap-6">
      {back}
      <header className="border-subtle border-b pb-6">
        <h2 className="font-display text-primary text-2xl leading-snug break-words">{state.n.title}</h2>
        <p className="text-muted text-2xs mt-2 tabular-nums">{day(state.n.publishedAt)}</p>
      </header>
      <div className="text-secondary text-sm leading-loose break-words whitespace-pre-line">{state.n.body}</div>
    </article>
  );
}

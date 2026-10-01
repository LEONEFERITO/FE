"use client";

import { CaretLeft, CaretRight, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/admin/AdminMemberList";
import { ErrorNotice } from "@/components/admin/AdminProductList";
import {
  ORDER_STATUS_LABEL,
  SHOP_CONNECTED,
  ShopError,
  adminOrders,
  when,
  won,
  type AdminOrderPage,
  type OrderStatus,
} from "@/lib/shop";

/**
 * 관리자 주문 목록.
 *
 * 기본은 "처리할 것" 이 먼저 보이게 결제 완료 주문을 연다 — 관리자가 매일 여는 이유는
 * "오늘 제작에 들어갈 주문" 이다. 결제 전에 떠난 주문서는 서버가 뺀다.
 * 검색은 주문번호 · 받는 분 · 연락처(하이픈 없이도).
 */

type State =
  | { kind: "loading" }
  | { kind: "error"; code: string; message: string }
  | { kind: "ready"; page: AdminOrderPage };

const FILTERS: { key: OrderStatus | null; label: string }[] = [
  { key: "PAID", label: "결제 완료 (제작 대기)" },
  { key: "IN_PRODUCTION", label: "제작 중" },
  { key: "SHIPPED", label: "발송" },
  { key: "DELIVERED", label: "배송 완료" },
  { key: "CANCELLED", label: "취소" },
  { key: null, label: "전체" },
];

export function AdminOrderList() {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState({ q: "", status: "PAID" as OrderStatus | null, page: 0 });
  const [state, setState] = useState<State>(
    SHOP_CONNECTED
      ? { kind: "loading" }
      : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    adminOrders(query)
      .then((page) => alive && setState({ kind: "ready", page }))
      .catch((e) => {
        if (!alive) return;
        const code =
          e instanceof ShopError ? (e.status === 401 ? "UNAUTHENTICATED" : e.status === 403 ? "FORBIDDEN" : e.code) : "UNKNOWN";
        setState({ kind: "error", code, message: e instanceof ShopError ? e.message : "목록을 불러오지 못했습니다." });
      });
    return () => {
      alive = false;
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-8">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery({ ...query, q: draft.trim(), page: 0 });
        }}
        className="flex max-w-xl gap-2"
      >
        <label htmlFor="order-search" className="sr-only">
          주문번호 · 받는 분 · 연락처로 찾기
        </label>
        <input
          id="order-search"
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="주문번호 · 받는 분 · 연락처"
          className="border-interactive focus-visible:border-accent text-primary placeholder:text-muted/70 min-h-12 min-w-0 flex-1 rounded-full border bg-transparent px-5 text-sm"
        />
        <button
          type="submit"
          className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm transition-colors duration-300"
        >
          <MagnifyingGlass size={16} weight="light" aria-hidden="true" />
          찾기
        </button>
      </form>

      <div role="group" aria-label="상태로 거르기" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = query.status === f.key;
          return (
            <button
              key={f.label}
              type="button"
              aria-pressed={on}
              onClick={() => setQuery({ ...query, status: f.key, page: 0 })}
              className={`ease-fluid inline-flex min-h-11 items-center rounded-full border px-5 text-sm transition-colors duration-300 ${
                on
                  ? "border-accent bg-accent text-on-accent"
                  : "border-interactive text-secondary hover:border-accent hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {state.kind === "loading" && (
        <p aria-busy="true" className="text-muted text-sm">
          불러오는 중
        </p>
      )}
      {state.kind === "error" && <ErrorNotice code={state.code} message={state.message} />}
      {state.kind === "ready" && (
        <>
          <p className="text-muted text-2xs" aria-live="polite">
            {state.page.totalElements}건
          </p>
          {state.page.items.length === 0 ? (
            <div className="border-subtle bg-band/60 rounded-2xl border px-6 py-12 text-center">
              <p className="text-primary text-sm">해당하는 주문이 없습니다.</p>
            </div>
          ) : (
            <ul className="border-subtle divide-subtle divide-y border-y">
              {state.page.items.map((o) => (
                <li key={o.orderNumber}>
                  <Link
                    href={`/admin/orders/detail/?no=${encodeURIComponent(o.orderNumber)}`}
                    className="group hover:bg-band/60 ease-fluid flex min-w-0 flex-col gap-1.5 px-1 py-4 transition-colors duration-300 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto_auto] md:items-center md:gap-6 md:px-3"
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="text-primary group-hover:text-accent truncate text-sm">{o.orderName}</span>
                        <Badge tone={o.status === "CANCELLED" ? "muted" : o.status === "PAID" ? "warn" : "accent"}>
                          {ORDER_STATUS_LABEL[o.status]}
                        </Badge>
                      </p>
                      <p className="text-muted text-2xs mt-1 tabular-nums">{o.orderNumber}</p>
                    </div>
                    <p className="text-secondary text-2xs">
                      {o.recipientName} · {o.itemCount}벌
                    </p>
                    <p className="text-primary text-sm tabular-nums">{won(o.totalAmountKrw)}</p>
                    <p className="text-muted text-2xs tabular-nums">{when(o.paidAt ?? o.createdAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {state.page.totalPages > 1 && (
            <nav aria-label="쪽 이동" className="flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={state.page.page === 0}
                onClick={() => setQuery({ ...query, page: query.page - 1 })}
                className="border-interactive text-secondary inline-flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40"
              >
                <CaretLeft size={16} weight="light" aria-hidden="true" />
                <span className="sr-only">이전 쪽</span>
              </button>
              <span className="text-secondary text-sm tabular-nums">
                {state.page.page + 1} / {state.page.totalPages}
              </span>
              <button
                type="button"
                disabled={state.page.page + 1 >= state.page.totalPages}
                onClick={() => setQuery({ ...query, page: query.page + 1 })}
                className="border-interactive text-secondary inline-flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40"
              >
                <CaretRight size={16} weight="light" aria-hidden="true" />
                <span className="sr-only">다음 쪽</span>
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

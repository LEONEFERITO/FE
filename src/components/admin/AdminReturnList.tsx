"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/admin/AdminMemberList";
import { ErrorNotice } from "@/components/admin/AdminProductList";
import {
  RETURN_REASON_LABEL,
  RETURN_STATUS_LABEL,
  RETURN_TYPE_LABEL,
  SELLER_FAULT,
  SHOP_CONNECTED,
  ShopError,
  adminReturns,
  when,
  type AdminReturnPage,
  type ReturnStatus,
} from "@/lib/shop";

/**
 * 관리자 교환·반품 목록.
 *
 * 기본은 "처리할 것"(신청 · 승인 · 회수) — 관리자가 이 화면을 여는 이유는 "오늘 처리할 신청" 이다.
 * 불량 · 오배송은 따로 표시한다 — 판매자 책임이라 먼저 봐야 한다.
 */

type State =
  | { kind: "loading" }
  | { kind: "error"; code: string; message: string }
  | { kind: "ready"; page: AdminReturnPage };

type Filter = { key: string; status: ReturnStatus | null; open: boolean; label: string };

const FILTERS: Filter[] = [
  { key: "open", status: null, open: true, label: "처리할 것" },
  { key: "REQUESTED", status: "REQUESTED", open: false, label: "신청" },
  { key: "APPROVED", status: "APPROVED", open: false, label: "회수 대기" },
  { key: "COLLECTED", status: "COLLECTED", open: false, label: "회수 완료" },
  { key: "COMPLETED", status: "COMPLETED", open: false, label: "완료" },
  { key: "REJECTED", status: "REJECTED", open: false, label: "거절" },
  { key: "all", status: null, open: false, label: "전체" },
];

export function AdminReturnList() {
  const [filter, setFilter] = useState<Filter>(FILTERS[0]);
  const [page, setPage] = useState(0);
  const [state, setState] = useState<State>(
    SHOP_CONNECTED
      ? { kind: "loading" }
      : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    adminReturns({ status: filter.status, open: filter.open, page })
      .then((p) => alive && setState({ kind: "ready", page: p }))
      .catch((e) => {
        if (!alive) return;
        const code =
          e instanceof ShopError ? (e.status === 401 ? "UNAUTHENTICATED" : e.status === 403 ? "FORBIDDEN" : e.code) : "UNKNOWN";
        setState({ kind: "error", code, message: e instanceof ShopError ? e.message : "목록을 불러오지 못했습니다." });
      });
    return () => {
      alive = false;
    };
  }, [filter, page]);

  return (
    <div className="flex flex-col gap-8">
      <div role="group" aria-label="상태로 거르기" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = filter.key === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setFilter(f);
                setPage(0);
              }}
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
              <p className="text-primary text-sm">
                {filter.open ? "처리할 교환 · 반품 신청이 없습니다." : "해당하는 신청이 없습니다."}
              </p>
            </div>
          ) : (
            <ul className="border-subtle divide-subtle divide-y border-y">
              {state.page.items.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/returns/detail/?id=${encodeURIComponent(r.id)}`}
                    className="group hover:bg-band/60 ease-fluid flex min-w-0 flex-col gap-1.5 px-1 py-4 transition-colors duration-300 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] md:items-center md:gap-6 md:px-3"
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="text-primary group-hover:text-accent truncate text-sm">
                          {RETURN_TYPE_LABEL[r.type]} · {r.orderName}
                        </span>
                        <Badge tone={r.status === "REQUESTED" ? "warn" : r.status === "COMPLETED" || r.status === "REJECTED" || r.status === "WITHDRAWN" ? "muted" : "accent"}>
                          {RETURN_STATUS_LABEL[r.status]}
                        </Badge>
                        {SELLER_FAULT.includes(r.reason) && <Badge tone="warn">판매자 책임</Badge>}
                      </p>
                      <p className="text-muted text-2xs mt-1 tabular-nums">{r.orderNumber}</p>
                    </div>
                    <p className="text-secondary text-2xs">
                      {r.recipientName} · {r.itemCount}벌 · {RETURN_REASON_LABEL[r.reason]}
                    </p>
                    <p className="text-muted text-2xs tabular-nums">{when(r.createdAt)}</p>
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
                onClick={() => setPage(page - 1)}
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
                onClick={() => setPage(page + 1)}
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

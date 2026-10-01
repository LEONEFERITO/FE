"use client";

import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { dashboard, type Dashboard } from "@/lib/console";
import { ORDER_STATUS_LABEL, SHOP_CONNECTED, ShopError, shortDate, when, won, type OrderStatus } from "@/lib/shop";

/**
 * 관리자 대시보드 — "지금 손이 가야 하는 것" 이 맨 위다. 숫자를 누르면 그 목록으로 바로 간다.
 * 그 아래 오늘 · 최근 14일 매출(결제 − 환불), 최근 결제 주문.
 * 매출 막대는 장식이 아니라 빈 날을 보이기 위한 것이다 — 표만 있으면 "어제 주문이 없었다" 가 안 보인다.
 */

type State = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready"; d: Dashboard };

const TODO: { key: string; label: string; href: string }[] = [
  { key: "PAID", label: "제작 대기 (결제 완료)", href: "/admin/orders/" },
  { key: "IN_PRODUCTION", label: "제작 중", href: "/admin/orders/" },
  { key: "SHIPPED", label: "배송 중", href: "/admin/orders/" },
  { key: "RETURN_REQUESTED", label: "교환 · 반품 신청", href: "/admin/returns/" },
  { key: "RETURN_APPROVED", label: "회수 대기", href: "/admin/returns/" },
  { key: "RETURN_COLLECTED", label: "회수 완료 (처리 남음)", href: "/admin/returns/" },
];

export function AdminDashboard() {
  const [state, setState] = useState<State>(
    SHOP_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    dashboard()
      .then((d) => alive && setState({ kind: "ready", d }))
      .catch((e) => {
        if (!alive) return;
        const code = e instanceof ShopError ? (e.status === 401 ? "UNAUTHENTICATED" : e.status === 403 ? "FORBIDDEN" : e.code) : "UNKNOWN";
        setState({ kind: "error", code, message: e instanceof ShopError ? e.message : "불러오지 못했습니다." });
      });
    return () => {
      alive = false;
    };
  }, []);

  if (state.kind === "loading") return <p aria-busy="true" className="text-muted text-sm">불러오는 중</p>;
  if (state.kind === "error") return <ErrorNotice code={state.code} message={state.message} />;

  const d = state.d;
  const max = Math.max(1, ...d.days.map((x) => x.salesKrw));
  const total14 = d.days.reduce((s, x) => s + x.salesKrw, 0);
  const orders14 = d.days.reduce((s, x) => s + x.orders, 0);

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="todo-h">
        <h2 id="todo-h" className="text-primary text-sm font-medium">지금 할 일</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TODO.map((t) => {
            const n = d.todo[t.key] ?? 0;
            return (
              <li key={t.key}>
                <Link
                  href={t.href}
                  className={`group ease-fluid flex min-h-24 items-end justify-between gap-4 rounded-2xl border p-5 transition-colors duration-300 ${
                    n > 0 ? "border-accent bg-surface" : "border-subtle bg-surface/60"
                  } hover:border-accent`}
                >
                  <span className="text-secondary text-sm">{t.label}</span>
                  <span className={`font-display text-3xl tabular-nums ${n > 0 ? "text-accent" : "text-muted"}`}>{n}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="sales-h" className="border-subtle bg-surface rounded-2xl border p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="sales-h" className="text-primary text-sm font-medium">매출 (결제 − 환불)</h2>
          <dl className="flex flex-wrap gap-8 text-sm">
            <div>
              <dt className="text-muted text-2xs">오늘</dt>
              <dd className="text-primary font-display text-2xl tabular-nums">{won(d.today.salesKrw)}</dd>
              <dd className="text-muted text-2xs">{d.today.orders}건</dd>
            </div>
            <div>
              <dt className="text-muted text-2xs">최근 14일</dt>
              <dd className="text-primary font-display text-2xl tabular-nums">{won(total14)}</dd>
              <dd className="text-muted text-2xs">{orders14}건</dd>
            </div>
          </dl>
        </div>
        <ol className="mt-8 grid h-40 grid-cols-14 items-end gap-1.5" aria-label="최근 14일 매출">
          {d.days.map((x, i) => (
            <li key={x.date} className="flex h-full min-w-0 flex-col items-center justify-end gap-1.5">
              <span className="sr-only">{x.date} {won(x.salesKrw)} {x.orders}건</span>
              <span
                aria-hidden="true"
                className={`w-full rounded-t ${x.salesKrw > 0 ? "bg-accent" : "bg-band"}`}
                style={{ height: `${Math.max(3, (x.salesKrw / max) * 100)}%` }}
              />
              {/* 날짜는 첫날 · 일주일 전 · 오늘만 — 14개를 다 쓰면 좁은 화면에서 겹친다 */}
              <span aria-hidden="true" className="text-muted text-2xs h-4 whitespace-nowrap tabular-nums">
                {i === 0 || i === 7 || i === d.days.length - 1 ? shortDate(x.date + "T00:00:00+09:00") : ""}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <section aria-labelledby="recent-h">
          <div className="flex items-end justify-between gap-4">
            <h2 id="recent-h" className="text-primary text-sm font-medium">최근 결제</h2>
            <Link href="/admin/orders/" className="text-accent inline-flex min-h-11 items-center gap-1.5 text-xs">
              주문 전체 <ArrowRight size={12} weight="light" aria-hidden="true" />
            </Link>
          </div>
          {d.recent.length === 0 ? (
            <p className="border-subtle bg-band/60 mt-3 rounded-2xl border px-6 py-10 text-center text-sm">아직 결제된 주문이 없습니다.</p>
          ) : (
            <ul className="border-subtle divide-subtle mt-3 divide-y border-y">
              {d.recent.map((o) => (
                <li key={o.orderNumber}>
                  <Link href={`/admin/orders/detail/?no=${encodeURIComponent(o.orderNumber)}`}
                    className="hover:bg-band/60 ease-fluid flex min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-1 px-1 py-3 text-sm transition-colors duration-300 md:px-3">
                    <span className="text-primary min-w-0 truncate">{o.orderName}</span>
                    <span className="text-muted text-2xs">{o.recipientName} · {ORDER_STATUS_LABEL[o.status as OrderStatus] ?? o.status}</span>
                    <span className="tabular-nums">{won(o.totalAmountKrw)}</span>
                    <span className="text-muted text-2xs tabular-nums">{when(o.paidAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="prod-h" className="border-subtle bg-surface h-fit rounded-2xl border p-6 text-sm">
          <h2 id="prod-h" className="text-primary font-medium">상품</h2>
          <p className="text-secondary mt-3">공개 {d.publishedProducts}개 · 작성 중 {d.draftProducts}개</p>
          <div className="mt-4 flex flex-col gap-1">
            <Link href="/admin/products/new/" className="text-accent min-h-11 text-xs underline underline-offset-4">새 상품 등록</Link>
            <Link href="/admin/display/" className="text-accent min-h-11 text-xs underline underline-offset-4">메인 구성 · 진열 순서</Link>
            <Link href="/admin/stats/" className="text-accent min-h-11 text-xs underline underline-offset-4">사이즈별 판매</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

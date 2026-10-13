"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ORDER_STATUS_LABEL, ORDER_STEPS, ShopError, myOrders, when, won, type OrderSummary } from "@/lib/shop";

/** 아직 손에 닿지 않은 주문 — ORDER STATUS 에 모은다 */
const IN_PROGRESS = new Set(["PAID", "IN_PRODUCTION", "SHIPPED"]);

/**
 * 마이페이지 — 주문 현황 · 주문 내역. 결제가 끝난 주문만 나온다(결제 전에 떠난 주문서는 서버가 뺀다).
 *
 * 2026-10-06 구조표의 CLIENT SERVICES 두 칸이 마이페이지의 두 탭이다(2026-10-13 "탭별로 해당 화면만"):
 *   view "status"   ORDER STATUS   진행 중인 주문(결제 완료 · 제작 중 · 발송)   /mypage/#order-status
 *   view "history"  ORDER HISTORY  전체 주문 내역                              /mypage/#orders
 * 탭을 열 때마다 새로 불러온다 — 다른 탭에 있는 동안 상태가 바뀌었을 수 있다.
 */
export function MyOrders({ view }: { view: "status" | "history" }) {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    myOrders()
      .then((list) => {
        if (!alive) return;
        setOrders(list);
      })
      .catch((e) => alive && setError(e instanceof ShopError ? e.message : "주문 내역을 불러오지 못했습니다."));
    return () => {
      alive = false;
    };
  }, []);

  const active = orders?.filter((o) => IN_PROGRESS.has(o.status)) ?? [];
  const loadState = (
    <>
      {error && (
        <p role="alert" className="text-error text-2xs mt-3">
          {error}
        </p>
      )}
      {!error && orders === null && (
        <p aria-busy="true" className="text-muted mt-3 text-sm">
          불러오는 중
        </p>
      )}
    </>
  );

  if (view === "status") {
    return (
      <section
        className="border-subtle bg-surface rounded-2xl border p-5 md:p-8"
        aria-labelledby="order-status-heading"
      >
        <p className="text-accent text-2xs tracking-label">ORDER STATUS</p>
        <h2 id="order-status-heading" className="text-primary mt-1 text-sm font-medium">
          진행 중인 주문
        </h2>
        {loadState}
        {orders !== null && active.length === 0 && (
          <p className="text-secondary mt-3 text-sm">지금 제작 · 배송 중인 주문이 없습니다.</p>
        )}
        {active.length > 0 && (
          <ul className="mt-4 flex flex-col gap-3">
            {active.map((o) => (
              <li key={o.orderNumber}>
                <Link
                  href={`/mypage/order/?no=${encodeURIComponent(o.orderNumber)}`}
                  className="border-subtle hover:border-accent ease-fluid flex flex-col gap-2.5 border px-4 py-3 transition-colors duration-300 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <span className="min-w-0 max-w-full">
                    <span className="text-primary block truncate text-sm">{o.orderName}</span>
                    <span className="text-muted text-2xs tabular-nums">{o.orderNumber}</span>
                  </span>
                  {/* 단계 표시 — 결제 완료 → 제작 중 → 발송 → 배송 완료 중 지금 어디인가 */}
                  <span className="flex shrink-0 items-center gap-1.5" aria-label={`현재 ${ORDER_STATUS_LABEL[o.status]}`}>
                    {ORDER_STEPS.map((step) => (
                      <span
                        key={step}
                        aria-hidden="true"
                        className={`h-1.5 w-6 ${ORDER_STEPS.indexOf(step) <= ORDER_STEPS.indexOf(o.status) ? "bg-accent" : "bg-band"}`}
                      />
                    ))}
                    <span className="text-accent text-2xs ml-1">{ORDER_STATUS_LABEL[o.status]}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section
      className="border-subtle bg-surface rounded-2xl border p-5 md:p-8"
      aria-labelledby="orders-heading"
    >
      <p className="text-accent text-2xs tracking-label">ORDER HISTORY</p>
      <h2 id="orders-heading" className="text-primary mt-1 text-sm font-medium">
        주문 내역
      </h2>
      {loadState}
      {orders?.length === 0 && (
        <p className="text-secondary mt-3 text-sm leading-relaxed">
          아직 주문이 없습니다. 주문하시면 결제 완료 → 제작 중 → 발송 → 배송 완료 순서로 여기에 쌓입니다.
        </p>
      )}
      {orders && orders.length > 0 && (
        <ul className="border-subtle divide-subtle mt-4 divide-y border-y">
          {orders.map((o) => (
            <li key={o.orderNumber}>
              <Link
                href={`/mypage/order/?no=${encodeURIComponent(o.orderNumber)}`}
                className="group hover:bg-band/60 ease-fluid flex items-center gap-3 px-1 py-4 sm:gap-4 transition-colors duration-300 md:px-2"
              >
                <div className="bg-velvet aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-lg">
                  {o.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={o.imageUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-primary group-hover:text-accent truncate text-sm">{o.orderName}</p>
                  <p className="text-muted text-2xs mt-1 tabular-nums">
                    {when(o.paidAt ?? o.createdAt)} · {o.orderNumber}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`text-2xs ${o.status === "CANCELLED" ? "text-muted" : "text-accent"}`}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </span>
                  <span className="text-primary text-sm tabular-nums">{won(o.totalAmountKrw)}</span>
                </div>
                <CaretRight size={14} weight="light" aria-hidden="true" className="text-muted shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

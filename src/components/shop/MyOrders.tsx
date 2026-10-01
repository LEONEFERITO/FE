"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ORDER_STATUS_LABEL, ShopError, myOrders, when, won, type OrderSummary } from "@/lib/shop";

/**
 * 마이페이지 — 주문 내역. 결제가 끝난 주문만 나온다(결제 전에 떠난 주문서는 서버가 뺀다).
 */
export function MyOrders() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    myOrders()
      .then((list) => alive && setOrders(list))
      .catch((e) => alive && setError(e instanceof ShopError ? e.message : "주문 내역을 불러오지 못했습니다."));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="border-subtle bg-surface rounded-2xl border p-6 md:p-8" aria-labelledby="orders-heading">
      <h2 id="orders-heading" className="text-primary text-sm font-medium">
        주문 내역
      </h2>

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
                className="group hover:bg-band/60 ease-fluid flex items-center gap-4 px-1 py-4 transition-colors duration-300 md:px-2"
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

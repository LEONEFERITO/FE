"use client";

import { ArrowLeft, CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  ORDER_STATUS_LABEL,
  RETURN_STATUS_LABEL,
  RETURN_TYPE_LABEL,
  SHOP_CONNECTED,
  ShopError,
  adminCancelOrder,
  adminDeliver,
  adminOrder,
  adminShip,
  adminStartProduction,
  when,
  won,
  type AdminOrderDetail as Detail,
} from "@/lib/shop";

/**
 * 관리자 주문 상세 · 처리. `?no=` 주문번호.
 *
 * 지금 상태에서 할 수 있는 다음 일만 버튼으로 둔다:
 *   결제 완료 → [제작 시작] · [발송] · [취소/환불]
 *   제작 중   → [발송] · [취소/환불]
 *   발송      → [배송 완료]
 * 발송은 택배사 · 송장번호를 받는다(손님 주문 상세에 그대로 보인다).
 * 취소는 사유를 받고 한 번 더 묻는다 — 토스 환불이 바로 나간다.
 * 배송 뒤의 일(교환·반품)은 손님 신청으로 시작한다 — 여기서는 신청 내역을 보이고 처리 화면으로 보낸다.
 */

type State = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready"; d: Detail };

export const COURIERS = ["CJ대한통운", "한진택배", "롯데택배", "우체국택배", "로젠택배"];

export function AdminOrderDetail() {
  const no = useSyncExternalStore<string | null | undefined>(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("no"),
    () => undefined,
  );
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [mode, setMode] = useState<"ship" | "cancel" | null>(null);
  const [courier, setCourier] = useState(COURIERS[0]);
  const [tracking, setTracking] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async (orderNumber: string): Promise<State> => {
    try {
      return { kind: "ready", d: await adminOrder(orderNumber) };
    } catch (e) {
      const code = e instanceof ShopError ? (e.status === 401 ? "UNAUTHENTICATED" : e.status === 403 ? "FORBIDDEN" : e.code) : "UNKNOWN";
      return { kind: "error", code, message: e instanceof ShopError ? e.message : "불러오지 못했습니다." };
    }
  }, []);

  useEffect(() => {
    if (!SHOP_CONNECTED || !no) return;
    let alive = true;
    load(no).then((s) => alive && setState(s));
    return () => {
      alive = false;
    };
  }, [no, load]);

  async function run(action: () => Promise<void>, ok: string) {
    if (!no) return;
    setBusy(true);
    setResult(null);
    try {
      await action();
      setMode(null);
      setState(await load(no));
      setResult({ tone: "ok", text: ok });
    } catch (e) {
      setResult({ tone: "error", text: e instanceof ShopError ? e.message : "처리하지 못했습니다." });
    } finally {
      setBusy(false);
    }
  }

  const head = (
    <>
      <Link href="/admin/orders/" className="text-muted hover:text-accent inline-flex min-h-11 items-center gap-2 text-xs">
        <ArrowLeft size={14} weight="light" aria-hidden="true" />
        주문 목록
      </Link>
      <Eyebrow className="mt-6">ORDER</Eyebrow>
    </>
  );

  if (!SHOP_CONNECTED) {
    return (
      <>
        {head}
        <h1 className="font-display text-primary mt-3 text-3xl">주문 상세</h1>
        <div className="mt-8">
          <ErrorNotice code="NOT_CONNECTED" message="서버가 아직 연결되지 않았습니다." />
        </div>
      </>
    );
  }
  if (no === null || no === undefined || state.kind === "loading") {
    return (
      <>
        {head}
        <h1 className="font-display text-primary mt-3 text-3xl">주문 상세</h1>
        <p aria-busy={no !== null} className="text-muted mt-8 text-sm">
          {no === null ? "주문을 목록에서 골라 주세요." : "불러오는 중"}
        </p>
      </>
    );
  }
  if (state.kind === "error") {
    return (
      <>
        {head}
        <h1 className="font-display text-primary mt-3 text-3xl">주문 상세</h1>
        <div className="mt-8">
          <ErrorNotice code={state.code} message={state.message} />
        </div>
      </>
    );
  }

  const { order: o, paymentKey, agreedAt, events, returns } = state.d;
  const outline =
    "border-interactive text-primary hover:border-accent ease-fluid inline-flex min-h-12 items-center justify-center rounded-full border px-6 text-sm transition-colors duration-300 disabled:opacity-60";
  const primary =
    "bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm transition-colors duration-300 disabled:opacity-60";
  const danger =
    "border-error text-error hover:bg-error/5 ease-fluid inline-flex min-h-12 items-center justify-center rounded-full border px-6 text-sm transition-colors duration-300 disabled:opacity-50";
  const canShip = o.status === "PAID" || o.status === "IN_PRODUCTION";
  const canCancel = canShip;

  return (
    <>
      {head}
      <h1 className="font-display text-primary leading-display mt-3 text-3xl md:text-4xl">{o.orderName}</h1>
      <p className="text-muted text-2xs mt-2 tabular-nums">
        {o.orderNumber} · {ORDER_STATUS_LABEL[o.status]}
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="border-subtle bg-surface rounded-2xl border p-6" aria-labelledby="oi-h">
            <h2 id="oi-h" className="text-primary text-sm font-medium">주문 상품</h2>
            <ul className="divide-subtle mt-3 divide-y">
              {o.items.map((i, k) => (
                <li key={k} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="text-primary">
                    {i.name} <span className="text-muted">· {i.size} · {i.quantity}벌 · 제작 {i.leadTimeDays}일</span>
                  </span>
                  <span className="tabular-nums">{won(i.lineAmountKrw)}</span>
                </li>
              ))}
            </ul>
            <p className="border-subtle mt-2 border-t pt-3 text-sm">
              상품 {won(o.itemsAmountKrw)} + 배송비 {won(o.shippingFeeKrw)} ={" "}
              <b className="text-primary">{won(o.totalAmountKrw)}</b>
              {o.refundedAmountKrw > 0 && <span className="text-error"> · 환불 {won(o.refundedAmountKrw)}</span>}
            </p>
          </section>

          <section className="border-subtle bg-surface rounded-2xl border p-6 text-sm" aria-labelledby="rc-h">
            <h2 id="rc-h" className="text-primary font-medium">받는 분 · 배송</h2>
            <p className="text-secondary mt-3">{o.recipient.name} · {o.recipient.phone}</p>
            <p className="text-secondary mt-1">({o.recipient.zipCode}) {o.recipient.address1} {o.recipient.address2}</p>
            {o.recipient.memo && <p className="text-muted mt-1 text-2xs">요청: {o.recipient.memo}</p>}
            {o.trackingNumber && (
              <p className="text-primary mt-3">
                {o.courier} {o.trackingNumber} · {when(o.shippedAt)} 발송
              </p>
            )}
          </section>

          <section className="border-subtle bg-surface rounded-2xl border p-6 text-sm" aria-labelledby="pay-h">
            <h2 id="pay-h" className="text-primary font-medium">결제</h2>
            <p className="text-secondary mt-3">
              {o.paymentMethod ?? "—"} · {when(o.paidAt)} · 결제 전 확인 {when(agreedAt)}
            </p>
            {paymentKey && (
              <p className="text-muted mt-1 text-2xs break-all">토스 결제 키: {paymentKey}</p>
            )}
          </section>

          {returns.length > 0 && (
            <section className="border-subtle bg-surface rounded-2xl border p-6 text-sm" aria-labelledby="ret-h">
              <h2 id="ret-h" className="text-primary font-medium">교환 · 반품</h2>
              <ul className="divide-subtle mt-3 divide-y">
                {returns.map((r) => (
                  <li key={r.id}>
                    <Link href={`/admin/returns/detail/?id=${encodeURIComponent(r.id)}`}
                      className="hover:text-accent flex min-h-11 items-center justify-between gap-4 py-2">
                      <span className="text-primary">
                        {RETURN_TYPE_LABEL[r.type]} · {RETURN_STATUS_LABEL[r.status]}
                      </span>
                      <span className="text-muted text-2xs tabular-nums">{when(r.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="ev-h">
            <h2 id="ev-h" className="text-primary text-sm font-medium">처리 기록</h2>
            <ol className="border-subtle divide-subtle mt-3 divide-y border-y">
              {events.map((e, k) => (
                <li key={k} className="flex flex-col gap-1 py-3 text-sm md:flex-row md:items-baseline md:gap-4">
                  <span className="text-muted text-2xs w-44 shrink-0 tabular-nums">{when(e.at)}</span>
                  <span className="text-primary">{ORDER_STATUS_LABEL[e.to]}</span>
                  {e.note && <span className="text-secondary">{e.note}</span>}
                  <span className="text-muted text-2xs md:ml-auto">{e.byAdmin ? "관리자" : "손님 · 시스템"}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="border-subtle bg-surface flex h-fit flex-col gap-4 rounded-2xl border p-6" aria-labelledby="act-h">
          <h2 id="act-h" className="text-primary text-sm font-medium">처리</h2>

          {o.status === "PAID" && (
            <button type="button" disabled={busy} className={primary}
              onClick={() => run(() => adminStartProduction(o.orderNumber), "제작을 시작했습니다. 이제 손님은 직접 취소할 수 없습니다.")}>
              제작 시작
            </button>
          )}

          {canShip && (mode === "ship" ? (
            <form className="flex flex-col gap-3" onSubmit={(e) => {
              e.preventDefault();
              if (tracking.trim()) run(() => adminShip(o.orderNumber, courier, tracking.trim()), "발송 처리했습니다.");
            }}>
              <label className="text-secondary text-2xs" htmlFor="courier">택배사</label>
              <select id="courier" value={courier} onChange={(e) => setCourier(e.target.value)}
                className="border-interactive text-primary min-h-12 rounded-xl border bg-transparent px-4 text-sm">
                {COURIERS.map((c) => <option key={c}>{c}</option>)}
              </select>
              <label className="text-secondary text-2xs" htmlFor="tracking">송장번호</label>
              <input id="tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} inputMode="numeric"
                maxLength={50} className="border-interactive text-primary min-h-12 rounded-xl border bg-transparent px-4 text-sm" />
              <div className="flex gap-3">
                <button type="button" className={outline} onClick={() => setMode(null)}>취소</button>
                <button type="submit" disabled={busy || !tracking.trim()} className={primary}>발송 처리</button>
              </div>
            </form>
          ) : (
            <button type="button" className={outline} onClick={() => setMode("ship")}>발송 (송장 입력)</button>
          ))}

          {o.status === "SHIPPED" && (
            <button type="button" disabled={busy} className={primary}
              onClick={() => run(() => adminDeliver(o.orderNumber), "배송 완료로 바꿨습니다.")}>
              배송 완료
            </button>
          )}

          {canCancel && (mode === "cancel" ? (
            <form className="flex flex-col gap-3" onSubmit={(e) => {
              e.preventDefault();
              if (reason.trim()) run(() => adminCancelOrder(o.orderNumber, reason.trim()), `취소하고 ${won(o.totalAmountKrw)}을 환불했습니다.`);
            }}>
              <label className="text-secondary text-2xs" htmlFor="reason">취소 사유 (손님에게 보입니다)</label>
              <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={200}
                className="border-interactive text-primary rounded-xl border bg-transparent px-4 py-3 text-sm" />
              <p className="text-muted text-2xs leading-relaxed">
                {won(o.totalAmountKrw)} 전액이 토스로 바로 환불됩니다. 되돌릴 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button type="button" className={outline} onClick={() => setMode(null)}>아니요</button>
                <button type="submit" disabled={busy || !reason.trim()} className={danger}>취소 · 환불</button>
              </div>
            </form>
          ) : (
            <button type="button" className={danger} onClick={() => setMode("cancel")}>주문 취소 · 환불</button>
          ))}

          {!canShip && o.status !== "SHIPPED" && (
            <p className="text-muted text-2xs leading-relaxed">
              {o.status === "CANCELLED"
                ? "취소된 주문입니다."
                : "처리할 일이 없습니다. 교환 · 반품은 손님이 신청하면 교환 · 반품 메뉴에 올라옵니다."}
            </p>
          )}

          {result && (
            <p role={result.tone === "error" ? "alert" : "status"}
              className={`text-2xs flex gap-1.5 leading-relaxed ${result.tone === "ok" ? "text-success" : "text-error"}`}>
              {result.tone === "ok"
                ? <CheckCircle size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
                : <Warning size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />}
              <span>{result.text}</span>
            </p>
          )}
        </aside>
      </div>
    </>
  );
}

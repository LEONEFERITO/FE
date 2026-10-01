"use client";

import { ArrowLeft, CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { COURIERS } from "@/components/admin/AdminOrderDetail";
import { ErrorNotice } from "@/components/admin/AdminProductList";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  RETURN_REASON_LABEL,
  RETURN_STATUS_LABEL,
  RETURN_TYPE_LABEL,
  SELLER_FAULT,
  SHOP_CONNECTED,
  ShopError,
  adminApproveReturn,
  adminCollectReturn,
  adminRefundReturn,
  adminRejectReturn,
  adminReshipReturn,
  adminReturn,
  when,
  won,
  type AdminReturnDetail as Detail,
} from "@/lib/shop";

/**
 * 관리자 교환·반품 상세 · 처리. `?id=` 신청 번호.
 *
 * 지금 상태에서 할 수 있는 다음 일만 버튼으로 둔다:
 *   신청      → [승인 (회수 안내)] · [거절]
 *   회수 대기 → [회수 완료] · [거절]
 *   회수 완료 → 반품: [환불하고 완료]   교환: [재발송 (송장)] · 둘 다 [거절 (검수 불합격)]
 *
 * 환불액은 관리자가 넣는다 — 왕복 배송비 차감 기준이 아직 없다(TODO(고객확인)).
 * 기본값은 돌려받은 상품 금액이고, 상한은 이 주문에서 아직 환불하지 않은 금액이다(서버도 막는다).
 * 환불은 토스로 바로 나가서 되돌릴 수 없으므로 한 번 더 묻는다.
 */

type State = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready"; d: Detail };
type Mode = "approve" | "reject" | "refund" | "reship" | null;

export function AdminReturnDetail() {
  const id = useSyncExternalStore<string | null | undefined>(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("id"),
    () => undefined,
  );
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [courier, setCourier] = useState(COURIERS[0]);
  const [tracking, setTracking] = useState("");

  const load = useCallback(async (returnId: string): Promise<State> => {
    try {
      return { kind: "ready", d: await adminReturn(returnId) };
    } catch (e) {
      const code = e instanceof ShopError ? (e.status === 401 ? "UNAUTHENTICATED" : e.status === 403 ? "FORBIDDEN" : e.code) : "UNKNOWN";
      return { kind: "error", code, message: e instanceof ShopError ? e.message : "불러오지 못했습니다." };
    }
  }, []);

  useEffect(() => {
    if (!SHOP_CONNECTED || !id) return;
    let alive = true;
    load(id).then((s) => alive && setState(s));
    return () => {
      alive = false;
    };
  }, [id, load]);

  async function run(action: () => Promise<void>, ok: string) {
    if (!id) return;
    setBusy(true);
    setResult(null);
    try {
      await action();
      setMode(null);
      setConfirmRefund(false);
      setState(await load(id));
      setResult({ tone: "ok", text: ok });
    } catch (e) {
      setResult({ tone: "error", text: e instanceof ShopError ? e.message : "처리하지 못했습니다." });
    } finally {
      setBusy(false);
    }
  }

  const head = (
    <>
      <Link href="/admin/returns/" className="text-muted hover:text-accent inline-flex min-h-11 items-center gap-2 text-xs">
        <ArrowLeft size={14} weight="light" aria-hidden="true" />
        교환 · 반품 목록
      </Link>
      <Eyebrow className="mt-6">RETURN</Eyebrow>
    </>
  );

  if (!SHOP_CONNECTED) {
    return (
      <>
        {head}
        <h1 className="font-display text-primary mt-3 text-3xl">교환 · 반품 상세</h1>
        <div className="mt-8">
          <ErrorNotice code="NOT_CONNECTED" message="서버가 아직 연결되지 않았습니다." />
        </div>
      </>
    );
  }
  if (id === null || id === undefined || state.kind === "loading") {
    return (
      <>
        {head}
        <h1 className="font-display text-primary mt-3 text-3xl">교환 · 반품 상세</h1>
        <p aria-busy={id !== null} className="text-muted mt-8 text-sm">
          {id === null ? "신청을 목록에서 골라 주세요." : "불러오는 중"}
        </p>
      </>
    );
  }
  if (state.kind === "error") {
    return (
      <>
        {head}
        <h1 className="font-display text-primary mt-3 text-3xl">교환 · 반품 상세</h1>
        <div className="mt-8">
          <ErrorNotice code={state.code} message={state.message} />
        </div>
      </>
    );
  }

  const { request: r, orderName, orderTotalKrw, refundableKrw, recipient, events } = state.d;
  const itemsValue = r.items.reduce((sum, i) => sum + i.unitPriceKrw * i.quantity, 0);
  const amountNum = Number(amount);
  const amountOk = amount.trim() !== "" && Number.isInteger(amountNum) && amountNum >= 0 && amountNum <= refundableKrw;

  const outline =
    "border-interactive text-primary hover:border-accent ease-fluid inline-flex min-h-12 items-center justify-center rounded-full border px-6 text-sm transition-colors duration-300 disabled:opacity-60";
  const primary =
    "bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm transition-colors duration-300 disabled:opacity-60";
  const danger =
    "border-error text-error hover:bg-error/5 ease-fluid inline-flex min-h-12 items-center justify-center rounded-full border px-6 text-sm transition-colors duration-300 disabled:opacity-50";
  const field = "border-interactive text-primary min-h-12 rounded-xl border bg-transparent px-4 text-sm";
  const canReject = r.status === "REQUESTED" || r.status === "APPROVED" || r.status === "COLLECTED";

  return (
    <>
      {head}
      <h1 className="font-display text-primary leading-display mt-3 text-3xl md:text-4xl">
        {RETURN_TYPE_LABEL[r.type]} · {orderName}
      </h1>
      <p className="text-muted text-2xs mt-2 tabular-nums">
        <Link href={`/admin/orders/detail/?no=${encodeURIComponent(r.orderNumber)}`} className="hover:text-accent underline underline-offset-4">
          {r.orderNumber}
        </Link>{" "}
        · {RETURN_STATUS_LABEL[r.status]} · {when(r.createdAt)} 신청
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="border-subtle bg-surface rounded-2xl border p-6 text-sm" aria-labelledby="rq-h">
            <h2 id="rq-h" className="text-primary font-medium">신청 내용</h2>
            <p className="text-primary mt-3">
              {RETURN_REASON_LABEL[r.reason]}
              {SELLER_FAULT.includes(r.reason) && <span className="text-error"> · 판매자 책임 (배송비 저희 부담)</span>}
            </p>
            {r.detail && <p className="text-secondary mt-2 whitespace-pre-line">{r.detail}</p>}
            {r.photoUrls.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-3" aria-label="손님이 붙인 사진">
                {r.photoUrls.map((u, k) => (
                  <li key={u}>
                    <a href={u} target="_blank" rel="noopener noreferrer" aria-label={`사진 ${k + 1} 원본 보기`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="" className="border-subtle h-24 w-24 rounded-lg border object-cover" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <ul className="divide-subtle border-subtle mt-4 divide-y border-t">
              {r.items.map((i) => (
                <li key={i.orderItemId} className="flex justify-between gap-4 py-3">
                  <span className="text-primary">
                    {i.name}{" "}
                    <span className="text-muted">
                      · {i.size}
                      {i.exchangeSize && <> → <b className="text-accent">{i.exchangeSize}</b></>} · {i.quantity}벌
                    </span>
                  </span>
                  <span className="tabular-nums">{won(i.unitPriceKrw * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="border-subtle text-secondary border-t pt-3">
              주문 결제 {won(orderTotalKrw)} · 아직 환불하지 않은 금액 <b className="text-primary">{won(refundableKrw)}</b>
            </p>
          </section>

          <section className="border-subtle bg-surface rounded-2xl border p-6 text-sm" aria-labelledby="pk-h">
            <h2 id="pk-h" className="text-primary font-medium">회수할 곳 (주문 배송지)</h2>
            <p className="text-secondary mt-3">{recipient.name} · {recipient.phone}</p>
            <p className="text-secondary mt-1">({recipient.zipCode}) {recipient.address1} {recipient.address2}</p>
            {r.adminNote && <p className="text-primary mt-3">손님에게 보낸 안내: {r.adminNote}</p>}
            {r.rejectReason && <p className="text-error mt-3">거절 사유: {r.rejectReason}</p>}
            {r.reshipTrackingNumber && <p className="text-primary mt-3">재발송 {r.reshipCourier} {r.reshipTrackingNumber}</p>}
            {r.status === "COMPLETED" && r.type === "RETURN" && <p className="text-primary mt-3">환불 {won(r.refundAmountKrw)}</p>}
          </section>

          <section aria-labelledby="rev-h">
            <h2 id="rev-h" className="text-primary text-sm font-medium">처리 기록</h2>
            <ol className="border-subtle divide-subtle mt-3 divide-y border-y">
              {events.map((e, k) => (
                <li key={k} className="flex flex-col gap-1 py-3 text-sm md:flex-row md:items-baseline md:gap-4">
                  <span className="text-muted text-2xs w-44 shrink-0 tabular-nums">{when(e.at)}</span>
                  <span className="text-primary">{RETURN_STATUS_LABEL[e.to]}</span>
                  {e.note && <span className="text-secondary">{e.note}</span>}
                  <span className="text-muted text-2xs md:ml-auto">{e.byAdmin ? "관리자" : "손님"}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="border-subtle bg-surface flex h-fit flex-col gap-4 rounded-2xl border p-6" aria-labelledby="ract-h">
          <h2 id="ract-h" className="text-primary text-sm font-medium">처리</h2>

          {r.status === "REQUESTED" && (mode === "approve" ? (
            <form className="flex flex-col gap-3" onSubmit={(e) => {
              e.preventDefault();
              run(() => adminApproveReturn(r.id, note.trim()), "승인했습니다. 안내가 손님 주문 상세에 보입니다.");
            }}>
              <label className="text-secondary text-2xs" htmlFor="note">회수 안내 (손님에게 보입니다 · 선택)</label>
              <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={300}
                placeholder="예) 기사님이 2~3일 안에 방문합니다. 받은 포장 그대로 준비해 주세요."
                className="border-interactive text-primary placeholder:text-muted/70 rounded-xl border bg-transparent px-4 py-3 text-sm" />
              <div className="flex gap-3">
                <button type="button" className={outline} onClick={() => setMode(null)}>취소</button>
                <button type="submit" disabled={busy} className={primary}>승인</button>
              </div>
            </form>
          ) : (
            <button type="button" className={primary} onClick={() => setMode("approve")}>승인 (회수 안내)</button>
          ))}

          {r.status === "APPROVED" && (
            <button type="button" disabled={busy} className={primary}
              onClick={() => run(() => adminCollectReturn(r.id), "회수 완료로 바꿨습니다. 상품을 확인한 뒤 완료 처리해 주세요.")}>
              회수 완료 (상품 받음)
            </button>
          )}

          {r.status === "COLLECTED" && r.type === "RETURN" && (mode === "refund" ? (
            <form className="flex flex-col gap-3" onSubmit={(e) => {
              e.preventDefault();
              if (!amountOk) return;
              if (!confirmRefund) return setConfirmRefund(true);
              run(() => adminRefundReturn(r.id, amountNum), `${won(amountNum)} 환불하고 반품을 완료했습니다.`);
            }}>
              <label className="text-secondary text-2xs" htmlFor="amount">환불액 (원)</label>
              <input id="amount" value={amount} inputMode="numeric" onChange={(e) => {
                setAmount(e.target.value.replace(/[^0-9]/g, ""));
                setConfirmRefund(false);
              }} className={`${field} tabular-nums`} />
              <p className="text-muted text-2xs leading-relaxed">
                돌려받은 상품 금액 {won(itemsValue)} · 최대 {won(refundableKrw)}. 배송비 차감은 아직 기준이 없어 직접 넣습니다.
              </p>
              {confirmRefund && amountOk && (
                <p className="text-primary text-2xs leading-relaxed">
                  {won(amountNum)}이 토스로 바로 환불됩니다. 되돌릴 수 없습니다. 한 번 더 누르면 진행합니다.
                </p>
              )}
              <div className="flex gap-3">
                <button type="button" className={outline} onClick={() => { setMode(null); setConfirmRefund(false); }}>취소</button>
                <button type="submit" disabled={busy || !amountOk} className={danger}>
                  {confirmRefund ? "네, 환불합니다" : "환불하고 완료"}
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className={primary} onClick={() => { setAmount(String(Math.min(itemsValue, refundableKrw))); setMode("refund"); }}>
              환불하고 완료
            </button>
          ))}

          {r.status === "COLLECTED" && r.type === "EXCHANGE" && (mode === "reship" ? (
            <form className="flex flex-col gap-3" onSubmit={(e) => {
              e.preventDefault();
              if (tracking.trim()) run(() => adminReshipReturn(r.id, courier, tracking.trim()), "재발송 처리했습니다. 송장이 손님 화면에 보입니다.");
            }}>
              <label className="text-secondary text-2xs" htmlFor="r-courier">택배사</label>
              <select id="r-courier" value={courier} onChange={(e) => setCourier(e.target.value)} className={field}>
                {COURIERS.map((c) => <option key={c}>{c}</option>)}
              </select>
              <label className="text-secondary text-2xs" htmlFor="r-tracking">송장번호</label>
              <input id="r-tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} inputMode="numeric" maxLength={50} className={field} />
              <div className="flex gap-3">
                <button type="button" className={outline} onClick={() => setMode(null)}>취소</button>
                <button type="submit" disabled={busy || !tracking.trim()} className={primary}>재발송 처리</button>
              </div>
            </form>
          ) : (
            <button type="button" className={primary} onClick={() => setMode("reship")}>교환 상품 재발송 (송장)</button>
          ))}

          {canReject && (mode === "reject" ? (
            <form className="flex flex-col gap-3" onSubmit={(e) => {
              e.preventDefault();
              if (reason.trim()) run(() => adminRejectReturn(r.id, reason.trim()), "거절했습니다. 사유가 손님에게 보입니다.");
            }}>
              <label className="text-secondary text-2xs" htmlFor="reject">거절 사유 (손님에게 보입니다)</label>
              <textarea id="reject" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={200}
                className="border-interactive text-primary rounded-xl border bg-transparent px-4 py-3 text-sm" />
              {r.status === "COLLECTED" && (
                <p className="text-muted text-2xs leading-relaxed">상품을 이미 받았다면 손님에게 다시 보내 주셔야 합니다.</p>
              )}
              <div className="flex gap-3">
                <button type="button" className={outline} onClick={() => setMode(null)}>아니요</button>
                <button type="submit" disabled={busy || !reason.trim()} className={danger}>거절</button>
              </div>
            </form>
          ) : (
            <button type="button" className={danger} onClick={() => setMode("reject")}>
              {r.status === "COLLECTED" ? "거절 (검수 불합격)" : "거절"}
            </button>
          ))}

          {!canReject && (
            <p className="text-muted text-2xs leading-relaxed">
              {r.status === "COMPLETED" ? "처리가 끝난 신청입니다." : r.status === "WITHDRAWN" ? "손님이 철회한 신청입니다." : "거절한 신청입니다."}
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

"use client";

import { ArrowLeft, ArrowsClockwise, Check, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ReturnCard } from "@/components/shop/ReturnCard";
import { loginUrl } from "@/lib/auth";
import {
  ORDER_STATUS_LABEL,
  ORDER_STEPS,
  ShopError,
  cancelOrder,
  myOrder,
  shortDate,
  when,
  won,
  type OrderDetail,
} from "@/lib/shop";

/**
 * 주문 상세 (손님). `?no=` 주문번호.
 *
 * 진행 단계를 맨 위에 둔다 — 주문 상세를 여는 이유는 대개 "지금 어디까지 왔나" 다.
 * 발송되면 택배사 · 송장번호가 그 바로 아래에 나온다.
 * 취소는 결제 직후(제작 전)에만 버튼이 있고, 한 번 더 묻는다.
 * 배송이 끝나면 교환·반품 구간이 열린다 — 신청 버튼과 마감일, 신청 내역(진행 단계 · 관리자 안내).
 */

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; order: OrderDetail };

export function OrderDetailView() {
  const no = useSyncExternalStore<string | null | undefined>(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("no"),
    () => undefined,
  );
  const [state, setState] = useState<State>({ kind: "loading" });
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!no) return;
    let alive = true;
    myOrder(no)
      .then((order) => alive && setState({ kind: "ready", order }))
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ShopError && e.needsLogin) {
          window.location.href = loginUrl();
          return;
        }
        setState({ kind: "error", message: e instanceof ShopError && e.status === 404 ? "주문을 찾을 수 없습니다." : "주문을 불러오지 못했습니다." });
      });
    return () => {
      alive = false;
    };
  }, [no]);

  async function cancel() {
    if (state.kind !== "ready") return;
    setBusy(true);
    setActionError(null);
    try {
      setState({ kind: "ready", order: await cancelOrder(state.order.orderNumber) });
      setConfirming(false);
    } catch (e) {
      setActionError(e instanceof ShopError ? e.message : "취소하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const back = (
    <Link href="/mypage/" className="text-muted hover:text-accent inline-flex min-h-11 items-center gap-2 text-xs">
      <ArrowLeft size={14} weight="light" aria-hidden="true" />
      마이페이지
    </Link>
  );

  if (no === null) return <>{back}<p className="text-secondary mt-6 text-sm">주문을 골라 주세요.</p></>;
  if (no === undefined || state.kind === "loading") {
    return (
      <>
        {back}
        <p aria-busy="true" className="text-muted mt-6 text-sm">
          불러오는 중
        </p>
      </>
    );
  }
  if (state.kind === "error") {
    return (
      <>
        {back}
        <p role="alert" className="text-error mt-6 text-sm">
          {state.message}
        </p>
      </>
    );
  }

  async function reload() {
    if (!no) return;
    try {
      setState({ kind: "ready", order: await myOrder(no) });
    } catch {
      // 새로고침하면 다시 읽는다 — 방금 바뀐 신청은 카드가 이미 보여 준다
    }
  }

  const o = state.order;
  const delivered = o.status === "DELIVERED";
  const cancelled = o.status === "CANCELLED";
  const reached = new Set(o.events.map((e) => e.status));
  const stepAt = (s: string) => o.events.find((e) => e.status === s)?.at ?? null;

  return (
    <div className="flex flex-col gap-8">
      {back}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted text-2xs tabular-nums">주문번호 {o.orderNumber}</p>
          <h2 className="font-display text-primary mt-1 text-2xl">{o.orderName}</h2>
        </div>
        <p className={`text-sm ${cancelled ? "text-muted" : "text-accent"}`}>{ORDER_STATUS_LABEL[o.status]}</p>
      </div>

      {cancelled ? (
        <div className="border-subtle bg-band/60 rounded-2xl border px-6 py-5 text-sm">
          <p className="text-primary">{when(o.cancelledAt)} 취소되었습니다.</p>
          <p className="text-secondary mt-1">
            {o.cancelReason} · 환불 {won(o.refundedAmountKrw)} (카드사에 따라 3~7영업일 걸릴 수 있습니다)
          </p>
        </div>
      ) : (
        <ol className="grid grid-cols-4 gap-2" aria-label="진행 단계">
          {ORDER_STEPS.map((s) => {
            const done = reached.has(s);
            return (
              <li key={s} className="flex flex-col items-center gap-2 text-center" aria-current={o.status === s ? "step" : undefined}>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                    done ? "border-accent bg-accent text-on-accent" : "border-subtle text-muted"
                  }`}
                >
                  {done ? <Check size={14} weight="bold" aria-hidden="true" /> : <span className="text-2xs">·</span>}
                </span>
                <span className={`text-2xs ${done ? "text-primary" : "text-muted"}`}>{ORDER_STATUS_LABEL[s]}</span>
                <span className="text-muted text-2xs tabular-nums">{done ? shortDate(stepAt(s)) : ""}</span>
              </li>
            );
          })}
        </ol>
      )}

      {o.trackingNumber && (
        <p className="border-subtle bg-surface rounded-xl border px-5 py-4 text-sm">
          <span className="text-muted">배송 조회 · </span>
          <span className="text-primary">{o.courier}</span>{" "}
          <span className="text-primary tabular-nums">{o.trackingNumber}</span>
        </p>
      )}

      <section aria-labelledby="items-h" className="border-subtle bg-surface rounded-2xl border p-6">
        <h3 id="items-h" className="text-primary text-sm font-medium">
          주문 상품
        </h3>
        <ul className="divide-subtle mt-3 divide-y">
          {o.items.map((i, k) => (
            <li key={k} className="flex items-center gap-4 py-3">
              <div className="bg-velvet aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-lg">
                {i.imageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={i.imageUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-primary text-sm">{i.name}</p>
                <p className="text-muted text-2xs mt-1">
                  사이즈 {i.size} · {i.quantity}벌 · 제작 약 {i.leadTimeDays}일
                </p>
              </div>
              <p className="text-primary text-sm tabular-nums">{won(i.lineAmountKrw)}</p>
            </li>
          ))}
        </ul>
        <dl className="border-subtle mt-3 flex flex-col gap-1.5 border-t pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-secondary">상품 금액</dt><dd className="tabular-nums">{won(o.itemsAmountKrw)}</dd></div>
          <div className="flex justify-between"><dt className="text-secondary">배송비</dt><dd className="tabular-nums">{won(o.shippingFeeKrw)}</dd></div>
          <div className="flex justify-between text-primary"><dt>결제 금액</dt><dd className="font-display text-lg tabular-nums">{won(o.totalAmountKrw)}</dd></div>
          <p className="text-muted text-2xs">{o.paymentMethod} · {when(o.paidAt)}</p>
        </dl>
      </section>

      <section aria-labelledby="ship-h" className="border-subtle bg-surface rounded-2xl border p-6 text-sm">
        <h3 id="ship-h" className="text-primary font-medium">
          받는 분
        </h3>
        <p className="text-secondary mt-3">
          {o.recipient.name} · {o.recipient.phone}
        </p>
        <p className="text-secondary mt-1">
          ({o.recipient.zipCode}) {o.recipient.address1} {o.recipient.address2}
        </p>
        {o.recipient.memo && <p className="text-muted text-2xs mt-1">{o.recipient.memo}</p>}
      </section>

      {(delivered || o.returns.length > 0) && (
        <section aria-labelledby="ret-h" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h3 id="ret-h" className="text-primary text-sm font-medium">
              교환 · 반품
            </h3>
            {o.returnable && (
              <Link
                href={`/mypage/return/?no=${encodeURIComponent(o.orderNumber)}`}
                className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm transition-colors duration-300"
              >
                <ArrowsClockwise size={15} weight="light" aria-hidden="true" />
                교환 · 반품 신청
              </Link>
            )}
          </div>
          {delivered && (o.changeOfMindDeadline || o.sellerFaultDeadline) && (
            <p className="text-muted text-2xs leading-relaxed">
              {o.changeOfMindDeadline && <>사이즈 · 단순 변심 {lastDay(o.changeOfMindDeadline)}까지</>}
              {o.sellerFaultDeadline && <> · 불량 · 오배송 {lastDay(o.sellerFaultDeadline)}까지</>}
              {!o.returnable && o.returns.every((r) => r.status !== "REQUESTED" && r.status !== "APPROVED" && r.status !== "COLLECTED") && (
                <> · 신청 기간이 지났습니다. 문제가 있다면 QnA 의 카카오톡 채널로 알려 주세요.</>
              )}
            </p>
          )}
          {o.returns.map((r) => (
            <ReturnCard key={r.id} r={r} onChanged={reload} />
          ))}
        </section>
      )}

      {o.cancellable && (
        <div className="flex flex-col gap-3">
          {confirming ? (
            <div className="border-error/40 bg-velvet-tint/40 flex flex-col gap-3 rounded-2xl border p-5">
              <p className="text-primary text-sm">
                주문을 취소하고 {won(o.totalAmountKrw)}을 환불받습니다. 되돌릴 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirming(false)} className="border-interactive text-primary inline-flex min-h-11 items-center rounded-full border px-5 text-sm">
                  아니요
                </button>
                <button type="button" disabled={busy} onClick={cancel} className="border-error text-error hover:bg-error/5 inline-flex min-h-11 items-center rounded-full border px-5 text-sm disabled:opacity-60">
                  {busy ? "취소하는 중" : "네, 취소합니다"}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="text-muted hover:text-error w-fit text-xs underline underline-offset-4 min-h-11">
              주문 취소 (제작 시작 전까지)
            </button>
          )}
          {actionError && (
            <p role="alert" className="text-error text-2xs flex gap-1.5">
              <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
              <span>{actionError}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** 서버 마감은 "그 시각 전까지" 다 — 화면에는 마지막 날을 보인다. */
export function lastDay(deadline: string): string {
  return shortDate(new Date(Date.parse(deadline) - 1).toISOString());
}

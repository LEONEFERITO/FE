"use client";

import { CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ShopError, confirmOrder, won, type OrderDetail } from "@/lib/shop";

/**
 * 결제 결과 — 토스 결제창이 돌려보낸 화면.
 *
 * 성공(/order/success): 주소에 paymentKey · orderId · amount 가 붙어 온다. 서버에 승인을 요청한다.
 * 서버는 amount 를 믿지 않고 주문에 저장된 금액과 대조한다 — 여기서는 그대로 전달만 한다.
 *
 * 같은 결제로 승인 요청이 두 번 나가지 않게 한 번만 보낸다(개발 모드는 effect 를 두 번 돌린다).
 * 서버도 행을 잠가 두 번째 요청을 같은 결과로 돌려준다.
 *
 * 실패(/order/fail): code · message 가 붙어 온다. 주문서는 결제 대기로 남고 장바구니도 그대로다.
 */

const inflight = new Map<string, Promise<OrderDetail>>();

function confirmOnce(orderId: string, paymentKey: string, amount: number) {
  const key = `${orderId}:${paymentKey}`;
  let p = inflight.get(key);
  if (!p) {
    p = confirmOrder(orderId, paymentKey, amount);
    inflight.set(key, p);
  }
  return p;
}

const readQuery = () => window.location.search;

type State =
  | { kind: "working" }
  | { kind: "done"; order: OrderDetail }
  | { kind: "error"; message: string; orderId: string | null };

export function PaymentSuccess() {
  const search = useSyncExternalStore(() => () => {}, readQuery, () => "");
  const [state, setState] = useState<State>({ kind: "working" });

  useEffect(() => {
    if (!search) return;
    const q = new URLSearchParams(search);
    const paymentKey = q.get("paymentKey");
    const orderId = q.get("orderId");
    const amount = Number(q.get("amount"));
    if (!paymentKey || !orderId || !Number.isFinite(amount)) {
      // 주소가 비정상 — 외부 상태(브라우저 주소)를 읽은 결과를 그대로 상태로 옮긴다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ kind: "error", message: "결제 정보가 올바르지 않습니다.", orderId });
      return;
    }
    let alive = true;
    confirmOnce(orderId, paymentKey, amount)
      .then((order) => alive && setState({ kind: "done", order }))
      .catch((e) => {
        if (!alive) return;
        setState({
          kind: "error",
          message: e instanceof ShopError ? e.message : "결제를 확인하지 못했습니다.",
          orderId,
        });
      });
    return () => {
      alive = false;
    };
  }, [search]);

  if (state.kind === "working") {
    return (
      <p aria-busy="true" role="status" className="text-secondary text-sm">
        결제를 확인하고 있습니다. 창을 닫지 마세요.
      </p>
    );
  }

  if (state.kind === "error") {
    return (
      <div role="alert" className="flex flex-col gap-4">
        <p className="text-error flex items-center gap-2 text-sm">
          <Warning size={18} weight="light" aria-hidden="true" />
          {state.message}
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          카드에서 돈이 빠져나갔는데 이 화면이 보이면 주문번호와 함께 고객센터로 알려 주세요. 확인 후 바로 처리해
          드립니다.
          {state.orderId && <span className="text-muted block mt-2 text-2xs">주문번호 {state.orderId}</span>}
        </p>
        <Link href="/cart/" className="text-accent inline-flex min-h-11 w-fit items-center text-sm underline underline-offset-4">
          장바구니로
        </Link>
      </div>
    );
  }

  const { order } = state;
  const lead = Math.max(...order.items.map((i) => i.leadTimeDays));
  return (
    <div role="status" className="flex flex-col gap-6">
      <p className="text-success flex items-center gap-2 text-sm">
        <CheckCircle size={20} weight="light" aria-hidden="true" />
        결제가 완료되었습니다
      </p>
      <dl className="border-subtle bg-surface grid gap-3 rounded-2xl border p-6 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">주문번호</dt>
          <dd className="text-primary tabular-nums">{order.orderNumber}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">주문 상품</dt>
          <dd className="text-primary text-right">{order.orderName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">결제 금액</dt>
          <dd className="text-primary tabular-nums">{won(order.totalAmountKrw)}</dd>
        </div>
      </dl>
      <p className="text-secondary text-sm leading-relaxed">
        지금부터 제작을 준비합니다. 약 {lead}일 뒤 출고되며, 발송되면 송장번호를 주문 상세에서 확인하실 수 있습니다.
        제작이 시작되기 전까지는 주문 상세에서 직접 취소할 수 있습니다.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/mypage/order/?no=${encodeURIComponent(order.orderNumber)}`}
          className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center rounded-full px-6 text-sm transition-colors duration-300"
        >
          주문 상세 보기
        </Link>
        <Link
          href="/products/"
          className="border-interactive text-primary hover:border-accent ease-fluid inline-flex min-h-12 items-center rounded-full border px-6 text-sm transition-colors duration-300"
        >
          계속 둘러보기
        </Link>
      </div>
    </div>
  );
}

export function PaymentFail() {
  const search = useSyncExternalStore(() => () => {}, readQuery, () => "");
  const q = new URLSearchParams(search);
  const code = q.get("code");
  const message = q.get("message");
  // 결제창을 닫은 경우 — 실패라기보다 손님의 선택이다. 다르게 말한다.
  const cancelled = code === "PAY_PROCESS_CANCELED" || code === "USER_CANCEL";

  return (
    <div role="alert" className="flex flex-col gap-5">
      <p className={`flex items-center gap-2 text-sm ${cancelled ? "text-primary" : "text-error"}`}>
        <Warning size={18} weight="light" aria-hidden="true" />
        {cancelled ? "결제를 취소하셨습니다." : "결제가 완료되지 않았습니다."}
      </p>
      {!cancelled && message && <p className="text-secondary text-sm leading-relaxed">{message}</p>}
      <p className="text-secondary text-sm leading-relaxed">
        결제된 금액은 없습니다. 장바구니는 그대로 남아 있어 다시 주문하실 수 있습니다.
      </p>
      <Link
        href="/cart/"
        className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 w-fit items-center rounded-full px-6 text-sm transition-colors duration-300"
      >
        장바구니로
      </Link>
    </div>
  );
}

"use client";

import { Check, Warning } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

import { PhotoThumb } from "@/components/shop/PhotoThumb";

import {
  RETURN_REASON_LABEL,
  RETURN_STATUS_LABEL,
  RETURN_STEPS,
  RETURN_TYPE_LABEL,
  ShopError,
  shortDate,
  when,
  withdrawReturn,
  won,
  type ReturnView,
} from "@/lib/shop";

/**
 * 교환·반품 신청 한 건 (손님 주문 상세 안).
 *
 * 주문 진행 단계와 같은 모양의 단계 표시를 쓴다 — 손님이 묻는 건 늘 "지금 어디까지 왔나" 다.
 * 관리자 안내(회수 방법)는 단계 바로 아래 — 손님이 다음에 할 일이 거기 있다.
 * 철회는 승인 전에만, 한 번 더 묻고.
 */
export function ReturnCard({ r, onChanged }: { r: ReturnView; onChanged: (next: ReturnView) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ended = r.status === "REJECTED" || r.status === "WITHDRAWN";
  const reached = new Set(r.events.map((e) => e.status));
  const stepAt = (s: string) => r.events.find((e) => e.status === s)?.at ?? null;

  async function withdraw() {
    setBusy(true);
    setError(null);
    try {
      onChanged(await withdrawReturn(r.id));
      setConfirming(false);
    } catch (e) {
      setError(e instanceof ShopError ? e.message : "철회하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="border-subtle bg-surface flex flex-col gap-5 rounded-2xl border p-6" aria-label={`${RETURN_TYPE_LABEL[r.type]} 신청`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-primary text-sm font-medium">
          {RETURN_TYPE_LABEL[r.type]} 신청 <span className="text-muted text-2xs font-normal">· {when(r.createdAt)}</span>
        </h4>
        <p className={`text-sm ${ended ? "text-muted" : "text-accent"}`}>{RETURN_STATUS_LABEL[r.status]}</p>
      </div>

      {!ended && (
        <ol className="grid grid-cols-4 gap-2" aria-label="진행 단계">
          {RETURN_STEPS.map((s) => {
            const done = reached.has(s);
            return (
              <li key={s} className="flex flex-col items-center gap-2 text-center" aria-current={r.status === s ? "step" : undefined}>
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border ${done ? "border-accent bg-accent text-on-accent" : "border-subtle text-muted"}`}>
                  {done ? <Check size={13} weight="bold" aria-hidden="true" /> : <span className="text-2xs">·</span>}
                </span>
                <span className={`text-2xs ${done ? "text-primary" : "text-muted"}`}>{s === "COMPLETED" ? (r.type === "EXCHANGE" ? "재발송" : "환불") : RETURN_STATUS_LABEL[s].split(" · ")[0]}</span>
                <span className="text-muted text-2xs tabular-nums">{done ? shortDate(stepAt(s)) : ""}</span>
              </li>
            );
          })}
        </ol>
      )}

      {r.adminNote && !ended && (
        <p className="bg-band/60 rounded-xl px-4 py-3 text-sm">
          <span className="text-muted text-2xs block">안내</span>
          <span className="text-primary">{r.adminNote}</span>
        </p>
      )}
      {r.status === "REJECTED" && r.rejectReason && (
        <p className="bg-band/60 rounded-xl px-4 py-3 text-sm">
          <span className="text-muted text-2xs block">거절 사유</span>
          <span className="text-primary">{r.rejectReason}</span>
        </p>
      )}
      {r.status === "COMPLETED" && r.type === "RETURN" && (
        <p className="text-primary text-sm">
          {won(r.refundAmountKrw)} 환불 · <span className="text-muted text-2xs">카드사에 따라 3~7영업일 걸릴 수 있습니다</span>
        </p>
      )}
      {r.reshipTrackingNumber && (
        <p className="text-sm">
          <span className="text-muted">교환 상품 배송 · </span>
          <span className="text-primary">{r.reshipCourier} <span className="tabular-nums">{r.reshipTrackingNumber}</span></span>
        </p>
      )}

      <dl className="border-subtle flex flex-col gap-1.5 border-t pt-4 text-sm">
        <div className="flex gap-3"><dt className="text-muted w-14 shrink-0">사유</dt><dd className="text-secondary">{RETURN_REASON_LABEL[r.reason]}</dd></div>
        <div className="flex gap-3">
          <dt className="text-muted w-14 shrink-0">상품</dt>
          <dd className="text-secondary flex flex-col gap-1">
            {r.items.map((i) => (
              <span key={i.orderItemId}>
                {i.name} · {i.size}{i.exchangeSize ? ` → ${i.exchangeSize}` : ""} · {i.quantity}벌
              </span>
            ))}
          </dd>
        </div>
        {r.detail && <div className="flex gap-3"><dt className="text-muted w-14 shrink-0">내용</dt><dd className="text-secondary whitespace-pre-line">{r.detail}</dd></div>}
        {r.photoUrls.length > 0 && (
          <div className="flex gap-3">
            <dt className="text-muted w-14 shrink-0">사진</dt>
            <dd className="flex flex-wrap gap-2">
              {r.photoUrls.map((u, k) => (
                <PhotoThumb key={u} url={u} label={`첨부 사진 ${k + 1} 크게 보기`} size="h-14 w-14" />
              ))}
            </dd>
          </div>
        )}
      </dl>

      {r.withdrawable && (confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-primary text-sm">신청을 철회합니다. 기간 안이라면 다시 신청할 수 있습니다.</p>
          <button type="button" onClick={() => setConfirming(false)} className="border-interactive text-primary inline-flex min-h-11 items-center rounded-full border px-5 text-sm">아니요</button>
          <button type="button" disabled={busy} onClick={withdraw} className="border-error text-error hover:bg-error/5 inline-flex min-h-11 items-center rounded-full border px-5 text-sm disabled:opacity-60">
            {busy ? "철회하는 중" : "네, 철회합니다"}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="text-muted hover:text-error min-h-11 w-fit text-xs underline underline-offset-4">
          신청 철회 (승인 전까지)
        </button>
      ))}
      {error && (
        <p role="alert" className="text-error text-2xs flex gap-1.5">
          <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </article>
  );
}

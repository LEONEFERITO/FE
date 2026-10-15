"use client";

import { Truck, Warning } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { ADMIN_CONNECTED, AdminApiError, getShippingWaiver, setShippingWaiver } from "@/lib/admin";

/**
 * 배송비 면제 스위치 (서버 V32, 2026-10-15 "테스트 하려고 하는데 배송비 면제 버튼 하나만").
 *
 * 켜면 다음 주문부터 배송비 0원 — 제주 · 도서산간 추가도 0원. 이미 만든 주문은 그대로다.
 * 켜 둔 채 잊으면 모든 주문이 무료 배송이 되므로, 켜져 있는 동안 경고색으로 크게 보인다.
 */
export function AdminShippingWaiver() {
  const [waived, setWaived] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ADMIN_CONNECTED) return;
    let alive = true;
    getShippingWaiver()
      .then((r) => alive && setWaived(r.waived))
      .catch((e) => alive && setError(e instanceof AdminApiError ? e.message : "상태를 불러오지 못했습니다."));
    return () => {
      alive = false;
    };
  }, []);

  async function toggle() {
    if (waived === null) return;
    setPending(true);
    setError(null);
    try {
      setWaived((await setShippingWaiver(!waived)).waived);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "바꾸지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  if (!ADMIN_CONNECTED) return null;

  return (
    <section
      aria-labelledby="waiver-heading"
      className={`mb-8 flex flex-col gap-4 rounded-2xl border px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7 ${
        waived ? "border-warning bg-velvet-tint" : "border-subtle bg-band/60"
      }`}
    >
      <div className="flex min-w-0 gap-3">
        {waived ? (
          <Warning size={18} weight="light" aria-hidden="true" className="text-warning mt-0.5 shrink-0" />
        ) : (
          <Truck size={18} weight="light" aria-hidden="true" className="text-secondary mt-0.5 shrink-0" />
        )}
        <div className="min-w-0">
          <h2 id="waiver-heading" className="text-primary text-sm font-medium">
            배송비 면제 {waived === null ? "" : waived ? "켜짐" : "꺼짐"}
          </h2>
          <p className="text-muted text-2xs mt-1 leading-relaxed">
            {waived
              ? "지금 들어오는 모든 주문의 배송비가 0원입니다(제주 · 도서산간 추가 포함). 테스트가 끝나면 꼭 끄세요."
              : "켜면 다음 주문부터 배송비가 0원이 됩니다. 결제 테스트 · 무료배송 행사용. 이미 만든 주문은 바뀌지 않습니다."}
          </p>
          {error && (
            <p role="alert" className="text-error text-2xs mt-1.5">
              {error}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={waived ?? false}
        aria-labelledby="waiver-heading"
        disabled={pending || waived === null}
        onClick={toggle}
        className={`ease-fluid inline-flex min-h-11 shrink-0 items-center rounded-full px-5 text-sm transition-colors duration-300 disabled:opacity-60 ${
          waived
            ? "bg-accent text-on-accent hover:bg-accent-hover"
            : "border-interactive text-secondary hover:border-accent hover:text-primary border"
        }`}
      >
        {pending ? "바꾸는 중" : waived ? "면제 끄기" : "배송비 면제 켜기"}
      </button>
    </section>
  );
}

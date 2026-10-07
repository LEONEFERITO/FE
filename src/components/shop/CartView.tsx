"use client";

import { ArrowRight, Minus, Plus, Trash, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

import { loginUrl } from "@/lib/auth";
import { pendingLabel } from "@/lib/pending";
import {
  MAX_QUANTITY,
  SHOP_CONNECTED,
  ShopError,
  changeCartQuantity,
  getCart,
  removeCartLine,
  won,
  type Cart,
} from "@/lib/shop";

/**
 * 장바구니.
 *
 * ── 합계는 서버가 준다 ──────────────────────────────────
 * 수량을 바꾸면 서버가 바뀐 장바구니 전체(합계 · 배송비 포함)를 돌려준다. 화면이 더하지 않는다 —
 * 화면 계산과 서버 계산이 어긋나면 "장바구니에선 29만원이었는데 결제창엔 29만 3천원" 이 된다.
 *
 * ── 주문할 수 없는 줄 ───────────────────────────────────
 * 담은 뒤 상품이 내려가거나 사이즈가 막히면 줄을 지우지 않고 이유를 보여 준다. 주문서에는
 * 주문할 수 있는 줄만 간다.
 */

type State =
  | { kind: "offline" }
  | { kind: "loading" }
  | { kind: "guest" }
  | { kind: "error"; message: string }
  | { kind: "ready"; cart: Cart };

export function CartView({ empty }: { empty: React.ReactNode }) {
  const [state, setState] = useState<State>(SHOP_CONNECTED ? { kind: "loading" } : { kind: "offline" });
  const [busy, setBusy] = useState<string | null>(null);
  const [lineError, setLineError] = useState<string | null>(null);

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    getCart()
      .then((cart) => alive && setState({ kind: "ready", cart }))
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ShopError && e.needsLogin) setState({ kind: "guest" });
        else setState({ kind: "error", message: e instanceof ShopError ? e.message : "불러오지 못했습니다." });
      });
    return () => {
      alive = false;
    };
  }, []);

  async function update(id: string, action: () => Promise<Cart>) {
    setBusy(id);
    setLineError(null);
    try {
      setState({ kind: "ready", cart: await action() });
    } catch (e) {
      setLineError(e instanceof ShopError ? e.message : "바꾸지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  if (state.kind === "offline") {
    return (
      <>
        <Notice>화면 확인 단계입니다. 주문 서버가 아직 연결되지 않았습니다.</Notice>
        {empty}
      </>
    );
  }
  if (state.kind === "loading") {
    return (
      <p aria-busy="true" className="text-muted text-sm">
        불러오는 중
      </p>
    );
  }
  if (state.kind === "guest") {
    return (
      <div className="border-subtle bg-surface flex flex-col items-start gap-4 rounded-2xl border p-7 md:flex-row md:items-center md:justify-between md:p-9">
        <div>
          <h2 className="font-display text-primary text-xl">로그인하고 장바구니를 보세요</h2>
          <p className="text-secondary mt-2 text-sm leading-relaxed">
            장바구니는 회원 계정에 저장됩니다. 다른 기기에서도 이어서 볼 수 있습니다.
          </p>
        </div>
        <a
          href="/login/?next=%2Fcart%2F"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = loginUrl();
          }}
          className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 shrink-0 items-center rounded-full px-6 text-sm transition-colors duration-300"
        >
          로그인
        </a>
      </div>
    );
  }
  if (state.kind === "error") {
    return <Notice tone="error">{state.message}</Notice>;
  }

  const { cart } = state;
  if (cart.items.length === 0) return <>{empty}</>;

  const orderable = cart.items.filter((l) => l.available);
  const checkoutHref = `/checkout/?items=${orderable.map((l) => encodeURIComponent(l.id)).join(",")}`;
  const longestLead = Math.max(0, ...orderable.map((l) => l.leadTimeDays ?? 0));

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-14">
      <section aria-label="담은 상품" className="min-w-0">
        <ul className="border-subtle divide-subtle divide-y border-y">
          {cart.items.map((line) => (
            <li key={line.id} className="flex gap-4 py-5 md:gap-6">
              <div className="bg-velvet relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-xl md:w-24">
                {line.imageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={line.imageUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {line.slug ? (
                      <Link href={`/products/${line.slug}/`} className="text-primary hover:text-accent text-sm font-medium">
                        {line.name ?? pendingLabel("제품명")}
                      </Link>
                    ) : (
                      <span className="text-muted text-sm">{line.name}</span>
                    )}
                    <p className="text-muted text-2xs mt-1">
                      사이즈 {line.size}
                      {line.leadTimeDays != null && <> · 주문 후 약 {line.leadTimeDays}일 제작</>}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy === line.id}
                    onClick={() => update(line.id, () => removeCartLine(line.id))}
                    className="text-muted hover:text-error ease-fluid inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-300"
                  >
                    <Trash size={16} weight="light" aria-hidden="true" />
                    <span className="sr-only">{line.name} 사이즈 {line.size} 빼기</span>
                  </button>
                </div>

                {line.available ? (
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                    <Stepper
                      value={line.quantity}
                      disabled={busy === line.id}
                      label={`${line.name ?? "상품"} 수량`}
                      onChange={(q) => update(line.id, () => changeCartQuantity(line.id, q))}
                    />
                    <p className="text-primary text-sm tabular-nums">{won(line.lineAmountKrw)}</p>
                  </div>
                ) : (
                  <p className="text-warning text-2xs mt-auto flex gap-1.5 leading-relaxed">
                    <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
                    <span>{line.unavailableReason} 주문서에는 포함되지 않습니다.</span>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
        {lineError && (
          <p role="alert" className="text-error text-2xs mt-3">
            {lineError}
          </p>
        )}
      </section>

      <aside className="border-subtle bg-surface h-fit rounded-2xl border p-6 md:p-7" aria-labelledby="sum-heading">
        <h2 id="sum-heading" className="text-primary text-sm font-medium">
          결제 예정 금액
        </h2>
        <dl className="mt-5 flex flex-col gap-2.5 text-sm">
          <Row label="상품 금액" value={won(cart.itemsAmountKrw)} />
          <Row
            label="배송비"
            value={cart.shippingFeeKrw == null ? pendingLabel("배송비 정책") : won(cart.shippingFeeKrw)}
            muted={cart.shippingFeeKrw == null}
          />
          {cart.freeShippingThresholdKrw != null && (
            <p className="text-muted text-2xs">{won(cart.freeShippingThresholdKrw)} 이상 무료 배송</p>
          )}
          <div className="border-subtle mt-2 border-t pt-3">
            <Row
              label="합계"
              value={cart.totalAmountKrw == null ? "—" : won(cart.totalAmountKrw)}
              strong
            />
          </div>
        </dl>
        {longestLead > 0 && (
          <p className="text-secondary text-2xs mt-4 leading-relaxed">
            주문 후 제작하는 옷입니다. 가장 긴 제작 기간은 약 {longestLead}일입니다.
          </p>
        )}
        {orderable.length > 0 && cart.shippingPolicyReady ? (
          <Link
            href={checkoutHref}
            data-quick-avoid=""
            className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid mt-6 flex min-h-14 items-center justify-center gap-2 rounded-full text-sm transition-colors duration-300"
          >
            주문하기
            <ArrowRight size={13} weight="light" aria-hidden="true" />
          </Link>
        ) : (
          <p className="text-muted text-2xs mt-6 leading-relaxed">
            {orderable.length === 0
              ? "지금 주문할 수 있는 상품이 없습니다."
              : "배송 정책을 준비하고 있어 지금은 주문할 수 없습니다."}
          </p>
        )}
      </aside>
    </div>
  );
}

function Stepper({
  value,
  disabled,
  label,
  onChange,
}: {
  value: number;
  disabled: boolean;
  label: string;
  onChange: (v: number) => void;
}) {
  const btn =
    "border-interactive text-primary hover:border-accent ease-fluid inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div role="group" aria-label={label} className="flex items-center gap-2">
      <button type="button" className={btn} disabled={disabled || value <= 1} onClick={() => onChange(value - 1)}>
        <Minus size={13} weight="light" aria-hidden="true" />
        <span className="sr-only">하나 빼기</span>
      </button>
      <span className="text-primary w-8 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        disabled={disabled || value >= MAX_QUANTITY}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={13} weight="light" aria-hidden="true" />
        <span className="sr-only">하나 더하기</span>
      </button>
    </div>
  );
}

function Row({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-secondary">{label}</dt>
      <dd
        className={`tabular-nums ${muted ? "text-muted text-2xs" : "text-primary"} ${
          strong ? "font-display text-xl" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export function Notice({ tone = "muted", children }: { tone?: "muted" | "error"; children: React.ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : undefined}
      className={`border-subtle mb-6 rounded-xl border px-4 py-3 text-2xs leading-relaxed ${
        tone === "error" ? "text-error bg-velvet-tint/60" : "bg-band/60 text-muted"
      }`}
    >
      {children}
    </p>
  );
}

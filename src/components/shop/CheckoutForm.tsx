"use client";

import { LockSimple, MagnifyingGlass, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Notice } from "@/components/shop/CartView";
import { Field } from "@/components/ui/Field";
import { fetchProfile, loginUrl } from "@/lib/auth";
import { searchAddress } from "@/lib/postcode";
import {
  SHOP_CONNECTED,
  ShopError,
  TOSS_CLIENT_KEY,
  createOrder,
  getCart,
  openPaymentWindow,
  paymentReadiness,
  quoteOrder,
  won,
  type CartLine,
  type Quote,
} from "@/lib/shop";

/**
 * 주문서.
 *
 * ── 순서 ───────────────────────────────────────────────
 * 상품 · 금액(서버 계산) → 받는 분 · 주소 → 결제 전 확인 → 결제하기.
 * "결제하기" 를 누르면 서버가 주문서를 만들고(금액 확정), 그 금액으로 토스 결제창을 연다.
 * 결제창에서 돌아오면 /order/success 가 서버에 승인을 요청한다.
 *
 * ── 결제 전 확인 ────────────────────────────────────────
 * 주문 상품 · 금액 · 제작 기간 · 교환/반품 조건을 결제 직전에 보여 주고 확인을 받는다
 * (전자상거래법 제8조, 약관 제9조). 서버가 확인 시각을 주문에 남긴다.
 *
 * ── 결제를 열지 않는 경우 ───────────────────────────────
 * 토스 클라이언트 키가 없거나(빌드), 서버가 준비되지 않았으면(시크릿 키 · 배송비 정책) 버튼을 닫고
 * "결제 준비 중" 이라고 말한다. 눌렀다가 실패하는 것보다 낫다.
 *
 * 주소는 카카오 우편번호 검색으로 채운다(lib/postcode.ts). 검색이 막혀도 직접 입력할 수 있다.
 */

type Load =
  | { kind: "offline" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; lines: CartLine[]; quote: Quote; paymentReady: boolean };

export function CheckoutForm() {
  // undefined = 아직 주소를 안 읽음(정적 HTML), "" = 없음
  const itemsParam = useSyncExternalStore<string | undefined>(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("items") ?? "",
    () => undefined,
  );
  const [load, setLoad] = useState<Load>(SHOP_CONNECTED ? { kind: "loading" } : { kind: "offline" });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [addressSearchError, setAddressSearchError] = useState<string | null>(null);

  async function findAddress() {
    setAddressSearchError(null);
    try {
      const picked = await searchAddress();
      if (!picked) return;
      setZipCode(picked.zipCode);
      setAddress1(picked.address1);
      document.querySelector<HTMLInputElement>('input[name="address2"]')?.focus();
    } catch {
      setAddressSearchError("주소 검색을 열지 못했습니다. 우편번호와 주소를 직접 입력해 주세요.");
    }
  }
  const [memo, setMemo] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!SHOP_CONNECTED || itemsParam === undefined) return;
    let alive = true;
    const ids = itemsParam.split(",").filter(Boolean);
    (async () => {
      try {
        const cart = await getCart();
        const lines = cart.items.filter((l) => ids.includes(l.id) && l.available);
        if (lines.length === 0) {
          throw new ShopError("EMPTY", "주문할 상품이 없습니다. 장바구니에서 다시 골라 주세요.");
        }
        const [quote, readiness] = await Promise.all([
          quoteOrder(lines.map((l) => l.id)),
          paymentReadiness(),
        ]);
        if (alive) setLoad({ kind: "ready", lines, quote, paymentReady: readiness.paymentReady });
        // 받는 분 기본값은 내 정보. 다른 사람에게 보내면 고치면 된다.
        const profile = await fetchProfile().catch(() => null);
        if (alive && profile) {
          setName((v) => v || profile.name);
          setPhone((v) => v || profile.phone || "");
        }
      } catch (e) {
        if (!alive) return;
        if (e instanceof ShopError && e.needsLogin) {
          window.location.href = loginUrl();
          return;
        }
        setLoad({ kind: "error", message: e instanceof ShopError ? e.message : "주문서를 불러오지 못했습니다." });
      }
    })();
    return () => {
      alive = false;
    };
  }, [itemsParam]);

  const errors: Record<string, string> = {};
  if (!name.trim()) errors.name = "받는 분 이름을 입력해 주세요.";
  if (!/^[0-9-]{9,20}$/.test(phone.trim())) errors.phone = "연락처를 숫자와 하이픈으로 입력해 주세요.";
  if (!/^[0-9]{5}$/.test(zipCode.trim())) errors.zipCode = "우편번호 5자리를 입력해 주세요.";
  if (!address1.trim()) errors.address1 = "주소를 입력해 주세요.";
  if (!agree) errors.agree = "결제 전 확인 사항에 동의해 주세요.";

  const clientReady = TOSS_CLIENT_KEY.length > 0;

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (load.kind !== "ready") return;
    setSubmitted(true);
    setError(null);
    if (Object.keys(errors).length > 0) return;

    setPending(true);
    try {
      const order = await createOrder({
        cartItemIds: load.lines.map((l) => l.id),
        recipientName: name.trim(),
        recipientPhone: phone.trim(),
        zipCode: zipCode.trim(),
        address1: address1.trim(),
        address2: address2.trim() || null,
        deliveryMemo: memo.trim() || null,
        agree,
      });
      // 결제창으로 넘어간다. 돌아오는 곳은 /order/success · /order/fail 이다.
      await openPaymentWindow(order, phone);
    } catch (err) {
      // 결제창을 닫은 경우도 여기로 온다(토스 SDK 가 오류로 알린다). 주문서는 결제 대기로 남고 다시 시도할 수 있다.
      setError(
        err instanceof ShopError
          ? err.message
          : err instanceof Error && err.message
            ? `결제창을 열지 못했습니다: ${err.message}`
            : "결제를 시작하지 못했습니다.",
      );
    } finally {
      setPending(false);
    }
  }

  if (load.kind === "offline") {
    return <Notice>화면 확인 단계입니다. 주문 서버가 아직 연결되지 않았습니다.</Notice>;
  }
  if (load.kind === "loading") {
    return (
      <p aria-busy="true" className="text-muted text-sm">
        주문서를 준비하는 중
      </p>
    );
  }
  if (load.kind === "error") {
    return (
      <div className="flex flex-col items-start gap-4">
        <Notice tone="error">{load.message}</Notice>
        <Link href="/cart/" className="text-accent text-sm underline underline-offset-4">
          장바구니로
        </Link>
      </div>
    );
  }

  const { lines, quote, paymentReady } = load;
  const canPay = paymentReady && clientReady;
  const show = (k: string) => (submitted ? errors[k] : undefined);

  return (
    <form onSubmit={pay} noValidate className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-14">
      <div className="flex min-w-0 flex-col gap-10">
        <section aria-labelledby="items-heading">
          <h2 id="items-heading" className="text-primary text-sm font-medium">
            주문 상품
          </h2>
          <ul className="border-subtle divide-subtle mt-4 divide-y border-y">
            {lines.map((l) => (
              <li key={l.id} className="flex items-center gap-4 py-4">
                <div className="bg-velvet aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg">
                  {l.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={l.imageUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-primary text-sm">{l.name}</p>
                  <p className="text-muted text-2xs mt-1">
                    사이즈 {l.size} · {l.quantity}벌 · 주문 후 약 {l.leadTimeDays}일 제작
                  </p>
                </div>
                <p className="text-primary text-sm tabular-nums">{won(l.lineAmountKrw)}</p>
              </li>
            ))}
          </ul>
        </section>

        <fieldset className="flex flex-col gap-5">
          <legend className="text-primary mb-5 text-sm font-medium">받는 분</legend>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="이름" name="recipient-name" autoComplete="name" value={name}
              onChange={(e) => setName(e.target.value)} error={show("name")} maxLength={50} />
            <Field label="연락처" name="recipient-phone" type="tel" inputMode="tel" autoComplete="tel"
              value={phone} onChange={(e) => setPhone(e.target.value)} error={show("phone")}
              placeholder="010-1234-5678" />
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" onClick={findAddress}
              className="border-interactive text-primary hover:border-accent ease-fluid inline-flex min-h-11 w-fit items-center gap-2 rounded-full border px-5 text-sm transition-colors duration-300">
              <MagnifyingGlass size={15} weight="light" aria-hidden="true" />
              주소 검색
            </button>
            {addressSearchError && <p className="text-muted text-2xs">{addressSearchError}</p>}
          </div>
          <div className="grid gap-5 md:grid-cols-[160px_minmax(0,1fr)]">
            <Field label="우편번호" name="zip" inputMode="numeric" autoComplete="postal-code" value={zipCode}
              onChange={(e) => setZipCode(e.target.value)} error={show("zipCode")} maxLength={5} />
            <Field label="주소" name="address1" autoComplete="address-line1" value={address1}
              onChange={(e) => setAddress1(e.target.value)} error={show("address1")} maxLength={200} />
          </div>
          <Field label="상세 주소 (선택)" name="address2" autoComplete="address-line2" value={address2}
            onChange={(e) => setAddress2(e.target.value)} maxLength={200} />
          <Field label="배송 요청사항 (선택)" name="memo" value={memo}
            onChange={(e) => setMemo(e.target.value)} maxLength={100} placeholder="문 앞에 두어 주세요" />
        </fieldset>
      </div>

      <aside className="border-subtle bg-surface flex h-fit flex-col gap-5 rounded-2xl border p-6 md:p-7" aria-labelledby="pay-heading">
        <h2 id="pay-heading" className="text-primary text-sm font-medium">
          결제 금액
        </h2>
        <dl className="flex flex-col gap-2.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-secondary">상품 금액</dt>
            <dd className="text-primary tabular-nums">{won(quote.itemsAmountKrw)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-secondary">배송비</dt>
            <dd className="text-primary tabular-nums">{won(quote.shippingFeeKrw)}</dd>
          </div>
          <div className="border-subtle flex items-baseline justify-between gap-4 border-t pt-3">
            <dt className="text-primary">합계</dt>
            <dd className="font-display text-primary text-2xl tabular-nums">{won(quote.totalAmountKrw)}</dd>
          </div>
        </dl>

        {/* 결제 전 확인 — 손님이 읽을 것을 체크 바로 위에 둔다. 링크 너머에만 두면 아무도 읽지 않는다. */}
        <div className="border-subtle bg-band/60 rounded-xl border px-4 py-4">
          <ul className="text-secondary text-2xs flex list-disc flex-col gap-1.5 pl-4 leading-relaxed">
            <li>주문 후 제작하는 옷입니다. 약 {quote.longestLeadTimeDays}일 뒤 출고됩니다.</li>
            <li>제작이 시작되면 직접 취소할 수 없습니다. 결제 직후에는 마이페이지에서 취소할 수 있습니다.</li>
            <li>
              교환·반품 조건은{" "}
              <Link href="/terms/#article-16" className="text-accent underline underline-offset-4">
                이용약관 제16~18조
              </Link>
              를 따릅니다.
            </li>
          </ul>
          <label className="text-primary text-2xs mt-3 flex min-h-11 cursor-pointer items-start gap-2.5 leading-relaxed">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              aria-invalid={show("agree") ? true : undefined}
              aria-describedby={show("agree") ? "agree-error" : undefined}
              className="accent-accent mt-0.5 h-4 w-4 shrink-0"
            />
            <span>주문 상품 · 결제 금액 · 제작 기간 · 교환/반품 조건을 확인했으며 결제에 동의합니다. (필수)</span>
          </label>
          {show("agree") && (
            <p id="agree-error" className="text-error text-2xs flex gap-1.5">
              <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
              <span>{show("agree")}</span>
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-error text-2xs flex gap-1.5 leading-relaxed">
            <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {canPay ? (
          <button
            type="submit"
            disabled={pending}
            className="bg-accent text-on-accent hover:bg-accent-hover shadow-button ease-fluid flex min-h-14 items-center justify-center gap-2 rounded-full text-sm transition-colors duration-300 disabled:cursor-wait disabled:opacity-60"
          >
            <LockSimple size={14} weight="light" aria-hidden="true" />
            {pending ? "결제창을 여는 중" : `${won(quote.totalAmountKrw)} 결제하기`}
          </button>
        ) : (
          <p className="border-subtle text-muted rounded-xl border px-4 py-3 text-2xs leading-relaxed">
            결제 준비 중입니다. 결제 서비스 연결이 끝나면 이 자리에서 결제할 수 있습니다.
          </p>
        )}
        <p className="text-muted text-2xs leading-relaxed">
          결제는 토스페이먼츠 결제창에서 진행됩니다. 카드 정보는 LEONE FERITO 에 저장되지 않습니다.
        </p>
      </aside>
    </form>
  );
}

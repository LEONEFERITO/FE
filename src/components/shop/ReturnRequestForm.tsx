"use client";

import { ArrowLeft, Camera, Warning, X } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { lastDay } from "@/components/shop/OrderDetailView";
import { PhotoThumb } from "@/components/shop/PhotoThumb";
import { KAKAO_CHANNEL } from "@/data/business";
import { loginUrl } from "@/lib/auth";
import { pendingLabel } from "@/lib/pending";
import {
  RETURN_PHOTO_ACCEPT,
  RETURN_PHOTO_MAX,
  RETURN_REASON_LABEL,
  SELLER_FAULT,
  ShopError,
  myOrder,
  orderableSizes,
  requestReturn,
  uploadReturnPhoto,
  type OrderDetail,
  type ReturnReason,
  type ReturnType,
} from "@/lib/shop";

/**
 * 교환·반품 신청 (손님). `?no=` 주문번호.
 *
 * 순서: 교환/반품 → 사유 → 상품(수량 · 교환 사이즈) → 자세한 내용.
 * 사유를 상품보다 먼저 묻는 이유: 사유에 따라 신청 기간이 달라서, 기간이 지난 사유는 고를 수 없게
 * 미리 닫아 둔다 — 다 쓰고 나서 "기간 지남" 을 듣는 것보다 낫다.
 *
 * 받을지 말지(주문 제작품의 단순 변심 등)는 관리자가 정한다. 여기서는 그 사실을 미리 알린다.
 * TODO(고객확인) 왕복 배송비 부담 · 주문 제작품 단순 변심 교환·반품 기준 · 불량 사진 받는 방법.
 */

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; order: OrderDetail };

interface Pick {
  on: boolean;
  quantity: number;
  size: string;
}

const REASONS: ReturnReason[] = ["SIZE", "CHANGE_OF_MIND", "DEFECT", "WRONG_ITEM", "OTHER"];

export function ReturnRequestForm() {
  const no = useSyncExternalStore<string | null | undefined>(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("no"),
    () => undefined,
  );
  const [state, setState] = useState<State>({ kind: "loading" });
  const [type, setType] = useState<ReturnType>("EXCHANGE");
  const [reason, setReason] = useState<ReturnReason | null>(null);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [sizes, setSizes] = useState<Record<string, string[] | "error">>({});
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const requested = useRef(new Set<string>());
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  /** 고르는 즉시 한 장씩 올린다 — 신청 버튼을 누를 때 한꺼번에 올리면 한 장 실패로 신청 전체가 막힌다. */
  async function addPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPhotoError(null);
    const room = RETURN_PHOTO_MAX - photos.length;
    const picked = Array.from(files).slice(0, Math.max(room, 0));
    if (files.length > room) setPhotoError(`사진은 ${RETURN_PHOTO_MAX}장까지 붙일 수 있습니다.`);
    setUploading(true);
    for (const file of picked) {
      try {
        const up = await uploadReturnPhoto(file);
        setPhotos((prev) => [...prev, up]);
      } catch (e) {
        setPhotoError(e instanceof ShopError ? e.message : "사진을 올리지 못했습니다.");
        break;
      }
    }
    setUploading(false);
  }

  useEffect(() => {
    if (!no) return;
    let alive = true;
    myOrder(no)
      .then((order) => {
        if (!alive) return;
        setState({ kind: "ready", order });
        const first: Record<string, Pick> = {};
        order.items.forEach((i) => (first[i.id] = { on: order.items.length === 1, quantity: 1, size: "" }));
        setPicks(first);
      })
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

  // 교환이면 상품별로 지금 주문할 수 있는 사이즈를 읽는다 (상품마다 한 번)
  useEffect(() => {
    if (type !== "EXCHANGE" || state.kind !== "ready") return;
    for (const slug of new Set(state.order.items.map((i) => i.slug))) {
      if (requested.current.has(slug)) continue;
      requested.current.add(slug);
      orderableSizes(slug)
        .then((list) => setSizes((prev) => ({ ...prev, [slug]: list })))
        .catch(() => setSizes((prev) => ({ ...prev, [slug]: "error" })));
    }
  }, [type, state]);

  const back = (
    <Link
      href={no ? `/mypage/order/?no=${encodeURIComponent(no)}` : "/mypage/"}
      className="text-muted hover:text-accent inline-flex min-h-11 items-center gap-2 text-xs"
    >
      <ArrowLeft size={14} weight="light" aria-hidden="true" />
      주문 상세
    </Link>
  );

  if (no === null) return <>{back}<p className="text-secondary mt-6 text-sm">주문을 골라 주세요.</p></>;
  if (no === undefined || state.kind === "loading") {
    return (
      <>
        {back}
        <p aria-busy="true" className="text-muted mt-6 text-sm">불러오는 중</p>
      </>
    );
  }
  if (state.kind === "error") {
    return (
      <>
        {back}
        <p role="alert" className="text-error mt-6 text-sm">{state.message}</p>
      </>
    );
  }

  const o = state.order;
  if (!o.returnable) {
    return (
      <>
        {back}
        <div className="border-subtle bg-band/60 mt-6 rounded-2xl border px-6 py-5 text-sm">
          <p className="text-primary">지금은 이 주문에 교환·반품을 신청할 수 없습니다.</p>
          <p className="text-secondary mt-1">
            배송이 끝난 주문만, 진행 중인 신청이 없을 때 신청할 수 있습니다. 기간이 지났다면 <a href={KAKAO_CHANNEL.chat} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover underline underline-offset-4">카카오톡 채널<span className="sr-only">(새 창)</span></a>로 알려 주세요.
          </p>
        </div>
      </>
    );
  }

  const deadline = (r: ReturnReason) => (SELLER_FAULT.includes(r) ? o.sellerFaultDeadline : o.changeOfMindDeadline);
  const reasonOpen = (r: ReturnReason) => {
    const d = deadline(r);
    return d != null && Date.parse(d) > now;
  };
  // 이미 신청한 수량(거절 · 철회 제외)은 뺀다 — 서버도 같은 규칙으로 막는다
  const taken: Record<string, number> = {};
  o.returns
    .filter((r) => r.status !== "REJECTED" && r.status !== "WITHDRAWN")
    .forEach((r) => r.items.forEach((ri) => (taken[ri.orderItemId] = (taken[ri.orderItemId] ?? 0) + ri.quantity)));
  const left = (id: string, ordered: number) => Math.max(ordered - (taken[id] ?? 0), 0);
  const chosen = o.items.filter((i) => picks[i.id]?.on && left(i.id, i.quantity) > 0);

  function setPick(id: string, patch: Partial<Pick>) {
    setPicks((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!reason) return setError("사유를 골라 주세요.");
    if (chosen.length === 0) return setError("교환·반품할 상품을 골라 주세요.");
    if (type === "EXCHANGE" && chosen.some((i) => !picks[i.id].size)) return setError("교환받을 사이즈를 골라 주세요.");
    if (uploading) return setError("사진을 올리는 중입니다. 잠시만 기다려 주세요.");
    setBusy(true);
    try {
      await requestReturn(o.orderNumber, {
        type,
        reason,
        detail: detail.trim() || null,
        items: chosen.map((i) => ({
          orderItemId: i.id,
          quantity: picks[i.id].quantity,
          exchangeSize: type === "EXCHANGE" ? picks[i.id].size : null,
        })),
        photoIds: photos.map((p) => p.id),
      });
      window.location.href = `/mypage/order/?no=${encodeURIComponent(o.orderNumber)}`;
    } catch (err) {
      setError(err instanceof ShopError ? err.message : "신청하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  const choice = (on: boolean) =>
    `ease-fluid flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm transition-colors duration-300 ${
      on ? "border-accent bg-accent/5 text-primary" : "border-interactive text-secondary hover:border-accent"
    }`;
  const select = "border-interactive text-primary min-h-11 rounded-xl border bg-transparent px-3 text-sm";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-10">
      {back}

      <div>
        <p className="text-muted text-2xs tabular-nums">주문번호 {o.orderNumber}</p>
        <h2 className="font-display text-primary mt-1 text-2xl">{o.orderName}</h2>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-primary mb-3 text-sm font-medium">무엇을 원하시나요</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["EXCHANGE", "RETURN"] as const).map((t) => (
            <label key={t} className={choice(type === t)}>
              <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="accent-accent h-4 w-4" />
              <span>
                {t === "EXCHANGE" ? "교환" : "반품"}
                <span className="text-muted text-2xs block">
                  {t === "EXCHANGE" ? "같은 상품을 다른 사이즈로 다시 받습니다" : "돌려보내고 환불받습니다"}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-primary mb-3 text-sm font-medium">사유</legend>
        {REASONS.map((r) => {
          const open = reasonOpen(r);
          const d = deadline(r);
          return (
            <label key={r} className={`${choice(reason === r)} ${open ? "" : "cursor-not-allowed opacity-50"}`}>
              <input type="radio" name="reason" value={r} disabled={!open} checked={reason === r}
                onChange={() => setReason(r)} className="accent-accent h-4 w-4" />
              <span className="flex-1">{RETURN_REASON_LABEL[r]}</span>
              <span className="text-muted text-2xs tabular-nums">
                {d ? (open ? `${lastDay(d)}까지` : "기간 지남") : ""}
              </span>
            </label>
          );
        })}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-primary mb-3 text-sm font-medium">상품</legend>
        <ul className="border-subtle divide-subtle divide-y border-y">
          {o.items.map((i) => {
            const p = picks[i.id] ?? { on: false, quantity: 1, size: "" };
            const list = sizes[i.slug];
            const max = left(i.id, i.quantity);
            return (
              <li key={i.id} className="flex flex-col gap-3 py-4">
                <label className={`flex min-h-11 items-center gap-3 ${max === 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                  <input type="checkbox" checked={p.on && max > 0} disabled={max === 0}
                    onChange={(e) => setPick(i.id, { on: e.target.checked })} className="accent-accent h-4 w-4 shrink-0" />
                  <div className="bg-velvet aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-md">
                    {i.imageUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={i.imageUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="text-primary">{i.name}</span>
                    <span className="text-muted text-2xs block">
                      사이즈 {i.size} · {i.quantity}벌 주문{max < i.quantity && ` · ${max === 0 ? "모두 신청함" : `${max}벌 남음`}`}
                    </span>
                  </span>
                </label>
                {p.on && max > 0 && (
                  <div className="flex flex-wrap items-center gap-3 pl-7">
                    {max > 1 && (
                      <label className="text-secondary text-2xs flex items-center gap-2">
                        수량
                        <select value={p.quantity} onChange={(e) => setPick(i.id, { quantity: Number(e.target.value) })} className={select}>
                          {Array.from({ length: max }, (_, k) => k + 1).map((n) => <option key={n} value={n}>{n}벌</option>)}
                        </select>
                      </label>
                    )}
                    {type === "EXCHANGE" && (
                      <label className="text-secondary text-2xs flex items-center gap-2">
                        받을 사이즈
                        {list === undefined ? (
                          <span className="text-muted">불러오는 중</span>
                        ) : list === "error" || list.length === 0 ? (
                          <span className="text-muted">지금 교환할 수 있는 사이즈가 없습니다 — 반품으로 신청해 주세요</span>
                        ) : (
                          <select value={p.size} onChange={(e) => setPick(i.id, { size: e.target.value })} className={select}>
                            <option value="">고르기</option>
                            {list.map((s) => <option key={s} value={s}>{s}{s === i.size ? " (같은 사이즈)" : ""}</option>)}
                          </select>
                        )}
                      </label>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="ret-detail" className="text-primary text-sm font-medium">자세한 내용 <span className="text-muted text-2xs font-normal">(선택)</span></label>
        <textarea id="ret-detail" value={detail} onChange={(e) => setDetail(e.target.value)} rows={4} maxLength={1000}
          placeholder={reason && SELLER_FAULT.includes(reason) ? "어느 부분이 어떻게 문제인지 적어 주세요" : "어디가 어떻게 맞지 않는지 적어 주시면 사이즈를 함께 봐 드립니다"}
          className="border-interactive focus-visible:border-accent text-primary placeholder:text-muted/70 rounded-xl border bg-transparent px-4 py-3 text-sm" />
        <p className="text-muted text-2xs">{detail.length} / 1000</p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-primary text-sm font-medium">
          사진 <span className="text-muted text-2xs font-normal">(선택 · {RETURN_PHOTO_MAX}장까지)</span>
        </p>
        <p className="text-muted text-2xs leading-relaxed">
          {reason && SELLER_FAULT.includes(reason)
            ? "불량 · 오배송은 사진이 있으면 바로 확인할 수 있습니다. 문제가 보이는 부분과 상품 라벨을 찍어 주세요."
            : "착용한 모습이나 맞지 않는 부분을 찍어 주시면 사이즈를 함께 봐 드립니다."}{" "}
          JPG · PNG · HEIC(아이폰) 등 사진 파일, 한 장 10MB 까지.
        </p>
        {photos.length > 0 && (
          <ul className="flex flex-wrap gap-3">
            {photos.map((p) => (
              <li key={p.id} className="relative">
                <PhotoThumb url={p.url} label="첨부한 사진 크게 보기" size="h-20 w-20" />
                <button type="button" aria-label="이 사진 빼기" onClick={() => setPhotos((prev) => prev.filter((x) => x.id !== p.id))}
                  className="bg-surface border-subtle text-secondary hover:text-error absolute -top-3 -right-3 inline-flex h-11 w-11 items-center justify-center rounded-full border">
                  <X size={13} weight="bold" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {photos.length < RETURN_PHOTO_MAX && (
          <label className={`border-interactive text-primary hover:border-accent ease-fluid inline-flex min-h-11 w-fit items-center gap-2 rounded-full border px-5 text-sm transition-colors duration-300 ${uploading ? "cursor-wait opacity-60" : "cursor-pointer"}`}>
            <Camera size={15} weight="light" aria-hidden="true" />
            {uploading ? "올리는 중" : "사진 고르기"}
            <input type="file" accept={RETURN_PHOTO_ACCEPT} multiple disabled={uploading} className="sr-only"
              onChange={(e) => {
                addPhotos(e.target.files);
                e.target.value = "";
              }} />
          </label>
        )}
        {photoError && <p role="alert" className="text-error text-2xs">{photoError}</p>}
      </div>

      <div className="border-subtle bg-band/60 rounded-xl border px-5 py-4">
        <ul className="text-secondary text-2xs flex list-disc flex-col gap-1.5 pl-4 leading-relaxed">
          <li>신청 후 확인해서 승인 여부와 회수 방법을 이 주문 상세에 안내해 드립니다.</li>
          <li>왕복 배송비: {pendingLabel("부담 기준")}. 불량 · 오배송은 저희가 부담합니다.</li>
          <li>주문 제작 상품이라 단순 변심 교환 · 반품은 제한될 수 있습니다 ({pendingLabel("기준")}). 불량 · 오배송은 제한 없이 받습니다.</li>
        </ul>
      </div>

      {error && (
        <p role="alert" className="text-error text-2xs flex gap-1.5 leading-relaxed">
          <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <button type="submit" disabled={busy}
        className="bg-accent text-on-accent hover:bg-accent-hover shadow-button ease-fluid flex min-h-14 items-center justify-center rounded-full text-sm transition-colors duration-300 disabled:cursor-wait disabled:opacity-60">
        {busy ? "신청하는 중" : `${type === "EXCHANGE" ? "교환" : "반품"} 신청`}
      </button>
    </form>
  );
}

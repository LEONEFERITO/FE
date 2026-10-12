"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle,
  PencilSimple,
  Plus,
  Trash,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { useCallback, useEffect, useMemo, useState } from "react";

import { HeroBannerPreview } from "@/components/admin/HeroBannerPreview";
import { ImageField, type ImageFieldValue } from "@/components/admin/ImageField";
import { ErrorNotice } from "@/components/admin/AdminProductList";
import { getProduct, listProducts, type AdminProductEdit, type AdminProductRow } from "@/lib/admin";
import {
  HERO_CTA_URL,
  HERO_LIMITS,
  MAX_HERO_BANNERS,
  adminHeroBanners,
  createHeroBanner,
  deleteHeroBanner,
  reorderHeroBanners,
  updateHeroBanner,
  type HeroBannerAdmin,
  type HeroBannerInput,
  type HeroBannerKind,
} from "@/lib/console";
import { slideFromCustom, slideFromProduct, type HeroSlide, type SlideProduct } from "@/lib/heroSlide";
import { SHOP_CONNECTED } from "@/lib/shop";
import type { Product } from "@/types/product";

/**
 * 메인 배너 — 목록 · 등록 · 수정 (2026-10-12 "리스트가 있고 배너 등록 → 저장 방식(상품 정보 가져오기 or 직접 등록)").
 *
 *   목록   등록한 배너 전부. 켜 둔 배너가 위에서부터 순서대로 메인 첫 화면에서 넘어간다(6초마다, 맨 위에서만).
 *          순서(↑↓) · 노출 켜고 끄기 · 수정 · 삭제. 나가는 배너가 없으면 진열 순서 맨 앞 상품이 자동으로 나간다.
 *   등록   등록 방식을 고른다 — 상품 정보 가져오기(공개 상품의 사진 · 이름 · 가격) / 직접 등록(사진 · 문구 · 버튼).
 *          사진 · 문구 · 노출을 **한 번에** 저장한다. 아래 미리보기는 PC · 모바일 창으로 저장 전 모습을 보여 준다.
 *
 * 저장하면 손님 화면을 다시 만든다(1~3분, 서버 FrontRebuildTrigger).
 */

const KIND_OPTIONS: { value: HeroBannerKind; title: string; desc: string }[] = [
  {
    value: "PRODUCT",
    title: "상품 정보 가져오기",
    desc: "공개 상품 하나를 고르면 그 상품의 누끼샷 · 착용샷 · 디테일컷과 이름 · 가격이 배너가 됩니다. 상품 정보를 고치면 배너도 같이 바뀝니다.",
  },
  {
    value: "CUSTOM",
    title: "직접 등록",
    desc: "인물 사진 · 액자 사진과 문구 · 버튼을 직접 올립니다. 시즌 화보 · 기획전에 맞습니다.",
  },
];

interface Form {
  kind: HeroBannerKind;
  productId: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  figure: ImageFieldValue | null;
  figureAlt: string;
  frameLeft: ImageFieldValue | null;
  frameLeftAlt: string;
  frameRight: ImageFieldValue | null;
  frameRightAlt: string;
  visible: boolean;
}

const EMPTY_FORM: Form = {
  kind: "PRODUCT",
  productId: "",
  eyebrow: "",
  title: "",
  subtitle: "",
  ctaLabel: "",
  ctaUrl: "",
  figure: null,
  figureAlt: "",
  frameLeft: null,
  frameLeftAlt: "",
  frameRight: null,
  frameRightAlt: "",
  visible: true,
};

const asField = (p: { mediaId: string; url: string } | null): ImageFieldValue | null =>
  p ? { mediaId: p.mediaId, url: p.url, filename: "" } : null;

function formOf(b: HeroBannerAdmin): Form {
  return {
    kind: b.kind,
    productId: b.productId ?? "",
    eyebrow: b.eyebrow,
    title: b.title,
    subtitle: b.subtitle,
    ctaLabel: b.ctaLabel,
    ctaUrl: b.ctaUrl,
    figure: asField(b.figure),
    figureAlt: b.figure?.alt ?? "",
    frameLeft: asField(b.frameLeft),
    frameLeftAlt: b.frameLeft?.alt ?? "",
    frameRight: asField(b.frameRight),
    frameRightAlt: b.frameRight?.alt ?? "",
    visible: b.visible,
  };
}

function inputOf(f: Form): HeroBannerInput {
  const custom = f.kind === "CUSTOM";
  const photo = (v: ImageFieldValue | null, alt: string) => (custom && v ? { mediaId: v.mediaId, alt: alt.trim() } : null);
  return {
    kind: f.kind,
    productId: f.kind === "PRODUCT" ? f.productId || null : null,
    eyebrow: f.eyebrow.trim(),
    title: f.title.trim(),
    subtitle: f.subtitle.trim(),
    ctaLabel: f.ctaLabel.trim(),
    ctaUrl: f.ctaUrl.trim(),
    figure: photo(f.figure, f.figureAlt),
    frameLeft: photo(f.frameLeft, f.frameLeftAlt),
    frameRight: photo(f.frameRight, f.frameRightAlt),
    visible: f.visible,
  };
}

/** 상품 수정용 응답 → 배너가 쓰는 모양. 사진 순서는 손님 화면(lib/catalog)과 같다: 대표 → 착용 → 디테일 */
const KIND_RANK: Record<string, number> = { MAIN: 0, WORN: 1, DETAIL: 2 };
function slideProductOf(e: AdminProductEdit): SlideProduct {
  return {
    slug: e.slug,
    name: e.name,
    category: e.category as Product["category"],
    line: e.line as Product["line"],
    priceKrw: e.priceKrw,
    cutout: e.images.find((i) => i.kind === "CUTOUT")?.url ?? null,
    images: e.images
      .filter((i) => i.kind in KIND_RANK)
      .sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.sortOrder - b.sortOrder)
      .map((i) => ({ url: i.url, alt: i.alt })),
  };
}

function errorText(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

const field =
  "border-interactive focus-visible:border-accent text-primary placeholder:text-muted/70 min-h-11 w-full border bg-transparent px-3 text-sm";

function Counted({
  id,
  label,
  value,
  max,
  placeholder,
  hint,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  max: number;
  placeholder?: string;
  hint?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-primary text-xs font-medium">
          {label}
        </label>
        <span className="text-muted text-2xs tabular-nums">
          {value.length}/{max}
        </span>
      </div>
      <input id={id} value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={field} />
      {hint && <p className="text-muted text-2xs leading-relaxed">{hint}</p>}
    </div>
  );
}

function Notice({ tone, text }: { tone: "ok" | "error"; text: string }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`text-2xs flex gap-1.5 leading-relaxed ${tone === "ok" ? "text-success" : "text-error"}`}
    >
      {tone === "ok" ? (
        <CheckCircle size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
      ) : (
        <Warning size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
      )}
      <span>{text}</span>
    </p>
  );
}

type Load = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready" };
type View = { kind: "list" } | { kind: "edit"; banner: HeroBannerAdmin | null };

export function AdminHeroBanners() {
  const [load, setLoad] = useState<Load>(
    SHOP_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );
  const [banners, setBanners] = useState<HeroBannerAdmin[]>([]);
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [view, setView] = useState<View>({ kind: "list" });
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const reload = useCallback(async () => {
    const [list, rows] = await Promise.all([adminHeroBanners(), listProducts()]);
    setBanners(list);
    setProducts(rows);
  }, []);

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    Promise.all([adminHeroBanners(), listProducts()])
      .then(([list, rows]) => {
        if (!alive) return;
        setBanners(list);
        setProducts(rows);
        setLoad({ kind: "ready" });
      })
      .catch((e) => {
        if (!alive) return;
        const status = (e as { status?: number }).status;
        const code = status === 401 ? "UNAUTHENTICATED" : status === 403 ? "FORBIDDEN" : ((e as { code?: string }).code ?? "UNKNOWN");
        setLoad({ kind: "error", code, message: errorText(e, "불러오지 못했습니다.") });
      });
    return () => {
      alive = false;
    };
  }, []);

  if (load.kind === "loading") return <p aria-busy="true" className="text-muted text-sm">불러오는 중</p>;
  if (load.kind === "error") return <ErrorNotice code={load.code} message={load.message} />;

  if (view.kind === "edit") {
    return (
      <BannerEditor
        banner={view.banner}
        products={products}
        onCancel={() => setView({ kind: "list" })}
        onSaved={async (text) => {
          await reload().catch(() => undefined);
          setView({ kind: "list" });
          setMessage({ tone: "ok", text });
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  return (
    <BannerList
      banners={banners}
      products={products}
      message={message}
      setMessage={setMessage}
      setBanners={setBanners}
      reload={reload}
      onEdit={(banner) => {
        setMessage(null);
        setView({ kind: "edit", banner });
        window.scrollTo({ top: 0 });
      }}
    />
  );
}

// ── 목록 ────────────────────────────────────────────────────

function BannerList({
  banners,
  products,
  message,
  setMessage,
  setBanners,
  reload,
  onEdit,
}: {
  banners: HeroBannerAdmin[];
  products: AdminProductRow[];
  message: { tone: "ok" | "error"; text: string } | null;
  setMessage: (m: { tone: "ok" | "error"; text: string } | null) => void;
  setBanners: (b: HeroBannerAdmin[]) => void;
  reload: () => Promise<void>;
  onEdit: (b: HeroBannerAdmin | null) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const shownCount = banners.filter((b) => b.shown).length;
  const full = banners.length >= MAX_HERO_BANNERS;

  async function run(key: string, task: () => Promise<void>, done: string) {
    setBusy(key);
    setMessage(null);
    try {
      await task();
      setMessage({ tone: "ok", text: done });
    } catch (e) {
      setMessage({ tone: "error", text: errorText(e, "저장하지 못했습니다.") });
      await reload().catch(() => undefined);
    } finally {
      setBusy(null);
    }
  }

  const move = (i: number, d: -1 | 1) =>
    run(
      `move-${i}`,
      async () => {
        const ids = banners.map((b) => b.id);
        [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
        setBanners(await reorderHeroBanners(ids));
      },
      "순서를 바꿨습니다. 손님 화면은 1~3분 뒤에 바뀝니다.",
    );

  const toggle = (b: HeroBannerAdmin) =>
    run(
      `toggle-${b.id}`,
      async () => {
        await updateHeroBanner(b.id, { ...inputOf(formOf(b)), visible: !b.visible });
        await reload();
      },
      b.visible ? "배너를 숨겼습니다. 손님 화면은 1~3분 뒤에 바뀝니다." : "배너를 켰습니다. 손님 화면은 1~3분 뒤에 바뀝니다.",
    );

  const remove = (b: HeroBannerAdmin, name: string) => {
    if (!window.confirm(`「${name}」 배너를 지울까요? 되돌릴 수 없습니다.`)) return;
    void run(
      `delete-${b.id}`,
      async () => {
        await deleteHeroBanner(b.id);
        await reload();
      },
      "배너를 지웠습니다. 손님 화면은 1~3분 뒤에 바뀝니다.",
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-secondary text-xs leading-relaxed">
          등록 <span className="text-primary tabular-nums">{banners.length}</span> / {MAX_HERO_BANNERS} · 노출 중{" "}
          <span className="text-primary tabular-nums">{shownCount}</span>
          <br />
          {shownCount === 0
            ? "지금 노출 중인 배너가 없어서 메인 구성(진열 순서) 맨 앞 상품이 배너로 나갑니다."
            : "노출 중인 배너가 위에서부터 순서대로 메인 첫 화면에서 넘어갑니다(6초마다)."}
        </p>
        <button
          type="button"
          onClick={() => onEdit(null)}
          disabled={full}
          className="bg-primary hover:bg-accent ease-fluid inline-flex min-h-12 items-center gap-2 px-6 text-sm text-white transition-colors duration-300 disabled:opacity-50"
        >
          <Plus size={14} weight="light" aria-hidden="true" />
          배너 등록
        </button>
      </div>
      {full && <p className="text-muted text-2xs">배너는 {MAX_HERO_BANNERS}개까지 등록할 수 있습니다. 안 쓰는 배너를 지운 뒤 등록해 주세요.</p>}
      {message && <Notice tone={message.tone} text={message.text} />}

      {banners.length === 0 ? (
        <div className="border-subtle flex flex-col items-center gap-4 border border-dashed px-6 py-14 text-center">
          <p className="text-primary text-sm font-medium">등록된 배너가 없습니다</p>
          <p className="text-muted text-xs leading-relaxed">
            지금은 메인 구성(진열 순서) 맨 앞 상품이 배너로 나갑니다.
            <br />
            「배너 등록」에서 상품 정보를 가져오거나 사진을 직접 올려 배너를 만드세요.
          </p>
        </div>
      ) : (
        <ol className="border-subtle divide-subtle divide-y border">
          {banners.map((b, i) => {
            const product = b.productId ? productById.get(b.productId) : undefined;
            const name = b.title || product?.name || (b.kind === "CUSTOM" ? "제목 없는 배너" : "상품 배너");
            const thumb = b.kind === "CUSTOM" ? b.figure?.url : product?.mainImageUrl;
            const status = b.shown
              ? { text: "노출 중", cls: "text-success border-success/40" }
              : !b.visible
                ? { text: "숨김", cls: "text-muted border-subtle" }
                : {
                    text: b.kind === "PRODUCT" ? "안 나감 · 상품 비공개" : "안 나감 · 인물 사진 없음",
                    cls: "text-error border-error/40",
                  };
            const iconBtn =
              "border-subtle text-secondary hover:border-accent hover:text-accent ease-fluid inline-flex h-10 w-10 items-center justify-center border transition-colors duration-300 disabled:opacity-30";
            return (
              <li key={b.id} className="bg-surface flex flex-wrap items-center gap-4 p-4 md:flex-nowrap md:gap-5 md:p-5">
                <span className="text-muted text-2xs w-6 shrink-0 text-center tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="bg-band/60 border-subtle relative block aspect-[4/5] w-14 shrink-0 overflow-hidden border">
                  {thumb ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={thumb} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-muted text-2xs absolute inset-0 flex items-center justify-center">없음</span>
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-primary truncate text-sm font-medium">{name}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-secondary border-subtle text-2xs border px-2 py-0.5">
                      {b.kind === "PRODUCT" ? "상품 정보" : "직접 등록"}
                    </span>
                    <span className={`text-2xs border px-2 py-0.5 ${status.cls}`}>{status.text}</span>
                    {b.kind === "PRODUCT" && product && <span className="text-muted text-2xs truncate">{product.slug}</span>}
                  </span>
                </span>
                <span className="flex w-full items-center justify-end gap-2 md:w-auto">
                  <label className="text-secondary text-2xs mr-2 inline-flex min-h-10 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={b.visible}
                      disabled={busy !== null}
                      onChange={() => toggle(b)}
                      className="accent-accent h-4 w-4"
                    />
                    노출
                  </label>
                  <button type="button" aria-label={`${name} 위로`} disabled={i === 0 || busy !== null} onClick={() => move(i, -1)} className={iconBtn}>
                    <ArrowUp size={14} weight="light" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`${name} 아래로`}
                    disabled={i === banners.length - 1 || busy !== null}
                    onClick={() => move(i, 1)}
                    className={iconBtn}
                  >
                    <ArrowDown size={14} weight="light" aria-hidden="true" />
                  </button>
                  <button type="button" aria-label={`${name} 수정`} disabled={busy !== null} onClick={() => onEdit(b)} className={iconBtn}>
                    <PencilSimple size={14} weight="light" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`${name} 삭제`}
                    disabled={busy !== null}
                    onClick={() => remove(b, name)}
                    className={`${iconBtn} hover:!border-error hover:!text-error`}
                  >
                    <Trash size={14} weight="light" aria-hidden="true" />
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ── 등록 · 수정 ─────────────────────────────────────────────

function BannerEditor({
  banner,
  products,
  onCancel,
  onSaved,
}: {
  banner: HeroBannerAdmin | null;
  products: AdminProductRow[];
  onCancel: () => void;
  onSaved: (message: string) => void | Promise<void>;
}) {
  const [form, setForm] = useState<Form>(banner ? formOf(banner) : EMPTY_FORM);
  const [details, setDetails] = useState<Record<string, SlideProduct | "error">>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  // 배너로 걸 수 있는 건 공개 상품뿐이다(서버도 막는다). 진열 순서대로
  const published = useMemo(
    () => products.filter((p) => p.status === "PUBLISHED").sort((a, b) => a.displayOrder - b.displayOrder),
    [products],
  );

  // 고른 상품의 사진 · 이름 · 가격 — 미리보기에 쓴다
  const pid = form.kind === "PRODUCT" ? form.productId : "";
  useEffect(() => {
    if (!pid || details[pid]) return;
    let alive = true;
    getProduct(pid)
      .then((e) => alive && setDetails((d) => ({ ...d, [pid]: slideProductOf(e) })))
      .catch(() => alive && setDetails((d) => ({ ...d, [pid]: "error" })));
    return () => {
      alive = false;
    };
  }, [pid, details]);

  const text = { eyebrow: form.eyebrow.trim(), title: form.title.trim(), subtitle: form.subtitle.trim(), ctaLabel: form.ctaLabel.trim(), ctaUrl: form.ctaUrl.trim() };
  const urlOk = HERO_CTA_URL.test(text.ctaUrl);
  const detail = pid ? details[pid] : undefined;
  const slide: HeroSlide | null =
    form.kind === "PRODUCT"
      ? detail && detail !== "error"
        ? slideFromProduct(detail, { ...text, ctaUrl: urlOk ? text.ctaUrl : "" })
        : null
      : slideFromCustom({
          ...text,
          ctaUrl: urlOk ? text.ctaUrl : "",
          figure: form.figure ? { url: form.figure.url, alt: form.figureAlt } : null,
          frameLeft: form.frameLeft ? { url: form.frameLeft.url, alt: form.frameLeftAlt } : null,
          frameRight: form.frameRight ? { url: form.frameRight.url, alt: form.frameRightAlt } : null,
        });
  const emptyText =
    form.kind === "PRODUCT"
      ? !pid
        ? "상품을 고르면 미리보기가 나옵니다."
        : detail === "error"
          ? "상품 정보를 불러오지 못했습니다."
          : "상품 정보를 불러오는 중입니다."
      : "가운데 인물 사진을 올리면 미리보기가 나옵니다.";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.kind === "PRODUCT" && !form.productId) return setError("배너로 쓸 상품을 골라 주세요.");
    if (form.kind === "CUSTOM" && !form.figure) return setError("가운데 인물 사진을 올려 주세요.");
    if (!urlOk) return setError("버튼 주소는 /로 시작하는 사이트 안 주소나 https:// 주소만 쓸 수 있습니다.");
    setBusy(true);
    try {
      const input = inputOf(form);
      if (banner) await updateHeroBanner(banner.id, input);
      else await createHeroBanner(input);
      await onSaved(
        (banner ? "배너를 저장했습니다." : "배너를 등록했습니다.") +
          (form.visible ? " 손님 화면은 1~3분 뒤에 바뀝니다." : " 「노출」을 꺼 두어 손님 화면에는 나가지 않습니다."),
      );
    } catch (err) {
      setError(errorText(err, "저장하지 못했습니다."));
      setBusy(false);
    }
  }

  const productText = form.kind === "PRODUCT";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="text-secondary hover:text-accent ease-fluid inline-flex min-h-11 items-center gap-1.5 text-xs transition-colors duration-300"
        >
          <ArrowLeft size={14} weight="light" aria-hidden="true" />
          배너 목록
        </button>
        <h2 className="text-primary text-lg font-semibold">{banner ? "배너 수정" : "배너 등록"}</h2>
      </div>

      {/* ── 1 등록 방식 ── */}
      <fieldset className="border-subtle bg-surface border p-6 md:p-8">
        <legend className="text-primary px-1 text-base font-semibold">등록 방식</legend>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {KIND_OPTIONS.map((m) => {
            const on = form.kind === m.value;
            return (
              <label
                key={m.value}
                className={`ease-fluid flex cursor-pointer flex-col gap-2 border p-5 transition-colors duration-300 ${
                  on ? "border-accent bg-accent-tint" : "border-subtle hover:border-accent"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="banner-kind"
                    value={m.value}
                    checked={on}
                    onChange={() => set({ kind: m.value })}
                    className="accent-accent h-4 w-4"
                  />
                  <span className="text-primary text-sm font-semibold">{m.title}</span>
                </span>
                <span className="text-secondary text-xs leading-relaxed">{m.desc}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* ── 2 상품 · 사진 ── */}
      {form.kind === "PRODUCT" ? (
        <section aria-label="상품 고르기" className="border-subtle bg-surface border p-6 md:p-8">
          <label htmlFor="banner-product" className="text-primary text-base font-semibold">
            상품
          </label>
          <p className="text-muted text-2xs mt-1">
            공개된 상품만 고를 수 있습니다. 누끼샷 · 착용샷 · 디테일컷이 있으면 배너가 가장 잘 나옵니다(상품 관리 → 사진).
          </p>
          {published.length === 0 ? (
            <p className="text-error mt-4 text-sm">공개된 상품이 없습니다. 상품을 먼저 공개하거나 「직접 등록」을 고르세요.</p>
          ) : (
            <select
              id="banner-product"
              value={form.productId}
              onChange={(e) => set({ productId: e.target.value })}
              className={`${field} mt-4 max-w-xl`}
            >
              <option value="">상품을 고르세요</option>
              {published.map((p) => (
                <option key={p.id} value={p.id}>
                  {(p.name ?? "이름 없음") + " · " + p.slug}
                </option>
              ))}
            </select>
          )}
        </section>
      ) : (
        <section aria-label="배너 사진" className="border-subtle bg-surface border p-6 md:p-8">
          <h3 className="text-primary text-base font-semibold">사진</h3>
          <p className="text-muted text-2xs mt-1">액자를 비우면 인물 사진을 잘라서 씁니다.</p>
          <div className="mt-6 grid gap-8 md:grid-cols-3">
            {(
              [
                ["figure", "가운데 인물", "배경을 지운 인물 사진(PNG · WebP 투명 배경)이 가장 잘 어울립니다. 세로로 깁니다.", true],
                ["frameLeft", "왼쪽 아래 액자", "세로 4:5. 스크롤하면 아래에서 올라옵니다.", false],
                ["frameRight", "오른쪽 위 액자", "세로 4:5.", false],
              ] as const
            ).map(([key, label, hint, required]) => {
              const altKey = `${key}Alt` as const;
              return (
                <div key={key} className="flex flex-col gap-3">
                  <ImageField label={label} hint={hint} required={required} value={form[key]} onChange={(v) => set({ [key]: v } as Partial<Form>)} />
                  <Counted
                    id={`banner-${key}-alt`}
                    label="사진 설명 (화면 낭독용)"
                    value={form[altKey]}
                    max={HERO_LIMITS.alt}
                    placeholder="예: 네이비 자켓을 입은 모델"
                    onChange={(v) => set({ [altKey]: v } as Partial<Form>)}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 3 문구 · 버튼 ── */}
      <section aria-label="배너 문구" className="border-subtle bg-surface border p-6 md:p-8">
        <h3 className="text-primary text-base font-semibold">문구 · 버튼</h3>
        <p className="text-muted text-2xs mt-1">
          {productText
            ? "비워 두면 상품 정보(분류 · 이름 · 가격 · 상품 페이지)가 나갑니다. 적은 줄만 그 문구로 바뀝니다."
            : "비운 줄은 화면에 나오지 않습니다."}{" "}
          맨 위 「운동으로 달라진 체형을 위한 남성 기성복」은 그대로입니다.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Counted id="banner-eyebrow" label="작은 줄 (제목 위)" value={form.eyebrow} max={HERO_LIMITS.eyebrow} placeholder={productText ? "비우면 분류 · 라인" : "예: 26FW COLLECTION"} onChange={(v) => set({ eyebrow: v })} />
          <Counted id="banner-title" label="큰 제목" value={form.title} max={HERO_LIMITS.title} placeholder={productText ? "비우면 상품 이름" : "예: 가을 아우터"} onChange={(v) => set({ title: v })} />
          <Counted id="banner-subtitle" label="제목 아래 줄" value={form.subtitle} max={HERO_LIMITS.subtitle} placeholder={productText ? "비우면 가격" : ""} onChange={(v) => set({ subtitle: v })} />
          <Counted id="banner-cta-label" label="버튼 글자" value={form.ctaLabel} max={HERO_LIMITS.ctaLabel} placeholder="비우면 「자세히 보기」" onChange={(v) => set({ ctaLabel: v })} />
          <div className="md:col-span-2">
            <Counted
              id="banner-cta-url"
              label="버튼 주소"
              value={form.ctaUrl}
              max={HERO_LIMITS.ctaUrl}
              placeholder={productText ? "비우면 상품 페이지" : "예: /category/jacket/  (비우면 전체 제품)"}
              hint="사이트 안 주소는 /로 시작합니다. 바깥 주소는 https://로 시작하고 새 창으로 열립니다."
              onChange={(v) => set({ ctaUrl: v })}
            />
            {!urlOk && (
              <p role="alert" className="text-error text-2xs mt-1.5">
                /로 시작하는 사이트 안 주소나 https:// 주소만 쓸 수 있습니다.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── 4 미리보기 ── */}
      <HeroBannerPreview slide={slide} emptyText={emptyText} />

      {/* ── 5 노출 · 저장 ── */}
      <div className="border-subtle bg-surface flex flex-col gap-5 border p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <label className="text-primary inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={form.visible} onChange={(e) => set({ visible: e.target.checked })} className="accent-accent h-4 w-4" />
          메인에 노출
          <span className="text-muted text-2xs">끄면 저장만 하고 손님 화면에는 나가지 않습니다</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="border-subtle text-secondary hover:border-accent hover:text-accent ease-fluid inline-flex min-h-12 items-center border px-6 text-sm transition-colors duration-300"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={busy}
            className="bg-primary hover:bg-accent ease-fluid inline-flex min-h-12 items-center px-8 text-sm text-white transition-colors duration-300 disabled:opacity-60"
          >
            {busy ? "저장하는 중" : banner ? "저장" : "등록"}
          </button>
        </div>
      </div>
      {error && <Notice tone="error" text={error} />}
    </form>
  );
}

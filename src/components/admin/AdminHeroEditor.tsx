"use client";

import { ArrowSquareOut, CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { AdminSiteImagesEditor } from "@/components/admin/AdminSiteImagesEditor";
import { siteImageGroup } from "@/data/siteImageGroups";
import { listProducts, type AdminProductRow } from "@/lib/admin";
import { HERO_CTA_URL, HERO_LIMITS, adminHero, saveHero, type HeroMode } from "@/lib/console";
import { SHOP_CONNECTED, ShopError } from "@/lib/shop";

/**
 * 메인 배너 — 배너를 무엇으로 채울지 고른다 (2026-10-12 "배너 따로 관리, 옵션 선택처럼". 서버 hero_config V24).
 *
 *   자동        메인 구성(진열 순서) 맨 앞 상품 — 지금까지의 방식
 *   상품 지정    고른 공개 상품 하나
 *   직접 올리기  아래 사진(사이트 사진 칸 HERO_*)과 문구 · 버튼
 *
 * 고른 상품이 비공개가 되거나 직접 올리기인데 인물 사진이 없으면 손님 화면은 자동으로 돌아간다 — 배너가 비지 않는다.
 * 저장하면 손님 화면을 다시 만든다(1~3분). 사진은 아래 "직접 올리기 사진" 의 저장 버튼으로 따로 저장한다.
 */

const MODES: { value: HeroMode; title: string; desc: string }[] = [
  {
    value: "AUTO",
    title: "자동",
    desc: "메인 구성(진열 순서)의 맨 앞 상품이 배너가 됩니다. 그 상품의 누끼샷 · 착용샷 · 디테일컷과 이름 · 가격이 나갑니다.",
  },
  {
    value: "PRODUCT",
    title: "상품 지정",
    desc: "고른 상품 하나를 진열 순서와 상관없이 배너로 겁니다. 그 상품이 비공개가 되면 자동으로 돌아갑니다.",
  },
  {
    value: "CUSTOM",
    title: "직접 올리기",
    desc: "아래에 올린 사진과 문구로 배너를 만듭니다. 시즌 화보에 맞습니다. 인물 사진이 없으면 자동으로 돌아갑니다.",
  },
];

interface Form {
  mode: HeroMode;
  productId: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
}

type State = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready" };

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

export function AdminHeroEditor() {
  const [state, setState] = useState<State>(
    SHOP_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );
  const [form, setForm] = useState<Form>({ mode: "AUTO", productId: "", eyebrow: "", title: "", subtitle: "", ctaLabel: "", ctaUrl: "" });
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    Promise.all([adminHero(), listProducts()])
      .then(([hero, list]) => {
        if (!alive) return;
        setForm({
          mode: hero.mode,
          productId: hero.productId ?? "",
          eyebrow: hero.eyebrow,
          title: hero.title,
          subtitle: hero.subtitle,
          ctaLabel: hero.ctaLabel,
          ctaUrl: hero.ctaUrl,
        });
        // 배너로 걸 수 있는 건 공개 상품뿐이다(서버도 막는다). 진열 순서대로
        setProducts(list.filter((p) => p.status === "PUBLISHED").sort((a, b) => a.displayOrder - b.displayOrder));
        setState({ kind: "ready" });
      })
      .catch((e) => {
        if (!alive) return;
        const code = e instanceof ShopError ? (e.status === 401 ? "UNAUTHENTICATED" : e.status === 403 ? "FORBIDDEN" : e.code) : "UNKNOWN";
        setState({ kind: "error", code, message: e instanceof ShopError ? e.message : "불러오지 못했습니다." });
      });
    return () => {
      alive = false;
    };
  }, []);

  if (state.kind === "loading") return <p aria-busy="true" className="text-muted text-sm">불러오는 중</p>;
  if (state.kind === "error") return <ErrorNotice code={state.code} message={state.message} />;

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const urlOk = HERO_CTA_URL.test(form.ctaUrl.trim());
  const productMissing = form.mode === "PRODUCT" && !form.productId;
  const banner = siteImageGroup("banner")!;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (productMissing) {
      setResult({ tone: "error", text: "배너로 걸 상품을 골라 주세요." });
      return;
    }
    if (!urlOk) {
      setResult({ tone: "error", text: "버튼 주소는 /로 시작하는 사이트 안 주소나 https:// 주소만 쓸 수 있습니다." });
      return;
    }
    setBusy(true);
    try {
      const saved = await saveHero({
        mode: form.mode,
        productId: form.mode === "PRODUCT" ? form.productId : null,
        eyebrow: form.eyebrow.trim(),
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        ctaLabel: form.ctaLabel.trim(),
        ctaUrl: form.ctaUrl.trim(),
      });
      set({ mode: saved.mode, productId: saved.productId ?? "" });
      setResult({ tone: "ok", text: "저장했습니다. 손님 화면은 1~3분 뒤에 바뀝니다." });
    } catch (err) {
      setResult({ tone: "error", text: err instanceof ShopError ? err.message : "저장하지 못했습니다." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <form onSubmit={submit} noValidate className="flex flex-col gap-8">
        {/* ── 배너 방식 ── */}
        <fieldset className="border-subtle bg-surface border p-6 md:p-8">
          <legend className="text-primary px-1 text-base font-semibold">배너 방식</legend>
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            {MODES.map((m) => {
              const on = form.mode === m.value;
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
                      name="hero-mode"
                      value={m.value}
                      checked={on}
                      onChange={() => set({ mode: m.value })}
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

        {/* ── 상품 지정 ── */}
        {form.mode === "PRODUCT" && (
          <section aria-label="배너 상품" className="border-subtle bg-surface border p-6 md:p-8">
            <label htmlFor="hero-product" className="text-primary text-base font-semibold">
              배너 상품
            </label>
            <p className="text-muted text-2xs mt-1">
              공개된 상품만 고를 수 있습니다. 누끼샷 · 착용샷 · 디테일컷이 있으면 배너가 가장 잘 나옵니다(상품 관리 → 사진).
            </p>
            {products.length === 0 ? (
              <p className="text-error mt-4 text-sm">공개된 상품이 없습니다. 상품을 먼저 공개해 주세요.</p>
            ) : (
              <select
                id="hero-product"
                value={form.productId}
                onChange={(e) => set({ productId: e.target.value })}
                className={`${field} mt-4 max-w-xl`}
              >
                <option value="">상품을 고르세요</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {(p.name ?? "이름 없음") + " · " + p.slug}
                  </option>
                ))}
              </select>
            )}
          </section>
        )}

        {/* ── 직접 올리기 문구 ── */}
        {form.mode === "CUSTOM" && (
          <section aria-label="배너 문구" className="border-subtle bg-surface border p-6 md:p-8">
            <h2 className="text-primary text-base font-semibold">배너 문구 · 버튼</h2>
            <p className="text-muted text-2xs mt-1">비운 줄은 화면에 나오지 않습니다. 맨 위 「운동으로 달라진 체형을 위한 남성 기성복」은 그대로입니다.</p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Counted id="hero-eyebrow" label="작은 줄 (이름 위)" value={form.eyebrow} max={HERO_LIMITS.eyebrow} placeholder="예: 26FW COLLECTION" onChange={(v) => set({ eyebrow: v })} />
              <Counted id="hero-title" label="큰 제목" value={form.title} max={HERO_LIMITS.title} placeholder="예: 가을 아우터" onChange={(v) => set({ title: v })} />
              <Counted id="hero-subtitle" label="제목 아래 줄" value={form.subtitle} max={HERO_LIMITS.subtitle} onChange={(v) => set({ subtitle: v })} />
              <Counted id="hero-cta-label" label="버튼 글자" value={form.ctaLabel} max={HERO_LIMITS.ctaLabel} placeholder="비우면 '자세히 보기'" onChange={(v) => set({ ctaLabel: v })} />
              <div className="md:col-span-2">
                <Counted
                  id="hero-cta-url"
                  label="버튼 주소"
                  value={form.ctaUrl}
                  max={HERO_LIMITS.ctaUrl}
                  placeholder="예: /category/jacket/  (비우면 전체 제품)"
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
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="bg-primary hover:bg-accent ease-fluid inline-flex min-h-12 items-center px-8 text-sm text-white transition-colors duration-300 disabled:opacity-60"
          >
            {busy ? "저장하는 중" : "배너 방식 저장"}
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:text-accent ease-fluid inline-flex min-h-11 items-center gap-1.5 text-xs underline underline-offset-4 transition-colors duration-300"
          >
            손님 화면 보기
            <ArrowSquareOut size={12} weight="light" aria-hidden="true" />
            <span className="sr-only">(새 창)</span>
          </a>
          {result && (
            <p
              role={result.tone === "error" ? "alert" : "status"}
              className={`text-2xs flex gap-1.5 leading-relaxed ${result.tone === "ok" ? "text-success" : "text-error"}`}
            >
              {result.tone === "ok" ? (
                <CheckCircle size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
              ) : (
                <Warning size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
              )}
              <span>{result.text}</span>
            </p>
          )}
        </div>
      </form>

      {/* ── 직접 올리기 사진 — 저장 버튼이 따로다 ── */}
      {form.mode === "CUSTOM" && (
        <section aria-label="직접 올리기 사진" className="flex flex-col gap-3">
          <p className="text-secondary text-xs">사진은 아래 저장 버튼으로 따로 저장합니다. 배너 방식이 「직접 올리기」로 저장돼 있어야 손님 화면에 나갑니다.</p>
          <AdminSiteImagesEditor group={banner} />
        </section>
      )}
    </div>
  );
}

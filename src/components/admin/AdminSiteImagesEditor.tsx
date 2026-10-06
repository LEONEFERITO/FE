"use client";

import { ArrowSquareOut, CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { ImageField, type ImageFieldValue } from "@/components/admin/ImageField";
import type { SiteImageGroup } from "@/data/siteImageGroups";
import { SITE_IMAGE_LIMITS, adminSiteImages, saveSiteImage, type SiteImageAdminView, type SiteImageSlot } from "@/lib/console";
import { SHOP_CONNECTED, ShopError } from "@/lib/shop";

/**
 * 사이트 사진 편집 — 한 묶음(data/siteImageGroups.ts)의 칸들을 한 화면에서 바꾼다.
 * 매장 사진 · 라인 페이지 · 룩북 · 브랜드 · 메인 라인 카드가 전부 이 하나로 그려진다.
 *
 * 저장은 화면 단위다 — 묶음의 칸을 차례로 보낸다. 하나가 실패하면 거기서 멈추고 알린다(앞 칸은 저장된 채다).
 * 저장하면 손님 화면을 다시 만든다(1~2분). 비운 칸은 손님 화면에서 묶음 설명에 적힌 대체 사진으로 돌아간다.
 */

interface Cell {
  image: ImageFieldValue | null;
  alt: string;
}

type State = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready" };

const COLS: Record<SiteImageGroup["columns"], string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
};

export function AdminSiteImagesEditor({ group }: { group: SiteImageGroup }) {
  const slots = group.sections.flatMap((s) => s.slots.map((x) => x.slot));
  const [state, setState] = useState<State>(
    SHOP_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );
  const [cells, setCells] = useState<Partial<Record<SiteImageSlot, Cell>>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  function toCell(v: SiteImageAdminView | undefined): Cell {
    return {
      image: v?.mediaId && v.imageUrl ? { mediaId: v.mediaId, url: v.imageUrl, filename: "등록된 사진" } : null,
      alt: v?.alt ?? "",
    };
  }

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    adminSiteImages()
      .then((list) => {
        if (!alive) return;
        const next: Partial<Record<SiteImageSlot, Cell>> = {};
        for (const slot of slots) next[slot] = toCell(list.find((v) => v.slot === slot));
        setCells(next);
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
    // slots 는 group 에서 나오는 고정 목록이다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.key]);

  if (state.kind === "loading") return <p aria-busy="true" className="text-muted text-sm">불러오는 중</p>;
  if (state.kind === "error") return <ErrorNotice code={state.code} message={state.message} />;

  const update = (slot: SiteImageSlot, patch: Partial<Cell>) =>
    setCells((c) => ({ ...c, [slot]: { ...(c[slot] ?? { image: null, alt: "" }), ...patch } }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setBusy(true);
    try {
      for (const slot of slots) {
        const cell = cells[slot] ?? { image: null, alt: "" };
        const saved = await saveSiteImage(slot, { mediaId: cell.image?.mediaId ?? null, alt: cell.alt.trim() });
        update(slot, toCell(saved));
      }
      setResult({ tone: "ok", text: "저장했습니다. 손님 화면은 1~2분 뒤에 바뀝니다." });
    } catch (err) {
      setResult({ tone: "error", text: err instanceof ShopError ? err.message : "저장하지 못했습니다." });
    } finally {
      setBusy(false);
    }
  }

  const field = "border-interactive focus-visible:border-accent text-primary border bg-transparent px-3 text-xs";

  return (
    <form id="site-images-form" onSubmit={submit} noValidate className="flex flex-col gap-12">
      {group.sections.map((section) => (
        <section key={section.title} aria-label={section.title} className="border-subtle bg-surface border p-6 md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-primary text-base font-semibold">{section.title}</h2>
            {section.description && <p className="text-muted text-2xs">{section.description}</p>}
          </div>
          <ol className={`mt-6 grid gap-6 ${COLS[group.columns]}`}>
            {section.slots.map((spec) => {
              const cell = cells[spec.slot] ?? { image: null, alt: "" };
              return (
                <li key={spec.slot} className="flex min-w-0 flex-col gap-2">
                  <ImageField label={spec.label} hint={spec.hint} aspect={spec.aspect} value={cell.image} onChange={(v) => update(spec.slot, { image: v })} />
                  <label htmlFor={`${spec.slot}-alt`} className="sr-only">
                    {spec.label} 사진 설명
                  </label>
                  <input
                    id={`${spec.slot}-alt`}
                    value={cell.alt}
                    maxLength={SITE_IMAGE_LIMITS.alt}
                    onChange={(e) => update(spec.slot, { alt: e.target.value })}
                    placeholder="사진 설명 (선택 — 화면을 읽어 주는 기기가 읽습니다)"
                    className={`${field} placeholder:text-muted/70 min-h-11`}
                  />
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="bg-primary hover:bg-accent ease-fluid inline-flex min-h-12 items-center px-8 text-sm text-white transition-colors duration-300 disabled:opacity-60"
        >
          {busy ? "저장하는 중" : "저장하기"}
        </button>
        <a
          href={group.previewHref}
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
  );
}

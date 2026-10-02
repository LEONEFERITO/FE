"use client";

import { ArrowDown, ArrowUp, CheckCircle, Plus, Warning, X } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { ImageField, type ImageFieldValue } from "@/components/admin/ImageField";
import { WHY_LIMITS, adminWhy, saveWhy, type WhyAdminItem, type WhyAdminView } from "@/lib/console";
import { SHOP_CONNECTED, ShopError } from "@/lib/shop";

/**
 * 메인 WHY 구간 편집 — 제목 · 소개 · 항목(제목 · 설명 · 배경 사진) 2~5개.
 *
 * 손님 화면은 화면을 붙잡아 두고 스크롤로 항목을 넘기는 구간이다(WhyScroll). 항목이 켜질 때 그 항목의
 * 배경 사진이 서서히 바뀐다. 사진이 없는 항목은 기본 배경(줄자로 재는 장면)을 쓴다.
 * 저장은 통째로 — 순서 · 추가 · 삭제가 한 번의 저장이다. 저장하면 손님 화면을 다시 만든다(1~2분).
 *
 * 오른쪽 미리보기는 "켜진 항목" 한 상태를 보여 준다 — 사진 위에 글자가 읽히는지 저장 전에 본다.
 */

type State = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready" };

interface Row extends WhyAdminItem {
  image: ImageFieldValue | null;
}

export function AdminWhyEditor() {
  const [state, setState] = useState<State>(
    SHOP_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );
  const [eyebrow, setEyebrow] = useState("");
  const [title, setTitle] = useState("");
  const [intro, setIntro] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [preview, setPreview] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  function apply(v: WhyAdminView) {
    setEyebrow(v.eyebrow);
    setTitle(v.title);
    setIntro(v.intro);
    setRows(
      v.items.map((i) => ({
        ...i,
        image: i.mediaId && i.imageUrl ? { mediaId: i.mediaId, url: i.imageUrl, filename: "등록된 사진" } : null,
      })),
    );
  }

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    adminWhy()
      .then((v) => {
        if (!alive) return;
        apply(v);
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

  function setRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  }

  function move(i: number, d: number) {
    const to = i + d;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    [next[i], next[to]] = [next[to], next[i]];
    setRows(next);
    setPreview(to);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (!eyebrow.trim() || !title.trim() || !intro.trim()) {
      setResult({ tone: "error", text: "작은 제목 · 제목 · 소개를 넣어 주세요." });
      return;
    }
    if (rows.length < WHY_LIMITS.minItems || rows.some((r) => !r.title.trim() || !r.body.trim())) {
      setResult({ tone: "error", text: `항목은 ${WHY_LIMITS.minItems}개 이상이고, 제목과 설명이 모두 있어야 합니다.` });
      return;
    }
    setBusy(true);
    try {
      apply(
        await saveWhy({
          eyebrow: eyebrow.trim(),
          title: title.trim(),
          intro: intro.trim(),
          items: rows.map((r) => ({ title: r.title.trim(), body: r.body.trim(), mediaId: r.image?.mediaId ?? null })),
        }),
      );
      setResult({ tone: "ok", text: "저장했습니다. 손님 화면은 1~2분 뒤에 바뀝니다." });
    } catch (err) {
      setResult({ tone: "error", text: err instanceof ShopError ? err.message : "저장하지 못했습니다." });
    } finally {
      setBusy(false);
    }
  }

  const field = "border-interactive focus-visible:border-accent text-primary rounded-xl border bg-transparent px-4 text-sm";
  const shown = rows[Math.min(preview, rows.length - 1)];

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
      <div className="flex min-w-0 flex-col gap-8">
        <fieldset className="flex flex-col gap-5">
          <legend className="text-primary mb-4 text-sm font-medium">제목</legend>
          <div className="flex flex-col gap-2">
            <label htmlFor="why-eyebrow" className="text-secondary text-2xs">작은 제목 (영문 라벨)</label>
            <input id="why-eyebrow" value={eyebrow} maxLength={WHY_LIMITS.eyebrow} onChange={(e) => setEyebrow(e.target.value)} className={`${field} min-h-12`} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="why-title" className="text-secondary text-2xs">제목</label>
            <input id="why-title" value={title} maxLength={WHY_LIMITS.title} onChange={(e) => setTitle(e.target.value)} className={`${field} min-h-12`} />
            <p className="text-muted text-2xs">{title.length} / {WHY_LIMITS.title}</p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="why-intro" className="text-secondary text-2xs">소개 (데스크톱에서만 보입니다 — 모바일은 제목과 항목만)</label>
            <textarea id="why-intro" value={intro} maxLength={WHY_LIMITS.intro} rows={3} onChange={(e) => setIntro(e.target.value)} className={`${field} py-3 leading-relaxed`} />
            <p className="text-muted text-2xs">{intro.length} / {WHY_LIMITS.intro}</p>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="text-primary mb-2 text-sm font-medium">
            항목 <span className="text-muted text-2xs font-normal">({WHY_LIMITS.minItems}~{WHY_LIMITS.maxItems}개 · 스크롤할 때 위에서부터 하나씩 켜집니다)</span>
          </legend>
          <ol className="flex flex-col gap-4">
            {rows.map((r, i) => (
              <li key={i} className={`rounded-2xl border p-5 ${i === preview ? "border-accent bg-surface" : "border-subtle bg-surface/60"}`}>
                <div className="flex items-start gap-3">
                  <button type="button" onClick={() => setPreview(i)} aria-label={`${i + 1}번 미리보기`}
                    className={`text-2xs tracking-label mt-3 w-6 shrink-0 text-right tabular-nums ${i === preview ? "text-accent" : "text-muted"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </button>
                  <div className="grid min-w-0 flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
                    <div className="flex min-w-0 flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor={`why-t-${i}`} className="text-secondary text-2xs">제목</label>
                        <input id={`why-t-${i}`} value={r.title} maxLength={WHY_LIMITS.itemTitle} onFocus={() => setPreview(i)}
                          onChange={(e) => setRow(i, { title: e.target.value })} className={`${field} min-h-11`} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor={`why-b-${i}`} className="text-secondary text-2xs">설명</label>
                        <textarea id={`why-b-${i}`} value={r.body} maxLength={WHY_LIMITS.itemBody} rows={3} onFocus={() => setPreview(i)}
                          onChange={(e) => setRow(i, { body: e.target.value })} className={`${field} py-2.5 leading-relaxed`} />
                        <p className="text-muted text-2xs">{r.body.length} / {WHY_LIMITS.itemBody}</p>
                      </div>
                    </div>
                    <ImageField label="배경 사진" hint="가로 사진. 없으면 기본 배경." aspect="wide"
                      value={r.image} onChange={(next) => setRow(i, { image: next })} />
                  </div>
                  <div className="flex shrink-0 flex-col">
                    <button type="button" aria-label={`${i + 1}번 위로`} disabled={i === 0} onClick={() => move(i, -1)}
                      className="text-secondary hover:text-accent inline-flex h-11 w-11 items-center justify-center disabled:opacity-30">
                      <ArrowUp size={15} weight="light" aria-hidden="true" />
                    </button>
                    <button type="button" aria-label={`${i + 1}번 아래로`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}
                      className="text-secondary hover:text-accent inline-flex h-11 w-11 items-center justify-center disabled:opacity-30">
                      <ArrowDown size={15} weight="light" aria-hidden="true" />
                    </button>
                    <button type="button" aria-label={`${i + 1}번 빼기`} disabled={rows.length <= WHY_LIMITS.minItems}
                      onClick={() => { setRows(rows.filter((_, k) => k !== i)); setPreview(0); }}
                      className="text-muted hover:text-error inline-flex h-11 w-11 items-center justify-center disabled:opacity-30">
                      <X size={15} weight="light" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          {rows.length < WHY_LIMITS.maxItems && (
            <button type="button" onClick={() => { setRows([...rows, { id: null, title: "", body: "", mediaId: null, imageUrl: null, image: null }]); setPreview(rows.length); }}
              className="border-interactive text-primary hover:border-accent ease-fluid inline-flex min-h-12 w-fit items-center gap-2 rounded-full border px-6 text-sm transition-colors duration-300">
              <Plus size={15} weight="light" aria-hidden="true" />
              항목 추가
            </button>
          )}
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy}
            className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center rounded-full px-8 text-sm transition-colors duration-300 disabled:opacity-60">
            {busy ? "저장하는 중" : "저장"}
          </button>
          {result && (
            <p role={result.tone === "error" ? "alert" : "status"}
              className={`text-2xs flex gap-1.5 leading-relaxed ${result.tone === "ok" ? "text-success" : "text-error"}`}>
              {result.tone === "ok"
                ? <CheckCircle size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
                : <Warning size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />}
              <span>{result.text}</span>
            </p>
          )}
        </div>
      </div>

      {/* 미리보기 — 켜진 항목 한 상태. 사진 위에 글자가 읽히는지 본다. */}
      <aside className="h-fit lg:sticky lg:top-24">
        <p className="text-muted text-2xs">미리보기 · {shown ? `${preview + 1}번이 켜진 상태` : "항목 없음"} (데스크톱 비율)</p>
        <div className="bg-band border-subtle relative mt-2 aspect-[16/10] overflow-hidden rounded-2xl border">
          {shown?.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={shown.image.url} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, var(--bg-subtle) 0%, var(--bg-subtle) 42%, color-mix(in srgb, var(--bg-subtle) 82%, transparent) 56%, color-mix(in srgb, var(--bg-subtle) 42%, transparent) 70%, transparent 96%)" }} />
          <div className="relative flex h-full flex-col justify-center p-5">
            <p className="text-accent text-[9px] tracking-[0.2em]">{eyebrow || "EYEBROW"}</p>
            <p className="font-display text-primary mt-1 text-base leading-snug">{title || "제목"}</p>
            <ol className="mt-3 flex max-w-[60%] flex-col">
              {rows.map((r, i) => (
                <li key={i} className="border-subtle border-t py-1.5">
                  <p className={`font-display text-xs ${i === preview ? "text-primary" : "text-primary/50"}`}>{r.title || `항목 ${i + 1}`}</p>
                  {i === preview && <p className="text-secondary mt-1 line-clamp-3 text-[10px] leading-relaxed">{r.body}</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </aside>
    </form>
  );
}

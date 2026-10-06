"use client";

import { ArrowDown, ArrowUp, CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { ADMIN_CONNECTED, listProducts, type AdminProductRow } from "@/lib/admin";
import { reorderProducts } from "@/lib/console";
import { ShopError, won } from "@/lib/shop";

/**
 * 메인 구성 · 진열 순서.
 *
 * 공개 상품을 손님에게 보일 순서로 놓는다. 메인 첫 화면은 이 순서에서 **대표 사진이 있는 앞의 4개**,
 * 제품 목록도 이 순서다. 저장하면 손님 화면을 다시 만든다(1~2분).
 * 옮긴 뒤 "저장" 을 눌러야 남는다. 그 사이 다른 관리자가 상품을 공개·비공개하면 서버가 거절하고 새로 불러온다.
 */

type State = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready"; items: AdminProductRow[] };

const MAIN_SLOTS = 4;

export function AdminDisplayOrder() {
  const [state, setState] = useState<State>(
    ADMIN_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );
  const [order, setOrder] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const fetchPublished = useCallback(async (): Promise<State> => {
    try {
      const all = await listProducts();
      const published = all
        .filter((p) => p.status === "PUBLISHED")
        .sort((a, b) => a.displayOrder - b.displayOrder || Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
      return { kind: "ready", items: published };
    } catch (e) {
      const status = (e as { status?: number }).status;
      return {
        kind: "error",
        code: status === 401 ? "UNAUTHENTICATED" : status === 403 ? "FORBIDDEN" : "UNKNOWN",
        message: e instanceof Error ? e.message : "불러오지 못했습니다.",
      };
    }
  }, []);

  useEffect(() => {
    if (!ADMIN_CONNECTED) return;
    let alive = true;
    fetchPublished().then((s) => alive && setState(s));
    return () => {
      alive = false;
    };
  }, [fetchPublished]);

  if (state.kind === "loading") return <p aria-busy="true" className="text-muted text-sm">불러오는 중</p>;
  if (state.kind === "error") return <ErrorNotice code={state.code} message={state.message} />;

  const byId = new Map(state.items.map((p) => [p.id, p]));
  const ids = order ?? state.items.map((p) => p.id);
  const rows = ids.map((id) => byId.get(id)!).filter(Boolean);
  const moved = order !== null && order.some((id, i) => id !== state.items[i]?.id);
  // 메인에 나오는 4개 — 사진이 있는 것만 센다 (메인 화면과 같은 규칙)
  const mainIds = new Set(rows.filter((p) => p.mainImageUrl).slice(0, MAIN_SLOTS).map((p) => p.id));

  function move(index: number, delta: number) {
    const next = [...ids];
    const to = index + delta;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    setOrder(next);
    setResult(null);
  }

  async function save() {
    setBusy(true);
    setResult(null);
    try {
      await reorderProducts(ids);
      setState(await fetchPublished());
      setOrder(null);
      setResult({ tone: "ok", text: "저장했습니다. 손님 화면은 1~2분 뒤에 바뀝니다." });
    } catch (e) {
      setResult({ tone: "error", text: e instanceof ShopError ? e.message : "저장하지 못했습니다." });
      if (e instanceof ShopError && e.code === "STALE_LIST") {
        setState(await fetchPublished());
        setOrder(null);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="border-subtle bg-surface rounded-2xl border px-5 py-4 text-sm">
        <span className="text-secondary">메인의 WHY 구간(제목 · 항목 · 배경 사진)과 사이트 사진(메인 라인 카드 · 라인 페이지 · 룩북 · 브랜드 · 매장)은 왼쪽 메뉴에서 따로 고칩니다 → </span>
        <Link href="/admin/display/why/" className="text-accent underline underline-offset-4">메인 WHY 구간</Link>
        <span aria-hidden="true" className="text-muted"> · </span>
        <Link href="/admin/display/main-lines/" className="text-accent underline underline-offset-4">사이트 사진</Link>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={!moved || busy} onClick={save}
          className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center rounded-full px-6 text-sm transition-colors duration-300 disabled:opacity-50">
          {busy ? "저장하는 중" : "순서 저장"}
        </button>
        {moved && (
          <button type="button" onClick={() => setOrder(null)} className="text-muted min-h-11 text-xs underline underline-offset-4">되돌리기</button>
        )}
      </div>

      {result && (
        <p role={result.tone === "error" ? "alert" : "status"}
          className={`text-2xs flex gap-1.5 leading-relaxed ${result.tone === "ok" ? "text-success" : "text-error"}`}>
          {result.tone === "ok"
            ? <CheckCircle size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
            : <Warning size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />}
          <span>{result.text}</span>
        </p>
      )}

      {rows.length === 0 ? (
        <div className="border-subtle bg-band/60 rounded-2xl border px-6 py-12 text-center">
          <p className="text-primary text-sm">공개된 상품이 없습니다.</p>
          <Link href="/admin/products/" className="text-accent text-2xs mt-2 inline-block underline underline-offset-4">상품 관리로</Link>
        </div>
      ) : (
        <ol className="border-subtle divide-subtle divide-y border-y">
          {rows.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 py-2">
              <span className="text-muted text-2xs w-6 shrink-0 text-right tabular-nums">{i + 1}</span>
              <div className="flex shrink-0">
                <button type="button" aria-label={`${p.name ?? "상품"} 위로`} disabled={i === 0} onClick={() => move(i, -1)}
                  className="text-secondary hover:text-accent inline-flex h-11 w-11 items-center justify-center disabled:opacity-30">
                  <ArrowUp size={15} weight="light" aria-hidden="true" />
                </button>
                <button type="button" aria-label={`${p.name ?? "상품"} 아래로`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}
                  className="text-secondary hover:text-accent inline-flex h-11 w-11 items-center justify-center disabled:opacity-30">
                  <ArrowDown size={15} weight="light" aria-hidden="true" />
                </button>
              </div>
              <div className="bg-velvet aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-md">
                {p.mainImageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={p.mainImageUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-primary truncate text-sm">{p.name ?? "(이름 없음)"}</p>
                <p className="text-muted text-2xs">
                  {p.priceKrw != null ? won(p.priceKrw) : "가격 없음"}
                  {!p.mainImageUrl && " · 사진이 없어 메인에는 안 나옵니다"}
                </p>
              </div>
              {mainIds.has(p.id) && (
                <span className="border-accent text-accent text-2xs shrink-0 rounded-full border px-2.5 py-0.5">메인</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

"use client";

import { ArrowDown, ArrowUp, CheckCircle, Plus, Trash, Warning } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { adminSiteGuide, saveSiteGuide, type SiteGuide } from "@/lib/console";
import { SHOP_CONNECTED, ShopError } from "@/lib/shop";

/**
 * 가이드 페이지 "제품별 제작 소요기간" 표 편집 (서버 V42, 2026-10-28 디자이너 "제작 소요기간이 바뀌어서 관리자에서").
 *
 * 한 줄 = 품목 · 기간. 줄을 더하고 · 지우고 · 위아래로 옮긴 뒤 한 번에 저장한다.
 * 길이 · 줄 수는 서버(SiteBusinessController.GuideInput)와 같다 — 1~12줄, 품목 60자, 기간 30자.
 * 오른쪽은 가이드 페이지에 나갈 표 모양 그대로.
 */

type Row = SiteGuide["leadTimes"][number];
type State = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready" };

const MAX_ROWS = 12;

export function AdminGuideEditor() {
  const [state, setState] = useState<State>(
    SHOP_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    adminSiteGuide()
      .then((v) => {
        if (!alive) return;
        setRows(v.leadTimes);
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

  const trimmed = rows.map((r) => ({ items: r.items.trim(), time: r.time.trim() }));
  const problems = trimmed.map((r) => ({ items: !r.items, time: !r.time }));
  const hasProblem = trimmed.length === 0 || problems.some((p) => p.items || p.time);

  function change(i: number, key: keyof Row, value: string) {
    // 칸 구분에 쓰는 탭 · 줄바꿈은 들어오지 않게(붙여넣기 대비)
    const clean = value.replace(/[\t\r\n]+/g, " ");
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, [key]: clean } : r)));
  }
  function move(i: number, d: -1 | 1) {
    setRows((prev) => {
      const next = [...prev];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (hasProblem) {
      setResult({ tone: "error", text: trimmed.length === 0 ? "한 줄 이상 적어 주세요." : "빨간 칸을 채워 주세요." });
      return;
    }
    setBusy(true);
    try {
      const saved = await saveSiteGuide({ leadTimes: trimmed });
      setRows(saved.leadTimes);
      setResult({ tone: "ok", text: "저장했습니다. 손님 화면(가이드 페이지)은 1~2분 뒤에 바뀝니다." });
    } catch (err) {
      setResult({ tone: "error", text: err instanceof ShopError ? err.message : "저장하지 못했습니다." });
    } finally {
      setBusy(false);
    }
  }

  const field = "border-interactive focus-visible:border-accent text-primary min-h-12 w-full rounded-xl border bg-transparent px-4 text-sm";
  const iconBtn =
    "text-secondary hover:text-primary hover:bg-band ease-fluid inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-200 disabled:opacity-30";
  const showErrors = result?.tone === "error";

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div className="flex min-w-0 flex-col gap-6">
        <ol className="flex flex-col gap-3">
          {rows.map((r, i) => (
            <li key={i} className="border-subtle flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-end">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <label htmlFor={`lt-items-${i}`} className="text-secondary text-2xs">
                  {i + 1}번 줄 · 품목
                </label>
                <input
                  id={`lt-items-${i}`}
                  value={r.items}
                  maxLength={60}
                  placeholder="자켓 / 팬츠 / 베스트"
                  onChange={(e) => change(i, "items", e.target.value)}
                  aria-invalid={showErrors && problems[i]?.items ? true : undefined}
                  className={`${field} ${showErrors && problems[i]?.items ? "border-error" : ""}`}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5 md:w-44">
                <label htmlFor={`lt-time-${i}`} className="text-secondary text-2xs">
                  기간
                </label>
                <input
                  id={`lt-time-${i}`}
                  value={r.time}
                  maxLength={30}
                  placeholder="14~18일"
                  onChange={(e) => change(i, "time", e.target.value)}
                  aria-invalid={showErrors && problems[i]?.time ? true : undefined}
                  className={`${field} ${showErrors && problems[i]?.time ? "border-error" : ""}`}
                />
              </div>
              <div className="flex items-center gap-1 self-end">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`${i + 1}번 줄 위로`} className={iconBtn}>
                  <ArrowUp size={16} weight="light" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`${i + 1}번 줄 아래로`} className={iconBtn}>
                  <ArrowDown size={16} weight="light" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                  disabled={rows.length <= 1}
                  aria-label={`${i + 1}번 줄 지우기`}
                  className={`${iconBtn} hover:text-error`}
                >
                  <Trash size={16} weight="light" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, { items: "", time: "" }])}
          disabled={rows.length >= MAX_ROWS}
          className="border-interactive text-primary hover:border-accent ease-fluid inline-flex min-h-11 w-fit items-center gap-2 rounded-full border px-5 text-sm transition-colors duration-200 disabled:opacity-40"
        >
          <Plus size={14} weight="light" aria-hidden="true" />
          줄 더하기
          <span className="text-muted text-2xs">
            ({rows.length}/{MAX_ROWS})
          </span>
        </button>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center rounded-full px-8 text-sm transition-colors duration-300 disabled:opacity-60"
          >
            {busy ? "저장하는 중" : "저장"}
          </button>
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
      </div>

      {/* 미리보기 — 가이드 페이지 Made To Order 표 모양 그대로 */}
      <aside className="h-fit lg:sticky lg:top-24">
        <p className="text-muted text-2xs">미리보기 · 가이드 페이지 «제품별 오더 후, 제작 소요기간 안내»</p>
        <table className="mt-3 w-full border-collapse border-t-2 border-[#5E1F21] text-center text-[13px]">
          <tbody>
            {trimmed.map((r, i) => (
              <tr key={i} className="border-b border-[#E3E3E3]">
                <th scope="row" className={`w-1/2 bg-[#D9D9D9] py-2.5 font-bold ${r.items ? "" : "text-error"}`}>
                  {r.items || "비어 있음"}
                </th>
                <td className={`py-2.5 ${r.time ? "" : "text-error"}`}>{r.time || "비어 있음"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </aside>
    </form>
  );
}

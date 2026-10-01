"use client";

import { ArrowDown, ArrowUp, CheckCircle, Plus, Warning } from "@phosphor-icons/react/dist/ssr";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/admin/AdminMemberList";
import { ErrorNotice } from "@/components/admin/AdminProductList";
import {
  FAQ_CATEGORY_LABEL,
  FAQ_LIMITS,
  adminFaqs,
  createFaq,
  deleteFaq,
  reorderFaqs,
  updateFaq,
  type Faq,
  type FaqCategory,
  type FaqInput,
} from "@/lib/console";
import { SHOP_CONNECTED, ShopError } from "@/lib/shop";

/**
 * FAQ 관리 — 한 화면에서 쓰고 · 고치고 · 순서를 바꾼다. 질문이 수십 개를 넘지 않아 화면을 나누지 않는다.
 *
 * 순서는 위·아래 화살표로 옮긴 뒤 "순서 저장" 을 눌러야 서버에 남는다(옮길 때마다 저장하면
 * 다섯 칸 내리는 데 요청이 다섯 번 나간다). 저장 전에는 바뀐 줄이 표시된다.
 * 하나도 없으면 손님 QnA 화면은 코드에 있는 기본 질문을 보여 준다 — 그 사실을 빈 화면에 적는다.
 */

type State = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready"; items: Faq[] };

const EMPTY: FaqInput = { category: "ORDER", question: "", answer: "", published: true };
const CATEGORIES = Object.keys(FAQ_CATEGORY_LABEL) as FaqCategory[];

export function AdminFaqManager() {
  const [state, setState] = useState<State>(
    SHOP_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );
  const [order, setOrder] = useState<string[] | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FaqInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const reload = useCallback(async () => {
    try {
      const items = await adminFaqs();
      setState({ kind: "ready", items });
      setOrder(null);
    } catch (e) {
      const code = e instanceof ShopError ? (e.status === 401 ? "UNAUTHENTICATED" : e.status === 403 ? "FORBIDDEN" : e.code) : "UNKNOWN";
      setState({ kind: "error", code, message: e instanceof ShopError ? e.message : "불러오지 못했습니다." });
    }
  }, []);

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    adminFaqs()
      .then((items) => alive && setState({ kind: "ready", items }))
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

  const byId = new Map(state.items.map((f) => [f.id, f]));
  const ids = order ?? state.items.map((f) => f.id);
  const rows = ids.map((id) => byId.get(id)!).filter(Boolean);
  const moved = order !== null && order.some((id, i) => id !== state.items[i]?.id);

  function move(index: number, delta: number) {
    const next = [...ids];
    const to = index + delta;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    setOrder(next);
  }

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setResult(null);
    try {
      await action();
      await reload();
      setEditing(null);
      setResult({ tone: "ok", text: ok });
    } catch (e) {
      setResult({ tone: "error", text: e instanceof ShopError ? e.message : "처리하지 못했습니다." });
      if (e instanceof ShopError && e.code === "STALE_LIST") await reload();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(f: Faq | null) {
    setResult(null);
    setEditing(f ? f.id : "new");
    setForm(f ? { category: f.category, question: f.question, answer: f.answer, published: f.published } : EMPTY);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      setResult({ tone: "error", text: "질문과 답을 넣어 주세요." });
      return;
    }
    if (editing === "new") run(() => createFaq(form), "추가했습니다. 맨 아래에 붙었습니다.");
    else if (editing) run(() => updateFaq(editing, form), "저장했습니다.");
  }

  const field = "border-interactive focus-visible:border-accent text-primary rounded-xl border bg-transparent px-4 text-sm";
  const editor = (
    <form onSubmit={submit} noValidate className="border-accent bg-surface flex flex-col gap-4 rounded-2xl border p-6">
      <div className="flex flex-wrap gap-4">
        <label className="text-secondary text-2xs flex items-center gap-2">
          분류
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as FaqCategory })}
            className={`${field} min-h-11`}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{FAQ_CATEGORY_LABEL[c]}</option>)}
          </select>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="accent-accent h-4 w-4" />
          손님에게 보이기
        </label>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="faq-q" className="text-secondary text-2xs">질문</label>
        <input id="faq-q" value={form.question} maxLength={FAQ_LIMITS.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })} className={`${field} min-h-12`} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="faq-a" className="text-secondary text-2xs">답 (줄바꿈은 그대로 보입니다)</label>
        <textarea id="faq-a" value={form.answer} maxLength={FAQ_LIMITS.answer} rows={5}
          onChange={(e) => setForm({ ...form, answer: e.target.value })} className={`${field} py-3 leading-relaxed`} />
        <p className="text-muted text-2xs">{form.answer.length} / {FAQ_LIMITS.answer}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setEditing(null)} className="border-interactive text-primary inline-flex min-h-11 items-center rounded-full border px-5 text-sm">취소</button>
        <button type="submit" disabled={busy} className="bg-accent text-on-accent hover:bg-accent-hover inline-flex min-h-11 items-center rounded-full px-6 text-sm disabled:opacity-60">
          {editing === "new" ? "추가" : "저장"}
        </button>
        {editing !== "new" && editing && (
          <button type="button" disabled={busy} onClick={() => run(() => deleteFaq(editing), "지웠습니다.")}
            className="text-muted hover:text-error ml-auto min-h-11 text-xs underline underline-offset-4">
            이 질문 지우기
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => startEdit(null)} disabled={editing !== null || moved}
          className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm transition-colors duration-300 disabled:opacity-50">
          <Plus size={15} weight="light" aria-hidden="true" />
          질문 추가
        </button>
        {moved && (
          <>
            <button type="button" disabled={busy} onClick={() => run(() => reorderFaqs(ids), "순서를 저장했습니다.")}
              className="border-accent text-accent inline-flex min-h-12 items-center rounded-full border px-6 text-sm disabled:opacity-60">
              순서 저장
            </button>
            <button type="button" onClick={() => setOrder(null)} className="text-muted min-h-11 text-xs underline underline-offset-4">
              되돌리기
            </button>
          </>
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

      {editing === "new" && editor}

      {rows.length === 0 ? (
        <div className="border-subtle bg-band/60 rounded-2xl border px-6 py-12 text-center">
          <p className="text-primary text-sm">등록한 질문이 없습니다.</p>
          <p className="text-muted text-2xs mt-1">지금 손님 QnA 화면에는 기본 질문(코드에 있는 것)이 보입니다. 하나라도 추가하면 여기 것으로 바뀝니다.</p>
        </div>
      ) : (
        <ol className="border-subtle divide-subtle divide-y border-y">
          {rows.map((f, i) => (
            <li key={f.id} className="py-3">
              {editing === f.id ? editor : (
                <div className="flex items-start gap-3">
                  <div className="flex shrink-0 flex-col">
                    <button type="button" aria-label={`${f.question} 위로`} disabled={i === 0 || editing !== null} onClick={() => move(i, -1)}
                      className="text-secondary hover:text-accent inline-flex h-11 w-11 items-center justify-center disabled:opacity-30">
                      <ArrowUp size={15} weight="light" aria-hidden="true" />
                    </button>
                    <button type="button" aria-label={`${f.question} 아래로`} disabled={i === rows.length - 1 || editing !== null} onClick={() => move(i, 1)}
                      className="text-secondary hover:text-accent inline-flex h-11 w-11 items-center justify-center disabled:opacity-30">
                      <ArrowDown size={15} weight="light" aria-hidden="true" />
                    </button>
                  </div>
                  <button type="button" disabled={moved} onClick={() => startEdit(f)}
                    className="group min-h-11 min-w-0 flex-1 py-2 text-left disabled:cursor-default">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-primary group-hover:text-accent text-sm">{f.question}</span>
                      <Badge tone="muted">{FAQ_CATEGORY_LABEL[f.category]}</Badge>
                      {!f.published && <Badge tone="warn">숨김</Badge>}
                    </span>
                    <span className="text-muted text-2xs mt-1 line-clamp-2 block whitespace-pre-line">{f.answer}</span>
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

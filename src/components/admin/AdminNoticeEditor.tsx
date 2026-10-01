"use client";

import { ArrowLeft, CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  NOTICE_LIMITS,
  adminNotice,
  createNotice,
  deleteNotice,
  updateNotice,
  type NoticeInput,
} from "@/lib/console";
import { SHOP_CONNECTED, ShopError } from "@/lib/shop";

/**
 * 공지 쓰기 · 고치기. `?id=` 가 있으면 고치기, 없으면 새 공지.
 *
 * 본문은 글자 그대로 나간다 — 줄바꿈만 살고 꾸밈(HTML)은 없다. 손님 화면에서 그대로 보이는 모양을
 * 오른쪽 미리보기로 같이 보여 준다. 삭제는 한 번 더 묻는다.
 */

type Load = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready" };

const EMPTY: NoticeInput = { title: "", body: "", pinned: false, published: false };

export function AdminNoticeEditor() {
  const id = useSyncExternalStore<string | null | undefined>(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("id"),
    () => undefined,
  );
  const [loaded, setLoad] = useState<Load>({ kind: "loading" });
  const [form, setForm] = useState<NoticeInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id || !SHOP_CONNECTED) return;
    let alive = true;
    adminNotice(id)
      .then((n) => {
        if (!alive) return;
        setForm({ title: n.title, body: n.body, pinned: n.pinned, published: n.published });
        setLoad({ kind: "ready" });
      })
      .catch((e) => {
        if (!alive) return;
        const code = e instanceof ShopError ? (e.status === 404 ? "NOT_FOUND" : e.code) : "UNKNOWN";
        setLoad({ kind: "error", code, message: e instanceof ShopError && e.status === 404 ? "공지를 찾을 수 없습니다." : "불러오지 못했습니다." });
      });
    return () => {
      alive = false;
    };
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (!form.title.trim() || !form.body.trim()) {
      setResult({ tone: "error", text: "제목과 본문을 넣어 주세요." });
      return;
    }
    setBusy(true);
    try {
      if (id) {
        await updateNotice(id, form);
        setResult({ tone: "ok", text: form.published ? "저장했습니다. 손님 화면에 바로 보입니다." : "저장했습니다 (비공개)." });
      } else {
        const created = await createNotice(form);
        window.location.replace(`/admin/notices/edit/?id=${encodeURIComponent(created.id)}`);
        return;
      }
    } catch (err) {
      setResult({ tone: "error", text: err instanceof ShopError ? err.message : "저장하지 못했습니다." });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!id) return;
    setBusy(true);
    try {
      await deleteNotice(id);
      window.location.href = "/admin/notices/";
    } catch (err) {
      setResult({ tone: "error", text: err instanceof ShopError ? err.message : "지우지 못했습니다." });
      setBusy(false);
    }
  }

  const head = (
    <>
      <Link href="/admin/notices/" className="text-muted hover:text-accent inline-flex min-h-11 items-center gap-2 text-xs">
        <ArrowLeft size={14} weight="light" aria-hidden="true" />
        공지 목록
      </Link>
      <Eyebrow className="mt-6">NOTICE</Eyebrow>
      <h1 className="font-display text-primary leading-display mt-3 text-3xl md:text-4xl">{id ? "공지 고치기" : "새 공지"}</h1>
    </>
  );

  // 새 공지(id 없음)는 불러올 것이 없다 · 서버가 없으면 쓸 수 없다
  const load: Load = !SHOP_CONNECTED
    ? { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." }
    : id === null
      ? { kind: "ready" }
      : loaded;

  if (load.kind === "loading") return <>{head}<p aria-busy="true" className="text-muted mt-8 text-sm">불러오는 중</p></>;
  if (load.kind === "error") return <>{head}<div className="mt-8"><ErrorNotice code={load.code} message={load.message} /></div></>;

  const field = "border-interactive focus-visible:border-accent text-primary rounded-xl border bg-transparent px-4 text-sm";

  return (
    <>
      {head}
      <form onSubmit={save} noValidate className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="n-title" className="text-secondary text-2xs">제목</label>
            <input id="n-title" value={form.title} maxLength={NOTICE_LIMITS.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} className={`${field} min-h-12`} />
            <p className="text-muted text-2xs">{form.title.length} / {NOTICE_LIMITS.title}</p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="n-body" className="text-secondary text-2xs">본문 (줄바꿈은 그대로 보입니다)</label>
            <textarea id="n-body" value={form.body} maxLength={NOTICE_LIMITS.body} rows={14}
              onChange={(e) => setForm({ ...form, body: e.target.value })} className={`${field} py-3 leading-relaxed`} />
            <p className="text-muted text-2xs">{form.body.length} / {NOTICE_LIMITS.body}</p>
          </div>
        </div>

        <aside className="flex h-fit flex-col gap-5">
          <div className="border-subtle bg-surface flex flex-col gap-4 rounded-2xl border p-6">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="accent-accent h-4 w-4" />
              <span>손님에게 공개</span>
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                className="accent-accent h-4 w-4" />
              <span>목록 맨 위에 고정</span>
            </label>
            <button type="submit" disabled={busy}
              className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm transition-colors duration-300 disabled:opacity-60">
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
            {id && (confirmDelete ? (
              <div className="border-subtle flex flex-col gap-3 border-t pt-4">
                <p className="text-primary text-2xs">이 공지를 지웁니다. 되돌릴 수 없습니다. (잠시 내리려면 &lsquo;공개&rsquo; 를 끄세요)</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setConfirmDelete(false)} className="border-interactive text-primary inline-flex min-h-11 items-center rounded-full border px-5 text-sm">아니요</button>
                  <button type="button" disabled={busy} onClick={remove} className="border-error text-error inline-flex min-h-11 items-center rounded-full border px-5 text-sm disabled:opacity-60">지우기</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="text-muted hover:text-error min-h-11 w-fit text-xs underline underline-offset-4">
                공지 지우기
              </button>
            ))}
          </div>

          <div className="border-subtle bg-band/60 rounded-2xl border p-6">
            <p className="text-muted text-2xs">미리보기</p>
            <p className="text-primary mt-2 text-base font-medium break-words">{form.title || "제목"}</p>
            <p className="text-secondary mt-3 text-sm leading-relaxed break-words whitespace-pre-line">{form.body || "본문"}</p>
          </div>
        </aside>
      </form>
    </>
  );
}

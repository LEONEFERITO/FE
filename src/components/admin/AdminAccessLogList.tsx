"use client";

import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { ADMIN_CONNECTED, AdminApiError, listAccessLogs, type AdminAccessLogPage } from "@/lib/admin";

/**
 * 관리자 접속 · 열람 기록 (서버 V33). 최고 관리자만 볼 수 있다 — 일반 관리자는 403 이 나오고 그 사실이 안내된다.
 * 주문번호 · 회원 id 로 찾으면 "누가 언제 이 주문을 봤나" 가 나온다. 이 화면을 연 것도 기록에 남는다.
 */
type State =
  | { kind: "loading" }
  | { kind: "error"; code: string; message: string }
  | { kind: "ready"; page: AdminAccessLogPage };

const when = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Seoul",
});

export function AdminAccessLogList() {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState({ q: "", page: 0 });
  const [state, setState] = useState<State>(
    ADMIN_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );

  useEffect(() => {
    if (!ADMIN_CONNECTED) return;
    let alive = true;
    listAccessLogs(query)
      .then((page) => alive && setState({ kind: "ready", page }))
      .catch((e) => {
        if (!alive) return;
        setState(
          e instanceof AdminApiError
            ? { kind: "error", code: e.code, message: e.code === "FORBIDDEN" ? "접속 기록은 최고 관리자만 볼 수 있습니다." : e.message }
            : { kind: "error", code: "UNKNOWN", message: "기록을 불러오지 못했습니다." },
        );
      });
    return () => {
      alive = false;
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-8">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery({ q: draft.trim(), page: 0 });
        }}
        className="flex max-w-xl gap-2"
      >
        <label htmlFor="log-search" className="sr-only">
          주문번호 · 회원 id · 경로로 찾기
        </label>
        <input
          id="log-search"
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="주문번호 · 회원 id · 경로"
          className="border-interactive focus-visible:border-accent text-primary placeholder:text-muted/70 min-h-12 min-w-0 flex-1 rounded-full border bg-transparent px-5 text-sm"
        />
        <button
          type="submit"
          className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm transition-colors duration-300"
        >
          <MagnifyingGlass size={16} weight="light" aria-hidden="true" />
          찾기
        </button>
      </form>

      {state.kind === "loading" && (
        <p aria-busy="true" className="text-muted text-sm">
          불러오는 중
        </p>
      )}
      {state.kind === "error" && <ErrorNotice code={state.code} message={state.message} />}
      {state.kind === "ready" && (
        <>
          <p className="text-muted text-2xs" aria-live="polite">
            {state.page.total.toLocaleString("ko-KR")}건{query.q && <> · &lsquo;{query.q}&rsquo; 검색 결과</>}
          </p>
          {state.page.items.length === 0 ? (
            <div className="border-subtle bg-band/60 rounded-2xl border px-6 py-12 text-center">
              <p className="text-primary text-sm">기록이 없습니다.</p>
            </div>
          ) : (
            <ul className="border-subtle divide-subtle divide-y border-y">
              {state.page.items.map((l) => (
                <li
                  key={l.id}
                  className="flex min-w-0 flex-col gap-1 px-1 py-3 md:grid md:grid-cols-[9rem_minmax(0,1fr)_minmax(0,2fr)_3rem_8rem] md:items-center md:gap-4 md:px-3"
                >
                  <p className="text-muted text-2xs tabular-nums">{when.format(new Date(l.createdAt))}</p>
                  <p className="text-primary truncate text-xs">{l.actorEmail}</p>
                  <p className="text-secondary text-2xs break-all">
                    <span className="text-muted mr-2 font-mono">{l.method}</span>
                    {l.path}
                  </p>
                  <p className={`text-2xs tabular-nums ${l.status >= 400 ? "text-error" : "text-muted"}`}>{l.status}</p>
                  <p className="text-muted text-2xs tabular-nums">{l.ip ?? ""}</p>
                </li>
              ))}
            </ul>
          )}
          {state.page.totalPages > 1 && (
            <nav aria-label="쪽 이동" className="flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={state.page.page === 0}
                onClick={() => setQuery({ ...query, page: state.page.page - 1 })}
                className="border-interactive text-secondary hover:border-accent ease-fluid inline-flex min-h-11 items-center rounded-full border px-5 text-sm transition-colors duration-300 disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-muted text-2xs tabular-nums">
                {state.page.page + 1} / {state.page.totalPages}
              </span>
              <button
                type="button"
                disabled={state.page.page + 1 >= state.page.totalPages}
                onClick={() => setQuery({ ...query, page: state.page.page + 1 })}
                className="border-interactive text-secondary hover:border-accent ease-fluid inline-flex min-h-11 items-center rounded-full border px-5 text-sm transition-colors duration-300 disabled:opacity-40"
              >
                다음
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

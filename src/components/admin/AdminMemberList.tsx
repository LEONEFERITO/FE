"use client";

import { CaretLeft, CaretRight, LockSimple, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import {
  ADMIN_CONNECTED,
  AdminApiError,
  MEMBER_STATUS_LABEL,
  PROVIDER_LABEL,
  ROLE_LABEL,
  listMembers,
  type AdminMemberPage,
  type MemberStatus,
} from "@/lib/admin";

/**
 * 관리자 회원 목록.
 *
 * ── 서버가 찾고 나눈다 ──────────────────────────────────
 * 상품(수십 점)과 달리 회원은 계속 는다. 한 번에 다 받아 화면에서 거르면 언젠가 느려지고,
 * 모든 회원의 개인정보가 매번 브라우저로 내려온다. 검색 · 상태 · 쪽 나누기를 서버가 한다.
 *
 * ── 전화번호는 가려져 온다 ──────────────────────────────
 * 목록에서는 "이 사람이 맞나" 만 보면 된다. 전체 번호는 상세에서만 보이고, 상세를 연 것은
 * 기록된다 (개인정보 접속 기록).
 *
 * 검색은 입력할 때마다가 아니라 **누를 때** 한다. 한 글자마다 요청하면 개인정보 조회가
 * 글자 수만큼 쌓인다.
 */

type State =
  | { kind: "loading" }
  | { kind: "error"; code: string; message: string }
  | { kind: "ready"; page: AdminMemberPage };

const FILTERS: { key: MemberStatus | null; label: string }[] = [
  { key: null, label: "전체 (탈퇴 제외)" },
  { key: "ACTIVE", label: MEMBER_STATUS_LABEL.ACTIVE },
  { key: "SUSPENDED", label: MEMBER_STATUS_LABEL.SUSPENDED },
  { key: "WITHDRAWN", label: MEMBER_STATUS_LABEL.WITHDRAWN },
];

const day = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" });

export function AdminMemberList() {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState({ q: "", status: null as MemberStatus | null, page: 0 });
  const [state, setState] = useState<State>(
    ADMIN_CONNECTED
      ? { kind: "loading" }
      : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );

  useEffect(() => {
    if (!ADMIN_CONNECTED) return;
    let alive = true;
    listMembers(query)
      .then((page) => alive && setState({ kind: "ready", page }))
      .catch((e) => {
        if (!alive) return;
        setState(
          e instanceof AdminApiError
            ? { kind: "error", code: e.code, message: e.message }
            : { kind: "error", code: "UNKNOWN", message: "목록을 불러오지 못했습니다." },
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
          setQuery({ ...query, q: draft.trim(), page: 0 });
        }}
        className="flex max-w-xl gap-2"
      >
        <label htmlFor="member-search" className="sr-only">
          이름 · 이메일 · 전화번호로 찾기
        </label>
        <input
          id="member-search"
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="이름 · 이메일 · 전화번호"
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

      <div role="group" aria-label="상태로 거르기" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = query.status === f.key;
          return (
            <button
              key={f.label}
              type="button"
              aria-pressed={on}
              onClick={() => setQuery({ ...query, status: f.key, page: 0 })}
              className={`ease-fluid inline-flex min-h-11 items-center rounded-full border px-5 text-sm transition-colors duration-300 ${
                on
                  ? "border-accent bg-accent text-on-accent"
                  : "border-interactive text-secondary hover:border-accent hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {state.kind === "loading" && (
        <p aria-busy="true" className="text-muted text-sm">
          불러오는 중
        </p>
      )}
      {state.kind === "error" && <ErrorNotice code={state.code} message={state.message} />}
      {state.kind === "ready" && (
        <>
          <p className="text-muted text-2xs" aria-live="polite">
            {state.page.totalElements}명
            {query.q && <> · &lsquo;{query.q}&rsquo; 검색 결과</>}
          </p>
          <Rows page={state.page} />
          <Pager
            page={state.page}
            onMove={(p) => setQuery({ ...query, page: p })}
          />
        </>
      )}
    </div>
  );
}

function Rows({ page }: { page: AdminMemberPage }) {
  if (page.items.length === 0) {
    return (
      <div className="border-subtle bg-band/60 rounded-2xl border px-6 py-12 text-center">
        <p className="text-primary text-sm">찾는 회원이 없습니다.</p>
      </div>
    );
  }
  return (
    <ul className="border-subtle divide-subtle divide-y border-y">
      {page.items.map((m) => (
        <li key={m.id}>
          <Link
            href={`/admin/members/detail?id=${encodeURIComponent(m.id)}`}
            className="group hover:bg-band/60 ease-fluid flex min-w-0 flex-col gap-1.5 px-1 py-4 transition-colors duration-300 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] md:items-center md:gap-6 md:px-3"
          >
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-primary group-hover:text-accent ease-fluid text-sm transition-colors duration-300">
                  {m.name}
                </span>
                {m.role !== "MEMBER" && <Badge tone="accent">{ROLE_LABEL[m.role]}</Badge>}
                {m.status !== "ACTIVE" && <Badge tone="warn">{MEMBER_STATUS_LABEL[m.status]}</Badge>}
                {m.locked && (
                  <Badge tone="warn">
                    <LockSimple size={11} weight="light" aria-hidden="true" />
                    잠김
                  </Badge>
                )}
              </p>
              <p className="text-muted text-2xs mt-1 truncate">{m.email}</p>
            </div>
            <p className="text-secondary text-2xs tabular-nums">{m.phone ?? "전화번호 없음"}</p>
            <p className="text-muted text-2xs">{PROVIDER_LABEL[m.provider]}</p>
            <p className="text-muted text-2xs tabular-nums">
              <span className="sr-only">가입일 </span>
              {day.format(new Date(m.createdAt))}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Pager({ page, onMove }: { page: AdminMemberPage; onMove: (p: number) => void }) {
  if (page.totalPages <= 1) return null;
  const button =
    "border-interactive text-secondary hover:border-accent hover:text-primary ease-fluid inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <nav aria-label="쪽 이동" className="flex items-center justify-center gap-4">
      <button type="button" className={button} disabled={page.page === 0} onClick={() => onMove(page.page - 1)}>
        <CaretLeft size={16} weight="light" aria-hidden="true" />
        <span className="sr-only">이전 쪽</span>
      </button>
      <span className="text-secondary text-sm tabular-nums">
        {page.page + 1} / {page.totalPages}
      </span>
      <button
        type="button"
        className={button}
        disabled={page.page + 1 >= page.totalPages}
        onClick={() => onMove(page.page + 1)}
      >
        <CaretRight size={16} weight="light" aria-hidden="true" />
        <span className="sr-only">다음 쪽</span>
      </button>
    </nav>
  );
}

export function Badge({ tone, children }: { tone: "accent" | "warn" | "muted"; children: React.ReactNode }) {
  const cls =
    tone === "accent"
      ? "border-accent/60 text-accent"
      : tone === "warn"
        ? "border-warning/60 text-warning"
        : "border-subtle text-muted";
  return (
    <span className={`text-2xs inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 ${cls}`}>
      {children}
    </span>
  );
}

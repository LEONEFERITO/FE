"use client";

import { ArrowLeft, CheckCircle, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { Badge } from "@/components/admin/AdminMemberList";
import { ErrorNotice } from "@/components/admin/AdminProductList";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  ACTION_LABEL,
  ADMIN_CONNECTED,
  AdminApiError,
  MEMBER_STATUS_LABEL,
  PROVIDER_LABEL,
  ROLE_LABEL,
  SUSPEND_REASON_MAX,
  changeMemberRole,
  getMember,
  reactivateMember,
  suspendMember,
  unlockMember,
  type AdminMemberDetail as Detail,
} from "@/lib/admin";
import { fetchCurrentUser, isSuperAdmin, type CurrentUser } from "@/lib/auth";

/**
 * 관리자 회원 상세 · 조치.
 *
 * ── 할 수 있는 것만 보인다 ───────────────────────────────
 * 버튼을 다 늘어놓고 누른 뒤 "권한이 없습니다" 를 듣게 하지 않는다. 지금 이 회원에게,
 * 지금 로그인한 내가 할 수 있는 것만 그린다. 그래도 **판단은 서버가 한다** — 화면이 숨긴 것은
 * 편의일 뿐이고, 서버가 거부하면 그 문구를 그대로 보여준다.
 *
 * ── 되돌리기 어려운 것은 두 번 누른다 ───────────────────
 * 정지(사유 필수)와 권한 변경은 한 번 더 확인한다. 둘 다 그 사람의 로그인을 즉시 끊는다.
 *
 * id 는 쿼리로 받는다 (정적 내보내기 — AdminProductEditor 와 같은 이유).
 */

type State =
  | { kind: "loading" }
  | { kind: "error"; code: string; message: string }
  | { kind: "ready"; detail: Detail };

const when = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function fmt(value: string | null): string {
  return value ? when.format(new Date(value)) : "—";
}

async function load(id: string): Promise<State> {
  try {
    return { kind: "ready", detail: await getMember(id) };
  } catch (e) {
    return e instanceof AdminApiError
      ? { kind: "error", code: e.code, message: e.message }
      : { kind: "error", code: "UNKNOWN", message: "회원을 불러오지 못했습니다." };
  }
}

export function AdminMemberDetail() {
  const id = useSyncExternalStore<string | null | undefined>(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("id"),
    () => undefined,
  );
  const [state, setState] = useState<State>({ kind: "loading" });
  const [me, setMe] = useState<CurrentUser | null>(null);

  useEffect(() => {
    if (!ADMIN_CONNECTED || !id) return;
    let alive = true;
    load(id).then((next) => alive && setState(next));
    fetchCurrentUser().then((u) => alive && setMe(u));
    return () => {
      alive = false;
    };
  }, [id]);

  const reload = useCallback(async () => {
    if (id) setState(await load(id));
  }, [id]);

  const head = (title: string) => (
    <>
      <Link
        href="/admin/members"
        className="text-muted hover:text-accent ease-fluid inline-flex min-h-11 items-center gap-2 text-xs transition-colors duration-300"
      >
        <ArrowLeft size={14} weight="light" aria-hidden="true" />
        회원 목록
      </Link>
      <Eyebrow className="mt-6">MEMBER</Eyebrow>
      <h1 className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl">
        {title}
      </h1>
    </>
  );

  if (!ADMIN_CONNECTED) {
    return (
      <>
        {head("회원 상세")}
        <div className="mt-8">
          <ErrorNotice code="NOT_CONNECTED" message="서버가 아직 연결되지 않았습니다." />
        </div>
      </>
    );
  }
  if (id === null) {
    return (
      <>
        {head("회원 상세")}
        <p className="text-secondary mt-8 text-sm">회원을 목록에서 골라 주세요.</p>
      </>
    );
  }
  if (id === undefined || state.kind === "loading") {
    return (
      <>
        {head("회원 상세")}
        <p aria-busy="true" className="text-muted mt-8 text-sm">
          불러오는 중
        </p>
      </>
    );
  }
  if (state.kind === "error") {
    return (
      <>
        {head("회원 상세")}
        <div className="mt-8">
          <ErrorNotice code={state.code} message={state.message} />
        </div>
      </>
    );
  }

  const { detail } = state;
  const m = detail.member;
  const isSelf = me?.email === m.email;

  const rows: [string, React.ReactNode][] = [
    ["이메일", <span key="e" className="break-all">{m.email}</span>],
    ["전화번호", m.phone ?? "—"],
    ["가입 방법", PROVIDER_LABEL[m.provider]],
    ["권한", ROLE_LABEL[m.role]],
    ["상태", MEMBER_STATUS_LABEL[m.status]],
    ["가입일", fmt(m.createdAt)],
    ["마지막 로그인", fmt(m.lastLoginAt)],
    [
      "로그인 실패",
      detail.lockedUntil && new Date(detail.lockedUntil) > new Date()
        ? `${detail.failedLoginAttempts}회 · ${fmt(detail.lockedUntil)}까지 잠김`
        : `${detail.failedLoginAttempts}회`,
    ],
  ];
  if (detail.withdrawnAt) rows.push(["탈퇴일", fmt(detail.withdrawnAt)]);

  return (
    <>
      {head(m.name)}
      <p className="mt-3 flex flex-wrap gap-2">
        {m.role !== "MEMBER" && <Badge tone="accent">{ROLE_LABEL[m.role]}</Badge>}
        {m.status !== "ACTIVE" && <Badge tone="warn">{MEMBER_STATUS_LABEL[m.status]}</Badge>}
        {m.locked && <Badge tone="warn">로그인 잠김</Badge>}
        {isSelf && <Badge tone="muted">나</Badge>}
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="border-subtle bg-surface rounded-2xl border p-6 md:p-8" aria-labelledby="info-heading">
            <h2 id="info-heading" className="text-primary text-sm font-medium">
              회원 정보
            </h2>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label} className="flex gap-3 text-sm">
                  <dt className="text-muted w-24 shrink-0 text-xs leading-6">{label}</dt>
                  <dd className="text-secondary min-w-0">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="log-heading">
            <h2 id="log-heading" className="text-primary text-sm font-medium">
              관리 기록
            </h2>
            <p className="text-muted text-2xs mt-1">
              최근 20건. 상세를 열어 본 것도 남습니다.
            </p>
            <ol className="border-subtle divide-subtle mt-4 divide-y border-y">
              {detail.logs.map((log, i) => (
                <li key={i} className="flex flex-col gap-1 py-3 text-sm md:flex-row md:items-baseline md:gap-4">
                  <span className="text-muted text-2xs w-40 shrink-0 tabular-nums">{fmt(log.createdAt)}</span>
                  <span className="text-primary">{ACTION_LABEL[log.action] ?? log.action}</span>
                  {log.detail && <span className="text-secondary">{log.detail}</span>}
                  <span className="text-muted text-2xs md:ml-auto">{log.actor}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <Actions detail={detail} me={me} isSelf={isSelf} onDone={reload} />
      </div>
    </>
  );
}

function Actions({
  detail,
  me,
  isSelf,
  onDone,
}: {
  detail: Detail;
  me: CurrentUser | null;
  isSelf: boolean;
  onDone: () => Promise<void>;
}) {
  const m = detail.member;
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [confirming, setConfirming] = useState<"suspend" | "role" | null>(null);
  const [reason, setReason] = useState("");

  async function run(action: () => Promise<void>, okText: string) {
    setPending(true);
    setResult(null);
    try {
      await action();
      setConfirming(null);
      setReason("");
      await onDone();
      setResult({ tone: "ok", text: okText });
    } catch (e) {
      setResult({
        tone: "error",
        text: e instanceof AdminApiError ? e.message : "처리하지 못했습니다.",
      });
    } finally {
      setPending(false);
    }
  }

  if (m.status === "WITHDRAWN") {
    return (
      <aside className="border-subtle bg-band/60 h-fit rounded-2xl border p-6">
        <p className="text-secondary text-sm leading-relaxed">
          탈퇴한 회원입니다. 개인정보는 지워졌고, 할 수 있는 조치가 없습니다.
        </p>
      </aside>
    );
  }
  if (isSelf) {
    return (
      <aside className="border-subtle bg-band/60 h-fit rounded-2xl border p-6">
        <p className="text-secondary text-sm leading-relaxed">
          내 계정입니다. 자기 자신에게는 조치할 수 없습니다. 내 정보는 마이페이지에서 고칩니다.
        </p>
      </aside>
    );
  }

  const canSuspend = m.status === "ACTIVE" && m.role === "MEMBER";
  const canChangeRole = me !== null && isSuperAdmin(me) && m.role !== "SUPER_ADMIN" && m.status === "ACTIVE";
  const nextRole = m.role === "ADMIN" ? "MEMBER" : "ADMIN";

  const outline =
    "border-interactive text-primary hover:border-accent ease-fluid inline-flex min-h-12 items-center justify-center rounded-full border px-6 text-sm transition-colors duration-300 disabled:cursor-wait disabled:opacity-60";
  const danger =
    "border-error text-error hover:bg-error/5 ease-fluid inline-flex min-h-12 items-center justify-center rounded-full border px-6 text-sm transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <aside className="border-subtle bg-surface flex h-fit flex-col gap-6 rounded-2xl border p-6" aria-labelledby="actions-heading">
      <h2 id="actions-heading" className="text-primary text-sm font-medium">
        조치
      </h2>

      {m.locked && (
        <div className="flex flex-col gap-2">
          <p className="text-secondary text-2xs leading-relaxed">
            로그인에 여러 번 실패해 잠겨 있습니다. 본인 확인 뒤 풀어 주세요.
          </p>
          <button type="button" disabled={pending} className={outline} onClick={() => run(() => unlockMember(m.id), "잠금을 풀었습니다.")}>
            로그인 잠금 해제
          </button>
        </div>
      )}

      {m.status === "SUSPENDED" && (
        <button type="button" disabled={pending} className={outline} onClick={() => run(() => reactivateMember(m.id), "정지를 해제했습니다.")}>
          이용 정지 해제
        </button>
      )}

      {canSuspend &&
        (confirming === "suspend" ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (reason.trim()) run(() => suspendMember(m.id, reason.trim()), "이용을 정지했습니다.");
            }}
          >
            <label htmlFor="suspend-reason" className="text-secondary text-2xs">
              정지 사유 (필수 · 회원 문의에 답할 근거가 됩니다)
            </label>
            <textarea
              id="suspend-reason"
              value={reason}
              maxLength={SUSPEND_REASON_MAX}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="border-interactive focus-visible:border-accent text-primary rounded-xl border bg-transparent px-4 py-3 text-sm"
            />
            <p className="text-muted text-2xs leading-relaxed">
              정지하면 이 회원의 로그인이 즉시 끊기고 다시 로그인할 수 없습니다.
            </p>
            <div className="flex gap-3">
              {/* 취소가 먼저 온다 — 확인 버튼이 방금 누른 자리에 나타나 두 번 눌리지 않게 */}
              <button type="button" className={outline} onClick={() => setConfirming(null)}>
                취소
              </button>
              <button type="submit" disabled={pending || !reason.trim()} className={danger}>
                정지하기
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className={danger} onClick={() => setConfirming("suspend")}>
            이용 정지
          </button>
        ))}

      {canChangeRole &&
        (confirming === "role" ? (
          <div className="flex flex-col gap-3">
            <p className="text-secondary text-2xs leading-relaxed">
              {nextRole === "ADMIN"
                ? "관리자가 되면 상품과 회원 정보를 보고 고칠 수 있습니다."
                : "관리자 권한을 해제하면 관리자 화면에 들어올 수 없습니다."}{" "}
              이 회원의 로그인은 즉시 끊기고, 다시 로그인하면 바뀐 권한이 적용됩니다.
            </p>
            <div className="flex gap-3">
              <button type="button" className={outline} onClick={() => setConfirming(null)}>
                취소
              </button>
              <button
                type="button"
                disabled={pending}
                className={nextRole === "ADMIN" ? outline : danger}
                onClick={() =>
                  run(
                    () => changeMemberRole(m.id, nextRole),
                    nextRole === "ADMIN" ? "관리자로 지정했습니다." : "관리자 권한을 해제했습니다.",
                  )
                }
              >
                {nextRole === "ADMIN" ? "관리자로 지정" : "관리자 해제"}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className={outline} onClick={() => setConfirming("role")}>
            {nextRole === "ADMIN" ? "관리자로 지정" : "관리자 권한 해제"}
          </button>
        ))}

      {!m.locked && m.status === "ACTIVE" && !canSuspend && !canChangeRole && (
        <p className="text-muted text-2xs leading-relaxed">
          {m.role === "SUPER_ADMIN"
            ? "최고 관리자는 화면에서 바꿀 수 없습니다. 서버 명령으로만 관리합니다."
            : "관리자는 정지할 수 없습니다. 권한 변경은 최고 관리자만 할 수 있습니다."}
        </p>
      )}

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
    </aside>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AccountSettings } from "@/components/account/AccountSettings";
import { MyOrders } from "@/components/shop/MyOrders";
import {
  AUTH_CONNECTED,
  fetchCurrentUser,
  isAdmin,
  signOut,
  type CurrentUser,
} from "@/lib/auth";
import { pendingLabel } from "@/lib/pending";

/**
 * 마이페이지 본문.
 *
 * ── 지금 보여줄 수 있는 것과 없는 것 ────────────────────
 * 로그인한 회원의 이름·이메일은 서버가 준다. 포인트·등급은 규칙이 정해지지 않았고
 * 주문 내역은 주문 기능이 없다. 그 자리는 비워 두되, **왜 비었는지**를 적는다 —
 * 빈 칸은 "고장" 으로 읽히고, 이유가 적힌 칸은 "아직" 으로 읽힌다.
 *
 * TODO(고객확인) 포인트 적립률·유효기간 · 등급 기준 · 주문 기능.
 */

type State =
  | { kind: "offline" }
  | { kind: "loading" }
  | { kind: "guest"; withdrawn?: boolean }
  | { kind: "member"; user: CurrentUser };

export function MypagePanel() {
  const [state, setState] = useState<State>(
    AUTH_CONNECTED ? { kind: "loading" } : { kind: "offline" },
  );

  useEffect(() => {
    if (!AUTH_CONNECTED) return;
    let alive = true;
    fetchCurrentUser()
      .then(
        (user) =>
          alive &&
          setState(user ? { kind: "member", user } : { kind: "guest" }),
      )
      .catch(() => alive && setState({ kind: "guest" }));
    return () => {
      alive = false;
    };
  }, []);

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      setState({ kind: "guest" });
    }
  }

  if (state.kind === "offline") {
    return (
      <p className="border-subtle bg-band/60 text-muted text-2xs rounded-xl border px-4 py-3 leading-relaxed">
        화면 확인 단계입니다. 회원 서버는 아직 연결되지 않았습니다.
      </p>
    );
  }

  if (state.kind === "loading") {
    return (
      <p aria-busy="true" className="text-muted text-sm">
        불러오는 중
      </p>
    );
  }

  if (state.kind === "guest" && state.withdrawn) {
    return (
      <div
        role="status"
        className="border-subtle bg-surface rounded-2xl border p-7 md:p-9"
      >
        <h2 className="font-display text-primary text-xl">
          탈퇴가 완료되었습니다
        </h2>
        <p className="text-secondary mt-2 text-sm leading-relaxed">
          그동안 이용해 주셔서 감사합니다. 회원 정보는 모두 지웠습니다.
        </p>
        <Link
          href="/"
          className="text-accent hover:text-accent-hover mt-4 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
        >
          메인으로
        </Link>
      </div>
    );
  }

  if (state.kind === "guest") {
    return (
      <div className="border-subtle bg-surface flex flex-col items-start gap-4 rounded-2xl border p-7 md:flex-row md:items-center md:justify-between md:p-9">
        <div>
          <h2 className="font-display text-primary text-xl">
            로그인이 필요합니다
          </h2>
          <p className="text-secondary mt-2 text-sm leading-relaxed">
            주문 내역과 사이즈 기록은 로그인 후 보실 수 있습니다.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Link
            href="/login"
            className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center rounded-full px-6 text-sm transition-colors duration-300"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="border-interactive text-primary hover:border-accent ease-fluid inline-flex min-h-12 items-center rounded-full border px-6 text-sm transition-colors duration-300"
          >
            회원가입
          </Link>
        </div>
      </div>
    );
  }

  const { user } = state;
  const summary = [
    {
      label: "등급",
      value: pendingLabel("규칙"),
      note: "등급 수 · 승급 기준 · 혜택이 정해지면 표시됩니다.",
    },
    {
      label: "사용 가능 포인트",
      value: pendingLabel("규칙"),
      note: "적립률 · 사용 단위 · 유효기간이 정해지면 표시됩니다.",
    },
    {
      label: "누적 구매금액",
      value: "0원",
      note: "주문이 쌓이면 자동으로 계산됩니다.",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-primary text-2xl">{user.name} 님</p>
          <p className="text-muted mt-1 text-xs">{user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          {isAdmin(user) && (
            // 관리자 로그인은 따로 없다 — 같은 로그인, 권한은 서버가 가른다. 입구는 여기와 /admin/ 하나.
            <Link
              href="/admin/"
              className="text-accent hover:text-accent-hover ease-fluid inline-flex min-h-11 items-center text-xs underline underline-offset-4 transition-colors duration-300"
            >
              관리자 화면
            </Link>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="text-muted hover:text-accent ease-fluid min-h-11 text-xs underline underline-offset-4 transition-colors duration-300"
          >
            로그아웃
          </button>
        </div>
      </div>

      <dl className="grid gap-4 md:grid-cols-3">
        {summary.map((s) => (
          <div
            key={s.label}
            className="border-subtle bg-surface rounded-2xl border p-6"
          >
            <dt className="text-muted text-2xs">{s.label}</dt>
            <dd className="font-display text-primary mt-2 text-xl">
              {s.value}
            </dd>
            <dd className="text-secondary mt-2 text-xs leading-relaxed">
              {s.note}
            </dd>
          </div>
        ))}
      </dl>

      <MyOrders />

      <AccountSettings
        onNameChanged={(name) =>
          setState({ kind: "member", user: { ...user, name } })
        }
        onWithdrawn={() => setState({ kind: "guest", withdrawn: true })}
      />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AUTH_CONNECTED, fetchCurrentUser, signOut, type CurrentUser } from "@/lib/auth";
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
  | { kind: "guest" }
  | { kind: "member"; user: CurrentUser };

export function MypagePanel() {
  const [state, setState] = useState<State>(
    AUTH_CONNECTED ? { kind: "loading" } : { kind: "offline" },
  );

  useEffect(() => {
    if (!AUTH_CONNECTED) return;
    let alive = true;
    fetchCurrentUser()
      .then((user) => alive && setState(user ? { kind: "member", user } : { kind: "guest" }))
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

  if (state.kind === "guest") {
    return (
      <div className="border-subtle bg-surface flex flex-col items-start gap-4 rounded-2xl border p-7 md:flex-row md:items-center md:justify-between md:p-9">
        <div>
          <h2 className="font-display text-primary text-xl">로그인이 필요합니다</h2>
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
    { label: "등급", value: pendingLabel("규칙"), note: "등급 수 · 승급 기준 · 혜택이 정해지면 표시됩니다." },
    { label: "사용 가능 포인트", value: pendingLabel("규칙"), note: "적립률 · 사용 단위 · 유효기간이 정해지면 표시됩니다." },
    { label: "누적 구매금액", value: "0원", note: "주문이 쌓이면 자동으로 계산됩니다." },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-primary text-2xl">{user.name} 님</p>
          <p className="text-muted mt-1 text-xs">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-muted hover:text-accent ease-fluid min-h-11 text-xs underline underline-offset-4 transition-colors duration-300"
        >
          로그아웃
        </button>
      </div>

      <dl className="grid gap-4 md:grid-cols-3">
        {summary.map((s) => (
          <div key={s.label} className="border-subtle bg-surface rounded-2xl border p-6">
            <dt className="text-muted text-2xs">{s.label}</dt>
            <dd className="font-display text-primary mt-2 text-xl">{s.value}</dd>
            <dd className="text-secondary mt-2 text-xs leading-relaxed">{s.note}</dd>
          </div>
        ))}
      </dl>

      <section
        className="border-subtle bg-surface rounded-2xl border p-6 md:p-8"
        aria-labelledby="orders-heading"
      >
        <h2 id="orders-heading" className="text-primary text-sm font-medium">
          주문 내역
        </h2>
        <p className="text-secondary mt-3 text-sm leading-relaxed">
          아직 주문이 없습니다. 주문 기능이 열리면 결제 완료 → 제작 중 → 발송 → 배송 완료
          순서로 여기에 쌓입니다.
        </p>
      </section>
    </div>
  );
}

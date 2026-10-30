"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { AccountSettings } from "@/components/account/AccountSettings";
import { MyOrders } from "@/components/shop/MyOrders";
import { KAKAO_CHANNEL } from "@/data/business";
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
 * TODO(고객확인) 등급 — 2026-10-06 구조표 "체스판 말 등급별로 나눌 예정" (폰 · 나이트 · 비숍 · 룩 · 퀸 · 킹 등).
 *   등급 이름 · 승급 기준(누적 구매금액?) · 혜택이 정해지면 위 "등급" 칸에 말 아이콘과 함께 표시한다.
 *
 * ── 탭 하나에 화면 하나 (2026-10-13 "너무 복잡하다, 탭별로 해당 화면만") ──────────────
 * 2026-10-06 구조표의 CLIENT SERVICES 네 칸이 그대로 네 탭이다. 한 번에 한 화면만 보인다:
 *   내 정보      MY ACCOUNT           등급 · 포인트 · 누적 구매금액 · 내 정보 수정 · 비밀번호 · 탈퇴   /mypage/
 *   주문 내역    ORDER HISTORY        전체 주문                                                    /mypage/#orders
 *   주문 현황    ORDER STATUS         제작 · 배송 중인 주문                                         /mypage/#order-status
 *   교환 · 반품  RETURNS & EXCHANGES  신청 방법                                                    /mypage/#returns
 * 고른 탭은 주소의 # 에 남는다 — 새로고침 · 공유해도 같은 탭, 메뉴의 링크(siteNav)도 그 탭을 바로 연다.
 * 같은 페이지에서 메뉴 링크를 누르면 Next 가 # 만 바꾸고 이벤트를 내지 않아서, 클릭 뒤에 주소를 다시 읽는다.
 * 휴대폰에서도 네 탭이 한 줄에 들어간다(가로 스크롤 없이 4칸).
 */

const TABS = [
  { id: "account", hash: "", label: "내 정보" },
  { id: "orders", hash: "orders", label: "주문 내역" },
  { id: "order-status", hash: "order-status", label: "주문 현황" },
  { id: "returns", hash: "returns", label: "교환 · 반품" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const TAB_EVENT = "mypage:tab";

function subscribeHash(onChange: () => void) {
  // 같은 페이지 안 링크(Next 의 pushState)는 hashchange 를 내지 않고, 주소도 클릭 직후가 아니라 조금 뒤에 바뀐다 —
  // 클릭 뒤 1초 동안 몇 번 다시 읽는다(바뀌지 않았으면 다시 그리지 않는다)
  const onClick = () => [0, 100, 300, 800].forEach((ms) => window.setTimeout(onChange, ms));
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  window.addEventListener(TAB_EVENT, onChange);
  document.addEventListener("click", onClick);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(TAB_EVENT, onChange);
    document.removeEventListener("click", onClick);
  };
}

function tabOf(hash: string): TabId {
  const h = hash.replace(/^#/, "");
  return TABS.find((t) => t.hash && t.hash === h)?.id ?? "account";
}

function selectTab(id: TabId) {
  const hash = TABS.find((t) => t.id === id)?.hash ?? "";
  const url = `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ""}`;
  // 탭을 바꿀 때마다 방문 기록을 쌓지 않는다 — 뒤로 가기는 마이페이지에 오기 전 화면으로
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new Event(TAB_EVENT));
}

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
      .then((user) => {
        if (!alive) return;
        setState(user ? { kind: "member", user } : { kind: "guest" });
      })
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
      // 2026-10-31 디자이너: 테두리 없이
      <div role="status" className="py-4">
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
  return (
    <MemberView
      user={user}
      onSignOut={handleSignOut}
      onNameChanged={(name) => setState({ kind: "member", user: { ...user, name } })}
      onWithdrawn={() => setState({ kind: "guest", withdrawn: true })}
    />
  );
}

function MemberView({
  user,
  onSignOut,
  onNameChanged,
  onWithdrawn,
}: {
  user: CurrentUser;
  onSignOut: () => void;
  onNameChanged: (name: string) => void;
  onWithdrawn: () => void;
}) {
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => "",
  );
  const tab = tabOf(hash);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /** ← → Home End 로 탭 사이를 옮긴다(WAI-ARIA 탭 패턴). 옮기면 바로 그 탭이 열린다 */
  function onTabKey(e: React.KeyboardEvent, index: number) {
    const last = TABS.length - 1;
    const next =
      e.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : e.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    selectTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

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
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="font-display text-primary text-2xl">{user.name} 님</p>
          {/* 이메일은 고딕(2026-10-31 디자이너) */}
          <p className="text-muted mt-1 break-all font-sans text-xs">{user.email}</p>
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
            onClick={onSignOut}
            className="text-muted hover:text-accent ease-fluid min-h-11 text-xs underline underline-offset-4 transition-colors duration-300"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 탭 — 휴대폰에서도 네 칸이 한 줄. 지금 탭은 글자색과 아래 줄로 */}
      <div role="tablist" aria-label="마이페이지" className="border-subtle grid grid-cols-4 border-b">
        {TABS.map((t, i) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`mypage-tab-${t.id}`}
              aria-selected={on}
              aria-controls={`mypage-panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => selectTab(t.id)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={`ease-fluid -mb-px flex min-h-12 items-center justify-center border-b-2 px-1 text-center text-xs leading-tight transition-colors duration-300 md:min-h-14 md:text-sm ${
                on ? "border-accent text-primary font-medium" : "text-muted hover:text-primary border-transparent"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`mypage-panel-${tab}`} aria-labelledby={`mypage-tab-${tab}`}>
        {tab === "account" && (
          <div className="flex flex-col gap-6">
            {/*
              등급 · 포인트 · 누적 구매금액 — 2026-10-31 디자이너: 테두리 상자 대신 회색(#EDEDED) 둥근(20px) 상자 셋,
              테두리 없이 사이 12px, 글자는 가운데 · 전부 고딕. 휴대폰도 세 칸 한 줄(설명은 넓은 화면에서만).
            */}
            <dl className="grid grid-cols-3 gap-2 font-sans sm:gap-3">
              {summary.map((s) => (
                <div key={s.label} className="flex flex-col items-center rounded-[20px] bg-[#EDEDED] px-3 py-5 text-center sm:px-5 sm:py-7">
                  <dt className="text-muted text-2xs">{s.label}</dt>
                  <dd className="text-primary mt-1.5 text-sm font-semibold sm:text-lg">{s.value}</dd>
                  <dd className="text-muted text-2xs mt-1.5 hidden leading-relaxed sm:block">{s.note}</dd>
                </div>
              ))}
            </dl>
            <AccountSettings onNameChanged={onNameChanged} onWithdrawn={onWithdrawn} />
          </div>
        )}

        {tab === "orders" && <MyOrders view="history" />}
        {tab === "order-status" && <MyOrders view="status" />}

        {/* RETURNS & EXCHANGES — 신청은 주문 상세에서 한다. 여기는 어디서 어떻게 하는지 알려 주는 자리 */}
        {tab === "returns" && (
          // 2026-10-31 디자이너: 테두리 없이
          <section className="py-2" aria-labelledby="returns-heading">
            <p className="text-accent text-2xs tracking-label">RETURNS &amp; EXCHANGES</p>
            <h2 id="returns-heading" className="text-primary mt-1 text-sm font-medium">
              교환 · 반품
            </h2>
            <ol className="text-secondary mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed">
              <li>배송이 끝난 주문을 「주문 내역」에서 엽니다.</li>
              <li>
                주문 상세의 <b className="text-primary">교환 · 반품 신청</b>에서 사유와 사진을 남깁니다.
              </li>
              <li>접수 → 승인 → 회수 → 완료 순서로 진행 상황이 그 주문 상세에 쌓입니다.</li>
            </ol>
            <button
              type="button"
              onClick={() => selectTab("orders")}
              className="border-interactive text-primary hover:border-accent hover:text-accent ease-fluid mt-5 inline-flex min-h-11 items-center rounded-full border px-5 text-xs transition-colors duration-300"
            >
              주문 내역 보기
            </button>
            <p className="text-muted mt-4 text-xs leading-relaxed">
              신청 기간과 기준은{" "}
              <Link href="/terms#article-16" className="text-accent hover:text-accent-hover underline underline-offset-4">
                이용약관 제16조
              </Link>
              에 있습니다. 기간이 지났거나 궁금한 점은{" "}
              <a
                href={KAKAO_CHANNEL.chat}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-hover underline underline-offset-4"
              >
                카카오톡 채널<span className="sr-only">(새 창)</span>
              </a>
              로 알려 주세요.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

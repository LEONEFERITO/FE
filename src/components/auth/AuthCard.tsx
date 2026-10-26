"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { Logo } from "@/components/brand/Logo";
import { AUTH_CONNECTED } from "@/lib/auth";

type Mode = "login" | "signup";

// 전환할 때 폼 두 개를 다시 그리지 않는다 — 바뀌는 건 바깥 칸의 클래스뿐이라, 폼까지 다시 그리면
// 패널이 밀리기 시작하는 첫 프레임이 그만큼 늦는다(2026-10-26 측정: 첫 프레임 53ms)
const LoginFormMemo = memo(LoginForm);
const SignupFormMemo = memo(SignupForm);

/**
 * 로그인 · 회원가입 한 카드 (2026-10-26 고객 레퍼런스 영상 — 짙은 패널이 좌우로 미끄러지며 폼이 바뀐다).
 *
 * ── 모양 ────────────────────────────────────────────────
 * PC: 카드 왼쪽 절반이 로그인, 오른쪽 절반이 회원가입. 와인 패널이 안 쓰는 쪽을 덮는다 —
 *     로그인 중이면 패널이 오른쪽("처음 오셨나요 → 회원가입"), 회원가입 중이면 왼쪽("다시 오셨군요 → 로그인").
 * 폰: 좌우로 나눌 폭이 없다. 위에 와인 띠(같은 문구 · 전환 버튼), 아래에 지금 폼 하나 — 바뀔 때 옆에서 밀려 들어온다.
 *
 * ── 버벅이지 않게 (2026-10-26 요청 "렉 · 버벅거림 최소로") ────
 * - 움직이는 건 transform · opacity 뿐이다 — 레이아웃을 다시 계산하는 속성(left · width · height)은 건드리지 않는다.
 * - 패널은 자기 레이어(will-change: transform)라 밀리는 동안 아래 폼을 다시 그리지 않는다.
 * - 물결 배경도 큰 그라데이션 판을 transform 으로만 천천히 움직인다(CSS 애니메이션, JS 0).
 * - 두 폼은 늘 붙어 있다(언마운트하지 않는다) — 바꿀 때 새로 그리지 않고, 적던 글자도 남는다.
 * - 기기의 «동작 줄이기» 가 켜져 있으면 미끄러짐 · 물결 없이 바로 바뀐다(globals.css .auth-*).
 *
 * ── 주소 ────────────────────────────────────────────────
 * /login · /signup 은 그대로 있다. 바꿀 때 주소창만 바꾼다(history.replaceState — 페이지를 다시 받지 않는다).
 * ?next= 같은 꼬리는 그대로 둔다.
 */
export function AuthCard({ initial }: { initial: Mode }) {
  const [mode, setMode] = useState<Mode>(initial);
  // 처음 그릴 때는 미끄러지지 않는다 — 전환을 누른 뒤부터만 애니메이션
  const [moved, setMoved] = useState(false);
  const loginRef = useRef<HTMLElement>(null);
  const signupRef = useRef<HTMLElement>(null);

  // 늘 같은 함수(useCallback, 의존 없음) — 폼에 넘기는 onSwitch 가 바뀌지 않아야 memo 가 통한다
  const go = useCallback((next: Mode) => {
    setMoved(true);
    setMode(next);
    window.history.replaceState(window.history.state, "", `/${next}/${window.location.search}`);
    document.title = `${next === "login" ? "로그인" : "회원가입"} | LEONE FERITO 레오네페리토`;
  }, []);
  const toLogin = useCallback(() => go("login"), [go]);
  const toSignup = useCallback(() => go("signup"), [go]);

  // 바뀐 폼의 첫 칸으로 초점 — 키보드 · 화면 낭독기 사용자가 어디로 왔는지 안다. 미끄러짐이 끝난 뒤에
  useEffect(() => {
    if (!moved) return;
    const box = mode === "login" ? loginRef.current : signupRef.current;
    const t = window.setTimeout(() => box?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true }), 450);
    return () => window.clearTimeout(t);
  }, [mode, moved]);

  const login = mode === "login";

  return (
    <div
      data-mode={mode}
      className={`auth-card relative grid overflow-hidden rounded-[20px] bg-white shadow-[0_24px_60px_-28px_rgba(23,10,14,0.35)] md:grid-cols-2 ${
        moved ? "auth-moved" : ""
      }`}
    >
      {/* ── 패널. PC 에서는 안 쓰는 쪽 절반을 덮고, 폰에서는 맨 위 띠 ── */}
      <div
        className={`auth-panel on-black relative z-20 overflow-hidden px-6 py-8 text-center md:absolute md:inset-y-0 md:left-0 md:flex md:w-1/2 md:items-center md:justify-center md:px-12 md:py-0 ${
          login ? "md:translate-x-full" : "md:translate-x-0"
        }`}
      >
        <div aria-hidden="true" className="auth-wave pointer-events-none absolute inset-0" />
        <div className="relative grid">
          <PanelText
            show={!login}
            title="다시 오셨군요"
            body={"로그인하고 주문 내역과\n사이즈 기록을 이어서 보세요."}
            action="로그인"
            onAction={toLogin}
          />
          <PanelText
            show={login}
            title="처음 오셨나요"
            body={"가입하면 주문 내역과\n사이즈 기록이 계정에 남습니다."}
            action="회원가입"
            onAction={toSignup}
          />
        </div>
      </div>

      {/* ── 로그인 (PC 왼쪽 절반) ── */}
      <section
        ref={loginRef}
        aria-labelledby="auth-login-heading"
        inert={!login}
        className={`auth-form px-6 py-10 md:col-start-1 md:row-start-1 md:flex md:items-center md:px-12 md:py-14 ${
          login ? "auth-on" : "auth-off max-md:hidden"
        }`}
      >
        <div className="mx-auto w-full max-w-[360px]">
          <h1 id="auth-login-heading" className="font-display text-primary leading-display tracking-display text-3xl">
            로그인
          </h1>
          <p className="text-secondary mt-3 text-sm">주문 내역과 사이즈 기록을 이어서 보실 수 있습니다.</p>
          {!AUTH_CONNECTED && <NotConnected />}
          <div className="mt-7">
            <LoginFormMemo onSwitch={toSignup} />
          </div>
        </div>
      </section>

      {/* ── 회원가입 (PC 오른쪽 절반) ── */}
      <section
        ref={signupRef}
        aria-labelledby="auth-signup-heading"
        inert={login}
        className={`auth-form px-6 py-10 md:col-start-2 md:row-start-1 md:px-12 md:py-14 ${
          login ? "auth-off max-md:hidden" : "auth-on"
        }`}
      >
        <div className="mx-auto w-full max-w-[360px]">
          <h1 id="auth-signup-heading" className="font-display text-primary leading-display tracking-display text-3xl">
            회원가입
          </h1>
          <p className="text-secondary mt-3 text-sm">주문 내역과 사이즈 기록이 계정에 남습니다.</p>
          {!AUTH_CONNECTED && <NotConnected />}
          <div className="mt-7">
            <SignupFormMemo onSwitch={toLogin} />
          </div>
        </div>
      </section>
    </div>
  );
}

/** 패널 안 문구 한 벌. 둘이 같은 칸에 겹쳐 있고 지금 것만 보인다(opacity · transform 으로 바뀐다) */
function PanelText({
  show,
  title,
  body,
  action,
  onAction,
}: {
  show: boolean;
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div
      inert={!show}
      className={`auth-panel-text col-start-1 row-start-1 flex flex-col items-center ${show ? "auth-on" : "auth-off"}`}
    >
      <span className="text-accent-deep hidden md:block">
        <Logo width={150} label="" />
      </span>
      <p className="font-display text-primary text-2xl md:mt-10 md:text-3xl">{title}</p>
      <p className="text-secondary mt-3 text-sm leading-relaxed whitespace-pre-line">{body}</p>
      <button
        type="button"
        onClick={onAction}
        className="ease-fluid mt-6 inline-flex min-h-11 items-center rounded-full border border-[#F7F1EA]/70 px-9 text-sm text-[#F7F1EA] transition-colors duration-300 hover:bg-[#F7F1EA] hover:text-[#5E1F21] md:mt-8"
      >
        {action}
      </button>
    </div>
  );
}

function NotConnected() {
  return (
    <p className="border-subtle bg-band/60 text-muted text-2xs mt-6 rounded-xl border px-4 py-3 leading-relaxed">
      화면 확인 단계입니다. 서버는 아직 연결되지 않았습니다.
    </p>
  );
}

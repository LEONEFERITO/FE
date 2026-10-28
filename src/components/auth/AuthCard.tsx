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
 * PC: 카드 왼쪽 절반이 로그인, 오른쪽 절반이 회원가입. 검은 패널이 안 쓰는 쪽을 덮는다 —
 *     로그인 중이면 패널이 오른쪽("처음 오셨나요 → 회원가입"), 회원가입 중이면 왼쪽("다시 오셨군요 → 로그인").
 * 폰: 좌우로 나눌 폭이 없다. 위에 전환 알약, 아래에 지금 폼 하나 — 바뀔 때 옆에서 밀려 들어온다.
 *
 * 2026-10-28: 패널은 사진 · 물결 없이 완전 검정(디자이너 "검은 상자" → 고객 "완전 블랙으로"). 미끄러지는 움직임 · 모양은 그대로.
 * 관리자 «로그인 화면 사진» 메뉴도 걷었다. 폰의 전환 알약도 같은 검정이다.
 *
 * ── 버벅이지 않게 (2026-10-26 요청 "렉 · 버벅거림 최소로") ────
 * - 움직이는 건 transform · opacity 뿐이다 — 레이아웃을 다시 계산하는 속성(left · width · height)은 건드리지 않는다.
 * - 패널은 자기 레이어(will-change: transform)라 밀리는 동안 아래 폼을 다시 그리지 않는다.
 * - 두 폼은 늘 붙어 있다(언마운트하지 않는다) — 바꿀 때 새로 그리지 않고, 적던 글자도 남는다.
 * - 기기의 «동작 줄이기» 가 켜져 있으면 미끄러짐 없이 바로 바뀐다(globals.css .auth-*).
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
      // PC 는 한 화면에 들어오는 높이로 고정(2026-10-27 "화면이 너무 큰데 한 화면에") — 헤더 73 + 위아래 여백 48 을 뺀 만큼,
      // 너무 낮은 창에서는 560, 큰 모니터에서는 860 까지. 폼이 그보다 길면(회원가입) 그 칸 안에서만 스크롤된다.
      className={`auth-card relative grid overflow-hidden rounded-[20px] bg-white shadow-[0_24px_60px_-28px_rgba(23,10,14,0.35)] md:h-[clamp(560px,calc(100dvh-121px),860px)] md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] ${
        moved ? "auth-moved" : ""
      }`}
    >
      {/*
        ── 폰: 맨 위 토글 (2026-10-27 요청 "모바일은 상단 토글로 전환") ──
        두 칸짜리 버튼 위를 검은 알약이 transform 으로 미끄러진다. PC 에서는 패널이 이 역할을 해서 숨긴다.
      */}
      <div role="tablist" aria-label="로그인 · 회원가입 전환" className="auth-toggle bg-band relative m-4 mb-0 grid grid-cols-2 rounded-full p-1 md:hidden">
        <span aria-hidden="true" className={`auth-toggle-pill absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#000000] ${login ? "" : "translate-x-full"}`} />
        <button type="button" role="tab" aria-selected={login} onClick={toLogin} className={`relative z-10 min-h-11 rounded-full text-sm font-medium transition-colors duration-300 ${login ? "text-[#F7F1EA]" : "text-secondary"}`}>
          로그인
        </button>
        <button type="button" role="tab" aria-selected={!login} onClick={toSignup} className={`relative z-10 min-h-11 rounded-full text-sm font-medium transition-colors duration-300 ${login ? "text-secondary" : "text-[#F7F1EA]"}`}>
          회원가입
        </button>
      </div>

      {/* ── 패널. PC 에서 안 쓰는 쪽 절반을 덮는다(폰에서는 위 토글) ── */}
      <div
        className={`auth-panel on-black relative z-20 hidden overflow-hidden text-center md:absolute md:inset-y-0 md:left-0 md:flex md:w-1/2 md:items-center md:justify-center md:px-12 ${
          login ? "md:translate-x-full" : "md:translate-x-0"
        }`}
      >
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
        className={`auth-form px-6 py-8 md:col-start-1 md:row-start-1 md:flex md:items-center md:overflow-y-auto md:px-12 md:py-4 ${
          login ? "auth-on" : "auth-off max-md:hidden"
        }`}
      >
        <div className="mx-auto w-full max-w-[360px]">
          <h1 id="auth-login-heading" className="font-display text-primary leading-display tracking-display text-2xl md:text-[28px]">
            로그인
          </h1>
          <p className="text-secondary mt-2 text-sm">주문 내역과 사이즈 기록을 이어서 보실 수 있습니다.</p>
          {!AUTH_CONNECTED && <NotConnected />}
          <div className="mt-5">
            <LoginFormMemo onSwitch={toSignup} />
          </div>
        </div>
      </section>

      {/* ── 회원가입 (PC 오른쪽 절반) ── */}
      <section
        ref={signupRef}
        aria-labelledby="auth-signup-heading"
        inert={login}
        className={`auth-form px-6 py-8 md:col-start-2 md:row-start-1 md:overflow-y-auto md:px-12 md:py-6 ${
          login ? "auth-off max-md:hidden" : "auth-on"
        }`}
      >
        <div className="mx-auto w-full max-w-[460px]">
          <h1 id="auth-signup-heading" className="font-display text-primary leading-display tracking-display text-2xl md:text-[28px]">
            회원가입
          </h1>
          {/* 설명 문장은 뺐다 — 옆 패널이 같은 말을 한다(2026-10-27 한 화면에 넣기) */}
          {!AUTH_CONNECTED && <NotConnected />}
          <div className="mt-5">
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
      <span className="text-accent-deep">
        <Logo width={150} label="" />
      </span>
      <p className="font-display text-primary text-2xl md:mt-10 md:text-3xl">{title}</p>
      <p className="text-secondary mt-3 text-sm leading-relaxed whitespace-pre-line">{body}</p>
      <button
        type="button"
        onClick={onAction}
        className="ease-fluid mt-6 inline-flex min-h-11 items-center rounded-full border border-[#F7F1EA]/70 px-9 text-sm text-[#F7F1EA] transition-colors duration-300 hover:bg-[#F7F1EA] hover:text-[#111111] md:mt-8"
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

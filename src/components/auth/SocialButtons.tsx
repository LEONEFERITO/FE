"use client";

import { Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  AUTH_CONNECTED,
  SOCIAL_ERROR_MESSAGE,
  SOCIAL_PROVIDER_LABEL,
  fetchSocialProviders,
  socialStartUrl,
} from "@/lib/auth";

/**
 * 간편 로그인 · 가입 버튼.
 *
 * ── 버튼은 링크다 ────────────────────────────────────────
 * 카카오 로그인 화면으로 **페이지 전체가** 이동해야 한다. fetch 로 하면 카카오가 돌려주는
 * 리다이렉트를 브라우저가 따라가지 못한다. 그래서 <a href> 이고, 돌아올 때도 서버가
 * 우리 주소로 리다이렉트한다.
 *
 * ── 켜진 제공자만 그린다 ─────────────────────────────────
 * 키가 없는 제공자는 서버 목록에 없다. 눌러도 아무 일이 없는 버튼을 두는 대신
 * "준비 중" 이라고 말한다.
 *
 * ── 모양 · 색 — 각 회사 공식 가이드 그대로 (2026-10-13 "다 공식으로") ──────────────
 * 네이버 로그인 검수는 버튼이 네이버 가이드를 따르는지 본다. 카카오도 같은 규칙이 있다. 그래서 둘 다 공식 모양이다:
 *   카카오  노랑(#FEE500) 바탕 · 검은 말풍선 심볼 · 검정 85% 글자 「카카오 로그인」 · 모서리 12px
 *   네이버  초록(#03C75A) 바탕 · 흰 N 로고 · 흰 글자 「네이버 로그인」
 * 네이버의 흰 글자는 초록 위 대비가 2.2:1 로 우리 대비 기준(4.5:1)에 못 미친다 — 예전에는 글자만 짙게 바꿔 두었지만,
 * 검수 반려를 피하려고 공식 색으로 돌렸다. 로고 · 회사 이름이 함께 있어 무엇인지 알아볼 수는 있다.
 * 심볼은 아이콘 라이브러리에 없어(상표) 공식 심볼 모양을 그대로 그린다.
 */

const STYLE: Record<string, string> = {
  kakao: "bg-[#FEE500] text-black/85 hover:bg-[#F5DC00]",
  naver: "bg-[#03C75A] text-white hover:bg-[#02B451]",
};

/** 카카오 말풍선 · 네이버 N — 공식 심볼 */
function Symbol({ id }: { id: string }) {
  if (id === "kakao") {
    return (
      <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" className="shrink-0">
        <path
          fill="#000000"
          d="M9 1.5C4.58 1.5 1 4.31 1 7.78c0 2.24 1.5 4.21 3.75 5.32l-.95 3.48c-.08.31.27.55.53.38l4.15-2.74c.17.01.34.02.52.02 4.42 0 8-2.81 8-6.28S13.42 1.5 9 1.5z"
        />
      </svg>
    );
  }
  if (id === "naver") {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="shrink-0">
        <path fill="#FFFFFF" d="M10.85 8.56 4.97 0H0v16h5.15V7.44L11.03 16H16V0h-5.15z" />
      </svg>
    );
  }
  return null;
}

export function SocialButtons({ mode }: { mode: "login" | "signup" }) {
  // null = 아직 모름(서버에 묻는 중). 빈 배열 = 켜진 제공자 없음.
  const [providers, setProviders] = useState<string[] | null>(AUTH_CONNECTED ? null : []);

  useEffect(() => {
    if (!AUTH_CONNECTED) return;
    let alive = true;
    fetchSocialProviders()
      .then((list) => alive && setProviders(list))
      .catch(() => alive && setProviders([]));
    return () => {
      alive = false;
    };
  }, []);

  // 서버가 실패를 /login?social=<코드> 로 알려준다. 읽기만 한다 (ProductList 의 ?category= 와 같은 방식).
  const errorCode = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("social"),
    () => null,
  );
  const error = errorCode
    ? (SOCIAL_ERROR_MESSAGE[errorCode] ?? SOCIAL_ERROR_MESSAGE.failed)
    : null;

  const title = mode === "login" ? "간편 로그인" : "간편 가입";
  const none = providers !== null && providers.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="border-subtle mt-2 flex items-center gap-4 border-t pt-7">
        <span className="text-muted text-2xs">{title}</span>
        {none && <span className="text-muted/70 text-2xs">준비 중</span>}
      </div>

      {error && (
        <p role="alert" className="text-error text-2xs flex gap-1.5 leading-relaxed">
          <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {providers !== null && providers.length > 0 && (
        /*
          간편 로그인은 처음이면 곧 가입이다 — 가입 화면의 체크를 거치지 않는다.
          그래서 누르기 **전에** 무엇에 동의하는 것인지 버튼 위에서 말한다.
          서버는 이 고지를 보고 진행한 것으로 동의를 기록한다(SOCIAL_NOTICE, BE V12).
        */
        <p className="text-muted text-2xs leading-relaxed">
          처음이시면 이 버튼으로 바로 가입됩니다. 계속하시면{" "}
          <Link href="/terms" className="text-accent underline underline-offset-4">
            이용약관
          </Link>
          에 동의하고 만 14세 이상임을 확인하신 것으로 봅니다. 회원 정보는{" "}
          <Link href="/privacy" className="text-accent underline underline-offset-4">
            개인정보처리방침
          </Link>
          에 따라 처리됩니다.
        </p>
      )}

      {providers !== null && providers.length > 0 && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {providers.map((id) => (
            <a
              key={id}
              href={socialStartUrl(id)}
              className={`ease-fluid flex min-h-12 items-center justify-center gap-2.5 rounded-[12px] text-sm font-medium transition-colors duration-300 ${
                STYLE[id] ?? "bg-accent text-on-accent"
              }`}
            >
              <Symbol id={id} />
              {SOCIAL_PROVIDER_LABEL[id] ?? `${id} 로그인`}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

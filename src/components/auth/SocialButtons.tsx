"use client";

import { Warning } from "@phosphor-icons/react/dist/ssr";
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
 * ── 색 ──────────────────────────────────────────────────
 * 제공자 브랜드색을 쓴다. 네이버 공식 버튼은 초록 위 흰 글자인데 그건 2.2:1 이라
 * 우리 QA(4.5:1)를 못 넘는다. 초록 면은 그대로 두고 글자만 짙게 한다.
 */

const STYLE: Record<string, string> = {
  kakao: "bg-[#FEE500] text-[#191919] hover:bg-[#F5DC00]",
  naver: "bg-[#03C75A] text-[#0A1F14] hover:bg-[#02B451]",
};

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
        <div className="grid gap-2.5 sm:grid-cols-2">
          {providers.map((id) => (
            <a
              key={id}
              href={socialStartUrl(id)}
              className={`ease-fluid flex min-h-12 items-center justify-center rounded-full text-sm font-medium transition-colors duration-300 ${
                STYLE[id] ?? "bg-accent text-on-accent"
              }`}
            >
              {SOCIAL_PROVIDER_LABEL[id] ?? `${id}로 계속하기`}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

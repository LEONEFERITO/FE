"use client";

import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";

/**
 * 뒤로 가기 — 라인 페이지 왼쪽 위 (2026-10-17 디자이너 요청 "이런 뒤로가기 버튼 여기에").
 *
 * 들어온 기록이 있으면 브라우저 뒤로, 주소로 바로 열려 기록이 없으면 메인으로 간다 —
 * 기록 없이 back() 을 부르면 아무 일도 안 일어나 버튼이 고장난 것처럼 보인다.
 * 표적은 44×44(WCAG 2.5.8). 색은 감싸는 구간의 글자 토큰을 따른다.
 */
export function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="뒤로 가기"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
      className={`text-primary hover:text-accent ease-fluid inline-flex h-11 w-11 items-center justify-center transition-colors duration-300 ${className}`}
    >
      <ArrowLeft size={24} weight="light" aria-hidden="true" />
    </button>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * 접속 통계 기록 (서버 V51, 2026-11-09 고객 "날짜 · 요일 · 시간대별 접속, 접속 경로를 관리자에서").
 *
 * 페이지를 열 때마다(주소가 바뀔 때마다) 서버에 한 줄 보낸다 — 본 주소 · 방문 시작 여부 · (시작일 때만) 들어온 주소와 utm.
 * 쿠키를 쓰지 않는다(credentials: "omit"). 방문 시작은 이 탭에서 처음 연 페이지다(sessionStorage 표시 하나 — 쿠키 아님).
 * 관리자 화면은 보내지 않는다. 실패해도 손님 화면에는 아무 일도 없다 — 기다리지도, 알리지도 않는다.
 * 서버는 IP 를 저장하지 않고 하루짜리 해시만 남긴다(VisitService).
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const STARTED = "lf-visit-started";
/** 마지막으로 보낸 주소 — 같은 화면을 다시 그리느라 효과가 두 번 돌아도(개발 모드 등) 한 번만 센다 */
let lastSent = "";

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!API_BASE || !pathname || pathname === lastSent) return;
    lastSent = pathname; // 관리자 화면을 거쳐 같은 손님 화면으로 돌아와도 다시 센다
    if (pathname.startsWith("/admin")) return;
    let entry = false;
    try {
      entry = sessionStorage.getItem(STARTED) === null;
      if (entry) sessionStorage.setItem(STARTED, "1");
    } catch {
      // 사생활 보호 모드 등으로 막혀 있으면 — 첫 페이지인지 알 수 없으니 들어온 주소가 있을 때만 시작으로 본다
      entry = !!document.referrer;
    }
    const q = new URLSearchParams(window.location.search);
    const body = {
      path: pathname,
      entry,
      referrer: entry ? document.referrer || null : null,
      utmSource: entry ? q.get("utm_source") : null,
      utmMedium: entry ? q.get("utm_medium") : null,
      utmCampaign: entry ? q.get("utm_campaign") : null,
    };
    // keepalive — 바로 다른 페이지로 넘어가도 요청이 끊기지 않는다
    fetch(`${API_BASE}/api/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "omit",
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}

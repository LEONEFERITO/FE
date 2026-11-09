import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/AdminPage";
import { AdminVisitStats } from "@/components/admin/AdminVisitStats";
import { StatsTabs } from "@/components/admin/StatsTabs";

/** 관리자 통계 — 접속 통계 (서버 V51). 날짜 · 요일 · 시간대 · 유입 경로 · 기기 */

export const metadata: Metadata = {
  title: "접속 통계",
  robots: { index: false, follow: false },
};

export default function AdminVisitStatsPage() {
  return (
    <AdminPage section="stats" title="접속 통계" description="손님이 언제, 어디를 거쳐 들어왔는지 봅니다. 시간은 한국 시간입니다.">
      <StatsTabs current="visits" />
      <AdminVisitStats />
    </AdminPage>
  );
}

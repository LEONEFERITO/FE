import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/AdminNav";
import { AdminReturnList } from "@/components/admin/AdminReturnList";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Eyebrow } from "@/components/ui/Eyebrow";

/** 관리자 교환·반품 목록. 접근 제어는 서버가 한다(`/api/admin/**` = ADMIN). */

export const metadata: Metadata = {
  title: "교환 · 반품 관리",
  robots: { index: false, follow: false },
};

export default function AdminReturnsPage() {
  return (
    <>
      <Header />

      <main id="main" className="on-cream flex-1">
        <div className="mx-auto max-w-[1320px] px-5 py-14 md:px-15 md:py-20">
          <AdminNav current="returns" />
          <Eyebrow>ADMIN</Eyebrow>
          <h1 className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl">
            교환 · 반품
          </h1>
          <p className="text-secondary mt-4 max-w-[60ch] text-sm leading-relaxed">
            처리할 신청이 먼저 보입니다. 신청을 열어 승인(회수 안내) → 회수 완료 → 반품 환불 또는 교환 재발송 순서로
            처리합니다. 받지 않을 신청은 사유를 적어 거절합니다.
          </p>

          <div className="mt-12">
            <AdminReturnList />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

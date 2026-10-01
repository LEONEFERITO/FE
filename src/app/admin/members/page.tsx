import type { Metadata } from "next";

import { AdminMemberList } from "@/components/admin/AdminMemberList";
import { AdminNav } from "@/components/admin/AdminNav";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * 관리자 회원 목록. 접근 제어는 서버가 한다(`/api/admin/**` = ADMIN).
 */

export const metadata: Metadata = {
  title: "회원 관리",
  robots: { index: false, follow: false },
};

export default function AdminMembersPage() {
  return (
    <>
      <Header />

      <main id="main" className="on-cream flex-1">
        <div className="mx-auto max-w-[1320px] px-5 py-14 md:px-15 md:py-20">
          <AdminNav current="members" />
          <Eyebrow>ADMIN</Eyebrow>
          <h1 className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl">
            회원 관리
          </h1>
          <p className="text-secondary mt-4 max-w-[60ch] text-sm leading-relaxed">
            최근 가입한 회원이 위로 옵니다. 목록에서는 전화번호가 가려져 있고, 상세를 열면
            보입니다. 상세를 연 기록은 남습니다.
          </p>

          <div className="mt-12">
            <AdminMemberList />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

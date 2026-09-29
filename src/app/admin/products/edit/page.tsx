import type { Metadata } from "next";

import { AdminProductEditor } from "@/components/admin/AdminProductEditor";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/**
 * 상품 수정 · 공개. `?id=` 로 상품을 받는다 — 이유는 `AdminProductEditor` 주석.
 * 머리(뒤로가기 · 표시 · 제목)는 상품 이름이 들어가므로 편집기가 그린다.
 */

export const metadata: Metadata = {
  title: "상품 수정",
  robots: { index: false, follow: false },
};

export default function AdminEditProductPage() {
  return (
    <>
      <Header />

      <main id="main" className="flex-1">
        <div className="mx-auto max-w-[1320px] px-5 py-14 md:px-15 md:py-20">
          <AdminProductEditor />
        </div>
      </main>

      <Footer />
    </>
  );
}

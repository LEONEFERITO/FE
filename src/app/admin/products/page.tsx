import type { Metadata } from "next";

import { AdminProductList } from "@/components/admin/AdminProductList";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * 관리자 상품 목록.
 *
 * 접근 제어는 서버가 한다(`/api/admin/**` = ADMIN). 이 페이지는 누구나 열 수 있지만
 * 권한이 없으면 목록 요청이 401/403 으로 돌아오고, 화면은 그 이유를 안내한다.
 */

export const metadata: Metadata = {
  title: "상품 관리",
  robots: { index: false, follow: false },
};

export default function AdminProductsPage() {
  return (
    <>
      <Header />

      <main id="main" className="on-cream flex-1">
        <div className="mx-auto max-w-[1320px] px-5 py-14 md:px-15 md:py-20">
          <Eyebrow>ADMIN</Eyebrow>
          <h1 className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl">
            상품 관리
          </h1>
          <p className="text-secondary mt-4 max-w-[60ch] text-sm leading-relaxed">
            초안과 공개 상품이 함께 나옵니다. 최근에 고친 상품이 위로 옵니다.
            공개하려면 무엇이 더 필요한지 줄마다 적혀 있습니다.
          </p>

          <div className="mt-12">
            <AdminProductList />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

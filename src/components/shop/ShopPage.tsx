import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageBand } from "@/components/ui/PageBand";

/**
 * 주문 흐름 화면의 공통 틀 — 와인 제목 띠 + 크림 본문.
 * 주문서 · 결제 결과 · 주문 상세가 같은 모양이어야 "같은 가게 안" 으로 읽힌다.
 */
export function ShopPage({
  eyebrow,
  title,
  description,
  narrow = false,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  /** 결과 화면처럼 읽을 거리가 적으면 좁게. */
  narrow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <PageBand eyebrow={eyebrow} title={title} description={description} />
        <div className="on-cream">
          <div
            className={`mx-auto px-5 py-12 md:px-15 md:py-16 ${narrow ? "max-w-[720px]" : "max-w-[1320px]"}`}
          >
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

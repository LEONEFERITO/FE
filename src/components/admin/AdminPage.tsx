import { AdminNav, type AdminSection } from "@/components/admin/AdminNav";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Eyebrow } from "@/components/ui/Eyebrow";

/** 관리자 목록형 화면의 공통 틀 — 메뉴 · 제목 · 한 줄 설명 · 본문. */
export function AdminPage({
  section,
  title,
  description,
  children,
}: {
  section: AdminSection;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main" className="on-cream flex-1">
        <div className="mx-auto max-w-[1320px] px-5 py-14 md:px-15 md:py-20">
          <AdminNav current={section} />
          <Eyebrow>ADMIN</Eyebrow>
          <h1 className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl">{title}</h1>
          {description && <p className="text-secondary mt-4 max-w-[64ch] text-sm leading-relaxed">{description}</p>}
          <div className="mt-12">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}

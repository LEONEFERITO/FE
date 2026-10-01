import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Eyebrow } from "@/components/ui/Eyebrow";

/** 관리자 로그인 · 비밀번호 변경의 틀 — 좁은 크림 판 하나. 손님 로그인과는 문구로 구분한다. */
export function AdminAuthFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main" className="on-cream flex-1">
        <div className="mx-auto max-w-[440px] px-5 py-16 md:py-24">
          <Eyebrow>ADMIN</Eyebrow>
          <h1 className="font-display text-primary leading-display mt-3 text-3xl">{title}</h1>
          <p className="text-secondary mt-3 text-sm leading-relaxed">{description}</p>
          <div className="mt-10">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}

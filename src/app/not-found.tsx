import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageBand } from "@/components/ui/PageBand";

/**
 * 404 — 없는 주소.
 *
 * 사과문보다 **갈 곳**이 중요하다. 이 사이트에 들어오는 이유 세 가지(옷 보기 · 내 주문 · 질문)로
 * 바로 보낸다. 정적 내보내기에서 이 파일이 404.html 이 되고, 호스팅이 없는 주소에 이걸 돌려준다.
 */

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false, follow: false },
};

const WAYS = [
  { href: "/products/", label: "제품 보기", hint: "지금 주문할 수 있는 옷" },
  { href: "/mypage/", label: "내 주문", hint: "주문 내역 · 배송 · 교환 · 반품" },
  { href: "/qna/", label: "QnA", hint: "자주 묻는 질문 · 문의" },
];

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <PageBand eyebrow="404" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 없어진 페이지입니다." />
        <div className="on-cream">
          <div className="mx-auto max-w-[960px] px-5 py-14 md:px-15 md:py-20">
            <ul className="grid gap-4 md:grid-cols-3">
              {WAYS.map((w) => (
                <li key={w.href}>
                  <Link
                    href={w.href}
                    className="border-subtle bg-surface hover:border-accent ease-fluid flex min-h-28 flex-col justify-between gap-3 rounded-2xl border p-6 transition-colors duration-300"
                  >
                    <span className="text-primary text-base font-medium">{w.label}</span>
                    <span className="text-muted text-2xs">{w.hint}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-sm">
              <Link href="/" className="text-accent underline underline-offset-4">
                메인으로
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

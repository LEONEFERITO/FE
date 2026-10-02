import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { BUSINESS, BUSINESS_FIELDS, KAKAO_CHANNEL } from "@/data/business";
import { pendingLabel } from "@/lib/pending";

/**
 * 전역 푸터.
 *
 * 베이지 밴드로 둔다. 메인이 베이지+화이트라 푸터까지 어둡게 깔면
 * 페이지 아래가 갑자기 다른 사이트처럼 끊긴다.
 *
 * 아래 사업자 정보와 약관 링크는 전자상거래법 제10조의 **표기 의무** 사항이다.
 * 값은 data/business.ts 에 있다 — 약관도 같은 값을 본다.
 *
 * 개인정보처리방침 링크는 개인정보 보호법 제30조 · 처리방침 작성지침에 따라
 * **이름을 그대로 쓰고 다른 링크보다 눈에 띄게**(굵게) 둔다.
 */

export function Footer() {
  return (
    <footer className="bg-band border-subtle mt-auto border-t">
      <div className="mx-auto max-w-[1320px] px-5 py-20 md:px-15 md:py-28">
        <div className="text-accent-deep">
          <Logo width={164} />
        </div>

        <p className="text-secondary mt-6 max-w-md text-sm">
          운동으로 달라진 체형을 위한 남성 기성복.
        </p>

        <div className="border-subtle mt-14 border-t pt-6">
          <nav aria-label="안내 · 약관 및 정책" className="flex flex-wrap gap-x-7">
            <Link
              href="/notice/"
              className="text-secondary hover:text-primary ease-fluid inline-flex min-h-11 items-center text-xs transition-colors duration-300"
            >
              공지사항
            </Link>
            <a
              href={KAKAO_CHANNEL.chat}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary ease-fluid inline-flex min-h-11 items-center text-xs transition-colors duration-300"
            >
              카카오톡 문의<span className="sr-only">(새 창)</span>
            </a>
            <Link
              href="/terms"
              className="text-secondary hover:text-primary ease-fluid inline-flex min-h-11 items-center text-xs transition-colors duration-300"
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className="text-primary hover:text-accent ease-fluid inline-flex min-h-11 items-center text-xs font-semibold transition-colors duration-300"
            >
              개인정보처리방침
            </Link>
          </nav>

          <dl className="mt-6 grid gap-x-12 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {BUSINESS_FIELDS.map(({ key, label }) => {
              const value = BUSINESS[key];
              return (
                <div key={key} className="flex gap-2.5 text-2xs">
                  <dt className="text-muted w-32 shrink-0">{label}</dt>
                  <dd className={value ? "text-secondary" : "text-muted"}>
                    {/* 값이 없으면 확인 필요임을 화면에서 드러낸다. 빈칸으로 두면 잊힌다. */}
                    {value ?? pendingLabel()}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        <p className="text-muted mt-12 text-2xs tracking-label">
          © {new Date().getFullYear()} LEONE FERITO
        </p>
      </div>
    </footer>
  );
}

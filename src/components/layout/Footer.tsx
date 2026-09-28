import { Logo } from "@/components/brand/Logo";
import { pendingLabel } from "@/lib/pending";

/**
 * 전역 푸터.
 *
 * 베이지 밴드로 둔다. 메인이 베이지+화이트라 푸터까지 어둡게 깔면
 * 페이지 아래가 갑자기 다른 사이트처럼 끊긴다.
 *
 * 아래 사업자 정보는 전자상거래법상 **표기 의무** 사항이다.
 * 확인 전까지 비워 둔다 — 추측으로 채우면 틀린 법적 표기가 공개된다.
 * 필요한 값은 docs/CLIENT_QUESTIONS.md F-1 에 정리되어 있다.
 */

const BUSINESS_INFO: { label: string; value: string | null }[] = [
  { label: "상호", value: null },
  { label: "대표자", value: null },
  { label: "사업자등록번호", value: null },
  { label: "통신판매업 신고번호", value: null },
  { label: "사업장 주소", value: null },
  { label: "대표 전화", value: null },
  { label: "이메일", value: null },
  { label: "개인정보 보호책임자", value: null },
  { label: "호스팅 서비스 제공자", value: null },
];

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

        <dl className="border-subtle mt-14 grid gap-x-12 gap-y-3 border-t pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {BUSINESS_INFO.map((item) => (
            <div key={item.label} className="flex gap-2.5 text-2xs">
              <dt className="text-muted w-32 shrink-0">{item.label}</dt>
              <dd className={item.value ? "text-secondary" : "text-muted"}>
                {/* 값이 없으면 확인 필요임을 화면에서 드러낸다. 빈칸으로 두면 잊힌다. */}
                {item.value ?? pendingLabel()}
              </dd>
            </div>
          ))}
        </dl>

        <p className="text-muted mt-12 text-2xs tracking-label">
          © {new Date().getFullYear()} LEONE FERITO
        </p>
      </div>
    </footer>
  );
}

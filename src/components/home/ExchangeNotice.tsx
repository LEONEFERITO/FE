import { Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * 배송 · 교환 · 상담 안내.
 *
 * CLAUDE.md 가 **"교환 흐름은 부가 기능이 아니라 핵심 흐름"** 이라고 못박았다.
 * 의류에서 구매를 막는 마지막 벽은 가격이 아니라 "안 맞으면 어쩌지" 다.
 * 그 답을 결제 직전이 아니라 **메인에서 미리** 준다.
 *
 * ── 왜 셋을 같은 상자 세 개로 두지 않는가 ──────────────
 * 셋의 무게가 다르다. 교환·반품이 핵심이고 배송·상담은 곁가지다.
 * 같은 크기의 카드 셋은 그 차이를 지우고 브로셔처럼 읽힌다.
 * 그래서 교환·반품만 상자(= 올려진 것)로 두고, 나머지 둘은 헤어라인 목록이다.
 * 상자는 위계를 말할 때만 쓴다.
 *
 * ── 값이 비어 있는 것에 대해 ──────────────────────────
 * 기간·비용 부담·조건은 전부 고객이 정할 사항이다(C 항목). 업계 관행으로 넘겨짚어
 * "7일 이내 무료 교환" 같은 문구를 쓰면, 그게 그대로 고지가 되고 분쟁의 근거가 된다.
 * 확정 전에는 TODO 로 남긴다.
 */

interface Item {
  no: string;
  title: string;
  body: string | null;
  /** 값이 확정되기 전까지 화면에 보여줄 안내 */
  todo: string;
  href?: string;
  linkLabel?: string;
}

const CORE: Item = {
  no: "01",
  title: "교환 · 반품",
  body: null, // TODO(고객확인) 신청 기간 · 왕복 배송비 부담 · 불가 조건
  todo: "신청 기간과 배송비 부담 기준을 확인 중입니다",
  href: "/qna/",
  linkLabel: "교환 · 반품 안내",
};

const SIDE: Item[] = [
  {
    no: "02",
    title: "배송",
    body: null, // TODO(고객확인) 배송비 · 발송 기준일 · 도서산간
    todo: "배송비와 발송 기준을 확인 중입니다",
  },
  {
    no: "03",
    title: "사이즈 상담",
    body: "치수를 알려주시면 어느 사이즈가 맞을지 함께 봐 드립니다. 받아보고 교환하는 것보다 빠릅니다.",
    todo: "",
    href: "/qna/",
    linkLabel: "문의하기",
  },
];

function Pending({ text }: { text: string }) {
  return (
    <p className="text-muted mt-3 flex gap-1.5 text-2xs leading-relaxed">
      {/* 색만으로 알리지 않는다 — 아이콘과 글자가 같이 간다 */}
      <Warning
        size={14}
        weight="light"
        aria-hidden="true"
        className="mt-px shrink-0"
      />
      <span>{text}</span>
    </p>
  );
}

export function ExchangeNotice() {
  return (
    <section
      className="bg-band border-subtle border-t"
      aria-labelledby="notice-heading-home"
    >
      <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-15 md:py-32">
        <Eyebrow>BEFORE YOU BUY</Eyebrow>
        <h2
          id="notice-heading-home"
          className="font-display text-primary leading-display tracking-display mt-3 max-w-2xl text-3xl md:text-4xl"
        >
          안 맞으면 바꿔 드립니다
        </h2>
        <p className="text-secondary mt-5 max-w-2xl text-sm">
          치수를 다 공개하는 이유는 교환을 줄이기 위해서입니다. 그래도 안 맞으면
          바꿔 드립니다.
        </p>

        {/* 7 : 5 — 핵심 항목이 넓고, 곁가지 둘은 세로로 쌓인다. 모바일은 한 열. */}
        <div className="mt-14 grid gap-8 md:grid-cols-12 md:gap-6">
          <div className="md:col-span-7">
            <div className="border-subtle bg-band/50 shadow-soft h-full rounded-none border p-1.5">
              <div className="bg-surface flex h-full flex-col rounded-none px-8 py-10 md:px-10 md:py-12">
                <span className="text-muted text-2xs tracking-label tabular-nums">
                  {CORE.no}
                </span>
                <h3 className="font-display text-primary mt-5 text-2xl md:text-3xl">
                  {CORE.title}
                </h3>
                {CORE.body ? (
                  <p className="text-secondary mt-4 max-w-[46ch] text-sm leading-relaxed">
                    {CORE.body}
                  </p>
                ) : (
                  <Pending text={CORE.todo} />
                )}
                {CORE.href && (
                  <Link
                    href={CORE.href}
                    className="text-accent hover:text-accent ease-fluid mt-auto inline-flex min-h-11 w-fit items-center pt-10 text-2xs underline underline-offset-4 transition-colors duration-300"
                  >
                    {CORE.linkLabel}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <ul className="divide-subtle border-subtle flex flex-col divide-y border-t md:col-span-5">
            {SIDE.map((item) => (
              <li
                key={item.no}
                className="flex flex-col py-7 first:pt-6 md:py-8"
              >
                <span className="text-muted text-2xs tracking-label tabular-nums">
                  {item.no}
                </span>
                <h3 className="font-display text-primary mt-3 text-lg">
                  {item.title}
                </h3>
                {item.body ? (
                  <p className="text-secondary mt-3 max-w-[40ch] text-sm leading-relaxed">
                    {item.body}
                  </p>
                ) : (
                  <Pending text={item.todo} />
                )}
                {item.href && (
                  <Link
                    href={item.href}
                    className="text-accent hover:text-accent ease-fluid mt-4 inline-flex min-h-11 w-fit items-center text-2xs underline underline-offset-4 transition-colors duration-300"
                  >
                    {item.linkLabel}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

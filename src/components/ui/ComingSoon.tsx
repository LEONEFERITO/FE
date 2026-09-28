import Link from "next/link";

import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * 아직 만들지 않은 페이지.
 *
 * ── 왜 빈 페이지라도 두는가 ─────────────────────────────
 * 링크는 이미 화면에 있는데 그 주소에 아무것도 없으면 404 가 뜬다. 404 는
 * "아직 안 만들었다" 가 아니라 **"고장났다"** 로 읽힌다. 둘러보던 사람이 메뉴를
 * 누를 때마다 오류 화면을 만나면, 만들어 둔 나머지까지 못 미덥게 보인다.
 *
 * 그래서 "여기 무엇이 올지" 를 한 줄로 말하고 돌아갈 길을 준다.
 * 진짜 페이지가 생기면 이 파일을 쓰는 라우트를 그것으로 갈아 끼운다.
 *
 * ── 검색에 잡히지 않게 ──────────────────────────────────
 * 이 페이지들은 내용이 없으므로 색인되면 브랜드 검색 결과에 빈 껍데기가 뜬다.
 * 지금은 사이트 전체가 noindex 라 자동으로 막히지만, 정식 오픈 때 그 설정을
 * 걷어내면서 **이 페이지들만은 계속 막아야 한다.** 각 라우트가 metadata 로 따로 건다.
 */
export function ComingSoon({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  /** 여기 무엇이 올지 한 줄. 막연한 "준비 중" 만으로는 언제 와야 할지 알 수 없다. */
  description: string;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-56px)] max-w-[1320px] flex-col items-center justify-center px-5 py-24 text-center md:min-h-[calc(100dvh-72px)] md:px-15">
      <Eyebrow>{eyebrow}</Eyebrow>

      <h1 className="font-display text-primary leading-display tracking-display mt-4 text-3xl md:text-4xl">
        {title}
      </h1>

      <p className="text-secondary mt-5 max-w-[46ch] text-sm leading-relaxed">
        {description}
      </p>

      <p className="border-subtle bg-band/60 text-muted text-2xs mt-8 rounded-full border px-5 py-2.5">
        준비 중입니다
      </p>

      <Link
        href="/"
        className="group border-interactive text-accent hover:border-accent hover:bg-accent-tint shadow-soft ease-fluid tracking-button text-2xs mt-10 inline-flex min-h-11 items-center gap-2.5 rounded-full border px-6 transition-all duration-500 hover:-translate-y-px"
      >
        <ArrowLeft
          size={13}
          weight="light"
          aria-hidden="true"
          className="ease-fluid transition-transform duration-500 group-hover:-translate-x-0.5"
        />
        메인으로
      </Link>
    </div>
  );
}

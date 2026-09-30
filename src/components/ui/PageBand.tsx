import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * 내용 페이지의 제목 띠 — 와인 면.
 *
 * 와인 + 크림 시안의 규칙: 제목 띠만 와인, 읽고 고르는 본문은 크림.
 * 와인은 "여기부터 이 페이지" 를 알리는 띠로만 쓴다. 이 아래는 `<div className="on-cream">`.
 *
 * 와인 면 위에서는 기본 토큰이 그대로다 — 글자 크림, 강조(Eyebrow) 골드.
 */
export function PageBand({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  /** 오른쪽 끝에 놓을 것 (필터 칩 등). 모바일에서는 제목 아래로 내려온다. */
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-stage">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-15 md:py-16">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="text-secondary mt-4 max-w-[48ch] text-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  );
}

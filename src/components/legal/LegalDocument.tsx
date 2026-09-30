import { CaretDown } from "@phosphor-icons/react/dist/ssr";

import type { Clause, LegalDocument as LegalDoc } from "@/data/terms";
import { pendingLabel } from "@/lib/pending";

/**
 * 약관 · 방침 문서.
 *
 * 법률 문서의 번호 체계를 그대로 그린다: 제N조 → ①② 항 → 1. 2. 호.
 * 번호는 데이터가 아니라 순서에서 나온다 — 조항을 끼워 넣어도 번호가 어긋나지 않는다.
 * (본문 속 "제N조" 참조는 글자라 따라오지 않는다. terms.ts 머리말 참고)
 *
 * 조항 목록은 <details> 로 접어 둔다. 25개를 펼쳐 두면 본문이 한 화면 아래로 밀린다.
 * 각 조항은 #article-N 으로 바로 들어올 수 있다 — CS 에서 "제16조 보세요" 하고 링크를 준다.
 */

const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫";

function ClauseBody({ clause }: { clause: Clause }) {
  if (typeof clause === "string") return <>{clause}</>;
  return (
    <>
      {clause.text}
      <ol className="mt-2 flex flex-col gap-1.5">
        {clause.items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-muted w-5 shrink-0 text-right tabular-nums">{i + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <div className="mx-auto max-w-[800px] px-5 py-12 md:px-15 md:py-16">
      <details className="border-subtle bg-surface group rounded-2xl border px-5 md:px-7">
        <summary className="text-primary flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span>조항 목록 ({doc.articles.length})</span>
          <CaretDown
            size={14}
            weight="light"
            aria-hidden="true"
            className="text-accent ease-fluid shrink-0 transition-transform duration-300 group-open:rotate-180"
          />
        </summary>
        <ol className="grid gap-x-6 pb-5 sm:grid-cols-2">
          {doc.articles.map((article, i) => (
            <li key={article.title}>
              <a
                href={`#article-${i + 1}`}
                className="text-secondary hover:text-accent ease-fluid flex min-h-10 items-center text-xs transition-colors duration-300"
              >
                제{i + 1}조 {article.title}
              </a>
            </li>
          ))}
        </ol>
      </details>

      <div className="mt-12 flex flex-col gap-10">
        {doc.articles.map((article, i) => {
          const numbered = article.clauses.length > 1;
          return (
            <section
              key={article.title}
              aria-labelledby={`article-${i + 1}`}
              className="scroll-mt-32"
            >
              <h2
                id={`article-${i + 1}`}
                className="text-primary text-(length:--fs-base) font-medium"
              >
                제{i + 1}조 ({article.title})
              </h2>
              <div className="text-secondary mt-3 flex flex-col gap-2.5 text-sm leading-relaxed">
                {article.clauses.map((clause, j) =>
                  numbered ? (
                    <div key={j} className="flex gap-2">
                      <span className="text-muted shrink-0">{CIRCLED[j]}</span>
                      <div className="min-w-0">
                        <ClauseBody clause={clause} />
                      </div>
                    </div>
                  ) : (
                    <div key={j}>
                      <ClauseBody clause={clause} />
                    </div>
                  ),
                )}
              </div>
            </section>
          );
        })}

        <section aria-labelledby="addenda" className="border-subtle border-t pt-10">
          <h2 id="addenda" className="text-primary text-(length:--fs-base) font-medium">
            부칙
          </h2>
          <p className="text-secondary mt-3 text-sm leading-relaxed">
            {doc.effectiveDate ? (
              `이 약관은 ${doc.effectiveDate}부터 시행합니다.`
            ) : (
              <span className="text-muted">{pendingLabel("시행일")}</span>
            )}
          </p>
        </section>
      </div>
    </div>
  );
}

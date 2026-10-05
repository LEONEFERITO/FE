import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { SLOGAN } from "@/data/brand";

/**
 * 메인 둘째 화면 — 브랜드 문장 + 브랜드 이용 메뉴얼 (2026-10-05 고객 디자인 가이드).
 *
 * 시안은 검은 바탕에 문장 두 줄, 그 아래 "브랜드 이용 메뉴얼" 과 EX) 목록이다. EX) 는 화면에 그대로
 * 쓸 문구가 아니라 **메뉴얼이 다뤄야 할 주제의 예시**다 — 그 여섯 주제는 이미 이용 안내(/guide)의
 * 카드 여섯 장으로 있다. 그래서 여기서는 주제를 나열하고 각각을 그 카드로 보낸다.
 * 같은 내용을 메인에 한 번 더 길게 적으면 두 곳이 갈라진다.
 *
 * 주제 문구는 고객이 적은 말을 그대로 옮겼다 ("주문 후 제작 방식", "본인에게 맞는 사이즈…").
 * 바탕은 시안의 검정이 아니라 이 사이트의 가장 깊은 와인(바닥색)이다 — 검정은 팔레트 밖의 색이다.
 */

/** id 는 /guide 의 카드 id 와 짝이다 (app/guide/page.tsx). */
const TOPICS = [
  { id: "order", label: "주문 후 제작", note: "주문 후 제작 방식으로 진행되는 점에 대한 안내" },
  { id: "lines", label: "라인별 핏", note: "제품별로 의도하는 핏 — 레오네 · 페리토" },
  { id: "size", label: "사이즈 고르는 법", note: "본인에게 맞는 사이즈의 제품을 선택하는 방법" },
  { id: "alteration", label: "수령 후 수선", note: "제품 수령 시 본인에게 맞게 수선하는 방법" },
  { id: "care", label: "관리법", note: "제품 수령 시 잘 관리하는 방법" },
  { id: "custom", label: "맞춤 제작", note: "맞춤 제작을 희망하시면 테일러샵 방문 안내" },
] as const;

export function BrandManual() {
  return (
    <section aria-labelledby="manual-heading" className="border-subtle border-b">
      <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-15 md:py-36">
        {/* 브랜드 문장. 두 줄을 줄 단위로 끊는다 — 한 문단으로 흘리면 좁은 화면에서 어절 중간이 갈린다 */}
        <p className="font-display text-primary leading-display tracking-display mx-auto max-w-[980px] text-center text-xl md:text-3xl">
          {SLOGAN.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>

        <div className="mt-20 md:mt-28">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <Eyebrow>MANUAL</Eyebrow>
              <h2
                id="manual-heading"
                className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl"
              >
                브랜드 이용 메뉴얼
              </h2>
              <p className="text-secondary mt-4 max-w-xl text-sm md:text-(length:--fs-base)">
                레오네페리토를 어떻게 이용하면 좋은지 안내합니다.
              </p>
            </div>
            <Link
              href="/guide/"
              className="group border-interactive text-accent hover:border-accent hover:bg-accent-tint ease-fluid tracking-button text-2xs inline-flex min-h-11 items-center gap-2.5 rounded-full border px-6 transition-all duration-500"
            >
              이용 안내 전체 보기
              <ArrowRight
                size={13}
                weight="light"
                aria-hidden="true"
                className="ease-fluid transition-transform duration-500 group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <ol className="border-subtle mt-10 grid border-t sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((topic, i) => (
              <li key={topic.id} className="border-subtle border-b sm:[&:nth-child(odd)]:border-r lg:border-r lg:[&:nth-child(3n)]:border-r-0">
                <Link
                  href={`/guide/#${topic.id}`}
                  className="group ease-fluid hover:bg-band flex h-full min-h-[132px] flex-col justify-between gap-6 p-6 transition-colors duration-500 md:p-8"
                >
                  <span className="text-accent text-2xs tracking-label tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="font-display text-primary group-hover:text-accent ease-fluid block text-xl transition-colors duration-500">
                      {topic.label}
                    </span>
                    <span className="text-secondary mt-2 block text-sm leading-relaxed">{topic.note}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

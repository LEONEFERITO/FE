import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/motion/Reveal";
import { shareMetadata } from "@/lib/metadata";

/**
 * 가이드 (2026-10-28 디자이너 피그마 "Guide" 페이지) — 헤더 맨 앞 "Guide".
 *
 *   Find your Fit            LEONE · FERITO 두 라인 비교(특징 · 추천 체형)
 *   Size Selection Guide     라인별 권장 체중 → 브랜드 사이즈 표
 *   Length Adjustment Guide  기장 수선 안내
 *   개인 맞춤 제작 서비스 안내 더맨리 맞춤 안내
 *
 * 글 · 수치는 시안 그대로다. 사이즈 표는 손님 주문에 바로 쓰이는 값이라 시안에서 옮긴 그대로 두고, 바뀌면 여기만 고친다.
 * 노란 형광 표시는 시안의 강조(<mark>)다. 글꼴은 Inria Serif + Noto Sans KR(main 에 한 번).
 */
export const metadata: Metadata = shareMetadata({
  title: "가이드",
  description:
    "레오네페리토 가이드 — LEONE(클래식) · FERITO(애슬레틱) 라인 비교, 체중에 따른 사이즈 선택표, 기장 수선 안내, 더맨리 개인 맞춤 제작 서비스.",
  path: "/guide/",
});

const WINE = "#5E1F21";

const LINES = [
  {
    name: "LEONE",
    feature: "절제된 실루엣과 클래식한 미학을 담아낸 라인",
    body: "일반체형 / 표준체형 / 평균체형",
  },
  {
    name: "FERITO",
    feature: "운동형 체형의 입체적인 실루엣과 조형미를 역동적으로 담아낸 라인",
    body: "운동형체형 / 근육형체형 / 근육발달형체형 / 역삼각형체형",
  },
] as const;

interface SizeTable {
  line: string;
  kind: string;
  weights: string[];
  rows: { item: string; sizes: string[] }[];
}

/** 시안의 사이즈 표 그대로 (2026-10-28). "-" 는 그 체중대에 사이즈가 없다는 뜻 */
const SIZE_TABLES: SizeTable[] = [
  {
    line: "LEONE",
    kind: "클래식 라인",
    weights: ["60~65kg", "65~70kg", "70~75kg", "75~80kg", "80~85kg", "85~90kg"],
    rows: [
      { item: "셔츠", sizes: ["XS", "S", "M", "L", "XL", "2XL"] },
      { item: "자켓", sizes: ["S", "M", "L", "XL", "2XL", "-"] },
      { item: "베스트", sizes: ["XS", "S", "M", "L", "XL", "-"] },
      { item: "팬츠", sizes: ["XS", "S", "M", "L", "XL", "-"] },
    ],
  },
  {
    line: "FERITO",
    kind: "애슬레틱 라인",
    weights: ["60~65kg", "65~70kg", "70~75kg", "75~80kg", "80~85kg", "85~90kg", "90~100kg", "110kg+"],
    rows: [
      { item: "셔츠", sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "EX"] },
      { item: "자켓", sizes: ["-", "S", "M", "L", "XL", "2XL", "3XL", "EX"] },
      { item: "팬츠", sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "EX"] },
    ],
  },
];

/** 제품별 제작 소요기간 — 시안 그대로 (2026-10-28) */
const LEAD_TIMES = [
  { items: "자켓 / 팬츠 / 베스트", time: "14~18일" },
  { items: "셔츠 / 구두 / 로퍼", time: "7~10일" },
  { items: "넥타이", time: "바로 출고" },
];

/** 시안의 노란 형광 강조 */
function Hl({ children }: { children: React.ReactNode }) {
  return <mark className="bg-[#E9CD8C]/80 text-inherit box-decoration-clone px-0.5">{children}</mark>;
}

/**
 * 구간 — 왼쪽 와인 세로 막대 + 영문 작은 제목 + 한글 제목.
 * {@code bar={false}} — 막대 없이 왼쪽에 붙인다(2026-10-28 디자이너: Find your Fit · Size Selection 은 "세로 라인 도형 없애고 왼쪽으로").
 */
function Section({ id, en, ko, bar = true, children }: { id: string; en?: string; ko: string; bar?: boolean; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className={bar ? "relative pl-5 md:pl-7" : "relative"}>
      {bar && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[6px]" style={{ background: WINE }} />}
      <h2 id={id} className="text-primary">
        {en && <span className="block text-[15px] leading-tight md:text-[17px]">{en}</span>}
        {ko && <span className="block text-[17px] font-bold leading-snug md:text-[19px]">{ko}</span>}
      </h2>
      <div className={ko ? "mt-8" : "mt-5"}>{children}</div>
    </section>
  );
}

export default function GuidePage() {
  return (
    <>
      <Header />

      {/* 글꼴은 페이지 전체가 Inria Serif(영문 · 숫자) + Noto Sans KR(한글) — 2026-10-28 디자이너 "Inria Serif" (globals --font-card) */}
      <main id="main" className="on-cream on-white flex-1 bg-white font-[family-name:var(--font-card)]">
        {/* 머리 띠 — 시안의 와인 판. 헤더(와인)와 이어진다 */}
        <div className="on-black" style={{ background: "#4A1517" }}>
          <div className="mx-auto max-w-[1100px] px-5 py-14 md:px-10 md:py-20">
            <h1 className="text-[32px] font-bold leading-tight text-white md:text-[40px]">가이드</h1>
            <p className="mt-4 text-[13px] text-white/80">레오네 페리토를 더 잘 이용하는 방법</p>
          </div>
        </div>

        <div className="text-primary mx-auto flex max-w-[1100px] flex-col gap-24 px-5 py-16 md:gap-32 md:px-10 md:py-24">
          {/* ── Find your Fit ── */}
          <Reveal>
            <Section id="guide-fit" bar={false} en="Find your Fit" ko="자신에게 가장 잘 맞는 핏을 찾아가는 과정">
              <p className="text-center text-[26px] md:text-[34px]" style={{ color: "#3B3533" }}>
                LEONE FERITO
              </p>
              {/* 가운데 이름에서 두 라인으로 갈라지는 선 — PC 만 */}
              <svg aria-hidden="true" viewBox="0 0 1000 60" preserveAspectRatio="none" className="mt-2 hidden h-12 w-full md:block">
                <path d="M500 2 L125 58 M500 2 L875 58" stroke="#C9C2BE" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
              </svg>

              {/* PC: [LEONE] [질문] [FERITO] 세 칸 · 폰: 라인마다 한 묶음 */}
              <div className="mt-6 hidden grid-cols-[1fr_200px_1fr] text-[13px] md:mt-0 md:grid">
                <p className="py-3 text-center text-[17px] text-white" style={{ background: WINE }}>LEONE</p>
                <span />
                <p className="py-3 text-center text-[17px] text-white" style={{ background: WINE }}>FERITO</p>

                <p className="border-b border-white bg-[#EBEBEB] px-4 py-3.5 text-center font-medium">{LINES[0].feature}</p>
                <p className="text-secondary flex items-center justify-center gap-2 px-2 text-center text-[12px]">
                  <span aria-hidden="true">←</span>특징이 뭔가요?<span aria-hidden="true">→</span>
                </p>
                <p className="border-b border-white bg-[#EBEBEB] px-4 py-3.5 text-center font-medium">{LINES[1].feature}</p>

                <p className="bg-[#EBEBEB] px-4 py-3.5 text-center font-medium">{LINES[0].body}</p>
                <p className="text-secondary flex items-center justify-center gap-2 px-2 text-center text-[12px]">
                  <span aria-hidden="true">←</span>어떤 사람에게 추천하나요?<span aria-hidden="true">→</span>
                </p>
                <p className="bg-[#EBEBEB] px-4 py-3.5 text-center font-medium">{LINES[1].body}</p>
              </div>

              <div className="mt-6 flex flex-col gap-6 md:hidden">
                {LINES.map((l) => (
                  <dl key={l.name} className="text-[13px]">
                    <dt className="py-3 text-center text-[17px] text-white" style={{ background: WINE }}>
                      {l.name}
                    </dt>
                    <dd className="border-b border-white bg-[#EBEBEB] px-4 py-3">
                      <span className="text-secondary block text-[11px]">특징이 뭔가요?</span>
                      <span className="font-medium">{l.feature}</span>
                    </dd>
                    <dd className="bg-[#EBEBEB] px-4 py-3">
                      <span className="text-secondary block text-[11px]">어떤 사람에게 추천하나요?</span>
                      <span className="font-medium">{l.body}</span>
                    </dd>
                  </dl>
                ))}
              </div>
            </Section>
          </Reveal>

          {/* ── Size Selection Guide ── */}
          <Reveal>
            <Section id="guide-size" bar={false} en="Size Selection Guide" ko="체형에 따른 최적의 사이즈 선택 가이드">
              <div className="flex flex-col gap-12">
                {SIZE_TABLES.map((t) => (
                  <div key={t.line}>
                    <p className="flex items-baseline gap-2">
                      <span className="text-[20px]">{t.line}</span>
                      <span className="text-secondary text-[12px]">{t.kind}</span>
                    </p>
                    {/* 폰에서는 표만 옆으로 밀린다 — 페이지 전체가 넘치지 않게 */}
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[640px] border-collapse text-center text-[12px]">
                        <caption className="sr-only">
                          {t.line} {t.kind} — 권장 체중별 브랜드 사이즈
                        </caption>
                        <thead>
                          <tr className="border-b border-[#D9D9D9] bg-[#F5F5F5]">
                            <td className="w-[60px]" />
                            {/* 체중 숫자는 "권장 체중" 과 같은 고딕(2026-10-28 디자이너) */}
                            <th scope="col" className="w-[90px] py-2.5 font-sans font-medium">권장 체중</th>
                            {t.weights.map((w) => (
                              <th key={w} scope="col" className="py-2.5 font-sans font-normal">
                                {w}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {t.rows.map((r, i) => (
                            <tr key={r.item} className="border-b border-[#E3E3E3]">
                              {i === 0 && (
                                <th scope="rowgroup" rowSpan={t.rows.length} className="text-secondary px-2 font-normal leading-snug">
                                  브랜드
                                  <br />
                                  사이즈
                                </th>
                              )}
                              <th scope="row" className="bg-[#D9D9D9] py-2.5 font-bold">
                                {r.item}
                              </th>
                              {r.sizes.map((s, k) => (
                                <td key={k} className="py-2.5">
                                  {s === "-" ? <span aria-label="없음">-</span> : s}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </Reveal>

          {/* ── Made To Order (2026-10-28 디자이너 추가) ── */}
          <Reveal>
            <Section id="guide-order" en="Made To Order" ko="">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col text-[13px] leading-[1.75]">
                  <p>
                    본 제품은 고객님의 주문이 확인된 후, 제작을 시작하는 <Hl><b>‘오더 메이드 제품’</b></Hl>입니다.
                  </p>
                  <p>한 벌의 완성을 위해 필요한 제작 기간을 거쳐, 정성스럽게 준비해 전해드립니다. 주문 전 제작 및 배송 일정을 확인해 주시기 바랍니다.</p>
                </div>
                <h3 className="text-[17px] font-bold leading-snug md:text-[19px]">제품별 오더 후, 제작 소요기간 안내</h3>
                <table className="-mt-3 w-full max-w-[360px] border-collapse text-center text-[13px]">
                  <caption className="sr-only">제품별 오더 후 제작 소요기간</caption>
                  <tbody>
                    {LEAD_TIMES.map((r) => (
                      <tr key={r.items} className="border-b border-[#E3E3E3]">
                        <th scope="row" className="w-1/2 bg-[#D9D9D9] py-2.5 font-bold">
                          {r.items}
                        </th>
                        <td className="py-2.5">{r.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </Reveal>

          {/* ── Length Adjustment Guide ── */}
          <Reveal>
            <Section id="guide-length" en="Length Adjustment Guide" ko="기장 수선 가이드">
              <div className="flex flex-col text-[13px] leading-[1.75]">
                <p>
                  레오네페리토는{" "}
                  <Hl>
                    고객 개개인의 신체 비율과 선호하는 실루엣에 따라 가장 이상적인 핏을 완성할 수 있도록, 재킷과 팬츠의 기장에 의도적인 여유를 두어
                    제작
                  </Hl>
                  합니다.
                </p>
                <p>
                  이는 동일한 사이즈를 착용하더라도 개인마다 팔의 길이, 다리의 비율, 선호하는 착용 스타일이 다르다는 점을 고려한 레오네페리토만의 제작
                  방식입니다.
                </p>
                <p>
                  따라서 제품 수령 시 소매나 팬츠의 기장이 다소 길게 느껴질 수 있으며, 이는 제작상의 오류가 아닌{" "}
                  <b>고객 개인에게 최적화된 핏을 완성하기 위한 의도적인 설계입니다.</b>
                </p>
                <p>제품 수령 후에는 실제 착용하실 셔츠와 신발을 함께 착용한 상태에서 전체적인 실루엣과 신체 비율을 확인하시고,</p>
                <p>
                  <Hl>전문 수선점을 통해 개인에게 적합한 길이로 조정하시는 것을 권장</Hl>합니다.
                </p>
                <p>
                  <b>레오네페리토는 정해진 기장에 고객의 신체를 맞추기보다, 고객의 신체에 맞춰 가장 이상적인 실루엣을 완성하는 것을 지향합니다.</b>
                </p>
              </div>
            </Section>
          </Reveal>

          {/* ── 개인 맞춤 제작 서비스 안내 ── */}
          <Reveal>
            <Section id="guide-bespoke" ko="개인 맞춤 제작 서비스 안내">
              <div className="flex flex-col text-[13px] leading-[1.75]">
                <p>
                  레오네페리토(LEONEFERITO)는 전문 테일러샵 더맨리(THE MANLY)의 테일러링 기술과 제작 경험을 기반으로 탄생한 남성 포멀웨어
                  브랜드입니다.
                </p>
                <p>
                  기성 사이즈의 범위를 넘어, 고객 개개인의 신체 구조와 비율, 선호하는 실루엣을 더욱 정교하게 반영한{" "}
                  <Hl>
                    맞춤 제작을 희망하시는 경우, 테일러샵 더맨리에 직접 방문하여 전문적인 상담과 체촌을 통해 제품을 제작하시는 것을 권장
                  </Hl>
                  합니다.
                </p>
                <p>
                  더맨리는 고객의 신체적 특성과 미적 취향을 면밀하게 분석하여, 원단 선택부터 디자인 구성, 패턴 설계 및 피팅에 이르기까지 개인에게
                  최적화된 테일러링 서비스를 제공합니다.
                </p>
                <p>
                  <b>레오네페리토가 추구하는 테일러링의 가치를, 더맨리의 전문적인 맞춤 제작 서비스를 통해 더욱 정교하게 경험해 보시기 바랍니다.</b>
                </p>
              </div>
            </Section>
          </Reveal>
        </div>
      </main>

      <Footer />
    </>
  );
}

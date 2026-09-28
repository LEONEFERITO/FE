import {
  ArrowDown,
  ArrowUp,
  Minus,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { Eyebrow } from "@/components/ui/Eyebrow";

import {
  DIRECTION_LABEL,
  FIT_COMPARISON,
  FIT_COMPARISON_BASIS,
} from "@/data/fit";
import { LINE_LABEL, type ProductLine } from "@/types/product";

/**
 * 라인 비교 — 레오네와 페리토가 무엇이 다른지 **문장이 아니라 표**로 보여준다.
 *
 * "체형별 패턴을 나눕니다" 는 아무 브랜드나 할 수 있는 말이다.
 * 같은 사이즈에서 어깨가 몇 cm 더 넓고 허리가 몇 cm 더 잡히는지가 그 말의 증거다.
 *
 * ── 지금 수치가 비어 있는 것에 대해 ────────────────────
 * 실측값(B-4)이 아직 없다. 숫자를 지어내지 않고 **패턴의 방향만** 먼저 보여준다.
 * 방향은 고객이 직접 말한 것이라 지어낸 값이 아니다.
 * 수치가 들어오면 cm 칸만 채워지고 표 구조는 그대로다.
 *
 * ── 색만으로 알리지 않는다 (WCAG 1.4.1) ────────────────
 * 이 브랜드는 따뜻한 색이 이미 다 쓰였다 (고동 25° · 경고 34.5° · 골드 41°).
 * 그래서 넓힘/좁힘을 색으로 구분하지 않고 **아이콘과 낱말** 을 같이 쓴다.
 */

const LINES: ProductLine[] = ["LEONE", "FERITO"];

/** 넓힘/좁힘/표준. 색이 아니라 **모양**으로 갈린다 — 옆의 낱말과 함께 읽힌다. */
const DIRECTION_ICON = {
  wider: ArrowUp,
  narrower: ArrowDown,
  standard: Minus,
} as const;

export function FitCompare() {
  const hasNumbers = FIT_COMPARISON.some((r) =>
    LINES.some((f) => r.cm[f] !== null),
  );

  return (
    <section
      className="bg-band border-subtle border-y"
      aria-labelledby="fit-compare-heading"
    >
      <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-15 md:py-32">
        <Eyebrow>FIT</Eyebrow>
        <h2
          id="fit-compare-heading"
          className="font-display text-primary leading-display tracking-display mt-3 max-w-2xl text-3xl md:text-4xl"
        >
          같은 사이즈, 다른 패턴
        </h2>
        <p className="text-secondary mt-5 max-w-2xl text-sm">
          어깨·가슴·허벅지는 끼는데 허리는 남는다면 문제는 체형이 아니라
          패턴입니다. 페리토 라인은 그 네 곳을 레오네와 다르게 잡습니다.
        </p>

        {/* 바깥 껍데기 + 안쪽 알맹이 — 표를 배경에 납작하게 얹지 않는다 */}
        <div className="border-subtle bg-band/60 shadow-soft mt-12 min-w-0 rounded-2xl border p-1.5">
          <div className="bg-surface min-w-0 overflow-x-auto rounded-[calc(1rem-0.375rem)]">
            <table className="w-full min-w-[540px] border-collapse">
              <caption className="sr-only">
                레오네 라인과 페리토 라인의 부위별 패턴 차이
              </caption>
              <thead>
                <tr className="border-subtle border-b">
                  <th
                    scope="col"
                    className="text-muted text-2xs tracking-label px-5 py-4 text-left font-medium"
                  >
                    부위
                  </th>
                  {LINES.map((f) => (
                    <th
                      key={f}
                      scope="col"
                      className="text-muted text-2xs px-5 py-4 text-center font-medium"
                    >
                      <span className="tracking-label block">
                        {LINE_LABEL[f].en}
                      </span>
                      <span className="text-muted/80 mt-1 block">
                        {LINE_LABEL[f].ko}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIT_COMPARISON.map((row, i) => (
                  <tr
                    key={row.key}
                    className={i > 0 ? "border-subtle border-t" : ""}
                  >
                    <th scope="row" className="px-5 py-5 text-left">
                      <span className="text-primary block text-sm font-medium">
                        {row.label}
                      </span>
                      {/* 어디를 재는지 밝히지 않으면 숫자가 와도 해석이 갈린다 */}
                      <span className="text-muted mt-1 block text-2xs">
                        {row.how}
                      </span>
                    </th>

                    {LINES.map((f) => {
                      const dir = DIRECTION_LABEL[row.direction[f]];
                      const DirectionIcon = DIRECTION_ICON[row.direction[f]];
                      const cm = row.cm[f];
                      const emphasised = row.direction[f] !== "standard";
                      return (
                        <td key={f} className="px-5 py-5 text-center">
                          <span
                            className={`text-2xs inline-flex items-center gap-1.5 ${
                              emphasised ? "text-accent-deep" : "text-muted"
                            }`}
                          >
                            <DirectionIcon
                              size={12}
                              weight="light"
                              aria-hidden="true"
                            />
                            <span>{dir.text}</span>
                          </span>
                          <span className="text-secondary mt-1.5 block text-sm tabular-nums">
                            {cm !== null ? (
                              `${cm} cm`
                            ) : (
                              <span className="text-muted">·</span>
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-muted mt-5 text-2xs leading-relaxed">
          {FIT_COMPARISON_BASIS
            ? `${FIT_COMPARISON_BASIS} 사이즈 기준`
            : "비교 기준 사이즈 확인 중"}
        </p>

        {!hasNumbers && (
          <p className="text-warning mt-2 flex gap-1.5 text-2xs">
            {/* 색만으로 알리지 않는다 — 경고색과 브랜드 고동색은 색상환에서 9.5° 차이뿐이다 */}
            <Warning
              size={14}
              weight="light"
              aria-hidden="true"
              className="mt-px shrink-0"
            />
            <span>
              {/* 값이 오면 채워질 자리: CLIENT_QUESTIONS.md B-4 */}
              부위별 실측값이 아직 등록되지 않았습니다. 방향만 표시 중이며,
              수치가 들어오면 이 표가 이 브랜드의 가장 강한 근거가 됩니다.
            </span>
          </p>
        )}
      </div>
    </section>
  );
}

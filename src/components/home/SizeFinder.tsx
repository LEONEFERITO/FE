"use client";

import { Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useId, useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";

import { BODY_SIZE_CHART, MEASURE_GUIDE } from "@/data/fit";
import { FIT_LABEL, type FitType } from "@/types/product";

/**
 * 사이즈 찾기 — 몸 치수 두 개로 사이즈를 권한다.
 *
 * 이 사이트에서 가장 값어치 있는 기능이 될 수 있다. 사진으로 고르는 사람은
 * 사이즈에서 막히고, 막히면 사거나 안 사거나가 아니라 **교환** 이 된다.
 *
 * ── 기준표가 비어 있을 때 폼을 내지 않는 이유 ──────────
 * 답할 수 없는 질문을 던지는 입력창은 없는 것보다 나쁘다. 사용자는 숫자를 재서
 * 넣고 나서야 "계산할 수 없습니다" 를 본다. 그래서 기준표(B-3·B-4)가 오기 전에는
 * 폼을 감추고, 지금 당장 쓸모 있는 것 — **재는 법** — 만 남긴다.
 * 계산 로직은 여기 그대로 있으므로 데이터가 들어오는 날 폼이 살아난다.
 *
 * ── 왜 "범위 밖" 을 따로 말하는가 ──────────────────────
 * 어느 사이즈에도 안 걸리는 몸은 실제로 있다. 그때 가장 가까운 사이즈를 슬쩍
 * 권하면 그 사람은 안 맞는 옷을 받는다. 맞는 게 없으면 없다고 말하고 문의로 보낸다.
 */

const FITS: FitType[] = ["ATHLETIC", "REGULAR"];

/** 사람 몸 치수의 상식 범위. 밖이면 단위를 잘못 넣었을 가능성이 높다(인치·mm). */
const LIMITS = {
  shoulder: { min: 30, max: 70, label: "어깨" },
  chest: { min: 70, max: 150, label: "가슴" },
} as const;

type Field = keyof typeof LIMITS;

function inRange(value: number, range: [number, number] | null) {
  return range !== null && value >= range[0] && value <= range[1];
}

export function SizeFinder() {
  const shoulderId = useId();
  const chestId = useId();

  const [fit, setFit] = useState<FitType>("ATHLETIC");
  const [shoulder, setShoulder] = useState("");
  const [chest, setChest] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const chart = BODY_SIZE_CHART[fit];
  const ready = chart.length > 0;

  const parse = (
    raw: string,
    field: Field,
  ): { value: number | null; error: string | null } => {
    if (raw.trim() === "") return { value: null, error: "값을 입력해 주세요" };
    const n = Number(raw);
    if (!Number.isFinite(n))
      return { value: null, error: "숫자만 입력해 주세요" };
    const { min, max, label } = LIMITS[field];
    if (n < min || n > max) {
      return {
        value: null,
        error: `${label}는 ${min}~${max}cm 사이로 입력해 주세요`,
      };
    }
    return { value: n, error: null };
  };

  const s = parse(shoulder, "shoulder");
  const c = parse(chest, "chest");

  const match =
    s.value !== null && c.value !== null
      ? (chart.find(
          (row) =>
            inRange(s.value!, row.shoulder) && inRange(c.value!, row.chest),
        ) ?? null)
      : null;

  return (
    <section
      className="mx-auto max-w-[1320px] px-5 py-24 md:px-15 md:py-32"
      aria-labelledby="size-finder-heading"
    >
      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <Eyebrow>SIZE FINDER</Eyebrow>
          <h2
            id="size-finder-heading"
            className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl"
          >
            내 사이즈 찾기
          </h2>
          <p className="text-secondary mt-5 text-sm">
            두 곳만 재면 됩니다. 옷의 치수가 아니라{" "}
            <strong className="text-primary">몸의 치수</strong>
            입니다.
          </p>

          <dl className="mt-10 flex flex-col gap-7">
            {MEASURE_GUIDE.map((m) => (
              <div key={m.key} className="border-subtle border-t pt-5">
                <dt className="text-primary text-sm font-medium">{m.label}</dt>
                <dd className="text-secondary mt-2 text-sm leading-relaxed">
                  {m.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border-subtle bg-band/60 shadow-soft min-w-0 rounded-2xl border p-1.5">
          <div className="bg-surface rounded-[calc(1rem-0.375rem)] px-7 py-8">
            {ready ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                noValidate
              >
                <fieldset className="flex flex-wrap items-center gap-2">
                  <legend className="text-muted text-2xs tracking-label mb-2 w-full">
                    핏
                  </legend>
                  {FITS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={fit === f}
                      onClick={() => setFit(f)}
                      className={`ease-fluid text-2xs inline-flex min-h-[44px] items-center rounded-full border px-4 transition-all duration-300 md:min-h-0 md:py-2 ${
                        fit === f
                          ? "border-velvet bg-velvet-tint text-velvet-deep shadow-soft"
                          : "border-subtle text-secondary hover:border-velvet"
                      }`}
                    >
                      {FIT_LABEL[f].ko}
                    </button>
                  ))}
                </fieldset>

                <div className="mt-7 flex flex-col gap-5">
                  {[
                    {
                      id: shoulderId,
                      field: "shoulder" as Field,
                      value: shoulder,
                      set: setShoulder,
                      state: s,
                    },
                    {
                      id: chestId,
                      field: "chest" as Field,
                      value: chest,
                      set: setChest,
                      state: c,
                    },
                  ].map(({ id, field, value, set, state }) => (
                    <div key={field}>
                      <label
                        htmlFor={id}
                        className="text-secondary block text-2xs"
                      >
                        {LIMITS[field].label} (cm)
                      </label>
                      <input
                        id={id}
                        inputMode="decimal"
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        aria-invalid={submitted && state.error !== null}
                        aria-describedby={
                          submitted && state.error ? `${id}-error` : undefined
                        }
                        className="border-interactive text-primary focus-visible:border-accent mt-2 w-full rounded-lg border bg-transparent px-4 py-3 text-sm tabular-nums"
                      />
                      {/* 오류는 색이 아니라 글자로 말한다. 필드 바로 아래에 둔다 — 토스트는 놓친다. */}
                      {submitted && state.error && (
                        <p
                          id={`${id}-error`}
                          className="text-error mt-2 flex gap-1.5 text-2xs"
                        >
                          <Warning
                            size={14}
                            weight="light"
                            aria-hidden="true"
                            className="mt-px shrink-0"
                          />
                          <span>{state.error}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="bg-accent text-on-dark hover:bg-accent-hover shadow-button hover:shadow-button-hover ease-fluid tracking-button mt-7 w-full rounded-full py-3.5 text-sm transition-all duration-500 hover:-translate-y-px active:scale-[0.99]"
                >
                  사이즈 보기
                </button>

                <div aria-live="polite" className="mt-6">
                  {submitted &&
                    !s.error &&
                    !c.error &&
                    (match ? (
                      <p className="bg-accent-tint text-accent-deep rounded-xl px-5 py-4 text-sm">
                        권장 사이즈{" "}
                        <strong className="text-base tabular-nums">
                          {match.size}
                        </strong>
                      </p>
                    ) : (
                      // 맞는 게 없으면 가장 가까운 걸 권하지 않는다 — 그건 교환을 만드는 추천이다.
                      <div className="border-subtle rounded-xl border px-5 py-4">
                        <p className="text-primary text-sm">
                          딱 맞는 사이즈가 없습니다
                        </p>
                        <p className="text-muted mt-2 text-2xs leading-relaxed">
                          체형에 따라 기준표 범위를 벗어날 수 있습니다. 문의
                          주시면 치수를 보고 안내드리겠습니다.
                        </p>
                      </div>
                    ))}
                </div>
              </form>
            ) : (
              /*
                기준표가 아직 없다. 폼을 내지 않는다 — 답할 수 없는 질문이기 때문이다.
                대신 무엇이 있어야 동작하는지 밝히고, 지금 볼 수 있는 곳으로 보낸다.
              */
              <div className="flex flex-col gap-4">
                <Eyebrow>준비 중</Eyebrow>
                <p className="text-primary text-sm leading-relaxed">
                  사이즈 기준표가 등록되면 어깨·가슴 두 값으로 권장 사이즈를
                  바로 알려드립니다.
                </p>
                <p className="text-muted text-2xs leading-relaxed">
                  필요한 것: 사이즈 체계와 사이즈별 실측값.
                  <br />
                  틀린 추천보다 없는 추천이 낫기 때문에, 값이 채워지기 전에는
                  계산하지 않습니다.
                </p>
                <Link
                  href="/products"
                  className="text-accent hover:text-velvet ease-fluid text-2xs mt-2 underline underline-offset-4 transition-colors duration-300"
                >
                  상품별 상세 실측 보기
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

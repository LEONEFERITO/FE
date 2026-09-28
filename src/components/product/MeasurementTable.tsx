import { Warning } from "@phosphor-icons/react/dist/ssr";
import type { MeasurementTable as MeasurementTableType } from "@/types/product";
import { pendingHint } from "@/lib/pending";

/**
 * 상세 실측표 — 이 사이트의 핵심.
 *
 * 사진으로는 "내 몸에 맞는가" 를 판단할 수 없다. 이 표가 그 판단을 대신한다.
 * 그래서 사진 바로 다음, 구매 버튼보다 **위**에 온다.
 *
 * 항목(어깨·가슴·…)이 고정 컬럼이 아니라 데이터인 이유:
 * 카테고리마다 재는 곳이 다르다. 자켓은 어깨·가슴·소매, 팬츠는 허리·허벅지·밑단.
 * (BE 에서 PostgreSQL JSONB 를 고른 이유 — docs/DECISIONS.md D4)
 */

interface Props {
  table: MeasurementTableType;
  /** 선택된 사이즈 행을 강조한다. 표가 길어지면 자기 행을 찾기 어렵다. */
  highlightSize?: string | null;
}

export function MeasurementTable({ table, highlightSize }: Props) {
  const hasAnyValue = table.rows.some((r) =>
    Object.values(r.values).some((v) => v !== null),
  );

  return (
    /*
      min-w-0 이 없으면 표가 컨테이너를 밀어낸다.
      flex/grid 자식의 기본 min-width 는 auto 라 "내용보다 작아지지 않는다" 가 기본이고,
      아래 표의 min-w-[420px] 가 그 내용 크기가 되어 모바일에서 가로 스크롤을 만든다.
      overflow-x-auto 를 걸어도 소용없다 — 넘치는 쪽이 아니라 컨테이너가 커지기 때문이다.
    */
    <section
      className="flex min-w-0 flex-col gap-3.5"
      aria-labelledby="measurements-heading"
    >
      <div className="flex items-baseline justify-between">
        <h2
          id="measurements-heading"
          className="text-primary text-sm font-medium"
        >
          상세 실측
        </h2>
        <span className="text-muted text-2xs tracking-label">CM</span>
      </div>

      {/*
        바깥 껍데기 + 안쪽 알맹이. 표를 배경에 납작하게 얹지 않고 트레이에 담는다 —
        안쪽 반경을 바깥에서 패딩만큼 뺀 값으로 줘야 곡선이 동심원으로 맞는다.
      */}
      <div className="border-subtle bg-band/60 shadow-soft min-w-0 rounded-2xl border p-1.5">
        <div className="bg-surface min-w-0 overflow-x-auto rounded-[calc(1rem-0.375rem)]">
          <table className="w-full min-w-[420px] border-collapse">
            <thead>
              <tr className="border-subtle border-b">
                <th
                  scope="col"
                  className="text-muted px-3 py-3 text-2xs font-medium tracking-label"
                >
                  SIZE
                </th>
                {table.fields.map((f) => (
                  <th
                    key={f.key}
                    scope="col"
                    className="text-muted px-3 py-3 text-2xs font-medium"
                  >
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => {
                const isHighlighted = highlightSize === row.size;
                return (
                  <tr
                    key={row.size}
                    className={`ease-fluid transition-colors duration-500 ${
                      i > 0 ? "border-subtle border-t" : ""
                    } ${isHighlighted ? "bg-velvet-tint" : ""}`}
                  >
                    <th
                      scope="row"
                      className={`px-3 py-3 text-xs font-medium tabular-nums ${
                        isHighlighted ? "text-velvet-deep" : "text-primary"
                      }`}
                    >
                      {row.size}
                    </th>
                    {table.fields.map((f) => (
                      <td
                        key={f.key}
                        className="text-secondary px-3 py-3 text-center text-xs tabular-nums"
                      >
                        {/* 값이 없으면 대시. 추측해서 채우지 않는다 — 틀린 치수는 교환을 늘린다. */}
                        {row.values[f.key] ?? (
                          <span className="text-muted">·</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/*
        측정 기준을 밝히지 않으면 실측표가 오히려 교환을 늘린다.
        둘레인지 단면인지에 따라 값이 2배 차이 나기 때문이다.
      */}
      <p className="text-muted text-2xs leading-relaxed">
        {table.basis ?? pendingHint("측정 기준", "평평히 놓고 잰 단면 기준")}
        {" · "}
        {table.tolerance ?? pendingHint("허용 오차", "±1cm")}
      </p>

      {!hasAnyValue && (
        <p className="text-warning flex gap-1.5 text-2xs">
          {/* 색만으로 알리지 않는다 — 경고색과 브랜드 고동색은 색상환에서 9.5° 차이뿐이다 */}
          <Warning
            size={14}
            weight="light"
            aria-hidden="true"
            className="mt-px shrink-0"
          />
          <span>
            실측값이 아직 등록되지 않았습니다. 이 표가 비어 있으면 이 사이트의
            핵심 기능이 동작하지 않습니다.
          </span>
        </p>
      )}
    </section>
  );
}

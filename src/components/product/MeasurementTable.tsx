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
 *
 * ── 왜 화면 폭이 아니라 **칸 폭**을 보는가 ────────────────
 * 전에는 표를 가로 스크롤 상자에 담았다. 페이지는 안 밀렸지만 표가 오른쪽에서
 * 잘린 채로 보였다. 더 나쁜 건 **1024px 에서도 잘렸다**는 것이다 —
 * 화면은 넓은데 정보 컬럼이 5fr 이라 400px 밖에 안 됐기 때문이다.
 * 즉 이 문제는 화면 크기와 상관이 없다. 미디어 쿼리로는 영원히 못 맞춘다.
 *
 * 그래서 컨테이너 쿼리(@container)를 쓴다. 표는 **자기가 들어앉은 칸**이 좁으면
 * 카드로, 넓으면 표로 그린다. 상세 페이지든 비교 화면이든 어디에 놓아도 맞는다.
 *
 * 두 모양을 다 렌더하고 CSS 로 하나만 보인다. 숨는 쪽은 display:none 이라
 * 접근성 트리에서도 빠지므로 스크린리더가 같은 내용을 두 번 읽지 않는다.
 */

interface Props {
  table: MeasurementTableType;
  /** 선택된 사이즈 행을 강조한다. 표가 길어지면 자기 행을 찾기 어렵다. */
  highlightSize?: string | null;
}

/** 값이 없으면 대시. 추측해서 채우지 않는다 — 틀린 치수는 교환을 늘린다. */
function Value({ value }: { value: string | number | null }) {
  if (value === null || value === undefined) {
    return <span className="text-muted">·</span>;
  }
  return <>{value}</>;
}

export function MeasurementTable({ table, highlightSize }: Props) {
  const hasAnyValue = table.rows.some((r) =>
    Object.values(r.values).some((v) => v !== null),
  );

  return (
    /*
      min-w-0 이 없으면 표가 컨테이너를 밀어낸다.
      flex/grid 자식의 기본 min-width 는 auto 라 "내용보다 작아지지 않는다" 가 기본이다.
    */
    <section
      className="@container flex min-w-0 flex-col gap-3.5"
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
        {/* ── 좁은 칸: 사이즈마다 한 덩어리 ──────────────────
            5열 숫자표를 335px 에 밀어 넣으면 읽을 수 없다. 옆으로 밀어서 보게 하는 것도
            표의 왼쪽(사이즈)과 오른쪽(값)을 동시에 못 보게 만들어 비교가 안 된다.
            사이즈를 제목으로 올리고 부위를 그 아래 나열하면 스크롤 없이 다 읽힌다. */}
        <ul className="bg-surface flex flex-col rounded-[calc(1rem-0.375rem)] @md:hidden">
          {table.rows.map((row, i) => {
            const isHighlighted = highlightSize === row.size;
            return (
              <li
                key={row.size}
                className={`ease-fluid px-4 py-3.5 transition-colors duration-500 ${
                  i > 0 ? "border-subtle border-t" : ""
                } ${isHighlighted ? "bg-accent-tint" : ""}`}
              >
                <p
                  className={`text-xs font-medium tabular-nums ${
                    isHighlighted ? "text-accent" : "text-primary"
                  }`}
                >
                  {row.size}
                </p>

                {/* 부위 : 값 을 2열로. dl 이라 "이름과 값" 관계가 구조로 남는다 */}
                <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {table.fields.map((f) => (
                    <div
                      key={f.key}
                      className="flex items-baseline justify-between gap-2"
                    >
                      <dt className="text-muted text-2xs">{f.label}</dt>
                      <dd className="text-secondary text-xs tabular-nums">
                        <Value value={row.values[f.key]} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ul>

        {/* ── 넓은 칸: 원래의 표 ─────────────────────────────
            숫자를 세로로 줄 세워 비교하는 건 표가 가장 잘한다. 폭만 있으면 표가 낫다. */}
        <div className="bg-surface hidden min-w-0 rounded-[calc(1rem-0.375rem)] @md:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-subtle border-b">
                <th
                  scope="col"
                  className="text-muted text-2xs tracking-label px-3 py-3 font-medium"
                >
                  SIZE
                </th>
                {table.fields.map((f) => (
                  <th
                    key={f.key}
                    scope="col"
                    className="text-muted text-2xs px-3 py-3 font-medium"
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
                    } ${isHighlighted ? "bg-accent-tint" : ""}`}
                  >
                    <th
                      scope="row"
                      className={`px-3 py-3 text-xs font-medium tabular-nums ${
                        isHighlighted ? "text-accent" : "text-primary"
                      }`}
                    >
                      {row.size}
                    </th>
                    {table.fields.map((f) => (
                      <td
                        key={f.key}
                        className="text-secondary px-3 py-3 text-center text-xs tabular-nums"
                      >
                        <Value value={row.values[f.key]} />
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
        <p className="text-warning text-2xs flex gap-1.5">
          {/* 색만으로 알리지 않는다 — 경고색과 브랜드 골드는 색상환에서 몇 도 차이뿐이다 */}
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

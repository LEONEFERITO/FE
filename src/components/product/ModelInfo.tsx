import type { ModelInfo as ModelInfoType } from "@/types/product";
import { pendingLabel } from "@/lib/pending";

/**
 * 모델 착용 정보.
 *
 * "이 모델과 내 체형이 비슷한가" 가 사이즈 판단의 마지막 근거다.
 * 실측표가 옷의 치수를 알려준다면, 이건 그 치수가 실제로 어떻게 보이는지를 알려준다.
 */
export function ModelInfo({ model }: { model: ModelInfoType }) {
  const rows: { label: string; value: string | null }[] = [
    { label: "키", value: model.heightCm ? `${model.heightCm} cm` : null },
    { label: "몸무게", value: model.weightKg ? `${model.weightKg} kg` : null },
    { label: "착용 사이즈", value: model.wearingSize },
  ];

  return (
    <section
      className="border-subtle bg-band/60 rounded-2xl border p-1.5"
      aria-labelledby="model-heading"
    >
      <div className="bg-surface rounded-none px-5 py-4">
        <h2 id="model-heading" className="text-muted text-2xs tracking-label">
          MODEL
        </h2>

        {/*
          flex-wrap 을 쓰는 이유: 좁은 화면(375px)에서 3칸을 한 줄에 고정하면
          값이 길어질 때 단어 중간에서 끊긴다. 줄바꿈을 허용해 두면 값 길이에 상관없이 버틴다.
        */}
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-muted text-2xs">{r.label}</dt>
              <dd
                className={`text-sm tabular-nums ${r.value ? "text-primary" : "text-muted"}`}
              >
                {r.value ?? pendingLabel()}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

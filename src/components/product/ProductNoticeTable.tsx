import { Warning } from "@phosphor-icons/react/dist/ssr";
import type { ProductNotice } from "@/types/product";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { pendingHint } from "@/lib/pending";

/**
 * 상품정보제공고시 (의류).
 *
 * 전자상거래 등에서의 상품 등의 정보제공에 관한 고시에 따른 **표기 의무** 사항이다.
 *
 * 반드시 텍스트로 넣는다. 국내 쇼핑몰 상당수가 이걸 상세 이미지 안에 그려 넣는데,
 * 그러면 두 가지가 깨진다:
 *   1. 고시 위반 소지 — 기계가 읽을 수 있는 형태가 아니다
 *   2. 스크린리더 사용자가 읽을 수 없다
 */

const FIELDS: { key: keyof ProductNotice; label: string; hint?: string }[] = [
  { key: "material", label: "제품 소재", hint: "혼용률까지 표기" },
  { key: "color", label: "색상" },
  { key: "size", label: "치수" },
  { key: "manufacturer", label: "제조자 / 수입자" },
  { key: "countryOfOrigin", label: "제조국" },
  { key: "washingInstruction", label: "세탁방법 및 취급 시 주의사항" },
  { key: "manufacturedAt", label: "제조연월" },
  { key: "warranty", label: "품질보증기준" },
  { key: "asContact", label: "A/S 책임자와 연락처" },
];

export function ProductNoticeTable({ notice }: { notice: ProductNotice }) {
  const missing = FIELDS.filter((f) => !notice[f.key]).length;

  return (
    <section
      className="bg-band border-subtle border-t"
      aria-labelledby="notice-heading"
    >
      <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-15 md:py-32">
        <Eyebrow>LEGAL</Eyebrow>
        <h2
          id="notice-heading"
          className="font-display text-primary mt-3 text-2xl leading-display tracking-display"
        >
          상품정보제공고시
        </h2>
        <p className="text-muted mt-2 text-2xs">
          전자상거래 등에서의 상품 등의 정보제공에 관한 고시에 따른 표기입니다.
        </p>

        <div className="border-subtle bg-band/60 shadow-soft mt-8 rounded-2xl border p-1.5">
          <dl className="bg-surface rounded-[calc(1rem-0.375rem)]">
            {FIELDS.map((f, i) => (
              <div
                key={f.key}
                className={`flex flex-col gap-1 px-6 py-4 sm:flex-row sm:gap-0 ${
                  i > 0 ? "border-subtle border-t" : ""
                }`}
              >
                <dt className="text-muted shrink-0 text-xs sm:w-72">
                  {f.label}
                </dt>
                <dd
                  className={`text-xs ${notice[f.key] ? "text-primary" : "text-muted"}`}
                >
                  {notice[f.key] ?? pendingHint(f.label, f.hint)}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {missing > 0 && (
          <p className="text-warning mt-5 flex gap-1.5 text-2xs">
            {/* 색만으로 알리지 않는다 — 경고색과 브랜드 고동색은 색상환에서 9.5° 차이뿐이다 */}
            <Warning
              size={14}
              weight="light"
              aria-hidden="true"
              className="mt-px shrink-0"
            />
            <span>
              {missing}개 항목이 비어 있습니다. 전부 채워야 오픈할 수 있습니다.
            </span>
          </p>
        )}
      </div>
    </section>
  );
}

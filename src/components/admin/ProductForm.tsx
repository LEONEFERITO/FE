"use client";

import { Warning } from "@phosphor-icons/react/dist/ssr";
import { useRef, useState } from "react";

import { CountedField, countGraphemes } from "@/components/admin/CountedField";
import {
  ImageField,
  type ImageFieldValue,
} from "@/components/admin/ImageField";
import { ProductPreview } from "@/components/admin/ProductPreview";
import { LIMITS, AdminApiError, createProduct, ADMIN_CONNECTED } from "@/lib/admin";
import { CATEGORY_LABEL, LINE_LABEL, type Category, type ProductLine } from "@/types/product";

/**
 * 상품 등록 폼.
 *
 * ── 왼쪽은 입력, 오른쪽은 미리보기 ──────────────────────
 * 입력한 글자가 <b>실제로 어떻게 보이는지</b>를 옆에서 바로 보여준다.
 * 글자 수만 세어 주면 "40자" 가 화면에서 몇 줄인지 알 수 없다. 미리보기가 그걸 답한다.
 * 데스크톱에서는 미리보기가 따라다니고(sticky), 모바일에서는 폼 위에 얹는다 —
 * 좁은 화면에서 옆에 두면 둘 다 못 읽는다.
 *
 * ── 이미지는 네 종류 ────────────────────────────────────
 * 고객이 상세페이지 요구사항에서 지정한 4종이다: 대표 · 착용샷 · 디테일컷 · 누끼샷.
 * 대표만 필수다 — 대표가 없으면 목록 카드에 그릴 것이 없다.
 *
 * ── 등록 = 초안 ─────────────────────────────────────────
 * 저장한다고 손님에게 보이지 않는다. 공개는 따로 누른다. 문구를 고치는 중에
 * 반쪽짜리가 노출되지 않게 하기 위한 것이고, 서버도 같은 규칙이다.
 */

const IMAGE_SLOTS = [
  {
    key: "MAIN",
    label: "대표 이미지",
    hint: "목록 카드와 상세 첫 화면에 쓰입니다. 세로 3:4 권장.",
    aspect: "portrait" as const,
    required: true,
  },
  {
    key: "WORN",
    label: "착용샷",
    hint: "사람이 입은 컷. 실루엣이 보이는 전신 또는 상반신.",
    aspect: "portrait" as const,
    required: false,
  },
  {
    key: "DETAIL",
    label: "디테일컷",
    hint: "원단 조직 · 봉제 · 단추처럼 가까이서 찍은 컷.",
    aspect: "square" as const,
    required: false,
  },
  {
    key: "CUTOUT",
    label: "누끼샷",
    hint: "배경이 투명한 컷. 단색 면 위에 올릴 때 씁니다.",
    aspect: "portrait" as const,
    required: false,
  },
] as const;

const CATEGORIES: Category[] = ["JACKET", "TROUSERS", "SHIRT", "SHOES"];
const LINES: ProductLine[] = ["LEONE", "FERITO"];

type Images = Partial<Record<(typeof IMAGE_SLOTS)[number]["key"], ImageFieldValue>>;

export function ProductForm() {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<Category>("SHIRT");
  const [line, setLine] = useState<ProductLine>("LEONE");
  const [priceKrw, setPriceKrw] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [fabric, setFabric] = useState("");
  const [care, setCare] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<Images>({});
  const [sizeChart, setSizeChart] = useState<ImageFieldValue | null>(null);
  const [sizeChartAlt, setSizeChartAlt] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const summaryRef = useRef<HTMLDivElement>(null);

  const errors = validate();
  const hasError = Object.keys(errors).length > 0;

  function validate() {
    const e: Record<string, string> = {};

    if (!slug.trim()) {
      e.slug = "주소(slug)를 입력해 주세요.";
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug.trim())) {
      // 서버와 같은 규칙이다. 여기서 먼저 알려줘야 저장 후에 되돌아오지 않는다.
      e.slug = "영문 소문자 · 숫자 · 하이픈만 사용할 수 있습니다.";
    }

    if (countGraphemes(name) > LIMITS.name) e.name = `${LIMITS.name}자를 넘었습니다.`;
    if (countGraphemes(summary) > LIMITS.summary)
      e.summary = `${LIMITS.summary}자를 넘었습니다.`;
    if (countGraphemes(fabric) > LIMITS.shortBody) e.fabric = "너무 깁니다.";
    if (countGraphemes(care) > LIMITS.shortBody) e.care = "너무 깁니다.";
    if (countGraphemes(description) > LIMITS.body) e.description = "너무 깁니다.";

    /*
     * 차트를 올렸으면 대체 텍스트는 필수다.
     * 표를 이미지로 만든 이상 이 문장이 스크린리더에게는 유일한 정보원이고,
     * 비어 있으면 그 사용자에게 사이즈 구간이 통째로 없는 것과 같다.
     */
    if (sizeChart && !sizeChartAlt.trim()) {
      e.sizeChartAlt = "차트에 무엇이 적혀 있는지 설명을 입력해 주세요.";
    }
    if (countGraphemes(sizeChartAlt) > LIMITS.sizeChartAlt) {
      e.sizeChartAlt = `${LIMITS.sizeChartAlt}자를 넘었습니다.`;
    }

    if (priceKrw && !/^\d+$/.test(priceKrw)) e.priceKrw = "숫자만 입력해 주세요.";
    if (leadTimeDays) {
      if (!/^\d+$/.test(leadTimeDays)) {
        e.leadTimeDays = "숫자만 입력해 주세요.";
      } else if (Number(leadTimeDays) < 1 || Number(leadTimeDays) > 365) {
        e.leadTimeDays = "1일 ~ 365일 사이로 입력해 주세요.";
      }
    }

    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);

    if (Object.keys(validate()).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setPending(true);
    try {
      const id = await createProduct({
        slug: slug.trim(),
        name: name.trim(),
        category,
        line,
        priceKrw: priceKrw ? Number(priceKrw) : null,
        listPriceKrw: null,
        summary: summary.trim(),
        description: description.trim(),
        intent: "",
        features: "",
        fabric: fabric.trim(),
        care: care.trim(),
        modelHeightCm: null,
        modelWeightKg: null,
        modelSize: "",
        leadTimeDays: leadTimeDays ? Number(leadTimeDays) : null,
        images: Object.entries(images)
          .filter(([, v]) => v)
          .map(([kind, v]) => ({
            mediaId: v!.mediaId,
            kind,
            // 대체 텍스트가 비면 서버가 거부한다. 임시로 이름을 쓰되 나중에 고칠 수 있게 둔다.
            alt: name.trim() || "상품 이미지",
          })),
        skus: [],
        sizeChartMediaId: sizeChart?.mediaId ?? null,
        sizeChartAlt: sizeChartAlt.trim(),
      });
      setCreatedId(id);
    } catch (err) {
      setFormError(
        err instanceof AdminApiError
          ? err.message
          : "등록하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
      requestAnimationFrame(() => summaryRef.current?.focus());
    } finally {
      setPending(false);
    }
  }

  if (createdId) {
    return (
      <div
        role="status"
        className="border-subtle bg-band/60 rounded-2xl border px-6 py-8 text-center"
      >
        <p className="font-display text-primary text-xl">초안으로 저장했습니다</p>
        <p className="text-secondary mt-3 text-sm leading-relaxed">
          아직 손님에게는 보이지 않습니다. 내용을 확인한 뒤 공개해 주세요.
        </p>
      </div>
    );
  }

  const summaryText = submitted
    ? (formError ?? (hasError ? "입력한 내용을 확인해 주세요." : null))
    : formError;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      /*
        데스크톱 2열, 모바일 1열. 모바일에서는 미리보기가 먼저 온다 —
        무엇을 만들고 있는지 보고 나서 칸을 채우는 순서가 자연스럽다.
      */
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-14"
    >
      <div className="order-2 flex min-w-0 flex-col gap-7 lg:order-1">
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className={
            summaryText
              ? "border-error/40 bg-velvet-tint/60 rounded-xl border px-5 py-4"
              : ""
          }
        >
          {summaryText && (
            <p className="text-error text-2xs flex gap-2 leading-relaxed">
              <Warning size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
              <span>{summaryText}</span>
            </p>
          )}
        </div>

        {!ADMIN_CONNECTED && (
          <p className="border-subtle bg-band/60 text-muted text-2xs rounded-xl border px-4 py-3 leading-relaxed">
            화면 확인 단계입니다. 관리자 서버는 아직 연결되지 않았습니다.
          </p>
        )}

        <CountedField
          label="주소 (slug)"
          value={slug}
          onChange={setSlug}
          max={LIMITS.slug}
          required
          placeholder="brown-shirt"
          hint="상품 주소가 됩니다 (/products/brown-shirt). 공개 후에는 바꿀 수 없습니다."
          error={submitted ? errors.slug : undefined}
        />

        <CountedField
          label="상품명"
          value={name}
          onChange={setName}
          max={LIMITS.name}
          placeholder="브라운 셔츠"
          hint="목록 카드에서 두 줄까지 보입니다."
          error={submitted ? errors.name : undefined}
        />

        <CountedField
          label="한 줄 설명"
          value={summary}
          onChange={setSummary}
          max={LIMITS.summary}
          placeholder="몸을 따라 떨어지는 포멀"
          hint="목록 카드에서 이름 아래 한 줄로 보입니다."
          error={submitted ? errors.summary : undefined}
        />

        {/* 분류는 선택지가 정해져 있다. 자유 입력이면 오타가 그대로 카테고리가 된다. */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="category" className="text-secondary text-2xs">
              카테고리
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="text-primary border-interactive focus-visible:border-accent ease-fluid min-h-12 w-full rounded-xl border bg-transparent px-4 text-sm transition-colors duration-300"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-surface">
                  {CATEGORY_LABEL[c].ko}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="line" className="text-secondary text-2xs">
              라인
            </label>
            <select
              id="line"
              value={line}
              onChange={(e) => setLine(e.target.value as ProductLine)}
              className="text-primary border-interactive focus-visible:border-accent ease-fluid min-h-12 w-full rounded-xl border bg-transparent px-4 text-sm transition-colors duration-300"
            >
              {LINES.map((l) => (
                <option key={l} value={l} className="bg-surface">
                  {LINE_LABEL[l].ko} ({LINE_LABEL[l].kind})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <CountedField
            label="판매가 (원)"
            value={priceKrw}
            onChange={setPriceKrw}
            max={12}
            inputMode="numeric"
            placeholder="290000"
            hint="숫자만. 쉼표는 화면이 알아서 넣습니다."
            error={submitted ? errors.priceKrw : undefined}
          />
          <CountedField
            label="제작 기간 (일)"
            value={leadTimeDays}
            onChange={setLeadTimeDays}
            max={3}
            inputMode="numeric"
            placeholder="14"
            hint="주문 후 수령까지. 결제 전에 반드시 표시되는 값입니다."
            error={submitted ? errors.leadTimeDays : undefined}
          />
        </div>

        {/* ── 이미지 ────────────────────────────────────── */}
        <fieldset className="border-subtle flex flex-col gap-6 border-t pt-7">
          <legend className="text-primary text-sm font-medium">이미지</legend>
          <p className="text-muted text-2xs -mt-4 leading-relaxed">
            고르는 즉시 미리보기가 나타납니다. 대표 이미지는 필수입니다.
          </p>

          <div className="grid gap-7 sm:grid-cols-2">
            {IMAGE_SLOTS.map((slot) => (
              <ImageField
                key={slot.key}
                label={slot.label}
                hint={slot.hint}
                aspect={slot.aspect}
                required={slot.required}
                value={images[slot.key] ?? null}
                onChange={(next) =>
                  setImages((prev) => ({ ...prev, [slot.key]: next ?? undefined }))
                }
              />
            ))}
          </div>
        </fieldset>

        {/* ── 상세 사이즈 차트 ──────────────────────────── */}
        <fieldset className="border-subtle flex flex-col gap-6 border-t pt-7">
          <legend className="text-primary text-sm font-medium">상세 사이즈 차트</legend>
          <p className="text-muted text-2xs -mt-4 leading-relaxed">
            브랜드에서 만든 차트를 그대로 올립니다. 카테고리마다 재는 곳이 달라도
            이미지 한 장이면 됩니다. 손님은 눌러서 크게 볼 수 있습니다.
          </p>

          <ImageField
            label="사이즈 차트"
            hint="상품 사진과 따로 보관됩니다. 갤러리에 섞이지 않습니다."
            aspect="wide"
            value={sizeChart}
            onChange={setSizeChart}
          />

          <CountedField
            label="차트 설명 (대체 텍스트)"
            value={sizeChartAlt}
            onChange={setSizeChartAlt}
            max={LIMITS.sizeChartAlt}
            required={sizeChart !== null}
            multiline
            rows={3}
            placeholder="95~110 사이즈의 어깨·가슴·소매·총장 실측표"
            hint="화면을 읽어 주는 기기에는 이 문장이 사이즈 정보의 전부입니다. 어떤 항목을 어느 사이즈 범위로 싣고 있는지 적어 주세요."
            error={submitted ? errors.sizeChartAlt : undefined}
          />
        </fieldset>

        {/* ── 상세 정보 ─────────────────────────────────── */}
        <fieldset className="border-subtle flex flex-col gap-6 border-t pt-7">
          <legend className="text-primary text-sm font-medium">상세 정보</legend>

          <CountedField
            label="제품 설명"
            value={description}
            onChange={setDescription}
            max={LIMITS.body}
            multiline
            rows={6}
            hint="상세 페이지 본문입니다."
            error={submitted ? errors.description : undefined}
          />
          <CountedField
            label="원단 · 혼용률"
            value={fabric}
            onChange={setFabric}
            max={LIMITS.shortBody}
            multiline
            rows={3}
            placeholder="면 100%"
            error={submitted ? errors.fabric : undefined}
          />
          <CountedField
            label="세탁 · 관리"
            value={care}
            onChange={setCare}
            max={LIMITS.shortBody}
            multiline
            rows={3}
            error={submitted ? errors.care : undefined}
          />
        </fieldset>

        <button
          type="submit"
          disabled={pending}
          className="group bg-accent text-on-accent hover:bg-accent-hover shadow-button hover:shadow-button-hover tracking-button ease-fluid flex min-h-14 items-center justify-center rounded-full text-sm transition-all duration-500 hover:-translate-y-px active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "저장하는 중" : "초안으로 저장"}
        </button>

        <p className="text-muted text-2xs text-center leading-relaxed">
          저장해도 손님에게는 보이지 않습니다. 공개는 따로 누릅니다.
        </p>
      </div>

      {/*
        ── 미리보기 ────────────────────────────────────
        min-w-0 이 필요하다. 미리보기 카드가 300px 고정이라 그게 grid 칸의 min-content 가
        되고, 320px 화면에서 칸이 342px 로 부풀어 페이지가 가로로 밀렸다.
        (상품 상세의 실측표와 같은 원인 — grid 자식의 기본 min-width 는 auto 다)
      */}
      <div className="order-1 min-w-0 lg:order-2">
        <div className="lg:sticky lg:top-24">
          <ProductPreview
            name={name}
            summary={summary}
            priceKrw={priceKrw ? Number(priceKrw) : null}
            category={category}
            line={line}
            imageUrl={images.MAIN?.url ?? null}
            leadTimeDays={leadTimeDays ? Number(leadTimeDays) : null}
          />
        </div>
      </div>
    </form>
  );
}

"use client";

import { Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRef, useState } from "react";

import { CountedField, countGraphemes } from "@/components/admin/CountedField";
import {
  ImageField,
  type ImageFieldValue,
} from "@/components/admin/ImageField";
import { ProductPreview } from "@/components/admin/ProductPreview";
import { StoryImagesField, type StoryImage } from "@/components/admin/StoryImagesField";
import {
  DEFAULT_SIZES,
  SizeListField,
  validateSizes,
  type SizeRow,
} from "@/components/admin/SizeListField";
import {
  LIMITS,
  INSTAGRAM_URL_RE,
  AdminApiError,
  createProduct,
  updateProduct,
  ADMIN_CONNECTED,
  type AdminProductEdit,
  type ProductDraft,
} from "@/lib/admin";
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
 * ── 이미지는 두 묶음 ────────────────────────────────────
 * 메인 사진 4종(고객 지정): 대표 · 착용샷 · 디테일컷 · 누끼샷 — 종류마다 한 장, 상세 맨 위에 보인다.
 * 대표만 필수다 — 대표가 없으면 목록 카드에 그릴 것이 없다.
 * 상세 이미지(STORY): 긴 상세페이지 이미지 여러 장 — 상세 가운데에 간격 없이 이어 붙는다(StoryImagesField).
 *
 * ── 등록 = 초안 ─────────────────────────────────────────
 * 저장한다고 손님에게 보이지 않는다. 공개는 따로 누른다. 문구를 고치는 중에
 * 반쪽짜리가 노출되지 않게 하기 위한 것이고, 서버도 같은 규칙이다.
 *
 * ── 수정 모드 (initial 이 있을 때) ──────────────────────
 * 서버는 받은 내용으로 이미지·사이즈를 **통째로 교체**한다. 이 폼에는 실측·모델 정보
 * 칸이 아직 없으므로, 그 값들은 `initial` 에서 그대로 실어 보낸다. 빠뜨리면
 * 저장 한 번에 실측표가 사라진다 — 화면에 없는 값이라 누구도 눈치채지 못한다.
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

// 내비와 같은 순서 (data/categories.ts CATEGORY_NAV). 서버의 ProductCategory · CHECK 제약(V19)과 값이 같아야 한다.
const CATEGORIES: Category[] = ["SUIT", "JACKET", "TROUSERS", "SHIRT", "SHOES", "ACCESSORIES"];
const LINES: ProductLine[] = ["LEONE", "FERITO"];

type SlotKey = (typeof IMAGE_SLOTS)[number]["key"];
type Images = Partial<Record<SlotKey, ImageFieldValue>>;

/** 서버에 이미 있는 이미지를 폼 칸에 채운다. 파일명은 모르므로 "등록된 이미지" 로 둔다. */
function imagesFrom(initial?: AdminProductEdit): Images {
  const out: Images = {};
  for (const img of initial?.images ?? []) {
    if (IMAGE_SLOTS.some((s) => s.key === img.kind) && !out[img.kind as SlotKey]) {
      out[img.kind as SlotKey] = { mediaId: img.mediaId, url: img.url, filename: "등록된 이미지" };
    }
  }
  return out;
}

interface Props {
  /** 있으면 수정 모드. 서버에서 받은 현재 상태. */
  initial?: AdminProductEdit;
  /** 수정 저장이 끝난 뒤. 부모가 상태(공개 가능 여부 등)를 다시 읽는다. */
  onSaved?: () => void;
}

export function ProductForm({ initial, onSaved }: Props = {}) {
  const editing = initial !== undefined;

  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [category, setCategory] = useState<Category>(
    (initial?.category as Category | undefined) ?? "SHIRT",
  );
  const [line, setLine] = useState<ProductLine>(
    (initial?.line as ProductLine | undefined) ?? "LEONE",
  );
  const [priceKrw, setPriceKrw] = useState(initial?.priceKrw?.toString() ?? "");
  const [leadTimeDays, setLeadTimeDays] = useState(initial?.leadTimeDays?.toString() ?? "");
  const [fabric, setFabric] = useState(initial?.fabric ?? "");
  const [care, setCare] = useState(initial?.care ?? "");
  const [color, setColor] = useState(initial?.color ?? "");
  const [manufacturer, setManufacturer] = useState(initial?.manufacturer ?? "");
  const [countryOfOrigin, setCountryOfOrigin] = useState(initial?.countryOfOrigin ?? "");
  const [manufacturedOn, setManufacturedOn] = useState(initial?.manufacturedOn ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [images, setImages] = useState<Images>(() => imagesFrom(initial));
  const [story, setStory] = useState<StoryImage[]>(() =>
    (initial?.images ?? [])
      .filter((img) => img.kind === "STORY")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({ mediaId: img.mediaId, url: img.url, alt: img.alt })),
  );
  const [sizeChart, setSizeChart] = useState<ImageFieldValue | null>(
    initial?.sizeChartMediaId && initial.sizeChartUrl
      ? { mediaId: initial.sizeChartMediaId, url: initial.sizeChartUrl, filename: "등록된 차트" }
      : null,
  );
  const [sizeChartAlt, setSizeChartAlt] = useState(initial?.sizeChartAlt ?? "");
  const [instagramUrl, setInstagramUrl] = useState(initial?.instagramUrl ?? "");
  /*
   * 사이즈. 새 상품은 브랜드 기본 전개(95~110)로 시작한다 — 빈 목록에서 넷을 치는 것보다
   * 넷에서 하나 지우는 편이 빠르고, 빠뜨릴 일이 없다. 수정이면 서버 값 그대로.
   */
  const [sizes, setSizes] = useState<SizeRow[]>(() =>
    initial
      ? initial.skus.map((s) => ({ size: s.size, orderable: s.orderable }))
      : DEFAULT_SIZES,
  );

  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  /** 수정 저장 성공 알림. 폼을 치우지 않고 제자리에서 알린다 — 이어서 고칠 수 있게. */
  const [savedAt, setSavedAt] = useState<Date | null>(null);

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
    if (countGraphemes(color) > LIMITS.notice) e.color = "너무 깁니다.";
    if (countGraphemes(manufacturer) > LIMITS.notice) e.manufacturer = "너무 깁니다.";
    if (countGraphemes(countryOfOrigin) > LIMITS.notice) e.countryOfOrigin = "너무 깁니다.";
    if (countGraphemes(manufacturedOn) > LIMITS.notice) e.manufacturedOn = "너무 깁니다.";
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

    if (instagramUrl.trim() && !INSTAGRAM_URL_RE.test(instagramUrl.trim())) {
      e.instagramUrl = "인스타그램 게시물 주소(https://www.instagram.com/…)를 붙여 넣어 주세요.";
    }

    if (Object.keys(validateSizes(sizes)).length > 0) {
      e.sizes = "사이즈 목록을 확인해 주세요.";
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

  function buildDraft(): ProductDraft {
    return {
      slug: slug.trim(),
      name: name.trim(),
      category,
      line,
      priceKrw: priceKrw ? Number(priceKrw) : null,
      summary: summary.trim(),
      description: description.trim(),
      fabric: fabric.trim(),
      care: care.trim(),
      color: color.trim(),
      manufacturer: manufacturer.trim(),
      countryOfOrigin: countryOfOrigin.trim(),
      manufacturedOn: manufacturedOn.trim(),
      leadTimeDays: leadTimeDays ? Number(leadTimeDays) : null,

      // ↓ 이 폼에 칸이 없는 값. 수정이면 원래 값을 그대로 돌려보낸다(위 주석 참고).
      listPriceKrw: initial?.listPriceKrw ?? null,
      intent: initial?.intent ?? "",
      features: initial?.features ?? "",
      modelHeightCm: initial?.modelHeightCm ?? null,
      modelWeightKg: initial?.modelWeightKg ?? null,
      modelSize: initial?.modelSize ?? "",
      displayOrder: initial?.displayOrder,
      /*
       * 사이즈는 폼의 목록이 진실이다. 실측값은 폼에 칸이 없으므로, 수정이면 **같은 이름의**
       * 사이즈에 붙어 있던 실측을 그대로 실어 보낸다 — 이름을 바꾸면 그 실측은 사라진다.
       * 상세 사이즈는 차트 이미지로 가기로 했으니 지금은 이 정도면 된다.
       */
      skus: sizes.map((s, i) => {
        const name = s.size.trim();
        const before = initial?.skus.find((k) => k.size === name);
        return {
          size: name,
          orderable: s.orderable,
          sortOrder: i,
          measurements: before?.measurements ?? [],
        };
      }),

      images: IMAGE_SLOTS.flatMap((slot, i): ProductDraft["images"] => {
        const v = images[slot.key];
        if (!v) return [];
        /*
         * 같은 이미지면 원래 설명을 지킨다. 등록 때 임시로 이름을 넣어 두었더라도
         * 누군가 API 로 고쳐 놓은 설명을 저장 한 번에 덮어쓰면 안 된다.
         * 새로 바꾼 이미지만 이름으로 채운다 — 비면 서버가 거부한다.
         */
        const before = initial?.images.find(
          (img) => img.kind === slot.key && img.mediaId === v.mediaId,
        );
        return [
          {
            mediaId: v.mediaId,
            kind: slot.key,
            alt: before?.alt ?? (name.trim() || "상품 이미지"),
            sortOrder: i,
          },
        ];
      }).concat(
        // 상세 이미지 — 메인 사진 뒤 순서(100~). 손님 화면은 이 순서대로 이어 붙인다.
        story.map((s, i) => ({
          mediaId: s.mediaId,
          kind: "STORY",
          alt: s.alt.trim() || `${name.trim() || "상품"} 상세 이미지 ${i + 1}`,
          sortOrder: 100 + i,
        })),
      ),
      sizeChartMediaId: sizeChart?.mediaId ?? null,
      sizeChartAlt: sizeChartAlt.trim(),
      instagramUrl: instagramUrl.trim(),
    };
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
    setSavedAt(null);
    try {
      const draft = buildDraft();
      if (editing) {
        await updateProduct(initial.id, draft);
        setSavedAt(new Date());
        setSubmitted(false);
        onSaved?.();
      } else {
        setCreatedId(await createProduct(draft));
      }
    } catch (err) {
      setFormError(
        err instanceof AdminApiError
          ? err.message
          : "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
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
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/admin/products/edit?id=${encodeURIComponent(createdId)}`}
            className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center rounded-full px-6 text-sm transition-colors duration-300"
          >
            이어서 편집 · 공개
          </Link>
          <Link
            href="/admin/products"
            className="border-interactive text-primary hover:border-accent ease-fluid inline-flex min-h-12 items-center rounded-full border px-6 text-sm transition-colors duration-300"
          >
            상품 목록
          </Link>
        </div>
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
          required={!editing}
          readOnly={editing}
          placeholder="brown-shirt"
          hint={
            editing
              ? "주소는 바꿀 수 없습니다. 바꾸면 걸어 둔 링크가 전부 끊깁니다."
              : "상품 주소가 됩니다 (/products/brown-shirt). 공개 후에는 바꿀 수 없습니다."
          }
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

        {/* ── 메인 사진 ──────────────────────────────────── */}
        <fieldset className="border-subtle flex flex-col gap-6 border-t pt-7">
          <legend className="text-primary text-sm font-medium">메인 사진</legend>
          <p className="text-muted text-2xs -mt-4 leading-relaxed">
            상세 맨 위 구매 판 옆에 보입니다 — 대표가 먼저, 나머지는 아래 작은 사진을 눌러 넘겨 봅니다.
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

        {/* ── 상세 이미지 ────────────────────────────────── */}
        <fieldset className="border-subtle flex flex-col gap-6 border-t pt-7">
          <legend className="text-primary text-sm font-medium">상세 이미지</legend>
          <StoryImagesField value={story} onChange={setStory} productName={name} />
        </fieldset>

        {/* ── 사이즈 ────────────────────────────────────── */}
        <fieldset className="border-subtle flex flex-col gap-6 border-t pt-7">
          <legend className="text-primary text-sm font-medium">사이즈</legend>
          <p className="text-muted text-2xs -mt-4 leading-relaxed">
            손님이 고르는 순서 그대로입니다. &lsquo;제작 가능&rsquo;을 끄면 그 사이즈는
            취소선으로 보이고 고를 수 없습니다 — 재고가 아니라 만들 수 있는지의 문제입니다.
          </p>
          {submitted && errors.sizes && (
            <p className="text-error text-2xs -mt-3 flex gap-1.5 leading-relaxed" role="alert">
              <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
              <span>{errors.sizes}</span>
            </p>
          )}
          <SizeListField
            value={sizes}
            onChange={setSizes}
            errors={submitted ? validateSizes(sizes) : {}}
          />
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

        {/* ── 인스타그램 ────────────────────────────────── */}
        <fieldset className="border-subtle flex flex-col gap-6 border-t pt-7">
          <legend className="text-primary text-sm font-medium">인스타그램</legend>

          <CountedField
            label="게시물 주소"
            value={instagramUrl}
            onChange={setInstagramUrl}
            max={LIMITS.instagramUrl}
            placeholder="https://www.instagram.com/p/…"
            hint="이 상품이 나온 게시물이 있을 때만 넣습니다. 비워 두면 상세 페이지에 버튼이 나오지 않습니다."
            error={submitted ? errors.instagramUrl : undefined}
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
        </fieldset>

        {/*
          ── 상품정보제공고시 ─────────────────────────────
          판매 전 법적 의무라 여섯 칸이 다 차야 공개된다(서버가 판단). 치수는 사이즈 목록이,
          품질보증기준과 A/S 연락처는 사업자 정보가 채우므로 여기 없다.
        */}
        <fieldset className="border-subtle flex flex-col gap-6 border-t pt-7">
          <legend className="text-primary text-sm font-medium">상품정보제공고시</legend>
          <p className="text-muted text-2xs -mt-3 leading-relaxed">
            여섯 칸이 모두 있어야 공개할 수 있습니다. 상세 페이지 맨 아래 표에 그대로 나갑니다.
          </p>

          <CountedField
            label="제품 소재 (원단 · 혼용률)"
            value={fabric}
            onChange={setFabric}
            max={LIMITS.shortBody}
            multiline
            rows={2}
            placeholder="겉감 울 100% · 안감 큐프라 100%"
            error={submitted ? errors.fabric : undefined}
          />
          <CountedField
            label="세탁방법 및 취급 시 주의사항"
            value={care}
            onChange={setCare}
            max={LIMITS.shortBody}
            multiline
            rows={2}
            placeholder="드라이클리닝 · 다림질은 천을 덧대 중온으로"
            error={submitted ? errors.care : undefined}
          />
          <div className="grid gap-6 md:grid-cols-2">
            <CountedField
              label="색상"
              value={color}
              onChange={setColor}
              max={LIMITS.notice}
              placeholder="브라운"
              error={submitted ? errors.color : undefined}
            />
            <CountedField
              label="제조자 / 수입자"
              value={manufacturer}
              onChange={setManufacturer}
              max={LIMITS.notice}
              placeholder="레오네페리토"
              error={submitted ? errors.manufacturer : undefined}
            />
            <CountedField
              label="제조국"
              value={countryOfOrigin}
              onChange={setCountryOfOrigin}
              max={LIMITS.notice}
              placeholder="대한민국"
              error={submitted ? errors.countryOfOrigin : undefined}
            />
            <CountedField
              label="제조연월"
              value={manufacturedOn}
              onChange={setManufacturedOn}
              max={LIMITS.notice}
              placeholder="2026년 9월"
              error={submitted ? errors.manufacturedOn : undefined}
            />
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={pending}
          className="group bg-accent text-on-accent hover:bg-accent-hover shadow-button hover:shadow-button-hover tracking-button ease-fluid flex min-h-14 items-center justify-center rounded-full text-sm transition-all duration-500 hover:-translate-y-px active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "저장하는 중" : editing ? "변경 사항 저장" : "초안으로 저장"}
        </button>

        {savedAt && (
          <p role="status" className="text-primary text-2xs text-center leading-relaxed">
            저장했습니다 ·{" "}
            {savedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

        <p className="text-muted text-2xs text-center leading-relaxed">
          {initial?.status === "PUBLISHED"
            ? // 공개 중인 상품은 저장이 곧 반영이다. 모르고 누르면 고치던 문구가 그대로 나간다.
              "공개 중인 상품입니다. 저장하면 손님 화면에 바로 반영됩니다."
            : "저장해도 손님에게는 보이지 않습니다. 공개는 따로 누릅니다."}
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

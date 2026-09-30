import fs from "node:fs";
import path from "node:path";

import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { CATEGORY_COVERS } from "@/data/categories";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CATEGORY_LABEL } from "@/types/product";

/**
 * 카테고리 격자 — 사진으로 고르는 입구.
 *
 * ── 왜 글자 목록이 아닌가 ───────────────────────────────
 * "자켓" 이라는 단어보다 자켓 사진이 먼저 판단을 만든다. 옷은 읽고 고르는 물건이 아니다.
 * 필터 칩은 이미 목록 페이지에 있다 — 여기서 같은 걸 또 하면 목록의 축소판이 될 뿐이다.
 *
 * ── 위 제품 격자와 무엇이 다른가 ────────────────────────
 * 바로 위 제품 격자는 **카드**다 — 사진 + 이름 + 가격 + 실측 요약. 살 물건을 본다.
 * 이 격자는 **타일**이다 — 사진 + 이름 하나. 어디로 갈지 고른다.
 * 담는 내용과 크기가 다르므로 격자가 두 번 이어져도 반복으로 읽히지 않는다.
 * 순서도 이래야 한다: 대표 4점을 본 직후에 "셔츠 말고 다른 것도 있다" 가 온다.
 *
 * ── 칸 크기가 데이터에서 나온다 ─────────────────────────
 * 착장(figure)은 세로, 제품 단독(object)은 가로다. 사람이 선 사진을 가로 칸에 넣으면
 * 머리와 발이 잘리고, 구두를 세로 칸에 넣으면 위아래가 텅 빈다.
 * 그래서 비율을 CSS 에 고정하지 않고 `framing` 에서 읽는다 (data/categories.ts).
 *
 * ── 사진이 없는 칸 ──────────────────────────────────────
 * 촬영본이 오기 전에는 글자 타일로 그린다. 딱지를 붙이지 않는 이유는 data 파일 참고.
 * 존재 확인은 **빌드 시점**에 한다 — 깨진 이미지 아이콘도, 404 요청도 나가지 않는다.
 */

/** 빌드 시점에 파일을 확인한다. 경로만 적고 파일을 안 넣은 경우를 걸러낸다. */
function exists(src: string) {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", src));
  } catch {
    return false;
  }
}

export function CategoryGrid() {
  const tiles = CATEGORY_COVERS.map((c) => ({
    ...c,
    cover: c.cover && exists(c.cover) ? c.cover : null,
  }));

  const figures = tiles.filter((t) => t.framing === "figure");
  const objects = tiles.filter((t) => t.framing === "object");

  /*
    모바일은 2열이다. 세로 타일이 홀수면 마지막 칸 옆이 빈다.
    그 한 칸을 가로로 눕혀 채운다 — 개수에서 계산하므로 카테고리가 늘어도 따라온다.
  */
  const orphan = figures.length % 2 === 1 ? figures.length - 1 : -1;

  return (
    /*
      와인 면. 앞뒤 구간(제품 · 라인 비교)이 크림이라 여기서 다시 어두워진다 —
      사진(착장 컷)이 서는 곳이고, 크림이 연속되면 리듬이 죽는다. 히어로와 같은 무대색.
    */
    <section
      className="bg-stage"
      aria-labelledby="category-heading"
    >
      <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-15 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>CATEGORIES</Eyebrow>
            <h2
              id="category-heading"
              className="font-display text-primary leading-display tracking-display mt-3 text-3xl md:text-4xl"
            >
              무엇을 찾으시나요
            </h2>
          </div>

          <Link
            href="/products"
            className="group border-interactive text-accent hover:border-accent hover:bg-accent-tint shadow-soft hover:shadow-lift ease-fluid tracking-button text-2xs inline-flex min-h-[44px] items-center gap-2.5 rounded-full border px-6 transition-all duration-500 hover:-translate-y-px md:min-h-0 md:py-3"
          >
            전체 제품
            <ArrowRight
              size={13}
              weight="light"
              aria-hidden="true"
              className="ease-fluid transition-transform duration-500 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {figures.map((t, i) => (
            <li
              key={t.category}
              className={i === orphan ? "col-span-2 md:col-span-1" : undefined}
            >
              <Reveal delay={i * 90}>
                <Tile tile={t} wideOnMobile={i === orphan} />
              </Reveal>
            </li>
          ))}

          {objects.map((t, i) => (
            <li key={t.category} className="col-span-2 md:col-span-3">
              <Reveal delay={(figures.length + i) * 90}>
                <Tile tile={t} wideOnMobile />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Tile({
  tile,
  wideOnMobile,
}: {
  tile: (typeof CATEGORY_COVERS)[number];
  wideOnMobile: boolean;
}) {
  const label = CATEGORY_LABEL[tile.category];

  /*
    비율은 두 축으로 갈린다: 무엇을 찍었나(framing) × 어느 폭인가(모바일 2칸/1칸).
    가로로 눕힌 칸에 3:4 를 그대로 두면 사진이 사람 키만큼 길어진다.
  */
  const ratio =
    tile.framing === "object"
      ? "aspect-[16/9] md:aspect-[21/7]"
      : wideOnMobile
        ? "aspect-[16/10] md:aspect-[3/4]"
        : "aspect-[3/4]";

  return (
    <Link
      href={`/products?category=${tile.category}`}
      className="group border-subtle hover:border-interactive ease-fluid block overflow-hidden rounded-sm border transition-colors duration-500"
    >
      <div className={`relative ${ratio} bg-surface overflow-hidden`}>
        {tile.cover ? (
          <img
            src={tile.cover}
            alt=""
            loading="lazy"
            decoding="async"
            /*
              alt 를 비운다. 바로 아래 같은 링크 안에 카테고리 이름이 글자로 있다.
              여기에 "자켓 사진" 을 넣으면 스크린리더가 같은 말을 두 번 읽는다.
            */
            className="ease-soft absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[1200ms] group-hover:scale-[1.04]"
          />
        ) : (
          /*
            촬영 전 글자 타일. 영문 카테고리명을 크게 눕히고 헤어라인으로 가둔다.
            사진 자리를 비워두는 게 아니라, 그 자체로 완결된 칸으로 보이게 한다.
          */
          <span
            aria-hidden="true"
            className="from-velvet-tint to-base absolute inset-0 flex items-center justify-center bg-gradient-to-br"
          >
            {/*
              글자 크기는 **칸 폭**을 따른다. 모바일 2열의 좁은 칸에 데스크톱 크기를
              그대로 두면 TROUSERS 가 좌우로 잘려 나간다 — 렌더로 확인한 결함.
            */}
            <span
              className={`font-display text-accent/35 tracking-display block select-none px-4 text-center md:text-6xl ${
                wideOnMobile ? "text-3xl" : "text-xl"
              }`}
            >
              {label.en}
            </span>
          </span>
        )}

        {/*
          가림막은 **사진이 있을 때만** 깐다.
          사진마다 밝기가 달라서, 없으면 밝은 컷에서 크림 글자의 대비가 무너진다.
          반대로 글자 타일은 이미 어두운 면이라 여기에 또 덮으면 아래쪽이 탁해지기만 한다
          — 렌더로 확인한 결함. 위쪽은 어느 쪽이든 건드리지 않는다.
        */}
        {tile.cover && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[rgba(12,3,6,0.88)] via-[rgba(12,3,6,0.45)] to-transparent"
          />
        )}

        <span className="absolute inset-x-0 bottom-0 p-4 md:p-6">
          <span className="font-display text-primary leading-display block text-lg md:text-2xl">
            {label.ko}
          </span>
          <span className="text-secondary mt-1 block text-xs md:text-sm">
            {tile.note}
          </span>
        </span>
      </div>
    </Link>
  );
}

import fs from "node:fs";
import path from "node:path";

import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * 왜 실측을 다 공개하는가 — 이 사이트의 주장.
 *
 * ── 배경 사진 ───────────────────────────────────────────
 * 줄자로 어깨를 재는 장면이 배경이다. 이 섹션의 제목이 "치수로 고르세요" 이므로
 * 사진이 장식이 아니라 **문장의 증거**가 된다. 왼쪽이 비어 있는 구도라 글자 자리가
 * 이미 사진 안에 있다 — 크롭으로 억지로 만들지 않아도 된다.
 *
 * 파일이 없으면 배경 없이 와인 단색으로 렌더한다. 빌드 시점에 존재를 확인하므로
 * 깨진 이미지 아이콘도, 404 요청도 나가지 않는다. 파일을 넣고 다시 빌드하면 켜진다.
 *
 * ── 이 사진이 아이보리 포인트다 ─────────────────────────
 * 페이지 전체가 딥 와인이라 한 덩어리로 읽힌다. 구간을 통째로 밝게 뒤집는 대신
 * **크림 톤 사진 한 장**이 그 자리를 맡는다. 색을 칠해서 만든 포인트가 아니라
 * 콘텐츠가 만든 포인트라 더 자연스럽고, 사진이 바뀌면 포인트도 같이 바뀐다.
 *
 * ── 글자 대비 ───────────────────────────────────────────
 * 사진이 밝고 바탕이 어두우므로, 글자 쪽은 **어두운 채로 지켜야** 한다.
 * 왼쪽 46% 는 불투명한 와인으로 덮고 거기서부터 사진 쪽으로 걷어낸다.
 * 글자는 그 불투명 구간 안에만 놓는다(max-w-[560px]) — 크림 글자 16.64:1 유지.
 * 오른쪽 끝은 가림막을 완전히 걷어 사진이 제 밝기로 드러나게 둔다. 그게 포인트다.
 *
 * 모바일에서는 사진을 걸지 않는다. 폭이 좁아 글자가 인물 위로 올라가고,
 * 배경 한 장을 더 받는 비용도 모바일에서 더 비싸다.
 */

const PILLARS = [
  {
    no: "01",
    title: "두 개의 라인",
    body: "레오네(클래식)와 페리토(애슬레틱)로 패턴을 나눠 제작합니다. 상품마다 어느 라인인지 표시합니다.",
  },
  {
    no: "02",
    title: "상세 실측",
    body: "사이즈별 어깨·가슴·허리·소매·총장을 전부 공개합니다. 측정 기준과 허용 오차까지 밝힙니다.",
  },
  {
    no: "03",
    title: "모델 체형",
    body: "모델의 키·몸무게·착용 사이즈를 함께 표기해 내 체형과 비교할 수 있게 합니다.",
  },
];

const BACKGROUND = "/brand/tailoring.webp";

/** 빌드 시점에 확인한다. 없으면 배경 자체를 렌더하지 않는다. */
function backgroundExists() {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", BACKGROUND));
  } catch {
    return false;
  }
}

export function WhySection() {
  const hasBackground = backgroundExists();

  return (
    <section className="bg-band border-subtle relative overflow-hidden border-y">
      {hasBackground && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden md:block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BACKGROUND}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-right"
          />
          {/*
            가림막. 왼쪽은 완전히 덮고 오른쪽으로 걷어낸다.
            색은 섹션 바탕과 같은 토큰이라 사진이 종이에서 배어나오듯 이어진다.
          */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, var(--bg-subtle) 0%, var(--bg-subtle) 44%, color-mix(in srgb, var(--bg-subtle) 82%, transparent) 58%, color-mix(in srgb, var(--bg-subtle) 42%, transparent) 72%, color-mix(in srgb, var(--bg-subtle) 12%, transparent) 86%, transparent 96%)",
            }}
          />
        </div>
      )}

      <div className="relative mx-auto max-w-[1320px] px-5 py-24 md:px-15 md:py-36">
        {/* 글자는 가림막의 불투명 구간 안에만 둔다 */}
        <div className={hasBackground ? "md:max-w-[560px]" : ""}>
          <Reveal>
            <Eyebrow>WHY LEONE FERITO</Eyebrow>
          </Reveal>

          <Reveal delay={100}>
            <h2 className="font-display text-primary leading-display tracking-display mt-4 text-3xl md:text-4xl">
              사진이 아니라 치수로 고르세요
            </h2>
          </Reveal>

          <Reveal delay={180}>
            <p className="text-secondary mt-6 text-(length:--fs-base)">
              어깨·가슴·허벅지는 끼는데 허리는 남는 옷을 입어 오셨다면, 문제는
              체형이 아니라 패턴입니다. 모든 상품에 사이즈별 상세 실측과 모델
              착용 정보를 공개합니다.
            </p>
          </Reveal>

          {/*
            셋을 나란한 카드로 두지 않는다. 같은 크기의 상자 셋은 브로셔의 "3가지 특징" 으로
            읽힌다. 헤어라인으로 나눈 목록이면 근거의 나열로 읽히고, 좁은 단에서도 안 무너진다.
            번호는 버건디 — 페이지 전체에서 반복되는 붉은 점 중 하나다.
          */}
          {/*
            사진이 있으면 좁은 단에 세로로 쌓고, 없으면 가로로 편다.
            항목 마크업은 같다 — 컨테이너만 바뀐다. 사진이 없는데 좁은 단만 남기면
            오른쪽 절반이 이유 없이 비고, 앞서 한 줄로 줄였을 때와 같은 실수가 된다.
          */}
          <ol
            className={
              hasBackground
                ? "mt-14 flex flex-col"
                : "mt-14 grid gap-x-8 gap-y-2 md:grid-cols-3"
            }
          >
            {PILLARS.map((item, i) => (
              <li key={item.no} className="border-subtle border-t py-6">
                <Reveal delay={i * 100}>
                  <div className="flex gap-5">
                    <span className="text-accent text-2xs tracking-label pt-1 tabular-nums">
                      {item.no}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-primary text-xl">
                        {item.title}
                      </h3>
                      <p className="text-secondary mt-2 text-sm leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

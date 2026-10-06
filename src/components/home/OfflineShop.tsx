import { KAKAO_CHANNEL, OFFLINE_SHOP } from "@/data/business";

/**
 * 메인 여섯째 화면 — OFFLINE SHOP (2026-10-05 고객 디자인 가이드).
 *
 * 시안은 기존 몰(leoneferito.kr)의 OFFLINE SHOP 구간 캡처다: 왼쪽 사진 위에 제목, 오른쪽에 주소와 운영시간,
 * 그 아래 버튼. 구성을 그대로 따른다. 문구는 data/business.ts 의 OFFLINE_SHOP — 받은 그대로다.
 *
 * ── 각진 직사각형이다 ───────────────────────────────────
 * 이 사이트의 카드는 대부분 모서리가 둥글지만 이 구간은 **모서리를 굴리지 않는다** — 고객이 시안처럼
 * "직사각형으로 각지게" 를 따로 요청했다(2026-10-05). 판도 버튼도 직각이다. 여기에 rounded 를 다시 붙이지 않는다.
 *
 * ── 사진 ───────────────────────────────────────────────
 * 관리자가 올린다(/admin/display/offline — 서버의 site_image OFFLINE_SHOP 칸). 올리기 전에는 `image` 로
 * 기본 사진(테일러링 컷)이 온다. 둘 다 없으면 버건디 면만 남는다 — 깨진 이미지는 나가지 않는다.
 * TODO(고객확인) 매장 사진 · 지도 링크.
 *
 * ── 버튼 ───────────────────────────────────────────────
 * 시안의 VIEW MORE 는 기존 몰에서 매장 안내로 갔다. 지도 링크를 아직 받지 못해(mapUrl = null) 지금은
 * "방문 문의" 가 카카오톡 채널로 간다 — 눌러서 갈 곳이 실제로 있는 유일한 길이다. 지도 링크가 오면
 * VIEW MORE 가 그 앞에 생긴다.
 *
 * ── 지도 (map) ─────────────────────────────────────────
 * 브랜드 페이지(ABOUT) 맨 끝은 사진 대신 지도 이미지를 둔다 (2026-10-06 요청).
 * 고객이 고른 구글 지도 캡처(public/brand/offline-map.webp) — 영통역과 매장이 한 장에 보이는 범위다.
 * 움직이는 지도(임베드)는 핀을 늘 가운데 둬서 좁은 화면에서 역이 잘렸다. 그래서 고정 이미지로 둔다.
 * 이미지 전체가 "구글 지도에서 보기" 링크다 — 길찾기는 거기서 한다 (OFFLINE_SHOP.mapQuery).
 *
 * 왼쪽 끝 역과 오른쪽 핀이 둘 다 남아야 해서, 가로가 넉넉하지 않은 폭(lg 미만)에서는 잘라 맞추지 않고
 * 원본 비율 그대로 위에 쌓는다. 1200px 이상은 지도 칸을 넓혀(3:2) 거의 원본 비율로 둔다(1024 에서 나란히 두면 둘 다 잘렸다).
 * 제목 뒤 가림막은 왼쪽 아래 모서리에만 깐다 — 오른쪽 아래의 핀을 덮지 않는다.
 * TODO 캡처가 897px 이라 큰 화면에서 조금 흐리다 — 고해상도로 다시 캡처하면 같은 파일명으로 바꾼다.
 */
export function OfflineShop({
  image = null,
  alt,
  map = false,
}: {
  image?: string | null;
  alt?: string | null;
  /** 사진 대신 고정 지도 이미지 (누르면 구글 지도) */
  map?: boolean;
}) {
  const q = encodeURIComponent(OFFLINE_SHOP.mapQuery);
  return (
    <section
      id="offline-shop"
      aria-labelledby="offline-heading"
      // 지도판은 화면 끝까지 채운다 — 가운데 떠 있는 블록이 아니라 페이지의 마지막 면이다 (2026-10-06 요청)
      className={map ? "w-full" : "mx-auto max-w-[1320px] px-5 pb-24 md:px-15 md:pb-32"}
    >
      <div
        className={`bg-surface grid ${
          map ? "min-[1200px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : "md:grid-cols-[minmax(0,11fr)_minmax(0,14fr)]"
        }`}
      >
        {/* 사진 면은 버건디 — 토큰을 뒤집지 않는 면이다(globals.css .on-cream 주석). 글자는 고정 크림 */}
        <div
          className={`bg-velvet relative overflow-hidden ${
            map ? "aspect-[897/594] min-[1200px]:aspect-auto min-[1200px]:min-h-[600px]" : "aspect-[4/3] md:aspect-auto md:min-h-[520px]"
          }`}
        >
          {map && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/offline-map.webp"
                alt={`${OFFLINE_SHOP.name} 위치 지도 — 영통역에서 매영로 방향, 매영로425번길 1`}
                width={897}
                height={594}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover object-[45%_50%]"
              />
              <span className="pointer-events-none absolute right-2 top-2 z-20 bg-white/80 px-1.5 text-[10px] text-[#444]">
                지도 © Google
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${q}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-10"
              >
                <span className="sr-only">구글 지도에서 {OFFLINE_SHOP.name} 위치 보기 (새 창)</span>
              </a>
            </>
          )}
          {!map && image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={image}
              // 사진의 뜻은 옆의 글자(주소 · 운영시간)가 전한다. 관리자가 설명을 적었을 때만 읽힌다.
              alt={alt ?? ""}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {/* 제목 자리를 눌러 준다 — 사진이 밝아도 왼쪽 아래 글자가 읽힌다 */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              background: map
                ? "radial-gradient(ellipse 70% 55% at 0% 100%, rgba(40,6,12,0.9) 0%, rgba(40,6,12,0.55) 45%, rgba(40,6,12,0) 100%)"
                : "linear-gradient(to top, rgba(40,6,12,0.86) 0%, rgba(40,6,12,0.18) 52%, rgba(40,6,12,0) 100%)",
            }}
          />
          <h2
            id="offline-heading"
            className="font-display tracking-display pointer-events-none absolute bottom-7 left-7 z-20 text-3xl text-[#F7F1EA] md:bottom-12 md:left-12 md:text-4xl"
          >
            OFFLINE SHOP
          </h2>
        </div>

        <div className={`flex flex-col justify-center gap-10 p-7 md:p-16 ${map ? "min-[1200px]:px-20" : ""}`}>
          <dl className="flex flex-col gap-9">
            <div>
              <dt className="text-primary text-sm font-semibold">주소</dt>
              <dd className="text-secondary mt-2 text-sm leading-relaxed">{OFFLINE_SHOP.address}</dd>
            </div>
            <div>
              <dt className="text-primary text-sm font-semibold">운영시간</dt>
              <dd className="text-secondary mt-2 flex flex-col gap-1 text-sm leading-relaxed">
                <span>운영일 : {OFFLINE_SHOP.openDays}</span>
                <span>휴무일 : {OFFLINE_SHOP.closedDays}</span>
                <span>{OFFLINE_SHOP.weekdayHours}</span>
                <span>{OFFLINE_SHOP.weekendHours}</span>
              </dd>
            </div>
          </dl>

          {/* 버튼도 직각이다 (머리말 "각진 직사각형이다"). 채운 것이 주 동선, 테두리만 있는 것이 부 동선 */}
          <div className="flex flex-wrap gap-3">
            {OFFLINE_SHOP.mapUrl && (
              <a
                href={OFFLINE_SHOP.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid tracking-button inline-flex min-h-11 items-center px-9 text-xs transition-colors duration-500"
              >
                VIEW MORE<span className="sr-only">(지도, 새 창)</span>
              </a>
            )}
            <a
              href={KAKAO_CHANNEL.chat}
              target="_blank"
              rel="noopener noreferrer"
              className={`ease-fluid tracking-button inline-flex min-h-11 items-center px-9 text-xs transition-colors duration-500 ${
                OFFLINE_SHOP.mapUrl
                  ? "border-interactive text-accent hover:border-accent hover:bg-accent-tint border"
                  : "bg-accent text-on-accent hover:bg-accent-hover"
              }`}
            >
              방문 문의<span className="sr-only">(카카오톡 채널, 새 창)</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

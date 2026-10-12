/**
 * 사이트 정식 주소 (예: https://leoneferito.kr). 운영 서버에서는 빌더가 SITE_DOMAIN 으로 넣는다(BE docker-compose.prod.yml).
 * TODO(고객확인) G-1 도메인.
 *
 * 비어 있으면 metadataBase · sitemap 을 만들지 않는다 — 틀린 절대 주소가 공유 미리보기와
 * 검색엔진에 박히는 것보다 없는 편이 낫다.
 */
const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");

export const SITE_URL: string | null = /^https?:\/\/[^/\s]+$/.test(raw) ? raw : null;

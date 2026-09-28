import type { NextConfig } from "next";

/**
 * D3 결정: Next.js + 정적 내보내기(SSG)
 *
 * next build 가 라우트마다 HTML 파일을 만들어 out/ 에 넣는다. Node 서버가 상주하지 않으므로
 * S3 + CloudFront 같은 정적 호스팅에 그대로 올린다 — 고객이 내는 월 서버비가 SPA 와 같다.
 * 그런데도 상품별 <title>/description/og:image 가 HTML 에 박혀 나가므로
 * 검색 노출과 카톡·인스타 공유 미리보기가 정상 동작한다. (SPA 가 못 하는 지점)
 *
 * 나중에 SSR/ISR 이 필요해지면 output 만 지우면 된다. 라우팅·데이터 페칭 코드는 그대로 쓴다.
 */
const nextConfig: NextConfig = {
  output: "export",

  // /products → /products/index.html 로 내보낸다.
  // S3 정적 호스팅은 확장자 없는 경로를 스스로 해석하지 못해서, 이게 없으면
  // CloudFront 에 경로 재작성 함수를 따로 붙여야 한다.
  trailingSlash: true,

  images: {
    // 정적 내보내기에서는 next/image 의 서버 최적화가 동작하지 않는다.
    // 선택지는 (1) unoptimized (2) 커스텀 로더 두 가지뿐이다.
    //
    // 지금은 (1). Phase 2 에서 BE 가 업로드 이미지를 디코드→재인코딩→렌디션 생성하도록
    // 만들 예정이므로, Phase 3 에서 그 렌디션 URL 을 가리키는 커스텀 로더로 바꾼다.
    // 그때 loader: "custom" + loaderFile 을 쓴다. (TODO: Phase 3)
    unoptimized: true,
  },

  // 빌드 시 타입 오류를 무시하지 않는다. 기본값이지만 명시해 둔다 —
  // 배포 파이프라인에서 이걸 끄고 싶은 유혹이 생기는 자리다.
  typescript: { ignoreBuildErrors: false },

  // 참고: Next 16 부터 next.config 의 `eslint` 키는 제거됐다.
  // 린트는 빌드와 분리되어 `npm run lint` 로 실행한다 (CI 에서 별도 단계로 돌린다).
};

export default nextConfig;

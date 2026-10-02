/**
 * LEONE FERITO 워드마크.
 *
 * SVG 를 JS 번들에 인라인하지 않고 CSS mask 로 쓴다:
 *   - SVG 파일(7.4KB)이 번들에 안 들어가고 브라우저 캐시에 남는다
 *   - 색은 background-color(currentColor)로 제어되므로 상황별 색을 자유롭게 준다
 *
 * 딥 와인 테마에서는 로고 원본색(#443D38, 고동색)을 **쓰지 못한다** — 와인 바닥 대비
 * 1.9:1 이라 사라진다. 원본색은 밝은 종이에 찍히도록 만들어진 색이기 때문이다.
 * 그래서 화면에서는 currentColor 로 크림(--text-primary) 또는 골드를 준다.
 * 인쇄·행택처럼 밝은 바탕에 찍을 때만 원본색을 쓴다.
 *
 * 비율 215.64 : 19.43 ≈ 11.1 : 1 — 높이는 폭에서 계산하므로 따로 주지 않는다.
 */

const ASPECT_RATIO = 215.64 / 19.43;

interface LogoProps {
  /** 워드마크 가로 폭(px). 높이는 비율로 자동 계산된다. `fluid` 일 때는 무시된다. */
  width?: number;
  /**
   * 부모 폭을 꽉 채운다. 높이는 aspect-ratio 로 따라온다.
   *
   * 히어로 바탕 워드마크처럼 화면 폭에 맞춰 커져야 하는 자리에 쓴다.
   * 고정 px 로 두면 좁은 화면에서 잘려 "ONE FERI" 처럼 글자가 토막난다.
   */
  fluid?: boolean;
  /**
   * 스크린리더용 이름.
   * 빈 문자열을 넘기면 장식으로 처리된다 — 감싸는 링크에 이미 aria-label 이 있을 때 쓴다.
   * (같은 이름이 두 번 읽히면 오히려 방해가 된다)
   */
  label?: string;
  className?: string;
  /**
   * 마스크 안에 겹쳐 그릴 것 — 글자 모양으로만 보인다.
   * 브랜드 히어로의 금속 광택(지나가는 빛 띠)이 이걸로 들어간다. 바탕색(currentColor)은 그대로다.
   */
  children?: React.ReactNode;
}

export function Logo({
  width = 168,
  fluid = false,
  label = "LEONE FERITO",
  className = "",
  children,
}: LogoProps) {
  const maskUrl = "url(/brand/leoneferito-wordmark.svg)";

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={`block bg-current ${children ? "relative overflow-hidden" : ""} ${fluid ? "w-full" : "inline-block shrink-0"} ${className}`}
      style={{
        ...(fluid
          ? { aspectRatio: `${ASPECT_RATIO}` }
          : { width: `${width}px`, height: `${width / ASPECT_RATIO}px` }),
        maskImage: maskUrl,
        WebkitMaskImage: maskUrl,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    >
      {children}
    </span>
  );
}

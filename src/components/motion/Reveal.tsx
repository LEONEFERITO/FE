"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * 스크롤 진입 연출.
 *
 * 요소가 화면에 정적으로 툭 나타나지 않는다. 아래에서 올라오며 초점이 맞는 동안
 * 사용자의 시선이 자연스럽게 따라간다.
 *
 * IntersectionObserver 를 쓰는 이유: scroll 이벤트 리스너는 스크롤 한 번에 수십~수백 번
 * 발화하고 매번 레이아웃을 재계산해서 모바일 프레임을 떨어뜨린다.
 * Observer 는 브라우저가 합성 단계에서 처리한다.
 *
 * 한 번 보이면 관찰을 끊는다 — 위아래로 스크롤할 때마다 요소가 다시 사라지면 거슬린다.
 *
 * 실제 트랜지션은 globals.css 의 `.reveal` 이 담당하고, 숨김은 html[data-motion="on"]
 * 일 때만 적용된다. JS 가 없으면 콘텐츠는 그냥 보인다.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** 순차 등장용 지연(ms). 형제 요소에 100~150씩 주면 계단식으로 올라온다. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => {
      el.dataset.visible = "true";
    };

    /*
     * 마운트 시점에 이미 화면에 걸쳐 있으면 관찰자를 기다리지 않고 바로 보여준다.
     *
     * 이유: 관찰자 콜백은 브라우저 합성 단계에 의존해서, 탭이 백그라운드이거나
     * 렌더링이 지연된 환경에서는 첫 발화가 늦거나 건너뛰어진다.
     * 그 경우 첫 화면 콘텐츠가 계속 숨어 있게 된다 — 연출보다 보이는 것이 우선이다.
     */
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      show();
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          io.disconnect();
        }
      },
      {
        // 화면 아래 8% 는 아직 "진입 전" 으로 본다. 요소가 올라온 뒤 시작해야 덜 산만하다.
        rootMargin: "0px 0px -8% 0px",
        // 주의: threshold 는 반드시 0 이어야 한다.
        //
        // threshold 는 "요소 **면적**의 몇 %가 보이는가" 다. 뷰포트보다 큰 요소
        // (상품 갤러리, 구매 패널처럼 세로로 긴 블록)는 그 비율을 영영 못 채운다.
        // 0.15 로 뒀더니 상품 상세의 리빌이 전부 발화하지 않았다 —
        // 콘텐츠가 길수록 안 보이는, 방향이 거꾸로 된 버그다.
        threshold: 0,
      },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

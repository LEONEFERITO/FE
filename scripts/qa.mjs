/**
 * QA — 정적 빌드를 실제 브라우저로 열어 페이지마다 점검한다.
 *
 * 이 창의 미리보기는 document.hidden 이 항상 true 라 IntersectionObserver 도 스크롤도
 * 발화하지 않는다. 그래서 확인할 수 있는 것만 확인하고, 확인 못 한 것은 "못 했다" 고 적는다.
 * 통과했다고 거짓으로 적는 것보다 낫다.
 *
 * 점검 항목 — 전부 **기계가 판정할 수 있는 것**만 둔다:
 *   1. 콘솔 오류 · 404
 *   2. 가로 스크롤 (모바일 375 / 데스크톱 1440)
 *   3. h1 이 정확히 하나인가 (문서 구조)
 *   4. 이미지 alt 누락
 *   5. 폼 입력에 라벨이 연결됐는가
 *   6. 터치 표적 44px 미만인 대화형 요소
 *   7. 글자 대비 4.5:1 미만 (실제 계산된 색으로)
 *   8. 링크 목적지가 실제로 존재하는가
 *   9. 개발용 표시(TODO 등)가 화면에 남았는가
 *
 * 사용: node scripts/qa.mjs <기준URL> [출력JSON]
 */
import fs from "node:fs";
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://127.0.0.1:4333";
const OUT = process.argv[3] ?? null;

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

const PAGES = [
  { path: "/", name: "메인" },
  { path: "/products/", name: "제품 목록" },
  // 상세는 아래에서 목록 페이지의 첫 상품으로 정한다 — 상품이 서버(관리자)에서 오므로 이름을 고정할 수 없다.
  // 2026-10-05 디자인 가이드로 생긴 페이지. 상품이 없는 분류(수트)도 같은 레이아웃이어야 한다.
  { path: "/category/shirts/", name: "카테고리(셔츠)" },
  { path: "/category/suit/", name: "카테고리(수트 · 상품 없음)" },
  { path: "/line/ferito/", name: "라인(페리토)" },
  { path: "/line/leone/", name: "라인(레오네)" },
  { path: "/login/", name: "로그인" },
  { path: "/signup/", name: "회원가입" },
  { path: "/cart/", name: "장바구니" },
  { path: "/terms/", name: "이용약관" },
  // 고객이 요구한 메뉴들. 헤더에서 이 주소를 가리키므로 전부 검사한다.
  { path: "/brand/", name: "브랜드" },
  { path: "/guide/", name: "이용 안내" },
  { path: "/lookbook/", name: "룩북" },
  { path: "/qna/", name: "QnA" },
  { path: "/mypage/", name: "마이페이지" },
  { path: "/admin/products/new/", name: "관리자 상품 등록" },
  // QA 브라우저는 로그인하지 않았으므로 "로그인이 필요합니다" 상태를 검사하게 된다.
  { path: "/admin/products/", name: "관리자 상품 목록" },
  { path: "/admin/products/edit/", name: "관리자 상품 수정(id 없음)" },
  { path: "/admin/members/", name: "관리자 회원 목록" },
  { path: "/admin/members/detail/", name: "관리자 회원 상세(id 없음)" },
  { path: "/checkout/", name: "주문서(상품 없음)" },
  { path: "/order/success/", name: "결제 완료(결제 정보 없음)" },
  { path: "/order/fail/", name: "결제 미완료" },
  { path: "/mypage/order/", name: "주문 상세(번호 없음)" },
  { path: "/admin/orders/", name: "관리자 주문 목록" },
  { path: "/admin/orders/detail/", name: "관리자 주문 상세(번호 없음)" },
  { path: "/privacy/", name: "개인정보처리방침" },
  { path: "/find/", name: "비밀번호 찾기" },
  { path: "/reset/", name: "새 비밀번호(링크 없음)" },
  { path: "/mypage/return/", name: "교환·반품 신청(번호 없음)" },
  { path: "/admin/returns/", name: "관리자 교환·반품 목록" },
  { path: "/admin/returns/detail/", name: "관리자 교환·반품 상세(번호 없음)" },
  { path: "/notice/", name: "공지사항" },
  { path: "/notice/view/", name: "공지 하나(번호 없음)" },
  { path: "/admin/login/", name: "관리자 로그인" },
  // 아래 관리자 화면은 로그인 전이라 관리자 로그인으로 옮겨 간다 — 옮겨 간 화면을 검사한다
  { path: "/admin/", name: "관리자 대시보드 → 로그인" },
  { path: "/admin/stats/", name: "관리자 통계 → 로그인" },
  { path: "/admin/notices/edit/", name: "관리자 공지 쓰기 → 로그인" },
  { path: "/admin/display/why/", name: "관리자 WHY 구간 → 로그인" },
  { path: "/admin/display/offline/", name: "관리자 매장 사진 → 로그인" },
  // 없는 주소 — 404 응답이 정답이다(not-found 화면)
  { path: "/no-such-page/", name: "404", expectStatus: 404 },
];

/*
 * 폭을 늘렸다. 375 와 1440 만 보면 그 사이가 빈다 —
 * 실제로 상품 상세의 실측표가 **1024 에서만** 잘리고 있었고 두 폭에서는 안 보였다.
 * 320 은 가장 좁은 실기기(iPhone SE 1세대), 768/1024 는 태블릿, 1920 은 큰 모니터다.
 */
const VIEWPORTS = [
  { name: "320", width: 320, height: 812 },
  { name: "mobile", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 900 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "1920", width: 1920, height: 1000 },
];

/** 상대 휘도 (WCAG 2.1). sRGB 를 선형으로 되돌린 뒤 가중 합한다. */
function luminance([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function parseRgb(css) {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return null;
  return { rgb: parts.slice(0, 3), alpha: parts.length > 3 ? parts[3] : 1 };
}

/** 반투명 글자를 배경 위에 합성한다. 합성하지 않으면 대비를 실제보다 높게 계산한다. */
function composite(fg, bg, alpha) {
  return fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));
}

const results = [];
// Edge 가 업데이트 중이면 뜨지 않는다 — 그때는 크롬으로 (둘 다 창 없이 돈다)
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
async function launch() {
  for (const executablePath of [EDGE, CHROME]) {
    try {
      return await puppeteer.launch({ executablePath, headless: true, args: ["--hide-scrollbars"] });
    } catch (e) {
      console.log(`브라우저를 띄우지 못했다 (${executablePath}) — 다음 것으로`);
    }
  }
  throw new Error("QA 브라우저를 띄우지 못했다");
}
const browser = await launch();

/*
 * 상품 상세 주소 — 목록 페이지에서 첫 상품 링크를 찾는다. 상품은 관리자가 공개한 것이라
 * 테스트 데이터에 따라 바뀐다. 상품이 하나도 없으면 상세는 검사하지 못했다고 적는다.
 */
{
  const probe = await browser.newPage();
  await probe.goto(BASE + "/products/", { waitUntil: "networkidle0" });
  const detail = await probe.evaluate(() =>
    [...document.querySelectorAll("main a[href^='/products/']")]
      .map((a) => a.getAttribute("href"))
      .find((h) => h && h !== "/products/" && h !== "/products"),
  );
  await probe.close();
  if (detail) {
    PAGES.splice(2, 0, { path: detail.endsWith("/") ? detail : detail + "/", name: "제품 상세" });
  } else {
    console.log("공개 상품이 없어 제품 상세는 검사하지 못했다");
  }
}

for (const vp of VIEWPORTS) {
  for (const target of PAGES) {
    const page = await browser.newPage();
    const consoleErrors = [];
    const badRequests = [];

    page.on("console", (m) => {
      if (m.type() !== "error") return;
      /*
       * next/link 는 RSC 페이로드를 미리 받아두려 하는데, 정적 내보내기에는 그 파일이
       * 없어서 항상 404 가 난다. 화면에는 아무 영향이 없고(이동은 전체 로드로 대체된다)
       * 우리가 고칠 수 있는 것도 아니다. 진짜 오류를 가리지 않게 걸러낸다.
       */
      const text = m.text();
      /*
       * 리소스 로드 실패는 아래 badRequests 가 URL 까지 담아 따로 잡는다.
       * 콘솔 메시지에는 URL 이 없어서 RSC 프리페치인지 진짜 문제인지 구분할 수 없다.
       * 같은 사실을 두 번 세지 않도록 여기서는 버린다.
       */
      if (text.startsWith("Failed to load resource")) return;
      consoleErrors.push(text.slice(0, 200));
    });
    page.on("pageerror", (e) => consoleErrors.push("PAGEERROR " + e.message.slice(0, 200)));
    page.on("response", (r) => {
      if (r.status() >= 400) {
        const url = r.url();
        // 정적 내보내기는 Link 프리페치용 RSC 파일을 찾다가 404 를 낸다. 화면과 무관하다.
        if (url.includes("_rsc=") || url.endsWith(".txt")) return;
        if (target.expectStatus === r.status() && url === BASE + target.path) return;
        /*
         * QA 브라우저는 로그인하지 않는다. 그래서 "누구세요"(/api/auth/me)와 관리자 API 의
         * 401 은 실패가 아니라 정답이다 — 화면은 그 답을 받아 "로그인이 필요합니다" 를 그린다.
         * 다른 4xx/5xx 는 그대로 잡는다.
         */
        // QA 브라우저는 로그인하지 않았다. 회원 전용 API 의 401 은 정상 응답이다(화면은 "로그인하세요" 를 그린다).
        if (
          r.status() === 401 &&
          ["/api/auth/me", "/api/admin/", "/api/cart", "/api/orders", "/api/me/"].some((p) => url.includes(p))
        )
          return;
        badRequests.push(`${r.status()} ${url.replace(BASE, "")}`);
      }
    });

    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await page.goto(BASE + target.path, { waitUntil: "networkidle0" });
    // 관리자 화면은 로그인 확인 뒤 브라우저에서 옮겨 간다(AdminGate). 옮겨 간 뒤를 검사한다.
    await new Promise((r) => setTimeout(r, 500));
    await page.waitForNetworkIdle({ idleTime: 400, timeout: 10000 }).catch(() => {});

    // 스크롤 연출은 이 환경에서 발화하지 않는다. 검사 대상을 보이게 만들어 둔다.
    await page.evaluate(() => {
      document.querySelectorAll(".reveal, .stage-in").forEach((el) => {
        el.dataset.visible = "true";
        el.style.transition = "none";
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      document.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager"));
    });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 600));

    const audit = await page.evaluate(() => {
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
      };

      // 배경색이 투명한 요소는 조상에서 실제 배경을 찾아 올라간다.
      const effectiveBg = (el) => {
        let node = el;
        while (node && node !== document.documentElement) {
          const bg = getComputedStyle(node).backgroundColor;
          if (bg && !bg.includes("rgba(0, 0, 0, 0)") && bg !== "transparent") return bg;
          node = node.parentElement;
        }
        return getComputedStyle(document.body).backgroundColor;
      };

      const textNodes = [];
      document.querySelectorAll("body *").forEach((el) => {
        if (!visible(el)) return;
        const own = [...el.childNodes]
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent.trim())
          .join(" ")
          .trim();
        if (!own) return;
        const cs = getComputedStyle(el);
        /*
         * 윤곽선 글자 (color: transparent + -webkit-text-stroke).
         *
         * 속을 비우고 외곽선만 남기는 연출이다 (브랜드 페이지 키워드 띠 — globals.css
         * `.brand-row li:nth-child(even)`). 이때 color 는 알파 0 이라 배경과 합성하면
         * 배경색 **그 자체**가 되어 대비가 정확히 1.00:1 로 나온다. 실제로 눈에 보이게
         * 하는 색은 stroke 쪽인데 color 만 보면 그걸 놓친다 — 멀쩡한 화면이 매번
         * "저대비 5건" 으로 잡혀서 진짜 문제를 덮었다.
         *
         * 그래서 글자가 완전히 투명하고 stroke 가 있으면 stroke 색으로 판정한다.
         * 둘 다 없으면(투명한데 stroke 도 없음) 보이지 않는 글자이니 그대로 걸린다.
         */
        const strokeWidth = parseFloat(cs.webkitTextStrokeWidth) || 0;
        const fillAlpha = (cs.color.match(/rgba?\(([^)]+)\)/)?.[1].split(/[\s,/]+/).filter(Boolean) ?? [])[3];
        const hollow = fillAlpha !== undefined && Number(fillAlpha) === 0 && strokeWidth > 0;
        textNodes.push({
          text: own.slice(0, 40),
          color: hollow ? cs.webkitTextStrokeColor : cs.color,
          bg: effectiveBg(el),
          fontSize: parseFloat(cs.fontSize),
          fontWeight: parseInt(cs.fontWeight, 10) || 400,
          tag: el.tagName.toLowerCase(),
          // 윤곽선 글자는 선이 얇아서 대비가 충분해도 읽기 어려울 수 있다. 사람이 볼 수 있게 남긴다.
          outlined: hollow || undefined,
        });
      });

      const interactive = [];
      document.querySelectorAll("a[href], button, input, select, textarea").forEach((el) => {
        if (!visible(el) || el.disabled) return;
        /*
         * 체크박스·라디오는 <label> 로 감싸져 있으면 **라벨 전체가 표적**이다.
         * 라벨을 누르면 브라우저가 입력을 토글한다. 입력 상자만 재면 16×16 으로
         * 미달처럼 보이지만 실제로 누를 수 있는 면은 라벨 높이다.
         */
        // ?? 는 null/undefined 만 거른다. && 가 돌려준 false 는 그대로 통과해서 터진다.
        const wrappingLabel =
          el.type === "checkbox" || el.type === "radio" ? el.closest("label") : null;
        const r = (wrappingLabel || el).getBoundingClientRect();
        // 본문 안에 흐르는 인라인 링크는 표적 크기 예외다(WCAG 2.5.8).
        const inline = el.tagName === "A" && getComputedStyle(el).display === "inline";
        interactive.push({
          tag: el.tagName.toLowerCase(),
          label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30),
          w: Math.round(r.width),
          h: Math.round(r.height),
          inline,
        });
      });

      const unlabeled = [];
      document.querySelectorAll("input, select, textarea").forEach((el) => {
        if (el.type === "hidden") return;
        const hasLabel =
          (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) ||
          el.closest("label") ||
          el.getAttribute("aria-label") ||
          el.getAttribute("aria-labelledby");
        if (!hasLabel) unlabeled.push(el.name || el.type);
      });

      const imagesWithoutAlt = [];
      document.querySelectorAll("img").forEach((img) => {
        if (img.getAttribute("alt") === null) imagesWithoutAlt.push(img.getAttribute("src"));
      });

      const brokenImages = [...document.querySelectorAll("img")]
        .filter((i) => i.complete && i.naturalWidth === 0)
        .map((i) => i.getAttribute("src"));

      return {
        title: document.title,
        h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim().slice(0, 40)),
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
        textNodes,
        interactive,
        unlabeled,
        imagesWithoutAlt,
        brokenImages,
        devMarkers: (document.body.innerText.match(/TODO|FIXME|lorem ipsum|undefined|NaN/gi) || []),
        links: [...document.querySelectorAll("a[href]")]
          .map((a) => a.getAttribute("href"))
          .filter((h) => h && h.startsWith("/")),
      };
    });

    // 대비는 브라우저 밖에서 계산한다 — 반투명 합성을 제대로 하기 위해서다.
    const lowContrast = [];
    for (const n of audit.textNodes) {
      const fg = parseRgb(n.color);
      const bg = parseRgb(n.bg);
      if (!fg || !bg) continue;
      const composited = fg.alpha < 1 ? composite(fg.rgb, bg.rgb, fg.alpha) : fg.rgb;
      const ratio = contrast(composited, bg.rgb);
      // 큰 글자(18.66px 이상 굵게 / 24px 이상)는 3:1 이 기준이다.
      const large = n.fontSize >= 24 || (n.fontSize >= 18.66 && n.fontWeight >= 700);
      const required = large ? 3 : 4.5;
      if (ratio < required) {
        lowContrast.push({ text: n.text, ratio: Number(ratio.toFixed(2)), required, fontSize: n.fontSize });
      }
    }

    /*
     * 표적 크기(WCAG 2.5.8, 24×24).
     * 건너뛰기 링크는 제외한다 — 평소 1×1 로 숨어 있다가 초점을 받으면 커지는 것이
     * 정상 동작이고, 크기를 키우면 오히려 모든 화면 좌상단에 글자가 상시 노출된다.
     */
    const smallTargets = audit.interactive.filter(
      (t) => !t.inline && !(t.w <= 1 && t.h <= 1) && (t.w < 24 || t.h < 24),
    );

    results.push({
      viewport: vp.name,
      page: target.name,
      path: target.path,
      title: audit.title,
      h1Count: audit.h1.length,
      h1: audit.h1,
      horizontalOverflow: audit.horizontalOverflow,
      consoleErrors,
      badRequests,
      brokenImages: audit.brokenImages,
      imagesWithoutAlt: audit.imagesWithoutAlt,
      unlabeledInputs: audit.unlabeled,
      smallTargets,
      lowContrast,
      devMarkers: audit.devMarkers,
      internalLinks: [...new Set(audit.links)],
    });

    await page.close();
  }
}

await browser.close();

// ── 요약 ────────────────────────────────────────────────
const problems = [];
for (const r of results) {
  const where = `${r.viewport} ${r.page}`;
  if (r.horizontalOverflow > 0) problems.push(`${where}: 가로 스크롤 ${r.horizontalOverflow}px`);
  if (r.h1Count !== 1) problems.push(`${where}: h1 이 ${r.h1Count}개`);
  if (r.consoleErrors.length) problems.push(`${where}: 콘솔 오류 ${r.consoleErrors.length}건 — ${r.consoleErrors[0]}`);
  if (r.badRequests.length) problems.push(`${where}: 실패 요청 ${r.badRequests.join(", ")}`);
  if (r.brokenImages.length) problems.push(`${where}: 깨진 이미지 ${r.brokenImages.join(", ")}`);
  if (r.imagesWithoutAlt.length) problems.push(`${where}: alt 없는 이미지 ${r.imagesWithoutAlt.length}건`);
  if (r.unlabeledInputs.length) problems.push(`${where}: 라벨 없는 입력 ${r.unlabeledInputs.join(", ")}`);
  if (r.smallTargets.length) problems.push(`${where}: 작은 표적 ${r.smallTargets.length}건 — ${r.smallTargets.map((t) => `${t.label}(${t.w}x${t.h})`).slice(0, 3).join(", ")}`);
  if (r.lowContrast.length) problems.push(`${where}: 저대비 ${r.lowContrast.length}건 — ${r.lowContrast.map((c) => `"${c.text}" ${c.ratio}:1`).slice(0, 3).join(", ")}`);
  if (r.devMarkers.length) problems.push(`${where}: 개발용 표시 ${[...new Set(r.devMarkers)].join(", ")}`);
}

/*
 * 링크 목적지가 실제로 있는가 (머리말 8번).
 *
 * 그동안 internalLinks 를 **모으기만 하고 판정하지 않았다** — 검사 목록에는 있는데
 * 요약에서 한 번도 보지 않아서, 링크가 깨져도 "문제 없음" 이 나왔다. 조용히 통과하는
 * 검사는 없는 검사보다 나쁘다. 믿고 안 보게 되기 때문이다.
 *
 * 화면마다가 아니라 링크마다 한 번씩 본다. 같은 링크가 여러 화면·뷰포트에 있어서
 * 화면별로 돌면 같은 사실을 수백 번 확인하게 된다.
 */
const linkTargets = new Map(); // 경로 → 그 링크가 있던 화면들
for (const r of results) {
  for (const href of r.internalLinks) {
    const target = href.split("#")[0].split("?")[0];
    if (!target) continue;
    if (!linkTargets.has(target)) linkTargets.set(target, new Set());
    linkTargets.get(target).add(r.page);
  }
}
for (const [target, pages] of [...linkTargets].sort()) {
  let status;
  try {
    status = (await fetch(BASE + target, { redirect: "manual" })).status;
  } catch (e) {
    status = `연결 실패 ${e.message}`;
  }
  if (status !== 200) {
    problems.push(`링크 깨짐: ${target} → ${status} (${[...pages].slice(0, 4).join(", ")})`);
  }
}

console.log(problems.length === 0 ? "문제 없음" : problems.join("\n"));
console.log(`\n확인한 내부 링크: ${linkTargets.size}종`);
console.log(`\n검사한 화면: ${results.length}개 (페이지 ${PAGES.length} × 뷰포트 ${VIEWPORTS.length})`);

if (OUT) fs.writeFileSync(OUT, JSON.stringify(results, null, 2), "utf-8");

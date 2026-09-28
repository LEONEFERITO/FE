/**
 * 섹션별 스크린샷 — 메인 페이지를 헤드리스 브라우저로 렌더해 섹션마다 한 장씩 저장한다.
 *
 * 왜 필요한가: 디자인 시안을 "상상도" 로 그리지 않고 **실제 코드가 그린 화면** 을 그대로 자른다.
 * 시안과 구현이 갈라질 틈이 없다. 나중에 화면 회귀 비교(before/after)에도 그대로 쓴다.
 *
 * 사용: node scripts/shoot-sections.mjs <출력폴더> [URL]
 *   - 시스템에 설치된 Edge/Chrome 을 쓴다. puppeteer-core 는 브라우저를 내려받지 않는다.
 *   - dvh 단위가 깨지지 않도록 뷰포트는 900px 로 고정하고, 뷰포트 밖은 captureBeyondViewport 로 찍는다.
 *     (창을 페이지 높이만큼 키우면 100dvh 히어로가 페이지 전체 높이로 늘어난다)
 */
import fs from "node:fs";
import path from "node:path";

import puppeteer from "puppeteer-core";
import sharp from "sharp";

const OUT = process.argv[2];
const URL = process.argv[3] ?? "http://localhost:3000/";
if (!OUT) {
  console.error("사용: node scripts/shoot-sections.mjs <출력폴더> [URL]");
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const CANDIDATES = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];
const executablePath = CANDIDATES.find((p) => fs.existsSync(p));
if (!executablePath) throw new Error("Chromium 계열 브라우저를 찾지 못했다");

/** 스크롤 진입 연출과 지연 로딩을 전부 풀어서, 화면 밖 구간도 완성된 상태로 찍는다. */
const SETTLE_CSS = `
  *, *::before, *::after { transition: none !important; animation: none !important; }
  html[data-motion="on"] .reveal, html[data-motion="on"] .stage-in {
    opacity: 1 !important; transform: none !important; filter: none !important;
  }
`;

async function settle(page) {
  await page.addStyleTag({ content: SETTLE_CSS });
  await page.evaluate(async () => {
    document.querySelectorAll("img[loading=lazy]").forEach((img) => {
      img.loading = "eager";
    });
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((img) =>
        img.complete
          ? null
          : new Promise((res) => {
              img.addEventListener("load", res, { once: true });
              img.addEventListener("error", res, { once: true });
            }),
      ),
    );
  });
}

/** main 의 직계 자식 = 섹션. 첫 섹션(히어로)은 헤더까지 포함해 페이지 맨 위부터 자른다. */
async function sections(page) {
  return page.evaluate(() => {
    const els = [...document.querySelectorAll("main > *")].filter(
      (el) => el.getBoundingClientRect().height > 40,
    );
    return els.map((el, i) => {
      const r = el.getBoundingClientRect();
      const labelled = el.getAttribute("aria-labelledby");
      const name =
        el.getAttribute("aria-label") ??
        (labelled ? document.getElementById(labelled)?.textContent?.trim() : null) ??
        el.querySelector("h2, h1")?.textContent?.trim() ??
        el.tagName.toLowerCase();
      const top = i === 0 ? 0 : r.top + window.scrollY;
      const height = i === 0 ? r.bottom + window.scrollY : r.height;
      return { i, name, top, height };
    });
  });
}

function slug(i, name) {
  const map = {
    "대표 제품": "hero",
    제품: "products",
    "사진이 아니라 치수로 고르세요": "why",
    "같은 사이즈, 다른 패턴": "fit-compare",
    "내 사이즈 찾기": "size-finder",
    "안 맞으면 바꿔 드립니다": "exchange",
  };
  return `${String(i + 1).padStart(2, "0")}-${map[name] ?? "section"}`;
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--hide-scrollbars", "--force-color-profile=srgb"],
});

try {
  const report = { desktop: [], mobile: [] };

  // ── 데스크톱: 섹션마다 한 장 ─────────────────────────────
  {
    const dpr = 1.5;
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: dpr });
    await page.goto(URL, { waitUntil: "networkidle0" });
    await settle(page);
    const list = await sections(page);
    const full = await page.screenshot({ fullPage: true, captureBeyondViewport: true });
    const meta = await sharp(full).metadata();
    for (const s of list) {
      const top = Math.round(s.top * dpr);
      const height = Math.min(Math.round(s.height * dpr), meta.height - top);
      const file = path.join(OUT, `desktop-${slug(s.i, s.name)}.png`);
      await sharp(full).extract({ left: 0, top, width: meta.width, height }).png().toFile(file);
      report.desktop.push({ ...s, file: path.basename(file) });
    }
    report.heroSrcDesktop = await page.evaluate(
      () => document.querySelector("[aria-roledescription=carousel] img")?.currentSrc ?? null,
    );
    await page.close();
  }

  // ── 모바일: 히어로 한 장 (첫 화면 + 히어로 전체) ─────────────
  {
    const dpr = 2;
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
    await page.goto(URL, { waitUntil: "networkidle0" });
    await settle(page);
    const list = await sections(page);
    const full = await page.screenshot({ fullPage: true, captureBeyondViewport: true });
    const meta = await sharp(full).metadata();
    const hero = list[0];
    const height = Math.min(Math.round(hero.height * dpr), meta.height);
    const file = path.join(OUT, "mobile-01-hero.png");
    await sharp(full).extract({ left: 0, top: 0, width: meta.width, height }).png().toFile(file);
    report.mobile.push({ ...hero, file: path.basename(file) });
    report.heroSrcMobile = await page.evaluate(
      () => document.querySelector("[aria-roledescription=carousel] img")?.currentSrc ?? null,
    );
    report.mobileHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    await page.close();
  }

  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}

"use client";

import { useEffect, useState } from "react";

import { ErrorNotice } from "@/components/admin/AdminProductList";
import { visitStats, type VisitCount, type VisitStats } from "@/lib/console";
import { SHOP_CONNECTED, ShopError } from "@/lib/shop";

/**
 * 접속 통계 (서버 V51, 2026-11-09 고객 "날짜 · 요일 · 시간대별로 얼마나 접속했는지, 접속 경로는 어떤지").
 *
 * 위: 기간(오늘 · 7일 · 30일 · 90일 · 직접) → 숫자 셋(방문자 · 방문 · 본 페이지) → 날짜별 막대 → 요일 · 시간대 막대 →
 * 유입 경로 · 들어온 사이트 · 첫 페이지 · 기기 → 날짜별 표.
 *
 * 막대는 계열이 하나라 색 하나(강조색)만 쓰고 범례 대신 제목이 무엇인지 말한다. 막대에 마우스를 올리거나 초점을 주면 숫자가 뜬다.
 * 같은 숫자를 맨 아래 표로도 볼 수 있다(색 · 모양만으로 읽지 않게).
 * 시간은 모두 한국 시간. 방문자는 날마다 센다 — 서버가 하루짜리 익명 값만 남겨서 날을 넘어 같은 사람인지 모른다.
 */

type State = { kind: "loading" } | { kind: "error"; code: string; message: string } | { kind: "ready"; s: VisitStats };

/** 한국 날짜(yyyy-MM-dd) */
const seoulToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

const PRESETS = [
  { days: 1, label: "오늘" },
  { days: 7, label: "최근 7일" },
  { days: 30, label: "최근 30일" },
  { days: 90, label: "최근 90일" },
];

const WEEKDAY = ["월", "화", "수", "목", "금", "토", "일"];

const SOURCE_LABEL: Record<string, string> = {
  DIRECT: "직접 입력 · 즐겨찾기",
  NAVER: "네이버",
  GOOGLE: "구글",
  DAUM: "다음",
  KAKAO: "카카오",
  INSTAGRAM: "인스타그램",
  FACEBOOK: "페이스북",
  YOUTUBE: "유튜브",
  OTHER: "기타 사이트",
};

const DEVICE_LABEL: Record<string, string> = { MOBILE: "휴대폰", TABLET: "태블릿", DESKTOP: "PC" };

const num = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export function AdminVisitStats() {
  const today = seoulToday();
  const [range, setRange] = useState({ from: addDays(today, -29), to: today });
  const [state, setState] = useState<State>(
    SHOP_CONNECTED ? { kind: "loading" } : { kind: "error", code: "NOT_CONNECTED", message: "서버가 아직 연결되지 않았습니다." },
  );

  useEffect(() => {
    if (!SHOP_CONNECTED) return;
    let alive = true;
    visitStats(range.from, range.to)
      .then((s) => alive && setState({ kind: "ready", s }))
      .catch((e) => {
        if (!alive) return;
        const code = e instanceof ShopError ? (e.status === 401 ? "UNAUTHENTICATED" : e.status === 403 ? "FORBIDDEN" : e.code) : "UNKNOWN";
        setState({ kind: "error", code, message: e instanceof ShopError ? e.message : "불러오지 못했습니다." });
      });
    return () => {
      alive = false;
    };
  }, [range]);

  const span = daysBetween(range.from, range.to) + 1;
  const preset = range.to === today ? PRESETS.find((p) => p.days === span)?.days : undefined;

  function pick(days: number) {
    setState({ kind: "loading" });
    setRange({ from: addDays(today, -(days - 1)), to: today });
  }

  function custom(next: { from: string; to: string }) {
    // 거꾸로 고르면 맞춰 주고, 366일을 넘으면 시작일을 당긴다(서버 한도)
    let { from, to } = next;
    if (!from || !to) return;
    if (from > to) [from, to] = [to, from];
    if (daysBetween(from, to) > 365) from = addDays(to, -365);
    setState({ kind: "loading" });
    setRange({ from, to });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="기간" className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const on = preset === p.days;
            return (
              <button
                key={p.days}
                type="button"
                aria-pressed={on}
                onClick={() => pick(p.days)}
                className={`ease-fluid inline-flex min-h-11 items-center rounded-full border px-5 text-sm transition-colors duration-300 ${
                  on ? "border-accent bg-accent text-on-accent" : "border-interactive text-secondary hover:border-accent hover:text-primary"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <span className="text-secondary flex flex-wrap items-center gap-2 text-xs sm:ml-2">
          <label className="flex items-center gap-1.5">
            <span className="sr-only">시작일</span>
            <input
              type="date"
              value={range.from}
              max={today}
              onChange={(e) => custom({ from: e.target.value, to: range.to })}
              className="text-primary border-interactive focus-visible:border-accent min-h-11 rounded-lg border bg-transparent px-2.5 text-sm tabular-nums"
            />
          </label>
          ~
          <label className="flex items-center gap-1.5">
            <span className="sr-only">종료일</span>
            <input
              type="date"
              value={range.to}
              max={today}
              onChange={(e) => custom({ from: range.from, to: e.target.value })}
              className="text-primary border-interactive focus-visible:border-accent min-h-11 rounded-lg border bg-transparent px-2.5 text-sm tabular-nums"
            />
          </label>
        </span>
      </div>

      {state.kind === "loading" && <p aria-busy="true" className="text-muted text-sm">불러오는 중</p>}
      {state.kind === "error" && <ErrorNotice code={state.code} message={state.message} />}
      {state.kind === "ready" && <Report s={state.s} />}
    </div>
  );
}

function Report({ s }: { s: VisitStats }) {
  const sessions = s.totals.sessions;
  if (s.totals.pageViews === 0) {
    return (
      <div className="border-subtle bg-band/60 rounded-2xl border px-6 py-12 text-center">
        <p className="text-primary text-sm">이 기간에 기록된 접속이 없습니다.</p>
        <p className="text-muted text-2xs mt-2">접속 통계는 이 기능을 반영한 날부터 쌓입니다.</p>
      </div>
    );
  }
  const labelEvery = Math.ceil(s.daily.length / 10);
  return (
    <div className="flex flex-col gap-8">
      {/* 숫자 셋 */}
      <dl className="grid gap-3 sm:grid-cols-3">
        <Tile label="방문자" value={s.totals.visitors} hint="날마다 센 사람 수의 합" />
        <Tile label="방문" value={sessions} hint="사이트에 들어온 횟수" />
        <Tile label="본 페이지" value={s.totals.pageViews} hint={sessions ? `방문 한 번에 평균 ${(s.totals.pageViews / sessions).toFixed(1)}쪽` : ""} />
      </dl>

      <Panel title="날짜별 방문" note={`${s.from} ~ ${s.to} · 한국 시간`}>
        <Bars
          items={s.daily.map((d, i) => ({
            key: d.date,
            value: d.sessions,
            label: i % labelEvery === 0 ? d.date.slice(5).replace("-", "/") : "",
            tip: `${d.date} · 방문 ${num(d.sessions)} · 방문자 ${num(d.visitors)} · 본 페이지 ${num(d.pageViews)}`,
          }))}
        />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,5fr)]">
        <Panel title="요일별 방문">
          <Bars items={s.weekdays.map((w) => ({ key: String(w.dow), value: w.sessions, label: WEEKDAY[w.dow - 1], tip: `${WEEKDAY[w.dow - 1]}요일 · 방문 ${num(w.sessions)}` }))} />
        </Panel>
        <Panel title="시간대별 방문">
          <Bars
            items={s.hours.map((h) => ({
              key: String(h.hour),
              value: h.sessions,
              label: h.hour % 3 === 0 ? String(h.hour) : "",
              tip: `${h.hour}시 ~ ${h.hour + 1}시 · 방문 ${num(h.sessions)}`,
            }))}
          />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="유입 경로" note="광고 · 링크에 utm_source 를 붙이면 그 값으로 가릅니다">
          <Ranks items={s.sources} total={sessions} label={(k) => SOURCE_LABEL[k] ?? k} />
        </Panel>
        <Panel title="기기">
          <Ranks items={s.devices} total={sessions} label={(k) => DEVICE_LABEL[k] ?? k} />
        </Panel>
        <Panel title="들어온 사이트" note="많은 순 10곳">
          {s.referrers.length ? <Ranks items={s.referrers} total={sessions} /> : <p className="text-muted text-xs">다른 사이트에서 들어온 방문이 없습니다.</p>}
        </Panel>
        <Panel title="처음 연 페이지" note="많은 순 10곳">
          <Ranks items={s.landings} total={sessions} />
        </Panel>
      </div>

      <details className="border-subtle bg-surface rounded-2xl border p-6">
        <summary className="text-primary cursor-pointer text-sm font-medium">날짜별 숫자 표</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-subtle text-muted text-2xs border-b text-left">
                <th scope="col" className="py-2 pr-4 font-normal">날짜</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal">방문자</th>
                <th scope="col" className="py-2 pr-4 text-right font-normal">방문</th>
                <th scope="col" className="py-2 text-right font-normal">본 페이지</th>
              </tr>
            </thead>
            <tbody className="divide-subtle divide-y">
              {[...s.daily].reverse().map((d) => (
                <tr key={d.date}>
                  <th scope="row" className="text-primary py-2 pr-4 text-left font-normal tabular-nums">
                    {d.date} ({WEEKDAY[(new Date(`${d.date}T00:00:00Z`).getUTCDay() + 6) % 7]})
                  </th>
                  <td className="py-2 pr-4 text-right tabular-nums">{num(d.visitors)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{num(d.sessions)}</td>
                  <td className="py-2 text-right tabular-nums">{num(d.pageViews)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="text-muted text-2xs leading-relaxed">
        방문 = 사이트에 들어온 횟수(같은 창에서 이어 본 페이지는 한 번), 방문자 = 그날 들어온 사람 수입니다. 개인을 알아볼 수 있는 정보(IP 등)는 저장하지 않아
        날을 넘어 같은 사람인지는 알 수 없습니다. 검색 로봇과 관리자 화면은 세지 않고, 기록은 2년 보관합니다.
      </p>
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="border-subtle bg-surface rounded-2xl border px-5 py-4">
      <dt className="text-secondary text-xs">{label}</dt>
      <dd className="font-display text-primary mt-1 text-3xl tabular-nums">{num(value)}</dd>
      {hint && <dd className="text-muted text-2xs mt-1">{hint}</dd>}
    </div>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="border-subtle bg-surface flex min-w-0 flex-col gap-4 rounded-2xl border p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-primary text-sm font-medium">{title}</h2>
        {note && <p className="text-muted text-2xs">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * 세로 막대 — 계열 하나. 막대 끝만 둥글게(4px), 사이 2px. 마우스 · 초점이면 위에 숫자 풍선.
 * 칸은 막대보다 넓게(칸 전체가 닿는 자리) — 가는 막대도 쉽게 짚는다.
 */
function Bars({ items }: { items: { key: string; value: number; label: string; tip: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div>
      <div className="relative flex h-40 items-end gap-[2px] border-b border-[var(--border-subtle,#E5E5E5)]">
        {/* 가로 눈금 — 절반 · 최대. 옅게 */}
        <span aria-hidden="true" className="text-muted pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-current opacity-20" />
        <span aria-hidden="true" className="text-muted pointer-events-none absolute -top-4 right-0 text-[10px] tabular-nums">{num(max)}</span>
        {items.map((i) => (
          <div key={i.key} tabIndex={0} aria-label={i.tip} className="group relative flex h-full min-w-0 flex-1 items-end outline-none">
            <span
              className="bg-accent group-hover:bg-accent-hover group-focus-visible:bg-accent-hover block w-full rounded-t-[4px] transition-colors duration-200"
              style={{ height: i.value === 0 ? 0 : `max(2px, ${(i.value / max) * 100}%)` }}
            />
            <span
              role="tooltip"
              className="bg-primary text-page pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 rounded-md px-2 py-1 text-[11px] whitespace-nowrap group-hover:block group-focus-visible:block"
            >
              {i.tip}
            </span>
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-1.5 flex gap-[2px]">
        {items.map((i) => (
          <span key={i.key} className="text-muted min-w-0 flex-1 text-center text-[10px] tabular-nums whitespace-nowrap">
            {i.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 가로 막대 목록 — 이름 · 막대 · 숫자 · 비율. 막대 길이는 맨 위 항목 기준 */
function Ranks({ items, total, label = (k) => k }: { items: VisitCount[]; total: number; label?: (key: string) => string }) {
  const max = Math.max(1, ...items.map((i) => i.sessions));
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((i) => (
        <li key={i.key} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-center gap-3 text-sm">
          <span className="text-primary truncate" title={label(i.key)}>{label(i.key)}</span>
          <span aria-hidden="true" className="bg-band h-2 overflow-hidden rounded-full">
            <span className="bg-accent block h-full rounded-full" style={{ width: `${(i.sessions / max) * 100}%` }} />
          </span>
          <span className="text-secondary text-xs tabular-nums">
            <b className="text-primary font-medium">{num(i.sessions)}</b> · {total ? Math.round((i.sessions / total) * 100) : 0}%
          </span>
        </li>
      ))}
    </ul>
  );
}

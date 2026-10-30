"use client";

import { CheckCircle, Warning, X } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useId, useRef, useState } from "react";

import { Field } from "@/components/ui/Field";
import {
  AuthError,
  PROVIDER_LABEL,
  changePassword,
  checkPassword,
  fetchProfile,
  updateProfile,
  withdraw,
  type Profile,
} from "@/lib/auth";

/**
 * 마이페이지 — 내 정보 수정 · 비밀번호 변경 · 탈퇴.
 *
 * ── 세 판은 따로 저장한다 ────────────────────────────────
 * 한 폼에 몰면 비밀번호 칸을 비워 둔 채 이름만 바꾸려는 사람이 "현재 비밀번호" 를
 * 요구받는다. 무엇을 바꾸는지에 따라 확인하는 것이 다르다.
 *
 * ── 비밀번호 관리 · 회원 탈퇴는 팝업 (2026-10-31 디자이너) ─────────────
 * 내 정보 아래에 회색 알약 버튼 두 개. 누르면 팝업(dialog)이 떠서 그 안에서 바꾸거나 탈퇴한다 —
 * 자주 하는 일이 아니라 화면에 늘 펼쳐 둘 이유가 없다. Esc · 바깥 누르기 · X 로 닫힌다.
 * 탈퇴는 무엇이 지워지는지 먼저 읽히고, 확인 체크를 해야 버튼이 눌린다. 버튼은 강조색이 아니다 — 권하는 동작이 아니다.
 *
 * ── 내 정보는 테두리 없이 (2026-10-31) ─────────────────
 * 흰 바탕에 내용만. 저장 버튼과 아래 안내는 가운데. 이메일은 고딕. 휴대폰 번호는 필수(가입과 같다).
 *
 * 간편가입 회원은 비밀번호가 없다. 비밀번호 칸을 그리지 않고 이유를 한 줄 적는다.
 */

// 비밀번호 관리 · 회원 탈퇴 버튼 — 옅은 회색 알약(2026-10-31 디자이너 시안)
const pillButton =
  "ease-fluid inline-flex min-h-14 w-full items-center justify-center rounded-full border border-[#E6E6E6] bg-[#F7F7F7] px-8 text-sm text-primary transition-colors duration-300 hover:border-[#CFCFCF] hover:bg-[#EFEFEF] sm:w-60";
const primaryButton =
  "bg-accent text-on-accent hover:bg-accent-hover ease-fluid inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm transition-colors duration-300 disabled:cursor-wait disabled:opacity-60";

function message(e: unknown): string {
  return e instanceof AuthError ? e.displayMessage : "처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export function AccountSettings({
  onNameChanged,
  onWithdrawn,
}: {
  onNameChanged: (name: string) => void;
  onWithdrawn: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState<"password" | "withdraw" | null>(null);

  useEffect(() => {
    let alive = true;
    fetchProfile()
      .then((p) => alive && setProfile(p))
      .catch((e) => alive && setLoadError(message(e)));
    return () => {
      alive = false;
    };
  }, []);

  if (loadError) return <Notice tone="error">{loadError}</Notice>;
  if (!profile) {
    return (
      <p aria-busy="true" className="text-muted text-sm">
        내 정보를 불러오는 중
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <ProfileForm
        profile={profile}
        onSaved={(p) => {
          setProfile(p);
          onNameChanged(p.name);
        }}
      />

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button type="button" onClick={() => setOpen("password")} className={pillButton} aria-haspopup="dialog">
          비밀번호 관리
        </button>
        <button type="button" onClick={() => setOpen("withdraw")} className={pillButton} aria-haspopup="dialog">
          회원 탈퇴
        </button>
      </div>

      <Modal open={open === "password"} title="비밀번호 관리" onClose={() => setOpen(null)}>
        {profile.hasPassword ? (
          <PasswordForm email={profile.email} />
        ) : (
          <p className="text-secondary text-sm leading-relaxed">
            {PROVIDER_LABEL[profile.provider]} 간편가입 계정이라 비밀번호가 없습니다.{" "}
            {PROVIDER_LABEL[profile.provider]}로 로그인해 주세요.
          </p>
        )}
      </Modal>
      <Modal open={open === "withdraw"} title="회원 탈퇴" onClose={() => setOpen(null)}>
        <WithdrawPanel hasPassword={profile.hasPassword} onWithdrawn={onWithdrawn} />
      </Modal>
    </div>
  );
}

/**
 * 팝업 — 브라우저 dialog(showModal). 뒤 화면은 눌리지 않고, 키보드 초점이 팝업 안에 갇히며, Esc 로 닫힌다.
 * 바깥(어두운 막)을 눌러도 닫힌다. 모서리는 크게 둥글게(디자이너 시안). 닫으면 안의 입력은 그대로 남지 않는다(다시 열면 새로).
 */
function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="text-primary m-auto w-[min(92vw,480px)] max-w-none rounded-[36px] bg-white p-0 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop:bg-black/40"
    >
      {open && (
        <div className="relative px-7 pb-8 pt-7 md:px-9 md:pb-9">
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-muted hover:text-primary ease-fluid absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300"
          >
            <X size={18} weight="light" aria-hidden="true" />
          </button>
          <h2 id={titleId} className="text-primary pr-10 text-sm font-medium">
            {title}
          </h2>
          <div className="mt-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}

function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "이름을 입력해 주세요.";
    if (!phone.trim()) next.phone = "휴대폰 번호를 입력해 주세요.";
    else if (!/^[0-9-]{9,20}$/.test(phone.trim())) next.phone = "숫자와 하이픈만 입력해 주세요.";
    setErrors(next);
    setResult(null);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      const saved = await updateProfile({ name: name.trim(), phone: phone.trim() });
      onSaved(saved);
      setResult({ tone: "ok", text: "저장했습니다." });
    } catch (err) {
      setResult({ tone: "error", text: message(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="text-primary text-sm font-medium">
        내 정보
      </h2>
      <dl className="text-2xs mt-4 grid gap-2 sm:grid-cols-2">
        <div className="flex gap-3">
          <dt className="text-muted w-16 shrink-0">이메일</dt>
          <dd className="text-secondary min-w-0 break-all font-sans">{profile.email}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="text-muted w-16 shrink-0">가입 방법</dt>
          <dd className="text-secondary">{PROVIDER_LABEL[profile.provider]}</dd>
        </div>
        {/* 이메일로 가입한 뒤 같은 이메일의 카카오 · 네이버로 들어와 연결된 계정 — 가입 방법만으로는 보이지 않는다 */}
        {(profile.linkedProviders ?? []).length > 0 && (
          <div className="flex gap-3 sm:col-span-2">
            <dt className="text-muted w-16 shrink-0">간편 로그인</dt>
            <dd className="text-secondary">
              {(profile.linkedProviders ?? []).map((p) => PROVIDER_LABEL[p]).join(" · ")} 연결됨
            </dd>
          </div>
        )}
      </dl>

      <form onSubmit={submit} noValidate className="mt-6 grid gap-5 md:grid-cols-2">
        <Field
          label="이름"
          name="name"
          autoComplete="name"
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <Field
          label="휴대폰 번호"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          hint="주문·배송 안내에 사용됩니다."
        />
        <div className="flex flex-col items-center gap-3 md:col-span-2">
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending ? "저장 중" : "저장"}
          </button>
          {result && <Notice tone={result.tone}>{result.text}</Notice>}
        </div>
      </form>
      <p className="text-muted text-2xs mt-3 text-center leading-relaxed">
        이메일은 로그인 아이디라 여기서 바꿀 수 없습니다.
      </p>
    </section>
  );
}

function PasswordForm({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: typeof errors = {};
    if (!current) found.current = "현재 비밀번호를 입력해 주세요.";
    const rule = checkPassword(next, email);
    if (rule) found.next = rule;
    if (next !== confirm) found.confirm = "새 비밀번호가 서로 다릅니다.";
    setErrors(found);
    setResult(null);
    if (Object.keys(found).length > 0) return;

    setPending(true);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setResult({ tone: "ok", text: "비밀번호를 바꿨습니다. 다른 기기의 로그인은 해제되었습니다." });
    } catch (err) {
      if (err instanceof AuthError && err.kind === "wrong-password") {
        setErrors({ current: err.displayMessage });
      } else if (err instanceof AuthError && err.kind === "weak-password") {
        setErrors({ next: err.displayMessage });
      } else {
        setResult({ tone: "error", text: message(err) });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-label="비밀번호 변경" className="grid gap-5">
      <Field
        label="현재 비밀번호"
        name="current-password"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        error={errors.current}
      />
      <Field
        label="새 비밀번호"
        name="new-password"
        type="password"
        autoComplete="new-password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        error={errors.next}
        hint="10자 이상. 이메일 주소는 포함할 수 없습니다."
      />
      <Field
        label="새 비밀번호 확인"
        name="new-password-confirm"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
      />
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "바꾸는 중" : "비밀번호 변경"}
        </button>
        {result && <Notice tone={result.tone}>{result.text}</Notice>}
      </div>
    </form>
  );
}

function WithdrawPanel({
  hasPassword,
  onWithdrawn,
}: {
  hasPassword: boolean;
  onWithdrawn: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPasswordError(undefined);
    if (hasPassword && !password) {
      setPasswordError("비밀번호를 입력해 주세요.");
      return;
    }
    setPending(true);
    try {
      await withdraw(hasPassword ? password : null);
      onWithdrawn();
    } catch (err) {
      if (err instanceof AuthError && err.kind === "wrong-password") {
        setPasswordError("비밀번호가 올바르지 않습니다.");
      } else {
        setError(message(err));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-label="회원 탈퇴" className="flex flex-col gap-5">
      <ul className="text-secondary flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
        <li>이름 · 이메일 · 전화번호가 즉시 지워지며 되돌릴 수 없습니다.</li>
        <li>같은 이메일로 다시 가입할 수 있습니다. 이전 기록은 이어지지 않습니다.</li>
        <li>주문 기록은 전자상거래법에 따라 5년간 보관된 뒤 파기됩니다.</li>
      </ul>

      {hasPassword && (
        <div className="max-w-sm">
          <Field
            label="비밀번호 확인"
            name="withdraw-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
          />
        </div>
      )}

      <label className="text-secondary text-2xs flex min-h-11 cursor-pointer items-start gap-2.5 leading-relaxed">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="accent-accent mt-0.5 h-4 w-4 shrink-0"
        />
        <span>위 내용을 확인했고, 탈퇴하겠습니다.</span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={!confirmed || pending}
          className="border-error text-error hover:bg-error/5 ease-fluid inline-flex min-h-12 items-center rounded-full border px-7 text-sm transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "처리 중" : "탈퇴하기"}
        </button>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </form>
  );
}

function Notice({ tone, children }: { tone: "ok" | "error"; children: React.ReactNode }) {
  const Icon = tone === "ok" ? CheckCircle : Warning;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`text-2xs flex gap-1.5 leading-relaxed ${tone === "ok" ? "text-success" : "text-error"}`}
    >
      <Icon size={14} weight="light" aria-hidden="true" className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}

"use client";

import { Warning } from "@phosphor-icons/react/dist/ssr";
import QRCode from "qrcode";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Field } from "@/components/ui/Field";
import { AuthError, adminSignIn, adminVerifyOtp, isOtpStep, safeNext, type AdminOtpStep, type CurrentUser } from "@/lib/auth";

/**
 * 관리자 로그인 (/admin/login). 아이디 또는 이메일.
 *
 * 실패 문구는 하나다 — "아이디 또는 비밀번호". 관리자가 아닌 계정도 같은 답이다(서버가 그렇게 준다).
 * 성공하면 임시 비밀번호는 변경 화면으로, 아니면 원래 가려던 관리자 화면(없으면 대시보드)으로.
 * 다른 곳으로는 보내지 않는다 — next 는 /admin 안쪽만 받는다.
 *
 * 2단계 인증(서버 V54, 2026-11-11 보안 강화): 비밀번호가 맞으면 OTP 앱의 6자리를 한 번 더 받는다.
 * 처음 로그인이면 QR(또는 설정 키)로 앱에 등록하는 칸이 먼저 나온다.
 */
export function AdminLoginForm() {
  const next = useSyncExternalStore<string>(
    () => () => {},
    () => {
      const raw = safeNext(new URLSearchParams(window.location.search).get("next"));
      return raw.startsWith("/admin") && !raw.startsWith("/admin/login") ? raw : "/admin/";
    },
    () => "/admin/",
  );
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState<AdminOtpStep | null>(null);

  function go(user: CurrentUser) {
    window.location.href = user.mustChangePassword ? `/admin/password/?next=${encodeURIComponent(next)}` : next;
  }

  if (otp) {
    return (
      <OtpStep
        step={otp}
        onDone={go}
        onRestart={(message) => {
          setOtp(null);
          setPassword("");
          setError(message);
        }}
      />
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      setError("아이디와 비밀번호를 넣어 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await adminSignIn(loginId.trim(), password);
      if (isOtpStep(result)) {
        setOtp(result);
        setBusy(false);
        return;
      }
      go(result);
    } catch (err) {
      const kind = err instanceof AuthError ? err.kind : "unknown";
      setError(
        kind === "invalid-credentials"
          ? "아이디 또는 비밀번호가 올바르지 않습니다."
          : err instanceof AuthError
            ? err.displayMessage
            : "로그인하지 못했습니다.",
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field label="아이디 또는 이메일" name="loginId" autoComplete="username" value={loginId}
        onChange={(e) => setLoginId(e.target.value)} autoCapitalize="none" spellCheck={false} />
      <Field label="비밀번호" name="password" type="password" autoComplete="current-password" value={password}
        onChange={(e) => setPassword(e.target.value)} />
      {error && (
        <p role="alert" className="text-error text-2xs flex gap-1.5 leading-relaxed">
          <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      )}
      <button type="submit" disabled={busy}
        className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid flex min-h-13 items-center justify-center rounded-full text-sm transition-colors duration-300 disabled:cursor-wait disabled:opacity-60">
        {busy ? "확인하는 중" : "관리자 로그인"}
      </button>
    </form>
  );
}

/** 2단계 — OTP 6자리. 처음이면 QR · 설정 키로 앱에 등록하는 안내가 먼저 */
function OtpStep({
  step,
  onDone,
  onRestart,
}: {
  step: AdminOtpStep;
  onDone: (user: CurrentUser) => void;
  onRestart: (message: string) => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const setup = step.step === "OTP_SETUP";

  useEffect(() => {
    if (!setup || !step.otpauthUri) return;
    let alive = true;
    QRCode.toDataURL(step.otpauthUri, { margin: 1, width: 200 })
      .then((url) => alive && setQr(url))
      .catch(() => alive && setQr(null));
    return () => {
      alive = false;
    };
  }, [setup, step.otpauthUri]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("OTP 앱에 보이는 6자리 숫자를 넣어 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onDone(await adminVerifyOtp(step.challengeId, code));
    } catch (err) {
      const kind = err instanceof AuthError ? err.kind : "unknown";
      if (kind === "otp-expired") {
        onRestart((err as AuthError).displayMessage);
        return;
      }
      setError(err instanceof AuthError ? err.displayMessage : "확인하지 못했습니다.");
      setCode("");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {setup ? (
        <div className="border-subtle bg-band/60 flex flex-col gap-3 rounded-2xl border p-4">
          <p className="text-primary text-sm font-medium">처음 한 번 — OTP 앱에 등록해 주세요</p>
          <ol className="text-secondary flex list-decimal flex-col gap-1 pl-4 text-xs leading-relaxed">
            <li>휴대폰에 Google OTP(Google Authenticator) 또는 Microsoft Authenticator 를 설치합니다.</li>
            <li>앱에서 «QR 코드 스캔» 으로 아래 그림을 찍습니다.</li>
            <li>앱에 생긴 «LEONE FERITO» 의 6자리를 아래 칸에 넣습니다.</li>
          </ol>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="OTP 앱에 등록할 QR 코드" width={200} height={200} className="self-center rounded-lg bg-white p-2" />
          )}
          {step.secret && (
            <p className="text-muted text-2xs break-all leading-relaxed">
              QR 을 찍을 수 없으면 앱에서 «설정 키 입력» 을 고르고 이 키를 넣습니다:{" "}
              <code className="text-primary bg-surface rounded px-1 py-0.5 font-mono text-xs tracking-wider">{step.secret}</code>
            </p>
          )}
          <p className="text-muted text-2xs leading-relaxed">휴대폰을 잃어버리면 최고 관리자에게 OTP 초기화를 요청하세요.</p>
        </div>
      ) : (
        <p className="text-secondary text-sm leading-relaxed">OTP 앱(Google OTP 등)의 «LEONE FERITO» 6자리를 넣어 주세요.</p>
      )}
      <Field
        label="인증번호 6자리"
        name="otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
      />
      {error && (
        <p role="alert" className="text-error text-2xs flex gap-1.5 leading-relaxed">
          <Warning size={13} weight="light" aria-hidden="true" className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      )}
      <button type="submit" disabled={busy}
        className="bg-accent text-on-accent hover:bg-accent-hover ease-fluid flex min-h-13 items-center justify-center rounded-full text-sm transition-colors duration-300 disabled:cursor-wait disabled:opacity-60">
        {busy ? "확인하는 중" : setup ? "등록하고 로그인" : "확인"}
      </button>
      <p className="text-muted text-2xs text-center">5분 안에 넣어 주세요. 시간이 지나면 처음부터 다시 로그인합니다.</p>
    </form>
  );
}

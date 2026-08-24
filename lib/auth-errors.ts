// Supabase 인증 에러 메시지를 한국어로 변환한다.
// 우선 error.code(신규 SDK)를 보고, 없으면 message 문자열로 매칭한다.

const BY_CODE: Record<string, string> = {
  invalid_credentials: "이메일 또는 비밀번호가 올바르지 않아요.",
  email_not_confirmed: "이메일 인증이 완료되지 않았어요. 메일함을 확인해 주세요.",
  user_already_exists: "이미 가입된 이메일이에요.",
  email_exists: "이미 가입된 이메일이에요.",
  weak_password: "비밀번호는 6자 이상으로 설정해 주세요.",
  over_email_send_rate_limit: "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.",
  over_request_rate_limit: "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.",
  signup_disabled: "현재 회원가입이 비활성화되어 있어요.",
  validation_failed: "입력한 정보를 다시 확인해 주세요.",
};

const BY_MESSAGE: [RegExp, string][] = [
  [/invalid login credentials/i, "이메일 또는 비밀번호가 올바르지 않아요."],
  [/email not confirmed/i, "이메일 인증이 완료되지 않았어요. 메일함을 확인해 주세요."],
  [/user already registered|already been registered/i, "이미 가입된 이메일이에요."],
  [/password should be at least/i, "비밀번호는 6자 이상으로 설정해 주세요."],
  [/unable to validate email address|invalid format/i, "이메일 형식이 올바르지 않아요."],
  [/for security purposes|rate limit|too many requests/i, "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요."],
  [/signups? not allowed|signup is disabled/i, "현재 회원가입이 비활성화되어 있어요."],
  [/network|fetch failed|failed to fetch/i, "네트워크 연결을 확인해 주세요."],
  [/no session/i, "로그인 세션이 만료됐어요. 다시 로그인해 주세요."],
];

export function translateAuthError(err: unknown): string {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  if (code && BY_CODE[code]) return BY_CODE[code];

  const message = err instanceof Error ? err.message : String(err ?? "");
  for (const [pattern, ko] of BY_MESSAGE) {
    if (pattern.test(message)) return ko;
  }
  return "문제가 발생했어요. 잠시 후 다시 시도해 주세요.";
}

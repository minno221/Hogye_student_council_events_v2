// 관리자 로그인 관련 유틸 (Edge Runtime에서도 돌아가도록 Web Crypto 사용)
//
// 쿠키에는 비밀번호의 해시가 아니라 "만료시각.서명" 값을 넣어요.
// 서명은 ADMIN_PASSWORD를 비밀키로 쓴 HMAC이라서, 비밀번호를 모르면 위조할 수 없어요.
// ADMIN_PASSWORD 환경변수가 없으면 모든 로그인과 인증이 거부돼요.

export const ADMIN_COOKIE_NAME = "admin_token";
export const SESSION_SECONDS = 60 * 60 * 8; // 8시간

const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(sig);
}

// 문자열 길이가 같을 때 항상 같은 시간이 걸리도록 비교
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function isAuthConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

// 입력한 비밀번호가 맞는지 확인
export async function checkPassword(input: unknown): Promise<boolean> {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || typeof input !== "string") return false;
  // 길이가 달라도 비교 시간이 같도록, 각각 서명한 값끼리 비교
  const [a, b] = await Promise.all([
    sign(input, "password-check"),
    sign(real, "password-check"),
  ]);
  return safeEqual(a, b);
}

// 로그인 성공 시 쿠키에 넣을 값 만들기
export async function createSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD is not set");
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const sig = await sign(`session.${exp}`, secret);
  return `${exp}.${sig}`;
}

// 쿠키 값이 진짜인지, 만료되지 않았는지 확인
export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expStr, sig] = parts;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;

  const expected = await sign(`session.${expStr}`, secret);
  return safeEqual(sig, expected);
}

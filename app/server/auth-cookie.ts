export const sessionCookieName = "mm_admin_session";
const maxAge = 60 * 60 * 12;

export function readSessionToken(request: Request) {
  const raw = request.headers.get("Cookie") ?? "";
  const match = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${sessionCookieName}=`));
  const token = match?.slice(sessionCookieName.length + 1);
  return token && /^[0-9a-f]{64}$/.test(token) ? token : null;
}

export function sessionCookie(request: Request, token: string) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${sessionCookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function clearSessionCookie(request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) throw new Response("Origem inválida.", { status: 403 });
}

export function safeAdminReturnTo(value: string | null) {
  if (!value || !value.startsWith("/admin") || value.startsWith("//") || /[\\\r\n]/.test(value)) return "/admin";
  try {
    const url = new URL(value, "https://example.invalid");
    return url.origin === "https://example.invalid" && (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) && !["/admin/login", "/admin/logout"].includes(url.pathname) ? `${url.pathname}${url.search}` : "/admin";
  } catch {
    return "/admin";
  }
}

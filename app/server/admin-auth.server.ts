import { redirect } from "react-router";
import { getDb } from "./db.server";
import { createSessionToken, sha256Hex, verifyPassword } from "./auth-crypto";
import { readSessionToken, safeAdminReturnTo } from "./auth-cookie";

type Db = NonNullable<ReturnType<typeof getDb>>;
type Admin = { id: string; email: string };

function requireDatabase() {
  const db = getDb();
  if (!db) throw new Response("Banco de dados administrativo indisponível.", { status: 503 });
  return db;
}

async function attemptKey(kind: "email" | "ip", value: string) {
  return sha256Hex(`${kind}:${value}`);
}

async function isBlocked(db: Db, key: string) {
  const rows = await db.query("SELECT blocked_until > now() AS blocked FROM admin_login_attempts WHERE attempt_key = $1", [key]) as { blocked: boolean }[];
  return rows[0]?.blocked === true;
}

async function recordFailure(db: Db, key: string, limit: number) {
  await db.query(`
    INSERT INTO admin_login_attempts (attempt_key, failure_count, window_started_at, blocked_until)
    VALUES ($1, 1, now(), NULL)
    ON CONFLICT (attempt_key) DO UPDATE SET
      failure_count = CASE WHEN admin_login_attempts.window_started_at < now() - interval '15 minutes' THEN 1 ELSE admin_login_attempts.failure_count + 1 END,
      window_started_at = CASE WHEN admin_login_attempts.window_started_at < now() - interval '15 minutes' THEN now() ELSE admin_login_attempts.window_started_at END,
      blocked_until = CASE WHEN admin_login_attempts.window_started_at >= now() - interval '15 minutes'
        AND admin_login_attempts.failure_count + 1 >= $2 THEN now() + interval '15 minutes' ELSE NULL END
  `, [key, limit]);
}

export async function authenticateAdmin(request: Request, email: string, password: string) {
  const db = requireDatabase();
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 320 || password.length === 0 || password.length > 128) {
    return { status: "invalid" as const };
  }
  const emailKey = await attemptKey("email", normalizedEmail);
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const ipKey = await attemptKey("ip", ip);
  if (await isBlocked(db, emailKey) || await isBlocked(db, ipKey)) return { status: "blocked" as const };

  const users = await db.query("SELECT id, email, password_hash FROM admin_users WHERE email = $1 AND is_active = true LIMIT 1", [normalizedEmail]) as (Admin & { password_hash: string })[];
  const user = users[0];
  if (!await verifyPassword(password, user?.password_hash ?? null)) {
    await Promise.all([recordFailure(db, emailKey, 5), recordFailure(db, ipKey, 20)]);
    return { status: "invalid" as const };
  }

  await db.query("DELETE FROM admin_login_attempts WHERE attempt_key = $1", [emailKey]);
  const token = createSessionToken();
  await db.query("INSERT INTO admin_sessions (admin_user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '12 hours')", [user.id, await sha256Hex(token)]);
  return { status: "success" as const, token };
}

export async function getAdmin(request: Request) {
  const token = readSessionToken(request);
  if (!token) return null;
  const db = requireDatabase();
  const rows = await db.query(`
    SELECT u.id, u.email FROM admin_sessions s
    JOIN admin_users u ON u.id = s.admin_user_id
    WHERE s.token_hash = $1 AND s.expires_at > now() AND s.revoked_at IS NULL AND u.is_active = true
    LIMIT 1
  `, [await sha256Hex(token)]) as Admin[];
  return rows[0] ?? null;
}

export async function requireAdmin(request: Request) {
  const admin = await getAdmin(request);
  if (!admin) {
    const url = new URL(request.url);
    throw redirect(`/admin/login?returnTo=${encodeURIComponent(safeAdminReturnTo(url.pathname + url.search))}`);
  }
  return admin;
}

export async function revokeAdminSession(request: Request) {
  const token = readSessionToken(request);
  if (!token) return;
  const db = requireDatabase();
  await db.query("UPDATE admin_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL", [await sha256Hex(token)]);
}

export async function getDashboardData() {
  const db = requireDatabase();
  const [counts, categories, latest] = await Promise.all([
    db.query(`SELECT count(*)::integer AS total,
      count(*) FILTER (WHERE status = 'available')::integer AS available,
      count(*) FILTER (WHERE status = 'reserved')::integer AS reserved,
      count(*) FILTER (WHERE status = 'sold')::integer AS sold
      FROM motorcycles`),
    db.query("SELECT count(*)::integer AS total FROM categories"),
    db.query(`SELECT id, brand, model, status, is_published, created_at
      FROM motorcycles ORDER BY created_at DESC, id DESC LIMIT 6`),
  ]) as unknown as [
    { total: number; available: number; reserved: number; sold: number }[],
    { total: number }[],
    { id: string; brand: string; model: string; status: string; is_published: boolean; created_at: string }[],
  ];
  return { counts: counts[0] ?? { total: 0, available: 0, reserved: 0, sold: 0 }, categories: categories[0]?.total ?? 0, latest };
}

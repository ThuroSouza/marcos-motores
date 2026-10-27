import assert from "node:assert/strict";
import { createSessionToken, hashPassword, sha256Hex, verifyPassword } from "../app/server/auth-crypto";
import { assertSameOrigin, clearSessionCookie, readSessionToken, safeAdminReturnTo, sessionCookie } from "../app/server/auth-cookie";

const password = "Senha longa para teste 2026!";
const hashed = await hashPassword(password);
assert.equal(await verifyPassword(password, hashed), true);
assert.equal(await verifyPassword("Senha errada para teste", hashed), false);
assert.equal(await verifyPassword(password, null), false);
assert.equal(hashed.includes(password), false);

const token = createSessionToken();
assert.match(token, /^[0-9a-f]{64}$/);
assert.match(await sha256Hex(token), /^[0-9a-f]{64}$/);
assert.notEqual(await sha256Hex(token), token);
const request = new Request("https://example.com/admin", { headers: { Cookie: `other=x; mm_admin_session=${token}`, Origin: "https://example.com" } });
assert.equal(readSessionToken(request), token);
assert.match(sessionCookie(request, token), /HttpOnly; SameSite=Strict; Max-Age=43200; Secure/);
assert.match(clearSessionCookie(request), /Max-Age=0; Secure/);
assert.doesNotThrow(() => assertSameOrigin(request));
assert.throws(() => assertSameOrigin(new Request("https://example.com/admin", { headers: { Origin: "https://evil.example" } })));
assert.equal(safeAdminReturnTo("/admin/motos?page=2"), "/admin/motos?page=2");
assert.equal(safeAdminReturnTo("//evil.example/admin"), "/admin");
assert.equal(safeAdminReturnTo("/admin/login"), "/admin");
console.log("Senha, token, cookie, origem e destino de redirecionamento validados.");

const iterations = 600_000;
const encoder = new TextEncoder();

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string) {
  if (!/^[0-9a-f]+$/.test(value) || value.length % 2 !== 0) return null;
  return Uint8Array.from(value.match(/../g) ?? [], (byte) => Number.parseInt(byte, 16));
}

async function derivePassword(password: string, salt: Uint8Array, rounds: number) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new Uint8Array(salt), iterations: rounds }, key, 256));
}

export async function hashPassword(password: string) {
  if (password.length < 12 || password.length > 128) throw new Error("A senha deve ter entre 12 e 128 caracteres.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, iterations);
  return `pbkdf2_sha256$${iterations}$${toHex(salt)}$${toHex(hash)}`;
}

export async function verifyPassword(password: string, stored: string | null) {
  const parts = stored?.split("$");
  const rounds = Number(parts?.[1]);
  const salt = parts?.[2] ? fromHex(parts[2]) : null;
  const expected = parts?.[3] ? fromHex(parts[3]) : null;
  const valid = parts?.[0] === "pbkdf2_sha256" && rounds === iterations && salt?.length === 16 && expected?.length === 32;
  const actual = await derivePassword(password, valid ? salt : new Uint8Array(16), iterations);
  const target = valid ? expected : new Uint8Array(32);
  let difference = 0;
  for (let index = 0; index < 32; index++) difference |= actual[index] ^ target[index];
  return valid && difference === 0;
}

export function createSessionToken() {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

export async function sha256Hex(value: string) {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

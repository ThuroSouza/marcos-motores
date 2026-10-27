import { stdin, stdout } from "node:process";
import readline from "node:readline/promises";
import { resolve } from "node:path";
import dotenv from "dotenv";
import pg from "pg";
import { hashPassword } from "../app/server/auth-crypto";

dotenv.config({ path: resolve(".dev.vars"), override: false, quiet: true });

function hiddenPrompt(label: string): Promise<string> {
  if (!stdin.isTTY || !stdin.setRawMode) throw new Error("Execute este comando em um terminal interativo.");
  stdout.write(label);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  return new Promise((resolvePrompt, reject) => {
    let value = "";
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Operação cancelada."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolvePrompt(value);
          return;
        }
        if (character === "\u007f" || character === "\b") value = value.slice(0, -1);
        else if (character >= " " && value.length < 128) value += character;
      }
    };
    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    };
    stdin.on("data", onData);
  });
}

const databaseUrl = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Configure MIGRATION_DATABASE_URL ou DATABASE_URL em .dev.vars antes de criar o administrador.");
if (!stdin.isTTY) throw new Error("Execute este comando em um terminal interativo.");

const prompt = readline.createInterface({ input: stdin, output: stdout });
const email = (await prompt.question("E-mail do administrador: ")).trim().toLowerCase();
prompt.close();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) throw new Error("E-mail inválido.");
const password = await hiddenPrompt("Senha (12 a 128 caracteres; entrada oculta): ");
const confirmation = await hiddenPrompt("Repita a senha: ");
if (password !== confirmation) throw new Error("As senhas não conferem.");
const passwordHash = await hashPassword(password);

const client = new pg.Client({ connectionString: databaseUrl });
try {
  await client.connect();
  await client.query("INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)", [email, passwordHash]);
  console.log(`Administrador criado: ${email}`);
} catch (error) {
  if (error instanceof Error && "code" in error && error.code === "23505") throw new Error("Já existe um administrador com este e-mail.");
  throw error;
} finally {
  await client.end().catch(() => {});
}

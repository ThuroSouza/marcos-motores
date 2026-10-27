import { spawn } from "node:child_process";
import { Buffer } from "node:buffer";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { URL } from "node:url";
import dotenv from "dotenv";

const dryRun = process.argv.includes("--dry-run");
const localVarsFile = await readFile(resolve(".dev.vars")).catch((error) => {
  if (error?.code === "ENOENT") return Buffer.from("");
  throw error;
});
const localVars = dotenv.parse(localVarsFile);
const databaseUrl = process.env.DATABASE_URL || localVars.DATABASE_URL;

if (!databaseUrl) throw new Error("Configure DATABASE_URL em .dev.vars antes do deploy.");
let parsedUrl;
try {
  parsedUrl = new URL(databaseUrl);
} catch {
  throw new Error("DATABASE_URL não é uma URL válida.");
}
if (!["postgres:", "postgresql:"].includes(parsedUrl.protocol) || !parsedUrl.hostname || !parsedUrl.username || !parsedUrl.password) {
  throw new Error("DATABASE_URL deve ser uma URL PostgreSQL completa.");
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), "marcos-motores-deploy-"));
const secretsFile = join(temporaryDirectory, "secrets.json");
try {
  await writeFile(secretsFile, JSON.stringify({ DATABASE_URL: databaseUrl }), { mode: 0o600 });
  const args = [resolve("node_modules/wrangler/bin/wrangler.js"), "deploy", "--secrets-file", secretsFile];
  if (dryRun) args.push("--dry-run");
  const result = await new Promise((resolveResult, rejectResult) => {
    const child = spawn(process.execPath, args, { stdio: "inherit" });
    child.once("error", rejectResult);
    child.once("exit", (code, signal) => resolveResult(signal ? 1 : (code ?? 1)));
  });
  process.exitCode = result;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

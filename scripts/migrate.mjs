import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: resolve(".dev.vars"), override: false, quiet: true });

const databaseUrl = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("MIGRATION_DATABASE_URL ou DATABASE_URL não configurada. Defina uma delas no ambiente ou em .dev.vars.");
  process.exit(1);
}

const migrationDirectory = resolve("database/migrations");
const files = (await readdir(migrationDirectory)).filter((file) => /^\d+_[a-z0-9_-]+\.sql$/.test(file)).sort();
const client = new pg.Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtext('marcos-motores-migrations'))");
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY,
    checksum char(64) NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);

  const { rows: appliedRows } = await client.query("SELECT version, checksum FROM schema_migrations");
  const applied = new Map(appliedRows.map((row) => [row.version, row.checksum.trim()]));
  if (applied.size === 0) {
    const { rows } = await client.query("SELECT to_regclass('public.categories') AS categories");
    if (rows[0].categories) throw new Error("Esquema existente sem histórico de migrations. Revise o banco antes de continuar.");
  }

  for (const file of files) {
    const source = await readFile(resolve(migrationDirectory, file), "utf8");
    const checksum = createHash("sha256").update(source).digest("hex");
    if (applied.has(file)) {
      if (applied.get(file) !== checksum) throw new Error(`Migration já aplicada foi alterada: ${file}`);
      console.log(`Já aplicada: ${file}`);
      continue;
    }
    await client.query(source);
    await client.query("INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)", [file, checksum]);
    console.log(`Aplicada: ${file}`);
  }

  await client.query("COMMIT");
  console.log("Migrations concluídas.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(error instanceof Error ? error.message : "Falha ao aplicar migrations.");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

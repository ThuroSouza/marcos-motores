import { env } from "cloudflare:workers";
import { neon } from "@neondatabase/serverless";

export function getDb() {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) return null;
  return neon(databaseUrl);
}

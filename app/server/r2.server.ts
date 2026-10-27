import { env } from "cloudflare:workers";

export function getImageBucket() {
  const bucket = getOptionalImageBucket();
  if (!bucket) throw new Response("Armazenamento de imagens indisponível.", { status: 503 });
  return bucket;
}

export function getOptionalImageBucket(): R2Bucket | undefined {
  return (env as typeof env & { MOTORCYCLE_IMAGES?: R2Bucket }).MOTORCYCLE_IMAGES;
}

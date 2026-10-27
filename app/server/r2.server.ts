import { env } from "cloudflare:workers";

export function getImageBucket() {
  const bucket = env.MOTORCYCLE_IMAGES;
  if (!bucket) throw new Response("Armazenamento de imagens indisponível.", { status: 503 });
  return bucket;
}

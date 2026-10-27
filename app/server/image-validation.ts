import { MotorcycleError } from "./motorcycles-admin.server";

export const maxImageSize = 8 * 1024 * 1024;
export const allowedImageTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/avif", "avif"]]);

export async function validateImage(file: File) {
  if (!allowedImageTypes.has(file.type) || file.size < 1 || file.size > maxImageSize) throw new MotorcycleError("Use JPEG, PNG, WebP ou AVIF com até 8 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  const valid = file.type === "image/jpeg" ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : file.type === "image/png" ? ascii(1, 4) === "PNG" && bytes[0] === 0x89
    : file.type === "image/webp" ? ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP"
    : ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12));
  if (!valid) throw new MotorcycleError("O conteúdo do arquivo não corresponde ao formato informado.");
  return bytes;
}

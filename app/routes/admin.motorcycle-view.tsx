import { Link } from "react-router";
import type { Route } from "./+types/admin.motorcycle-view";
import { requireAdmin } from "../server/admin-auth.server";
import { requireCategoryDb } from "../server/categories-db.server";
import { getAdminMotorcycle, validMotorcycleId } from "../server/motorcycles-admin.server";
import { formatKm, formatPrice, statusLabel } from "../utils/format";

export function meta() { return [{ title: "Detalhes do anúncio | Marcos Motores" }, { name: "robots", content: "noindex,nofollow" }]; }
export function headers() { return { "Cache-Control": "private, no-store" }; }

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAdmin(request);
  if (!validMotorcycleId(params.id)) throw new Response("Motocicleta não encontrada.", { status: 404 });
  const motorcycle = await getAdminMotorcycle(requireCategoryDb(), params.id);
  if (!motorcycle) throw new Response("Motocicleta não encontrada.", { status: 404 });
  return motorcycle;
}

export default function ViewMotorcycle({ loaderData: motorcycle }: Route.ComponentProps) {
  const moto = motorcycle.draft;
  const details = [
    ["Categoria", motorcycle.categoryName], ["Fabricação / modelo", `${moto.manufactureYear} / ${moto.modelYear}`],
    ["Quilometragem", formatKm(Number(moto.mileageKm))], ["Cilindrada", `${moto.engineCc} cc`],
    ["Cor", moto.color], ["Combustível", moto.fuelType || "Não informado"],
    ["Status", statusLabel[moto.status]], ["Publicação", moto.isPublished ? "Publicado" : "Rascunho"],
    ["Destaque", moto.isFeatured ? "Sim" : "Não"], ["Slug", moto.slug],
  ];
  return <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12"><Link to="/admin/motos" className="text-xs font-bold uppercase tracking-widest text-gold hover:underline">← Voltar às motocicletas</Link><div className="mt-9 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">ESTOQUE / ANÚNCIO</p><h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">{moto.brand} {moto.model}</h1><p className="mt-3 text-xl font-semibold text-gold">{formatPrice(Number(moto.price) * 100)}</p></div><Link to={`/admin/motos/${motorcycle.id}/editar`} className="button-primary">Editar anúncio</Link></div>
    {motorcycle.images.length > 0 && <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{motorcycle.images.map((image) => <img key={image.id} src={`/admin/imagens/${image.id}`} alt={image.alt || `Foto de ${moto.brand} ${moto.model}`} className="aspect-[4/3] w-full object-cover" />)}</div>}
    <dl className="mt-9 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className="min-w-0 bg-charcoal p-4"><dt className="text-xs font-bold uppercase tracking-wider text-muted">{label}</dt><dd className="mt-2 break-words text-sm text-white">{value}</dd></div>)}</dl>
    <div className="mt-9 grid gap-5 lg:grid-cols-2"><section className="admin-form-section"><h2 className="admin-form-heading">Descrição pública</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">{moto.description}</p></section><section className="admin-form-section"><h2 className="admin-form-heading">Observações internas</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">{moto.observations || "Nenhuma observação."}</p></section></div>
    {moto.features && <section className="admin-form-section mt-5"><h2 className="admin-form-heading">Características adicionais</h2><ul className="mt-4 grid gap-2 sm:grid-cols-2">{moto.features.split("\n").map((feature) => <li key={feature} className="text-sm text-muted">• {feature}</li>)}</ul></section>}
    <Link to={`/admin/motos/${motorcycle.id}/excluir`} className="mt-9 inline-block text-sm text-red-300 hover:underline">Excluir motocicleta</Link>
  </div>;
}

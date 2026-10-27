import { ArrowUpRight, Bike, CircleCheck, Clock3, Tags, Trophy } from "lucide-react";
import { data } from "react-router";
import type { Route } from "./+types/admin.dashboard";
import { getDashboardData, requireAdmin } from "../server/admin-auth.server";

const statusLabels: Record<string, string> = { available: "Disponível", reserved: "Reservada", sold: "Vendida" };

export function meta() {
  return [{ title: "Visão geral | Marcos Motores" }, { name: "robots", content: "noindex,nofollow" }];
}

export function headers() {
  return { "Cache-Control": "private, no-store" };
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return data(await getDashboardData(), { headers: { "Cache-Control": "private, no-store" } });
}

export default function AdminDashboard({ loaderData }: Route.ComponentProps) {
  const { counts, categories, latest } = loaderData;
  const cards = [
    { label: "Motos cadastradas", value: counts.total, icon: Bike },
    { label: "Disponíveis", value: counts.available, icon: CircleCheck },
    { label: "Reservadas", value: counts.reserved, icon: Clock3 },
    { label: "Vendidas", value: counts.sold, icon: Trophy },
    { label: "Categorias", value: categories, icon: Tags },
  ];
  return (
    <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-12">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">PAINEL ADMINISTRATIVO</p><h1 className="font-display mt-3 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">Visão geral</h1><p className="mt-3 text-sm text-muted">Acompanhe o estoque cadastrado e as últimas movimentações.</p></div><a href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold hover:underline">Ver vitrine <ArrowUpRight size={16} aria-hidden="true" /></a></div>
      <section aria-label="Resumo do estoque" className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => <div key={label} className="border border-white/10 bg-charcoal p-5"><Icon size={20} className="text-gold" aria-hidden="true" /><p className="mt-8 font-display text-3xl font-bold tabular-nums text-white">{value}</p><p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p></div>)}
      </section>
      <section className="mt-10 border border-white/10 bg-charcoal">
        <div className="border-b border-white/10 px-5 py-5 sm:px-7"><p className="eyebrow">ESTOQUE</p><h2 className="font-display mt-2 text-xl font-bold text-white">Últimos anúncios cadastrados</h2></div>
        {latest.length === 0 ? <p className="px-5 py-10 text-sm leading-6 text-muted sm:px-7">Nenhuma motocicleta cadastrada ainda. O cadastro de anúncios será habilitado no Bloco 6.</p> : <ul className="divide-y divide-white/10">{latest.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7"><div><p className="font-semibold text-white">{item.brand} {item.model}</p><p className="mt-1 text-xs text-muted">{item.is_published ? "Publicado" : "Rascunho"}</p></div><span className="border border-white/15 px-3 py-1 text-xs text-muted">{statusLabels[item.status] ?? item.status}</span></li>)}</ul>}
      </section>
    </div>
  );
}

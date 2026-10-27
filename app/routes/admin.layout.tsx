import { data, Form, Link, NavLink, Outlet } from "react-router";
import { Bike, LayoutDashboard, LogOut, Tags } from "lucide-react";
import type { Route } from "./+types/admin.layout";
import { requireAdmin } from "../server/admin-auth.server";

export function headers() {
  return { "Cache-Control": "private, no-store" };
}

export async function loader({ request }: Route.LoaderArgs) {
  const admin = await requireAdmin(request);
  return data({ admin }, { headers: { "Cache-Control": "private, no-store" } });
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  const { admin } = loaderData;
  return (
    <div className="min-h-screen bg-ink lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-b border-white/10 bg-charcoal lg:min-h-screen lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-4 px-5 py-5 lg:px-7 lg:py-8">
          <Link to="/admin" className="font-display text-base font-extrabold tracking-[-0.04em] text-white">MARCOS <span className="text-gold">MOTORES</span></Link>
          <span className="border border-gold/30 px-2 py-1 text-[10px] font-bold tracking-widest text-gold">ADMIN</span>
        </div>
        <nav aria-label="Navegação administrativa" className="flex gap-1 overflow-x-auto px-4 pb-4 lg:mt-8 lg:flex-col lg:px-4">
          <NavLink to="/admin" end className={({ isActive }) => `admin-nav-item ${isActive ? "admin-nav-active" : ""}`}><LayoutDashboard size={18} aria-hidden="true" />Visão geral</NavLink>
          <NavLink to="/admin/motos" className={({ isActive }) => `admin-nav-item ${isActive ? "admin-nav-active" : ""}`}><Bike size={18} aria-hidden="true" />Motocicletas</NavLink>
          <NavLink to="/admin/categorias" className={({ isActive }) => `admin-nav-item ${isActive ? "admin-nav-active" : ""}`}><Tags size={18} aria-hidden="true" />Categorias</NavLink>
        </nav>
        <div className="border-t border-white/10 p-5 lg:mt-12 lg:px-7">
          <p className="truncate text-xs font-semibold text-white">{admin.email}</p>
          <Form method="post" action="/admin/logout" className="mt-4"><button type="submit" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted transition hover:text-gold"><LogOut size={16} aria-hidden="true" />Encerrar sessão</button></Form>
        </div>
      </aside>
      <main id="conteudo-admin" className="min-w-0"><Outlet /></main>
    </div>
  );
}

import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router";
import { Brand } from "./Brand";

const navigation = [
  { to: "/", label: "Início", end: true },
  { to: "/motos", label: "Motos" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-50 border-b border-white/10 bg-ink/95 backdrop-blur-lg">
      <div className="site-container flex h-20 items-center justify-between gap-5">
        <Brand onClick={() => setMenuOpen(false)} />
        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
          {navigation.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>{label}</NavLink>
          ))}
        </nav>
        <NavLink to="/contato" className="hidden items-center gap-2 border border-gold/60 px-5 py-3 text-xs font-bold uppercase tracking-[0.13em] text-gold transition hover:bg-gold hover:text-ink lg:inline-flex">
          Fale com a loja <ArrowUpRight size={16} aria-hidden="true" />
        </NavLink>
        <button
          type="button"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          aria-controls="menu-mobile"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex size-11 items-center justify-center border border-white/20 text-white md:hidden"
        >
          {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>
      {menuOpen && (
        <nav id="menu-mobile" aria-label="Navegação mobile" className="border-t border-white/10 bg-charcoal px-5 py-3 md:hidden">
          {navigation.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `block border-b border-white/10 py-4 text-sm font-semibold uppercase tracking-[0.12em] ${isActive ? "text-gold" : "text-white"}`}>{label}</NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

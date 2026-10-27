import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-charcoal">
      <div className="site-container grid gap-12 py-14 sm:grid-cols-[1fr_auto] sm:py-20">
        <div>
          <Brand />
          <p className="mt-6 max-w-sm text-sm leading-6 text-muted">Vitrine digital de motocicletas. Conheça as opções e converse com a loja quando encontrar a sua próxima moto.</p>
        </div>
        <div className="flex flex-col items-start gap-4">
          <p className="eyebrow">NAVEGUE</p>
          <Link className="footer-link" to="/motos">Motos <ArrowUpRight size={14} aria-hidden="true" /></Link>
          <Link className="footer-link" to="/sobre">Sobre nós <ArrowUpRight size={14} aria-hidden="true" /></Link>
          <Link className="footer-link" to="/contato">Contato <ArrowUpRight size={14} aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="site-container flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Marcos Motores</span>
          <span>Feito para a próxima jornada.</span>
        </div>
      </div>
    </footer>
  );
}

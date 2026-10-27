import { ArrowRight, Bike, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router";

export function meta() {
  return [{ title: "Sobre | Marcos Motores" }, { name: "description", content: "Página institucional provisória da Marcos Motores. Conteúdo oficial em preparação." }];
}

const previewTopics = [
  { icon: Bike, title: "Nossa história", text: "Espaço reservado para a trajetória oficial da Marcos Motores." },
  { icon: ShieldCheck, title: "Nosso atendimento", text: "Espaço reservado para informações confirmadas sobre o atendimento da loja." },
  { icon: Sparkles, title: "Nossos diferenciais", text: "Espaço reservado para os diferenciais fornecidos pela equipe." },
];

export default function About() {
  return (
    <>
      <section className="border-b border-white/10 bg-charcoal"><div className="site-container grid gap-10 py-16 sm:py-24 lg:grid-cols-[1fr_0.9fr] lg:items-center"><div><p className="eyebrow mb-5">SOBRE A MARCOS MOTORES</p><h1 className="font-display text-4xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-6xl">Uma história que ainda vamos contar por aqui.</h1><p className="mt-6 max-w-xl leading-7 text-muted">Esta página está em preparação. O texto institucional definitivo será publicado após o envio e a aprovação das informações oficiais pela Marcos Motores.</p></div><div className="relative overflow-hidden border border-white/10"><img src="/demo/naked-side.jpg" alt="Imagem ilustrativa de motocicleta; não é foto da loja" width="1536" height="1024" className="aspect-[4/3] w-full object-cover" /><span className="absolute bottom-4 left-4 bg-ink/85 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white">Imagem ilustrativa</span></div></div></section>
      <section className="site-container py-20 sm:py-24"><p className="eyebrow mb-4">CONTEÚDO EM PREPARAÇÃO</p><h2 className="font-display max-w-2xl text-3xl font-semibold text-white sm:text-4xl">O que você encontrará aqui</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{previewTopics.map(({ icon: Icon, title, text }) => <div key={title} className="border border-white/10 bg-charcoal p-7"><Icon size={27} className="text-gold" aria-hidden="true" /><h3 className="font-display mt-6 text-xl font-bold text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-muted">{text}</p></div>)}</div></section>
      <section className="border-t border-white/10 bg-charcoal"><div className="site-container flex flex-col gap-6 py-14 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow mb-3">EXPLORE A VITRINE</p><h2 className="font-display text-2xl font-bold text-white">Veja as motocicletas publicadas</h2></div><Link to="/motos" className="button-primary w-fit">Ver motos <ArrowRight size={18} aria-hidden="true" /></Link></div></section>
    </>
  );
}

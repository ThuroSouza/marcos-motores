import { Clock3, Globe2, MapPin, MessageCircle, Phone } from "lucide-react";

export function meta() {
  return [{ title: "Contato | Marcos Motores" }, { name: "description", content: "Canais oficiais de contato da Marcos Motores em preparação." }];
}

const contactItems = [
  { icon: MessageCircle, label: "WhatsApp", value: "Número oficial a confirmar", note: "O link direto será ativado após a configuração." },
  { icon: Phone, label: "Telefone", value: "Número oficial a confirmar", note: "Informação fornecida pela loja." },
  { icon: MapPin, label: "Endereço", value: "Localização a confirmar", note: "O mapa aparecerá após confirmação do endereço." },
  { icon: Clock3, label: "Horário", value: "Atendimento a confirmar", note: "Dias e horários oficiais ainda não informados." },
  { icon: Globe2, label: "Redes sociais", value: "Perfis oficiais a confirmar", note: "Os links serão publicados após verificação." },
];

export default function Contact() {
  return (
    <>
      <section className="border-b border-white/10 bg-charcoal"><div className="site-container py-16 sm:py-24"><p className="eyebrow mb-5">FALE COM A LOJA</p><h1 className="font-display max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">A conversa começa por aqui.</h1><p className="mt-6 max-w-2xl leading-7 text-muted">Estamos preparando esta página com os canais oficiais da Marcos Motores. Nenhum número ou endereço provisório será divulgado como dado real.</p></div></section>
      <section className="site-container py-20 sm:py-24"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{contactItems.map(({ icon: Icon, label, value, note }) => <div key={label} className="min-h-52 border border-white/10 bg-charcoal p-7"><Icon size={25} className="text-gold" aria-hidden="true" /><p className="eyebrow mt-6">{label}</p><h2 className="font-display mt-2 text-lg font-bold text-white">{value}</h2><p className="mt-3 text-sm leading-6 text-muted">{note}</p></div>)}</div><div className="mt-6 border border-dashed border-white/20 p-8 text-center sm:p-12"><MapPin size={30} className="mx-auto text-gold" aria-hidden="true" /><h2 className="font-display mt-5 text-xl font-bold text-white">Mapa em preparação</h2><p className="mt-3 text-sm text-muted">O mapa será incluído quando o endereço oficial da loja estiver disponível.</p></div></section>
    </>
  );
}

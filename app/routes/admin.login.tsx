import { LockKeyhole, ArrowRight } from "lucide-react";
import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/admin.login";
import { authenticateAdmin, getAdmin } from "../server/admin-auth.server";
import { assertSameOrigin, safeAdminReturnTo, sessionCookie } from "../server/auth-cookie";

export function meta() {
  return [{ title: "Acesso administrativo | Marcos Motores" }, { name: "robots", content: "noindex,nofollow" }];
}

export function headers() {
  return { "Cache-Control": "private, no-store" };
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const returnTo = safeAdminReturnTo(url.searchParams.get("returnTo"));
  if (await getAdmin(request)) throw redirect(returnTo);
  return { returnTo };
}

export async function action({ request }: Route.ActionArgs) {
  assertSameOrigin(request);
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const returnTo = safeAdminReturnTo(String(form.get("returnTo") ?? ""));
  const result = await authenticateAdmin(request, email, password);
  if (result.status === "blocked") return { error: "Muitas tentativas. Aguarde 15 minutos e tente novamente." };
  if (result.status === "invalid") return { error: "E-mail ou senha inválidos." };
  throw redirect(returnTo, { headers: { "Set-Cookie": sessionCookie(request, result.token), "Cache-Control": "no-store" } });
}

export default function AdminLogin({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const busy = navigation.state === "submitting";
  return (
    <main className="min-h-screen bg-ink lg:grid lg:grid-cols-[1fr_1fr]">
      <div className="relative hidden overflow-hidden border-r border-white/10 bg-charcoal lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#d4af3720,transparent_45%)]" />
        <Link to="/" className="relative font-display text-xl font-extrabold tracking-[-0.04em] text-white">MARCOS <span className="text-gold">MOTORES</span></Link>
        <div className="relative max-w-lg"><p className="eyebrow mb-6">ÁREA ADMINISTRATIVA</p><h1 className="font-display text-5xl font-bold leading-[1.1] tracking-[-0.06em] text-white">Controle a vitrine com clareza.</h1><p className="mt-6 text-base leading-7 text-muted">Acompanhe os anúncios, organize as categorias e mantenha as informações da loja atualizadas.</p></div>
        <p className="relative text-xs uppercase tracking-[0.15em] text-muted">Acesso reservado à equipe autorizada</p>
      </div>
      <div className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/" className="font-display text-lg font-extrabold tracking-[-0.04em] text-white lg:hidden">MARCOS <span className="text-gold">MOTORES</span></Link>
          <div className="mt-14 flex size-12 items-center justify-center border border-gold/40 bg-gold/10 text-gold lg:mt-0"><LockKeyhole size={21} aria-hidden="true" /></div>
          <p className="eyebrow mt-9">ACESSO RESTRITO</p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">Entrar no painel</h2>
          <p className="mt-3 text-sm leading-6 text-muted">Use as credenciais administrativas da Marcos Motores.</p>
          <Form method="post" className="mt-9 space-y-5" replace>
            <input type="hidden" name="returnTo" value={loaderData.returnTo} />
            <label className="filter-label">E-mail<input className="filter-field mt-2 h-13" type="email" name="email" autoComplete="username" maxLength={320} required /></label>
            <label className="filter-label">Senha<input className="filter-field mt-2 h-13" type="password" name="password" autoComplete="current-password" minLength={1} maxLength={128} required /></label>
            {actionData?.error && <p role="alert" className="border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{actionData.error}</p>}
            <button className="button-primary w-full" type="submit" disabled={busy}>{busy ? "Verificando..." : "Entrar"}<ArrowRight size={17} aria-hidden="true" /></button>
          </Form>
          <Link to="/" className="mt-8 inline-block text-sm text-muted hover:text-gold">Voltar à vitrine</Link>
        </div>
      </div>
    </main>
  );
}

import { Form, Link, useNavigation } from "react-router";
import type { CategoryInput } from "../../server/categories.server";

export function CategoryForm({ initial, error, submitLabel }: { initial: CategoryInput; error?: string; submitLabel: string }) {
  const navigation = useNavigation();
  return (
    <Form method="post" className="mt-8 max-w-3xl space-y-6 border border-white/10 bg-charcoal p-5 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="filter-label">Nome <span className="text-gold">*</span><input className="filter-field mt-2 h-12" name="name" type="text" maxLength={120} required defaultValue={initial.name} placeholder="Ex.: Trail" /></label>
        <label className="filter-label">Slug <span className="text-gold">*</span><input className="filter-field mt-2 h-12" name="slug" type="text" maxLength={140} required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={initial.slug} placeholder="ex.: trail" /><span className="mt-2 block text-xs font-normal text-muted">Letras minúsculas, números e hífens. Usado nos links e filtros.</span></label>
      </div>
      <label className="filter-label">Descrição <span className="font-normal text-muted">(opcional)</span><textarea className="filter-field mt-2 h-28 resize-y py-3" name="description" maxLength={2000} defaultValue={initial.description} placeholder="Uma breve descrição da categoria" /></label>
      <label className="filter-label">Status<select className="filter-field mt-2 h-12" name="isActive" defaultValue={String(initial.isActive)}><option value="true">Ativa — aparece no catálogo público</option><option value="false">Inativa — oculta do catálogo público</option></select></label>
      {error && <p role="alert" className="border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-6"><button type="submit" className="button-primary" disabled={navigation.state === "submitting"}>{navigation.state === "submitting" ? "Salvando..." : submitLabel}</button><Link to="/admin/categorias" className="button-secondary">Cancelar</Link></div>
    </Form>
  );
}

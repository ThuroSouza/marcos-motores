import { Form, Link, useNavigation } from "react-router";
import type { MotorcycleDraft } from "../../server/motorcycles-admin.server";

type Option = { id: string; name: string; isActive: boolean };

const input = "filter-field mt-2 h-12";
const area = "filter-field mt-2 h-32 resize-y py-3";

export function MotorcycleForm({ initial, categories, error, submitLabel }: { initial: MotorcycleDraft; categories: Option[]; error?: string; submitLabel: string }) {
  const navigation = useNavigation();
  return <Form method="post" className="mt-8 space-y-8" key={JSON.stringify(initial)}>
    <input type="hidden" name="intent" value="save" />
    {error && <p role="alert" className="border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
    <section className="admin-form-section"><h2 className="admin-form-heading">Identificação</h2><div className="mt-6 grid gap-5 sm:grid-cols-2">
      <label className="filter-label">Marca *<input className={input} name="brand" maxLength={100} required defaultValue={initial.brand} /></label>
      <label className="filter-label">Modelo *<input className={input} name="model" maxLength={120} required defaultValue={initial.model} /></label>
      <label className="filter-label">Versão<input className={input} name="version" maxLength={120} defaultValue={initial.version} /></label>
      <label className="filter-label">Slug *<input className={input} name="slug" maxLength={240} pattern="[a-z0-9]+(-[a-z0-9]+)*" required defaultValue={initial.slug} placeholder="ex.: marca-modelo-2025" /><span className="mt-2 block text-xs font-normal text-muted">Usado na URL pública do anúncio.</span></label>
      <label className="filter-label">Categoria *<select className={input} name="categoryId" required defaultValue={initial.categoryId}><option value="">Selecione</option>{categories.filter((category) => category.isActive || category.id === initial.categoryId).map((category) => <option key={category.id} value={category.id}>{category.name}{category.isActive ? "" : " (inativa)"}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3"><label className="filter-label">Ano fabricação *<input className={input} name="manufactureYear" type="number" min="1950" max="2100" required defaultValue={initial.manufactureYear} /></label><label className="filter-label">Ano modelo *<input className={input} name="modelYear" type="number" min="1950" max="2102" required defaultValue={initial.modelYear} /></label></div>
    </div></section>
    <section className="admin-form-section"><h2 className="admin-form-heading">Características</h2><div className="mt-6 grid gap-5 sm:grid-cols-2">
      <label className="filter-label">Cilindrada (cc) *<input className={input} name="engineCc" type="number" min="1" max="10000" required defaultValue={initial.engineCc} /></label>
      <label className="filter-label">Quilometragem *<input className={input} name="mileageKm" type="number" min="0" required defaultValue={initial.mileageKm} /></label>
      <label className="filter-label">Cor *<input className={input} name="color" maxLength={80} required defaultValue={initial.color} /></label>
      <label className="filter-label">Combustível<input className={input} name="fuelType" maxLength={80} defaultValue={initial.fuelType} /></label>
    </div><label className="filter-label mt-5">Características adicionais<textarea className={area} name="features" defaultValue={initial.features} placeholder="Uma característica por linha, até 20" /><span className="mt-2 block text-xs font-normal text-muted">Uma por linha. Ex.: freios ABS.</span></label></section>
    <section className="admin-form-section"><h2 className="admin-form-heading">Informações comerciais</h2><div className="mt-6 grid gap-5 sm:grid-cols-2">
      <label className="filter-label">Preço (R$) *<input className={input} name="price" type="number" min="0" step="0.01" required defaultValue={initial.price} /></label>
      <label className="filter-label">Status<select className={input} name="status" defaultValue={initial.status}><option value="available">Disponível</option><option value="reserved">Reservada</option><option value="sold">Vendida</option></select></label>
      <label className="filter-label">Exibir no catálogo<select className={input} name="isPublished" defaultValue={String(initial.isPublished)}><option value="false">Não — rascunho</option><option value="true">Sim — publicado</option></select></label>
      <label className="filter-label">Destaque na página inicial<select className={input} name="isFeatured" defaultValue={String(initial.isFeatured)}><option value="false">Não</option><option value="true">Sim</option></select></label>
    </div><label className="filter-label mt-5">Descrição pública *<textarea className={area} name="description" maxLength={10000} required defaultValue={initial.description} /></label><label className="filter-label mt-5">Observações internas<textarea className={area} name="observations" maxLength={10000} defaultValue={initial.observations} /><span className="mt-2 block text-xs font-normal text-muted">Não aparecem na API pública.</span></label></section>
    <div className="flex flex-wrap gap-3 pb-4"><button type="submit" className="button-primary" disabled={navigation.state === "submitting"}>{navigation.state === "submitting" ? "Salvando..." : submitLabel}</button><Link to="/admin/motos" className="button-secondary">Cancelar</Link></div>
  </Form>;
}

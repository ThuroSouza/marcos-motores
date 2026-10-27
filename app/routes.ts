import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("api/public/motorcycles", "routes/api.public.motorcycles.ts"),
  route("api/public/motorcycles/:slug", "routes/api.public.motorcycle.ts"),
  route("api/public/categories", "routes/api.public.categories.ts"),
  route("api/public/store", "routes/api.public.store.ts"),
  route("api/public/images/:imageId", "routes/api.public.image.ts"),
  route("admin/login", "routes/admin.login.tsx"),
  route("admin/logout", "routes/admin.logout.ts"),
  route("admin/imagens/:imageId", "routes/admin.image.ts"),
  layout("routes/admin.layout.tsx", [
    route("admin", "routes/admin.dashboard.tsx"),
    route("admin/motos", "routes/admin.motorcycles.tsx"),
    route("admin/motos/nova", "routes/admin.motorcycle-new.tsx"),
    route("admin/motos/:id", "routes/admin.motorcycle-view.tsx"),
    route("admin/motos/:id/editar", "routes/admin.motorcycle-edit.tsx"),
    route("admin/motos/:id/excluir", "routes/admin.motorcycle-delete.tsx"),
    route("admin/categorias", "routes/admin.categories.tsx"),
    route("admin/categorias/nova", "routes/admin.category-new.tsx"),
    route("admin/categorias/:id/editar", "routes/admin.category-edit.tsx"),
    route("admin/categorias/:id/excluir", "routes/admin.category-delete.tsx"),
  ]),
  layout("routes/public-layout.tsx", [
    index("routes/home.tsx"),
    route("motos", "routes/motorcycles.tsx"),
    route("motos/:slug", "routes/motorcycle-detail.tsx"),
    route("sobre", "routes/about.tsx"),
    route("contato", "routes/contact.tsx"),
  ]),
] satisfies RouteConfig;

import { redirect } from "react-router";
import type { Route } from "./+types/admin.logout";
import { revokeAdminSession } from "../server/admin-auth.server";
import { assertSameOrigin, clearSessionCookie } from "../server/auth-cookie";

export async function action({ request }: Route.ActionArgs) {
  assertSameOrigin(request);
  await revokeAdminSession(request);
  throw redirect("/admin/login", { headers: { "Set-Cookie": clearSessionCookie(request), "Cache-Control": "no-store" } });
}

export function loader() {
  throw redirect("/admin/login");
}

import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

/**
 * Puerta del panel. Protege el renderizado de /admin.
 * Las Server Actions NO pasan por aquí: cada una llama `requireAdmin()`.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) redirect("/login");
  return children;
}

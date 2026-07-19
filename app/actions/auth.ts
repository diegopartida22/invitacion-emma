"use server";

import { redirect } from "next/navigation";
import { adminPinIsConfigured, signIn, signOut, PIN_LENGTH } from "@/lib/auth";

export type LoginState = { error: string | null };

const PIN_SHAPE = new RegExp(`^\\d{${PIN_LENGTH}}$`);

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!adminPinIsConfigured()) {
    return {
      error: `Falta definir ADMIN_PIN (${PIN_LENGTH} dígitos) en .env.local.`,
    };
  }

  const pin = String(formData.get("pin") ?? "").trim();
  if (!PIN_SHAPE.test(pin)) return { error: `El PIN son ${PIN_LENGTH} dígitos.` };

  const result = await signIn(pin);
  if (!result.ok) return { error: result.error };

  // redirect() lanza una excepción de control de flujo: va fuera de try/catch.
  redirect("/admin");
}

export async function logout() {
  await signOut();
  redirect("/login");
}

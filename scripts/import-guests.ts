/**
 * Importa la lista de invitados desde un Excel (.xlsx / .xls / .csv).
 *
 *   npm run import:guests -- ./invitados.xlsx            # simulacro, no escribe
 *   npm run import:guests -- ./invitados.xlsx --apply    # sí escribe
 *
 * Columnas que busca (no importan mayúsculas ni acentos):
 *   mamá / madre / tutor          → nombre de la mamá
 *   nombre del niño / alumno      → nombre del niño o niña
 *   teléfono / celular / whatsapp → WhatsApp
 *   adultos                       → lugares de adulto apartados
 *   niños                         → lugares de niño apartados
 *
 * Si adivina mal, corrígelo a mano:
 *   npm run import:guests -- ./lista.xlsx --map "mother=Mamá,kids=Menores"
 */

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { normalizePhone } from "../lib/whatsapp";

type Field = "mother" | "child" | "phone" | "adults" | "kids";

type Row = {
  mother_name: string | null;
  child_name: string | null;
  phone: string | null;
  allowed_adults: number;
  allowed_kids: number;
};

const FIELDS: Field[] = ["mother", "child", "phone", "adults", "kids"];

/** minúsculas, sin acentos, sin puntuación, espacios colapsados */
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Guardamos el teléfono ya listo para wa.me, con clave de país. */
function digitsOnly(value: unknown) {
  return normalizePhone(String(value ?? ""));
}

function toCount(value: unknown) {
  const parsed = Math.floor(Number(String(value ?? "").replace(/[^0-9.-]/g, "")));
  return Number.isFinite(parsed) ? Math.max(0, Math.min(30, parsed)) : 0;
}

/**
 * `"name"` es el caso ambiguo: un encabezado "Nombre" a secas no dice de quién.
 * Se resuelve hasta el final, cuando ya sabemos qué otras columnas hay.
 *
 * "niños" a secas casi siempre es la cantidad; el nombre del niño/a suele venir
 * como "nombre del niño". Por eso el nombre exige la palabra "nombre".
 */
function detectField(header: string): Field | "name" | null {
  const h = normalize(header);
  if (!h) return null;

  if (/tel|cel|whats|movil|contacto/.test(h)) return "phone";
  if (/adult/.test(h)) return "adults";
  if (/mam|madre|tutor|responsable|papa|padre/.test(h)) return "mother";
  if (/nombre/.test(h) && /nin|hij|alumn|comulg/.test(h)) return "child";
  if (/^(nino|nina|ninos|ninas|menores|infantes)$/.test(h)) return "kids";
  if (/\b(cantidad|numero|num|no|total)\b/.test(h) && /nin|menor/.test(h)) {
    return "kids";
  }
  if (/^(nino|nina|hijo|hija|alumno|alumna)$/.test(h)) return "child";
  if (/^(nombre|nombres|nombre completo|invitado|invitada)$/.test(h)) {
    return "name";
  }
  return null;
}

function parseOverrides(argv: string[]) {
  const index = argv.indexOf("--map");
  if (index === -1) return {} as Partial<Record<Field, string>>;

  const raw = argv[index + 1] ?? "";
  const overrides: Partial<Record<Field, string>> = {};

  for (const pair of raw.split(",")) {
    const [field, header] = pair.split("=").map((s) => s?.trim());
    if (FIELDS.includes(field as Field) && header) {
      overrides[field as Field] = header;
    }
  }
  return overrides;
}

async function main() {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith("--"));
  const apply = argv.includes("--apply");
  const overrides = parseOverrides(argv);

  if (!file) {
    console.error("Uso: npm run import:guests -- ./invitados.xlsx [--apply]");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local",
    );
    process.exit(1);
  }

  // ---- Leer el archivo ----
  const workbook = XLSX.readFile(file);
  const sheetName = workbook.SheetNames[0];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName],
    { defval: "" },
  );

  if (raw.length === 0) {
    console.error(`La hoja "${sheetName}" está vacía.`);
    process.exit(1);
  }

  // ---- Mapear columnas ----
  const headers = Object.keys(raw[0]);
  const mapping = {} as Partial<Record<Field, string>>;
  const ambiguous: string[] = [];

  for (const header of headers) {
    const field = detectField(header);
    if (field === "name") ambiguous.push(header);
    else if (field && !mapping[field]) mapping[field] = header;
  }

  // Un "Nombre" suelto ocupa el hueco de nombre que quede libre. Si el archivo
  // ya trae "Mamá", entonces "Nombre" es el del niño o niña; si no hay mamá,
  // ese nombre es el del invitado principal.
  for (const header of ambiguous) {
    if (!mapping.mother) mapping.mother = header;
    else if (!mapping.child) mapping.child = header;
  }

  Object.assign(mapping, overrides);

  console.log(`\nHoja: "${sheetName}"  ·  ${raw.length} filas`);
  console.log("Columnas detectadas:");
  for (const field of FIELDS) {
    console.log(`  ${field.padEnd(7)} → ${mapping[field] ?? "(ninguna)"}`);
  }

  if (!mapping.mother && !mapping.child) {
    console.error(
      "\nNo encontré ninguna columna de nombre. Usa --map para indicarla.",
    );
    process.exit(1);
  }

  const pick = (row: Record<string, unknown>, field: Field) => {
    const header = mapping[field];
    return header ? String(row[header] ?? "").trim() : "";
  };

  // ---- Convertir filas ----
  const rows: Row[] = [];
  const skipped: { line: number; reason: string }[] = [];
  const seen = new Set<string>();

  raw.forEach((row, i) => {
    const line = i + 2; // +1 por el encabezado, +1 porque Excel cuenta desde 1
    const mother = pick(row, "mother");
    const child = pick(row, "child");

    if (!mother && !child) {
      const isBlank = headers.every((h) => !String(row[h] ?? "").trim());
      if (!isBlank) skipped.push({ line, reason: "sin nombre" });
      return;
    }

    const phone = digitsOnly(pick(row, "phone"));
    const dedupeKey = phone || normalize(mother || child);

    if (seen.has(dedupeKey)) {
      skipped.push({ line, reason: `duplicado en el archivo (${mother || child})` });
      return;
    }
    seen.add(dedupeKey);

    rows.push({
      mother_name: mother || null,
      child_name: child || null,
      phone: phone || null,
      allowed_adults: toCount(pick(row, "adults")),
      allowed_kids: toCount(pick(row, "kids")),
    });
  });

  // ---- Comparar con lo que ya está en la base ----
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: readError } = await supabase
    .from("guests")
    .select("mother_name, child_name, phone");

  if (readError) {
    console.error(`\nNo pude leer los invitados actuales: ${readError.message}`);
    process.exit(1);
  }

  const existingKeys = new Set(
    (existing ?? []).map(
      (g) =>
        digitsOnly(g.phone) ||
        normalize(String(g.mother_name ?? g.child_name ?? "")),
    ),
  );

  const fresh = rows.filter((r) => {
    const key = r.phone || normalize(String(r.mother_name ?? r.child_name));
    return !existingKeys.has(key);
  });

  const alreadyThere = rows.length - fresh.length;

  // ---- Reporte ----
  console.log(`\nListos para importar: ${fresh.length}`);
  if (alreadyThere > 0) console.log(`Ya estaban en la base:  ${alreadyThere}`);
  if (skipped.length > 0) {
    console.log(`Omitidos:              ${skipped.length}`);
    for (const s of skipped.slice(0, 10)) {
      console.log(`  fila ${s.line}: ${s.reason}`);
    }
    if (skipped.length > 10) console.log(`  ... y ${skipped.length - 10} más`);
  }

  const sinTelefono = fresh.filter((r) => !r.phone).length;
  if (sinTelefono > 0) {
    console.log(
      `\nAviso: ${sinTelefono} sin teléfono. Se importan igual, pero su botón\n` +
        `de WhatsApp abrirá sin destinatario (tendrás que elegir el contacto).`,
    );
  }

  console.log("\nMuestra:");
  for (const r of fresh.slice(0, 5)) {
    const nombre = r.mother_name ?? r.child_name;
    const ref = r.mother_name && r.child_name ? ` (niño/a: ${r.child_name})` : "";
    console.log(
      `  ${nombre}${ref} · ${r.phone ?? "sin tel"} · ${r.allowed_adults}A ${r.allowed_kids}N`,
    );
  }

  if (!apply) {
    console.log(
      "\nSimulacro: no se escribió nada. Vuelve a correrlo con --apply para importar.\n",
    );
    return;
  }

  if (fresh.length === 0) {
    console.log("\nNo hay nada nuevo que importar.\n");
    return;
  }

  const { error: insertError } = await supabase.from("guests").insert(fresh);
  if (insertError) {
    console.error(`\nFalló la importación: ${insertError.message}`);
    process.exit(1);
  }

  console.log(`\n✓ ${fresh.length} invitados importados. Revísalos en /admin\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

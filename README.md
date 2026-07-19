# Invitación · Primera Comunión de Emma

Invitación digital personalizada por invitado, con confirmación de asistencia (RSVP)
y un panel de anfitrión para administrar la lista.

- **Next.js 16** (App Router) · **Tailwind CSS v4** · **Supabase (Postgres)**
- Cada invitado recibe una liga propia: `/i/emma-t3k9`
- El diseño es un port 1:1 del proyecto de Claude Design (`Invitacion Emma.dc.html`)

---

## Puesta en marcha

```bash
npm install
npm run dev
```

Abre http://localhost:3000

### Variables de entorno

`.env.local` ya viene creado y casi completo.

| Variable | Para qué sirve | ¿Ya está? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave pública; solo puede leer y responder invitaciones | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave privada; la usa **solo** el panel admin | ⚠️ **falta pegarla** |
| `ADMIN_PASSWORD` | Contraseña para entrar a `/admin` | ✅ |
| `NEXT_PUBLIC_SITE_URL` | Dominio público (para armar las ligas de WhatsApp) | opcional en local |

La `SUPABASE_SERVICE_ROLE_KEY` se copia del dashboard:
**Project Settings → API Keys → `service_role`**.
Sin ella el panel `/admin` muestra un aviso y no carga la lista.

---

## Rutas

| Ruta | Quién entra | Qué hace |
| --- | --- | --- |
| `/i/[code]` | invitado | Su invitación con su nombre y su RSVP |
| `/admin` | anfitrión | Lista, altas, ediciones, bajas, envíos |
| `/login` | anfitrión | Pide `ADMIN_PASSWORD` |
| `/` | cualquiera | Portada sin datos de invitados |

---

## Modelo de datos

Dos tablas en Supabase:

**`guests`** — un renglón por invitación (no por persona).

| Columna | Nota |
| --- | --- |
| `code` | Se genera solo: `emma-t3k9`. Alfabeto sin caracteres ambiguos (0/O/1/l) |
| `mother_name`, `child_name` | Al menos uno es obligatorio |
| `display_name` | Columna generada: mamá → niño/a → "Invitado especial" |
| `phone` | Solo para armar la liga de WhatsApp; **nunca** sale al navegador del invitado |
| `allowed_adults`, `allowed_kids` | Lugares apartados |
| `status` | `pending` · `yes` · `no` |
| `confirmed_adults`, `confirmed_kids` | Lo que confirmó el invitado (nunca mayor a lo apartado) |
| `message` | Mensajito opcional para Emma |
| `invite_sent_at` | Se sella al abrir WhatsApp desde el panel |

**`rsvp_log`** — historial append-only de cada respuesta, por si alguien cambia de opinión.

### Seguridad

Ambas tablas tienen RLS activo y **cero políticas**: la llave pública no puede
leer ni escribir nada directamente. El acceso público pasa por dos funciones
`SECURITY DEFINER`:

- `get_invitation(code)` — devuelve solo lo que el invitado necesita ver (sin teléfono)
- `submit_rsvp(code, status, adultos, niños, mensaje)` — valida y recorta al máximo apartado

El panel admin es el único que lee la tabla completa, con la `service_role` key
desde el servidor (`lib/supabase/admin.ts` importa `server-only`).

---

## Importar invitados desde Excel

```bash
# 1. Ver qué detectó, sin escribir nada
npm run import:guests -- ./invitados.xlsx

# 2. Si la lectura se ve bien, aplicar
npm run import:guests -- ./invitados.xlsx --apply
```

Detecta las columnas solo, ignorando acentos y mayúsculas. Reconoce encabezados
como _Mamá / Madre_, _Niño / Niña / Hijo_, _Teléfono / Celular / WhatsApp_,
_Adultos_, _Niños / Menores_.

Si tu archivo usa encabezados distintos, los puedes mapear a mano:

```bash
npm run import:guests -- ./invitados.xlsx --map "mother=Jefa de familia,kids=Chamacos" --apply
```

Salta duplicados: dentro del mismo archivo y contra lo que ya está en la base
(compara por teléfono, o por nombre normalizado si no hay teléfono).

---

## Panel de anfitrión

- Totales arriba: confirmados, pendientes, no asisten y **cuántas personas** suman
- Filtros y buscador por nombre o teléfono
- Botón de WhatsApp por invitado, con el mensaje y su liga ya escritos
- Copiar liga, editar, reabrir RSVP (si alguien se equivocó) y eliminar
- Resumen de los mensajitos recibidos

---

## Personalizar los datos del evento

Todo vive en un solo archivo: [`lib/event.ts`](lib/event.ts) — fecha, misa, recepción,
papás, madrinas, teléfono del anfitrión y datos bancarios. Cambiar algo ahí se
refleja en toda la invitación.

**Pendientes de llenar:**

```ts
hostPhone: "523300000000",   // ← teléfono real para el botón de WhatsApp
bank: { bank: "____________", clabe: "____ ____ ____ ____ __" },
```

---

## Comandos

```bash
npm run dev            # desarrollo
npm run build          # build de producción
npm run typecheck      # tsc --noEmit
npm run import:guests  # importador de Excel
```

## Deploy

En Vercel: importa el repo y copia las 5 variables de entorno, agregando
`NEXT_PUBLIC_SITE_URL=https://tu-dominio.com` para que las ligas de WhatsApp
apunten al dominio real y no a `localhost`.
# invitacion-emma

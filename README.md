# Invitación · Primera Comunión de Emma

Invitación digital personalizada por invitado, con confirmación de asistencia (RSVP)
y un panel de anfitrión para administrar la lista.

- **Next.js 16** (App Router) · **Tailwind CSS v4** · **Supabase (Postgres)**
- Cada invitado recibe una liga propia: `emma-comunion.com/i/k3m9p`
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
| `SUPABASE_SERVICE_ROLE_KEY` | Llave privada; la usa **solo** el panel admin | ✅ |
| `ADMIN_PIN` | PIN de 4 dígitos para entrar a `/admin` | ✅ |
| `NEXT_PUBLIC_SITE_URL` | Dominio público (ligas de WhatsApp e imagen del preview) | ⚠️ **en producción** |

La `SUPABASE_SERVICE_ROLE_KEY` se copia del dashboard:
**Project Settings → API Keys → `service_role`**.
Sin ella el panel `/admin` muestra un aviso y no carga la lista.

### Sobre el PIN

Son 4 dígitos, o sea 10,000 combinaciones: poco para dejarlo suelto. Cada intento
pasa antes por `register_login_attempt` en Postgres, que **bloquea esa IP 15
minutos después de 5 fallos**. Si el contador no responde, el login no deja pasar.

El desbloqueo manual, si te llegas a encerrar fuera:

```sql
delete from admin_login_attempts;
```

---

## Rutas

| Ruta | Quién entra | Qué hace |
| --- | --- | --- |
| `/i/[code]` | invitado | Su invitación con su nombre y su RSVP |
| `/admin` | anfitrión | Lista, altas, ediciones, bajas, envíos |
| `/login` | anfitrión | Pide el `ADMIN_PIN` |
| `/` | cualquiera | Portada sin datos de invitados |
| `/calendario.ics` | cualquiera | El evento para Apple Calendar, Outlook, etc. |

---

## Modelo de datos

Dos tablas en Supabase:

**`guests`** — un renglón por invitación (no por persona).

| Columna | Nota |
| --- | --- |
| `code` | Se genera solo: 5 caracteres, `k3m9p`. Alfabeto sin ambigüedades (0/O/1/l) |
| `mother_name`, `child_name` | Al menos uno, salvo que pongas `display_name_override` |
| `display_name_override` | Opcional. Con qué saludarla: un apodo ("Faby") o algo que no es una mamá ("Familia Hernández") |
| `display_name` | Columna generada: override → mamá → niño/a → "Invitado especial" |
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
- Filtro **Cambiaron**: quiénes respondieron más de una vez, con su rastro
  completo (`3 adultos · 2 niños → 1 adulto · 1 niño → no asisten`). Sale de
  `rsvp_log`, que guarda cada respuesta desde siempre
- Botón de WhatsApp por invitado, con el mensaje y su liga ya escritos. El texto
  cambia solo: invitación la primera vez, recordatorio si ya se mandó y no han
  contestado, y "te la dejo de nuevo" si ya respondieron
- Copiar liga, editar, reabrir RSVP (avisa que se borra el mensajito) y eliminar
- En **Editar**, el campo "Cómo saludarla" cambia el nombre que ve la invitada,
  el del saludo de WhatsApp y el del preview. La tarjeta sigue mostrando abajo
  el nombre de la lista para poder cruzarlo con el Excel
- Resumen de los mensajitos recibidos

## Cambios y cancelaciones

Un invitado puede cambiar su respuesta cuantas veces quiera hasta la fecha
límite. Cada cambio queda en `rsvp_log`, y el panel lo marca.

Cuando alguien modifica algo que la organizadora **ya tenía contado**, la
pantalla se lo dice y el mensaje de WhatsApp lo explica solo:

| Qué pasó | Qué le llega a la organizadora |
| --- | --- |
| Confirma por primera vez | "Confirmo asistencia … con 2 adultos y 1 niño" |
| Cambia el número | "Cambié mi confirmación: ahora seremos …" |
| Cancela después de confirmar | "**Les había confirmado**, pero al final no vamos a poder…" |
| Se arrepiente de un "no" | "Al final sí vamos a poder acompañarlos…" |

Ese aviso depende de que el invitado apriete el botón, por eso el panel también
lo marca por su cuenta: una cosa cubre a la otra.

### Fecha límite

`EVENT.rsvpDeadlineISO` en [`lib/event.ts`](lib/event.ts). Después de esa fecha
la invitación se ve igual pero el RSVP queda de solo lectura, con un botón para
escribirle a la organizadora.

El plazo se revisa en el servidor (nunca con el reloj del celular) y se aplica
también en la Server Action, no solo escondiendo el formulario. A diferencia del
tope de lugares, este candado **no** vive en Postgres: es una cortesía para
cerrar cuentas, no una frontera de seguridad, y así la fecha se cambia sin una
migración.

---

## Agregar al calendario

Abajo de las tarjetas de misa y recepción hay dos botones. Los dos salen del
mismo lugar, [`lib/calendar.ts`](lib/calendar.ts):

- **Google Calendar** — una liga que abre Google con el evento ya lleno
- **Apple · Outlook** — descarga [`/calendario.ics`](app/calendario.ics/route.ts)

Es **un solo evento**, de la misa al final de la recepción, no dos. En un `.ics`
sí caben dos, pero la liga de Google solo admite uno, y que Apple agregara dos
entradas y Google una sola sería peor que la imprecisión: quien guarda esto
quiere apartar el día. Los horarios y las direcciones de ambos momentos van
completos en la descripción del evento.

La hora de salida no está en la invitación, así que `EVENT.endISO` es un
estimado (7 pm) y sirve nada más para que no ocupe el día entero en el
calendario del invitado.

El archivo se genera en el build (`force-static`): no depende de la petición.
Si cambias algo en `lib/event.ts`, se regenera al desplegar. Para revisarlo:

```bash
curl -s http://localhost:3000/calendario.ics
```

Ojo con el formato si lo llegas a tocar: el RFC 5545 pide fines de línea CRLF y
que ninguna línea pase de 75 **octetos** (no caracteres — los acentos de
"Recepción" pesan dos). Eso lo resuelve `fold()` en `lib/calendar.ts`.

---

## Personalizar los datos del evento

Todo vive en un solo archivo: [`lib/event.ts`](lib/event.ts) — fecha, misa, recepción,
papás, madrinas, teléfono del anfitrión y datos bancarios. Cambiar algo ahí se
refleja en toda la invitación.

El regalo admite las dos formas: sobre el día del evento o transferencia. La
CLABE se muestra en bloques de cuatro para poder leerla, pero el botón de copiar
la manda al portapapeles **sin espacios**, que es como la pide la app del banco.

---

## Rótulos de sección y contraste

Los rotulitos que encabezan cada sección ("Mis papás", "Cuenta regresiva",
"Confirma tu asistencia"…) salen todos de
[`SectionLabel`](components/invitation/SectionLabel.tsx). **No escribas uno a
mano**: andaban sueltos entre 11 y 12px, con espaciados de .2, .32, .4 y .42em,
unos en normal y otros en medium, y se notaba.

Lo único que cambia entre uno y otro es el color, con la prop `tone`:

| `tone` | Color | Dónde |
| --- | --- | --- |
| `light` (default) | `clay` | Sobre cream o sand |
| `blush` | `cocoa` | Sobre el rosa: RSVP y pie |

El espaciado se encoge solo en pantallas angostas: "Te espero con mucha ilusión"
mide 318px con el .4em de siempre y en un celular de 375px se partía en dos
renglones. Con el `clamp` cabe en un renglón desde 320px para arriba.

### Contraste

Los colores no se escogen a ojo — el rosa es claro y engaña, un café que *se ve*
oscuro puede quedarse en 3:1. El mínimo es **4.5:1** para texto normal y **3:1**
a partir de ~24px. Lo que se corrigió, medido:

| Texto | Antes | Ahora |
| --- | --- | --- |
| Rótulos sobre cream / sand (`clay`) | 3.4 / 3.0:1 | 5.3 / 4.7:1 |
| "Te espero con mucha ilusión" | 2.5:1 | 5.8:1 |
| "Confirma tu asistencia" | 2.9:1 | 6.7:1 |
| Fecha del pie, "Con cariño para" (`sienna`) | 3.6:1 | 4.8:1 |
| "Emma" del pie | 2.6:1 | 3.4:1 |

`clay` y `sienna` se oscurecieron en [`globals.css`](app/globals.css)
conservando el matiz. Como `clay` también se usa en bordes, ahí el cambio casi
no se nota: casi todos van al 40-50% de opacidad.

---

## Preview de WhatsApp

El dibujo vive en [`lib/og.tsx`](lib/og.tsx) y lo usan dos rutas: la portada
([`app/opengraph-image.tsx`](app/opengraph-image.tsx)) y la invitación de cada
quien ([`app/i/[code]/opengraph-image.tsx`](app/i/%5Bcode%5D/opengraph-image.tsx)),
que además le agrega el "Con cariño para Claudia". Son 1200×630. Las tipografías
se leen de [`assets/`](assets/) porque `ImageResponse` no puede usar `next/font`.

### Si el preview sale sin imagen

WhatsApp necesita una URL **absoluta y pública**, y esa la arma `metadataBase`
con [`staticSiteUrl()`](lib/site.ts). El orden en que la busca importa:

1. `NEXT_PUBLIC_SITE_URL` — defínela y ya, es la única que no adivina
2. `VERCEL_PROJECT_PRODUCTION_URL` — el dominio público (`emma-comunion.com`)
3. `VERCEL_URL` — **último recurso**: apunta al deploy concreto
   (`invitacion-emma-a1b2c3….vercel.app`), que trae activada la protección de
   Vercel y responde con un redirect al login. El preview sale sin foto.

Para revisar qué está mandando el sitio, sin adivinar:

```bash
curl -s https://emma-comunion.com/i/CODIGO | grep 'og:image'
# y luego, contra esa URL exacta:
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' 'LA_URL_DE_ARRIBA'
# 200 image/png = bien · 302 = protección de Vercel · 404 = ruta mal
```

WhatsApp cachea el preview por URL. Si arreglas algo después de mandar ligas,
las ya enviadas conservan un rato lo viejo: para verificar, prueba con un código
que todavía no hayas compartido.

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
y la imagen del preview apunten al dominio real y no al del deploy.

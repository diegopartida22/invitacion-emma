import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { EVENT } from "./event";

/**
 * La imagen que ve quien recibe la liga por WhatsApp, antes de abrirla.
 *
 * Vive aquí y no en la ruta porque hay dos que la usan: la portada (`/`) y la
 * invitación personalizada (`/i/[code]`). La única diferencia entre ambas es el
 * saludo del final, así que se pasa como parámetro.
 *
 * Ojo: `ImageResponse` no entiende Tailwind ni `next/font`, todo va en estilos
 * en línea y las tipografías se leen como TTF crudo desde `assets/`.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = `Primera Comunión de ${EVENT.child}`;

const font = (file: string) => readFile(join(process.cwd(), "assets", file));

export async function ogImage(name?: string | null) {
  const [pinyon, cormorant, jost] = await Promise.all([
    font("PinyonScript-Regular.ttf"),
    font("CormorantGaramond-SemiBold.ttf"),
    font("Jost-Regular.ttf"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontFamily: "Jost",
          backgroundColor: "#fffdfb",
          backgroundImage:
            "radial-gradient(120% 70% at 50% 0%, #f7ece6 0%, #efe2da 55%, #e7d5cb 100%)",
        }}
      >
        {/* Halos de color, los mismos del hero de la invitación */}
        <div
          style={{
            position: "absolute",
            top: -170,
            left: -120,
            width: 520,
            height: 520,
            borderRadius: 999,
            backgroundImage:
              "radial-gradient(circle at 35% 35%, rgba(242,211,200,.95), rgba(227,174,155,.35) 55%, rgba(227,174,155,0) 72%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -140,
            width: 460,
            height: 460,
            borderRadius: 999,
            backgroundImage:
              "radial-gradient(circle at 60% 40%, rgba(240,220,196,.9), rgba(203,176,142,.25) 55%, rgba(203,176,142,0) 72%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -200,
            left: 380,
            width: 460,
            height: 460,
            borderRadius: 999,
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgba(242,211,200,.7), rgba(242,211,200,0) 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0 80px",
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: 10,
              textTransform: "uppercase",
              color: "#b07e6a",
            }}
          >
            Con la bendición de Dios
          </div>

          <div
            style={{
              marginTop: 26,
              fontFamily: "Cormorant",
              fontSize: 44,
              color: "#8c7168",
            }}
          >
            Mi Primera
          </div>
          <div
            style={{
              fontFamily: "Cormorant",
              fontSize: 78,
              letterSpacing: 12,
              textTransform: "uppercase",
              color: "#5a4038",
              lineHeight: 1.05,
            }}
          >
            Comunión
          </div>

          {/* Filete ◆ filete */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              margin: "22px 0 4px",
            }}
          >
            <div
              style={{
                width: 90,
                height: 1,
                backgroundImage:
                  "linear-gradient(90deg, rgba(203,176,142,0), #cbb08e)",
              }}
            />
            <div style={{ color: "#cbb08e", fontSize: 15 }}>◆</div>
            <div
              style={{
                width: 90,
                height: 1,
                backgroundImage:
                  "linear-gradient(90deg, #cbb08e, rgba(203,176,142,0))",
              }}
            />
          </div>

          <div
            style={{
              fontFamily: "Pinyon",
              fontSize: 150,
              color: "#c08d79",
              lineHeight: 1.25,
            }}
          >
            {EVENT.child}
          </div>

          <div
            style={{
              fontFamily: "Cormorant",
              fontSize: 34,
              letterSpacing: 2,
              color: "#7a5f55",
              marginTop: 4,
            }}
          >
            {EVENT.dateLabel}
          </div>

          {name && (
            <div
              style={{
                display: "flex",
                marginTop: 34,
                padding: "12px 34px",
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,.72)",
                border: "1px solid rgba(203,176,142,.5)",
                fontSize: 25,
                color: "#8a5a48",
              }}
            >
              Con cariño para {name}
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Jost", data: jost, weight: 400, style: "normal" },
        { name: "Cormorant", data: cormorant, weight: 600, style: "normal" },
        { name: "Pinyon", data: pinyon, weight: 400, style: "normal" },
      ],
    },
  );
}

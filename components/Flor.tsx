import { createElement, type ReactElement } from "react";

/**
 * Ramillete floral generativo — port 1:1 del componente `Flor` de Claude Design.
 *
 * Se construye con SVG puro (sin imágenes) a partir de cuatro primitivas:
 * rosa, flor de cinco pétalos, capullo y hoja. Cada variante coloca esas
 * primitivas en una composición distinta sobre un lienzo de 200×200.
 */

export type FlorVariant = "a" | "b" | "c";

type Palette = { d: string; m: string; l: string; w: string; c: string };

const PAL: Record<string, Palette> = {
  salmon: { d: "#bd7d64", m: "#dc9c82", l: "#f0bda9", w: "#f9ddd0", c: "#caa066" },
  blush: { d: "#c68d7b", m: "#e4ab97", l: "#f4cfc0", w: "#fbe6dc", c: "#cea975" },
  peach: { d: "#c58a63", m: "#e4a97f", l: "#f2caa6", w: "#fbe7d3", c: "#c9a25f" },
  mauve: { d: "#b58681", m: "#d5a69f", l: "#ecc9c1", w: "#f8e6e0", c: "#c6a27a" },
  rose: { d: "#c07f78", m: "#dd9f97", l: "#efbfb6", w: "#f9e0da", c: "#cca377" },
};

const LEAF = { d: "#93a173", m: "#b0bd8d", l: "#c8d2ac" };

const PETAL_D = "M0 0 C -15 -10 -17 -33 0 -44 C 17 -33 15 -10 0 0 Z";

const rad = (deg: number) => (deg * Math.PI) / 180;

export default function Flor({ variant = "a" }: { variant?: FlorVariant }) {
  // Contador local al render: mantiene las keys estables entre servidor y cliente.
  let k = 0;
  const key = () => `e${k++}`;

  const ring = (
    n: number,
    scale: number,
    fill: string,
    opacity: number,
    offset: number,
  ): ReactElement[] =>
    Array.from({ length: n }, (_, i) =>
      createElement("path", {
        key: key(),
        d: PETAL_D,
        fill,
        opacity,
        transform: `rotate(${offset + (i * 360) / n}) scale(${scale})`,
      }),
    );

  const stamens = (n: number, r: number, dist: number, fill: string) =>
    Array.from({ length: n }, (_, i) => {
      const ang = rad((i * 360) / n);
      return createElement("circle", {
        key: key(),
        r,
        cx: Math.cos(ang) * dist,
        cy: Math.sin(ang) * dist,
        fill,
      });
    });

  const rose = (cx: number, cy: number, s: number, p: Palette, rot = 0) =>
    createElement(
      "g",
      { key: key(), transform: `translate(${cx} ${cy}) scale(${s}) rotate(${rot})` },
      [
        createElement("ellipse", { key: key(), rx: 44, ry: 44, fill: p.l, opacity: 0.28 }),
        ...ring(7, 1, p.m, 0.95, 0),
        ...ring(7, 1, p.d, 0.16, 25),
        ...ring(6, 0.72, p.l, 1, 22),
        ...ring(5, 0.5, p.m, 1, 8),
        ...ring(4, 0.32, p.d, 0.85, 40),
        createElement("circle", { key: key(), r: 5.5, fill: p.d, opacity: 0.85 }),
        ...stamens(7, 1.5, 4, p.c),
        createElement("path", {
          key: key(),
          d: PETAL_D,
          fill: "#ffffff",
          opacity: 0.16,
          transform: "rotate(-32) scale(.82)",
        }),
      ],
    );

  const blossom = (cx: number, cy: number, s: number, p: Palette, rot = 0) =>
    createElement(
      "g",
      { key: key(), transform: `translate(${cx} ${cy}) scale(${s}) rotate(${rot})` },
      [
        ...Array.from({ length: 5 }, (_, i) =>
          createElement("ellipse", {
            key: key(),
            rx: 8.5,
            ry: 14,
            cy: -15,
            fill: p.l,
            opacity: 0.95,
            transform: `rotate(${i * 72})`,
          }),
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          createElement("ellipse", {
            key: key(),
            rx: 5,
            ry: 9,
            cy: -13,
            fill: p.w,
            opacity: 0.6,
            transform: `rotate(${i * 72})`,
          }),
        ),
        createElement("circle", { key: key(), r: 5, fill: p.c }),
        ...stamens(6, 1.3, 3, p.d),
      ],
    );

  const bud = (cx: number, cy: number, s: number, p: Palette, rot = 0) =>
    createElement(
      "g",
      { key: key(), transform: `translate(${cx} ${cy}) scale(${s}) rotate(${rot})` },
      [
        createElement("path", {
          key: key(),
          d: "M-6 8 Q-10 18 -2 22 M6 8 Q10 18 2 22 M0 10 Q0 19 0 24",
          stroke: LEAF.m,
          strokeWidth: 1.8,
          fill: "none",
          strokeLinecap: "round",
        }),
        createElement("path", {
          key: key(),
          d: "M0 10 C -11 -2 -9 -18 0 -20 C 9 -18 11 -2 0 10 Z",
          fill: p.m,
        }),
        createElement("path", {
          key: key(),
          d: "M0 7 C -6 0 -5 -11 0 -13 C 5 -11 6 0 0 7 Z",
          fill: p.l,
          opacity: 0.85,
        }),
        createElement("path", {
          key: key(),
          d: "M0 5 C -3 0 -2.5 -8 0 -10 C 2.5 -8 3 0 0 5 Z",
          fill: p.d,
          opacity: 0.5,
        }),
      ],
    );

  const leaf = (cx: number, cy: number, s: number, rot: number) =>
    createElement(
      "g",
      { key: key(), transform: `translate(${cx} ${cy}) scale(${s}) rotate(${rot})` },
      [
        createElement("path", {
          key: key(),
          d: "M0 0 Q12 -21 0 -42 Q-12 -21 0 0 Z",
          fill: LEAF.m,
          opacity: 0.9,
        }),
        createElement("path", {
          key: key(),
          d: "M0 0 Q7 -21 0 -40 Q-7 -21 0 0 Z",
          fill: LEAF.l,
          opacity: 0.5,
        }),
        createElement("path", {
          key: key(),
          d: "M0 -3 L0 -37",
          stroke: LEAF.d,
          strokeWidth: 1,
          opacity: 0.45,
        }),
      ],
    );

  const stem = (d: string) =>
    createElement("path", {
      key: key(),
      d,
      stroke: LEAF.m,
      strokeWidth: 1.6,
      fill: "none",
      opacity: 0.65,
      strokeLinecap: "round",
    });

  const fill = (cx: number, cy: number, p: Palette) =>
    createElement("circle", { key: key(), cx, cy, r: 2.4, fill: p.c, opacity: 0.9 });

  let content: ReactElement[];

  if (variant === "b") {
    content = [
      stem("M84 118 C 118 92 148 62 152 30"),
      stem("M90 122 C 66 96 58 58 74 34"),
      leaf(152, 30, 1, 20),
      leaf(134, 52, 0.85, 34),
      leaf(74, 34, 0.9, -14),
      leaf(96, 58, 0.75, -30),
      leaf(150, 122, 0.8, 78),
      blossom(150, 52, 0.82, PAL.peach, 8),
      rose(150, 120, 0.78, PAL.blush, 12),
      bud(60, 150, 0.95, PAL.rose, -14),
      rose(98, 116, 1.28, PAL.salmon, 0),
      blossom(122, 150, 0.72, PAL.mauve, -20),
      fill(160, 40, PAL.peach),
      fill(168, 52, PAL.peach),
      fill(58, 112, PAL.salmon),
      fill(66, 122, PAL.salmon),
    ];
  } else if (variant === "c") {
    content = [
      stem("M96 122 C 150 112 178 88 192 58"),
      stem("M92 124 C 98 92 88 60 70 42"),
      leaf(192, 58, 0.95, 60),
      leaf(172, 78, 0.8, 74),
      leaf(70, 42, 0.85, -8),
      leaf(150, 110, 0.72, 50),
      leaf(120, 150, 0.7, 30),
      bud(182, 64, 0.9, PAL.peach, 34),
      rose(112, 124, 1.08, PAL.mauve, 0),
      blossom(152, 104, 0.74, PAL.salmon, 15),
      bud(76, 152, 0.9, PAL.blush, -10),
      rose(150, 150, 0.6, PAL.rose, 20),
      fill(170, 58, PAL.mauve),
      fill(178, 70, PAL.mauve),
      fill(86, 150, PAL.salmon),
    ];
  } else {
    content = [
      stem("M100 118 C 150 96 174 70 178 40"),
      stem("M92 120 C 100 90 90 58 74 40"),
      stem("M112 126 C 150 128 180 116 196 98"),
      leaf(178, 40, 1, 24),
      leaf(158, 64, 0.85, 38),
      leaf(74, 40, 0.9, -10),
      leaf(106, 60, 0.75, -28),
      leaf(196, 98, 0.8, 72),
      leaf(182, 112, 0.7, 86),
      bud(150, 142, 1, PAL.peach, 8),
      rose(126, 100, 0.86, PAL.blush, 12),
      rose(72, 130, 1.22, PAL.salmon, 0),
      blossom(120, 152, 0.68, PAL.mauve, -18),
      fill(150, 56, PAL.peach),
      fill(158, 46, PAL.peach),
      fill(90, 56, PAL.salmon),
      fill(188, 86, PAL.blush),
    ];
  }

  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className="block h-full w-full overflow-visible"
    >
      {content}
    </svg>
  );
}

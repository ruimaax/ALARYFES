import type { PlanSlug } from "@/data/planes";
import type { CSSProperties, ReactNode } from "react";

/**
 * Diagramas isométricos de la obra: planta replanteada, torre, recinto
 * amurallado y ciudad. Los cuatro comparten suelo, escala y proyección,
 * así que la progresión se lee de un vistazo.
 */
const U = 11.8; // lado de la unidad
const CX = 130;
const CY = 42;
const SUELO = 10; // el solar mide 10 x 10 unidades

type Punto = [number, number];
const p = (x: number, y: number, z = 0): Punto => [
  Math.round((CX + (x - y) * 0.866 * U) * 10) / 10,
  Math.round((CY + (x + y) * 0.5 * U - z * U) * 10) / 10,
];
const via = (...puntos: Punto[]) =>
  `M${puntos.map(([x, y]) => `${x} ${y}`).join("L")}`;
const cerrada = (...puntos: Punto[]) => `${via(...puntos)}Z`;

/** Prisma recto entre las cotas z0 y h: cara superior y las dos caras vistas. */
function Prisma({
  x,
  y,
  w,
  d,
  h,
  z0 = 0,
  luz = 1,
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  z0?: number;
  luz?: number;
}) {
  const x2 = x + w;
  const y2 = y + d;
  return (
    <>
      {/* Cuerpo opaco: sin él se transparentarían las aristas de detrás. */}
      <path
        d={cerrada(
          p(x, y, h),
          p(x2, y, h),
          p(x2, y, z0),
          p(x2, y2, z0),
          p(x, y2, z0),
          p(x, y2, h),
        )}
        fill="var(--diagram-fill, #650e15)"
        stroke="none"
      />
      <path
        d={cerrada(p(x, y, h), p(x2, y, h), p(x2, y2, h), p(x, y2, h))}
        fill="currentColor"
        fillOpacity={0.17 * luz}
      />
      <path
        d={cerrada(p(x, y2, h), p(x2, y2, h), p(x2, y2, z0), p(x, y2, z0))}
        fill="currentColor"
        fillOpacity={0.1 * luz}
      />
      <path
        d={cerrada(p(x2, y, h), p(x2, y2, h), p(x2, y2, z0), p(x2, y, z0))}
        fill="currentColor"
        fillOpacity={0.04 * luz}
      />
    </>
  );
}

/** Almenas sobre el borde de un lienzo de muralla. */
function Almenas({
  x,
  y,
  largo,
  eje,
  h,
  grosor,
  paso = 1.15,
}: {
  x: number;
  y: number;
  largo: number;
  eje: "x" | "y";
  h: number;
  grosor: number;
  paso?: number;
}) {
  const piezas: ReactNode[] = [];
  const ancho = paso * 0.55;
  for (let t = 0.12; t + ancho <= largo; t += paso) {
    const [px, py] = eje === "x" ? [x + t, y] : [x, y + t];
    const [w, d] = eje === "x" ? [ancho, grosor] : [grosor, ancho];
    piezas.push(
      <Prisma
        key={`${px}-${py}`}
        x={px}
        y={py}
        w={w}
        d={d}
        z0={h}
        h={h + 0.42}
      />,
    );
  }
  return <>{piezas}</>;
}

/** Torreón: fuste, almenas y una saetera. */
function Torreon({
  x,
  y,
  lado = 1.9,
  h = 2.9,
}: {
  x: number;
  y: number;
  lado?: number;
  h?: number;
}) {
  return (
    <>
      <Prisma x={x} y={y} w={lado} d={lado} h={h} />
      <Almenas
        x={x}
        y={y}
        largo={lado}
        eje="x"
        h={h}
        grosor={0.35}
        paso={lado / 2.4}
      />
      <Almenas
        x={x}
        y={y + lado - 0.35}
        largo={lado}
        eje="x"
        h={h}
        grosor={0.35}
        paso={lado / 2.4}
      />
      <path
        d={via(p(x + lado, y + lado * 0.45, h - 0.7), p(x + lado, y + lado * 0.45, h - 1.5))}
        strokeWidth="1.6"
        opacity=".8"
      />
    </>
  );
}

/** Pieza animada: cada grupo entra con su propio retardo. */
function Pieza({
  orden,
  children,
}: {
  orden: number;
  children: ReactNode;
}) {
  return (
    <g className="pieza" style={{ "--d": orden } as CSSProperties}>
      {children}
    </g>
  );
}

function Solar({ replanteo }: { replanteo?: boolean }) {
  return (
    <g className="solar">
      <path
        d={cerrada(p(0, 0), p(SUELO, 0), p(SUELO, SUELO), p(0, SUELO))}
        fill="currentColor"
        fillOpacity=".05"
      />
      <g opacity=".3" strokeDasharray="2.5 4">
        {[2.5, 5, 7.5].map((t) => (
          <path key={`x${t}`} d={via(p(t, 0), p(t, SUELO))} />
        ))}
        {[2.5, 5, 7.5].map((t) => (
          <path key={`y${t}`} d={via(p(0, t), p(SUELO, t))} />
        ))}
      </g>
      {replanteo && (
        <g opacity=".75" strokeDasharray="4 3">
          <path
            d={cerrada(p(1.6, 1.6), p(8.4, 1.6), p(8.4, 8.4), p(1.6, 8.4))}
          />
          <path d={via(p(5, 1.6), p(5, 8.4))} />
          <path d={via(p(1.6, 5), p(8.4, 5))} />
        </g>
      )}
    </g>
  );
}

export function Architecture({
  plan,
  className = "",
}: {
  plan: PlanSlug;
  className?: string;
}) {
  const lienzos = (h: number) => (
    <>
      <path
        d={cerrada(p(1, 1, h), p(9, 1, h), p(9, 1.7, h), p(1, 1.7, h))}
        fill="currentColor"
        fillOpacity=".17"
      />
      <Prisma x={1} y={1} w={8} d={0.7} h={h} />
      <Prisma x={1} y={1} w={0.7} d={8} h={h} />
    </>
  );
  return (
    <svg
      className={`architecture arq-${plan} ${className}`}
      viewBox="0 0 260 180"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <Solar replanteo={plan === "cimiento"} />

      {plan === "cimiento" && (
        <Pieza orden={1}>
          {/* Estacas de replanteo en las cuatro esquinas */}
          {(
            [
              [1.6, 1.6],
              [8.4, 1.6],
              [8.4, 8.4],
              [1.6, 8.4],
            ] as const
          ).map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <path d={via(p(x, y), p(x, y, 0.9))} strokeWidth="1.7" />
              <path
                d={via(p(x - 0.35, y, 0.9), p(x + 0.35, y, 0.9))}
                strokeWidth="1.7"
              />
              <path
                d={via(p(x, y - 0.35, 0.9), p(x, y + 0.35, 0.9))}
                strokeWidth="1.7"
              />
            </g>
          ))}
          {/* Cimentación bajo rasante */}
          <g opacity=".55">
            <path
              d={cerrada(
                p(1.6, 1.6, -0.5),
                p(8.4, 1.6, -0.5),
                p(8.4, 8.4, -0.5),
                p(1.6, 8.4, -0.5),
              )}
              strokeDasharray="3 3"
            />
            <path d={via(p(1.6, 8.4), p(1.6, 8.4, -0.5))} />
            <path d={via(p(8.4, 8.4), p(8.4, 8.4, -0.5))} />
            <path d={via(p(8.4, 1.6), p(8.4, 1.6, -0.5))} />
          </g>
        </Pieza>
      )}

      {plan === "torre" && (
        <>
          <Pieza orden={1}>
            <g opacity=".5" strokeDasharray="4 3">
              <path
                d={cerrada(p(1.6, 1.6), p(8.4, 1.6), p(8.4, 8.4), p(1.6, 8.4))}
              />
            </g>
            <Prisma x={3.2} y={3.2} w={3.6} d={3.6} h={0.5} luz={0.8} />
          </Pieza>
          <Pieza orden={2}>
            <Prisma x={3.6} y={3.6} w={2.8} d={2.8} h={4.4} />
            {/* Vanos: puerta y saeteras alineadas */}
            <path
              d={cerrada(
                p(6.4, 4.6, 1.5),
                p(6.4, 5.4, 1.5),
                p(6.4, 5.4, 0.5),
                p(6.4, 4.6, 0.5),
              )}
              fill="currentColor"
              fillOpacity=".22"
            />
            <path
              d={via(p(6.4, 4.9, 3.2), p(6.4, 4.9, 2.5))}
              strokeWidth="1.7"
            />
            <path
              d={via(p(4.5, 6.4, 3.2), p(4.5, 6.4, 2.5))}
              strokeWidth="1.7"
            />
            <path d={via(p(3.6, 6.4, 2.4), p(6.4, 6.4, 2.4))} opacity=".45" />
          </Pieza>
          <Pieza orden={3}>
            <Almenas
              x={3.6}
              y={3.6}
              largo={2.8}
              eje="x"
              h={4.4}
              grosor={0.45}
              paso={0.95}
            />
            <Almenas
              x={3.6}
              y={6.15}
              largo={2.8}
              eje="x"
              h={4.4}
              grosor={0.45}
              paso={0.95}
            />
            <Almenas
              x={5.95}
              y={3.6}
              largo={2.8}
              eje="y"
              h={4.4}
              grosor={0.45}
              paso={0.95}
            />
          </Pieza>
        </>
      )}

      {(plan === "alcazaba" || plan === "medina") && (
        <>
          {/* Lienzos del fondo */}
          <Pieza orden={1}>
            {lienzos(2.1)}
            <Almenas x={1} y={1} largo={8} eje="x" h={2.1} grosor={0.7} />
            <Almenas x={1} y={1} largo={8} eje="y" h={2.1} grosor={0.7} />
          </Pieza>
          <Pieza orden={2}>
            <Torreon x={0.4} y={0.4} />
          </Pieza>

          {plan === "medina" && (
            <Pieza orden={3}>
              {/* Caserío, dibujado de fondo a frente */}
              <Prisma x={2.3} y={2.3} w={1.9} d={1.7} h={2.1} />
              <Prisma x={2.2} y={4.7} w={1.5} d={1.7} h={2.4} />
              <Prisma x={5} y={2.2} w={1.7} d={1.5} h={1.7} />
              {/* Alminar: la pieza más alta del recinto */}
              <Prisma x={4.1} y={3.9} w={1.05} d={1.05} h={3.5} />
              <Prisma x={4.3} y={4.1} w={0.65} d={0.65} h={4.1} z0={3.5} />
              <Prisma x={2.6} y={6.6} w={1.5} d={1.4} h={1.8} />
              <Prisma x={6} y={4.4} w={1.6} d={1.5} h={2} />
              <Prisma x={5.5} y={6.2} w={1.8} d={1.5} h={2.5} />
            </Pieza>
          )}

          {/* Lienzos delanteros y puerta */}
          <Pieza orden={plan === "medina" ? 4 : 3}>
            <Prisma x={1} y={8.3} w={8} d={0.7} h={2.1} />
            <Prisma x={8.3} y={1} w={0.7} d={8} h={2.1} />
            <Almenas x={1} y={8.3} largo={8} eje="x" h={2.1} grosor={0.7} />
            <Almenas x={8.3} y={1} largo={8} eje="y" h={2.1} grosor={0.7} />
            {/* Puerta en recodo */}
            <path
              d={cerrada(
                p(4.3, 9, 1.4),
                p(5.7, 9, 1.4),
                p(5.7, 9),
                p(4.3, 9),
              )}
              fill="var(--diagram-fill, #650e15)"
              fillOpacity=".85"
            />
            <path
              d={via(p(4.3, 9, 1.4), p(5, 9, 1.85), p(5.7, 9, 1.4))}
              fill="var(--diagram-fill, #650e15)"
            />
          </Pieza>
          <Pieza orden={plan === "medina" ? 5 : 4}>
            <Torreon x={7.7} y={0.4} />
            <Torreon x={0.4} y={7.7} />
          </Pieza>
          <Pieza orden={plan === "medina" ? 6 : 5}>
            <Torreon x={7.7} y={7.7} lado={2.1} h={3.4} />
          </Pieza>
        </>
      )}
    </svg>
  );
}

export function Pattern({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="100%" height="32" aria-hidden="true">
      <defs>
        <pattern id="lace" width="40" height="32" patternUnits="userSpaceOnUse">
          <path
            d="M20 0 26 10 38 16 26 22 20 32 14 22 2 16 14 10ZM0 0l40 32M40 0 0 32"
            fill="none"
            stroke="currentColor"
            strokeWidth=".65"
          />
        </pattern>
      </defs>
      <rect className="cenefa" width="120%" height="100%" fill="url(#lace)" />
    </svg>
  );
}

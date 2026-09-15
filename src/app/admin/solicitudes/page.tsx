"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, mensajeDe } from "../_lib/api";
import { ESTADOS_SOLICITUD, enlaceWhatsApp, fechaHora, haceTiempo } from "../_lib/formato";
import {
  Cabecera,
  Cargando,
  Chip,
  ErrorCarga,
  Giro,
  useCarga,
  useTitulo,
  Vacio,
} from "../_componentes/comunes";
import { Dialogo, useConfirmar } from "../_componentes/dialogo";
import { Icono } from "../_componentes/icono";
import { useAviso } from "../_componentes/avisos";
import { useMarco } from "../_componentes/marco";

type Solicitud = {
  id: string;
  creada: string;
  actualizada: string;
  tipo: "contacto" | "recomendacion";
  estado: string;
  nombre: string;
  negocio: string;
  telefono: string | null;
  sector: string | null;
  plan: string | null;
  mensaje: string | null;
  referido_negocio: string | null;
  referido_contacto: string | null;
  notas: string;
  sheets: "no" | "ok" | "error";
};
type Lista = {
  solicitudes: Solicitud[];
  total: number;
  pagina: number;
  porPagina: number;
  cuentas: Record<string, number>;
};

export default function Pagina() {
  return (
    <Suspense fallback={<Cargando />}>
      <Solicitudes />
    </Suspense>
  );
}

function Solicitudes() {
  useTitulo("Solicitudes");
  const params = useSearchParams();
  const router = useRouter();
  const estado = params.get("estado") || "";
  const tipo = params.get("tipo") || "";
  const q = params.get("q") || "";
  const pagina = Number(params.get("pagina")) || 1;
  const id = params.get("id") || "";
  const [busqueda, setBusqueda] = useState(q);

  const cambiar = (valores: Record<string, string>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(valores)) (v ? p.set(k, v) : p.delete(k));
    if (!("pagina" in valores) && !("id" in valores)) p.delete("pagina");
    router.replace(`/admin/solicitudes${p.size ? `?${p}` : ""}`, { scroll: false });
  };
  // La búsqueda se lanza cuando dejas de escribir.
  useEffect(() => {
    if (busqueda === q) return;
    const t = setTimeout(() => cambiar({ q: busqueda.trim() }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  const filtros = new URLSearchParams();
  if (estado) filtros.set("estado", estado);
  if (tipo) filtros.set("tipo", tipo);
  if (q) filtros.set("q", q);
  const { datos, error, cargando, recargar, setDatos } = useCarga(
    () => api<Lista>(`solicitudes?${filtros}&pagina=${pagina}`),
    [estado, tipo, q, pagina],
  );
  const total = Object.values(datos?.cuentas || {}).reduce((a, b) => a + b, 0);
  const paginas = datos ? Math.max(1, Math.ceil(datos.total / datos.porPagina)) : 1;

  return (
    <div className="a-contenedor">
      <Cabecera
        titulo="Solicitudes"
        descripcion="Consultas y recomendaciones que llegan desde los formularios de la web."
        acciones={
          <a className="a-boton secundario" href={`/api/admin/solicitudes/exportar?${filtros}`}>
            <Icono nombre="descargar" /> Exportar a Excel (CSV)
          </a>
        }
      />
      <div className="a-filtros">
        <div className="a-pestanas" role="group" aria-label="Filtrar por estado">
          <button type="button" aria-pressed={!estado} onClick={() => cambiar({ estado: "" })}>
            Todas <span className="n">{total}</span>
          </button>
          {Object.entries(ESTADOS_SOLICITUD).map(([clave, e]) => (
            <button key={clave} type="button" aria-pressed={estado === clave} onClick={() => cambiar({ estado: clave })}>
              {e.etiqueta} <span className="n">{datos?.cuentas[clave] ?? 0}</span>
            </button>
          ))}
        </div>
        <select
          className="a-entrada"
          style={{ width: "auto" }}
          value={tipo}
          onChange={(e) => cambiar({ tipo: e.target.value })}
          aria-label="Tipo"
        >
          <option value="">Consultas y recomendaciones</option>
          <option value="contacto">Solo consultas</option>
          <option value="recomendacion">Solo recomendaciones</option>
        </select>
        <input
          className="a-entrada a-buscar"
          type="search"
          placeholder="Buscar por nombre, negocio, teléfono…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar"
        />
      </div>
      {error ? (
        <ErrorCarga error={error} reintentar={recargar} />
      ) : !datos ? (
        <Cargando />
      ) : datos.solicitudes.length === 0 ? (
        <div className="a-tarjeta">
          {estado || tipo || q ? (
            <Vacio titulo="Nada con esos filtros" texto="Prueba a quitar algún filtro o a buscar otra cosa." />
          ) : (
            <Vacio
              titulo="Todavía no hay solicitudes"
              texto="Cuando alguien rellene el formulario de contacto o de recomendación, aparecerá aquí al momento."
            />
          )}
        </div>
      ) : (
        <>
          <div className="a-tabla-envoltorio" style={{ opacity: cargando ? 0.6 : 1 }}>
            <table className="a-tabla adaptable">
              <thead>
                <tr>
                  <th>Recibida</th>
                  <th>Quién</th>
                  <th>Tipo</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {datos.solicitudes.map((s) => (
                  <tr key={s.id} className="clicable" onClick={() => cambiar({ id: s.id })}>
                    <td className="flojo" title={fechaHora(s.creada)}>
                      {haceTiempo(s.creada)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="fuerte"
                        style={{ background: "none", border: 0, padding: 0, cursor: "pointer", textAlign: "left" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          cambiar({ id: s.id });
                        }}
                      >
                        {s.tipo === "recomendacion" ? s.referido_negocio : s.negocio}
                      </button>
                      <div className="flojo">
                        {s.tipo === "recomendacion" ? `Recomendado por ${s.nombre} (${s.negocio})` : s.nombre}
                      </div>
                    </td>
                    <td>{s.tipo === "recomendacion" ? "Recomendación" : "Consulta"}</td>
                    <td className="flojo">{s.telefono || s.referido_contacto}</td>
                    <td>
                      <Chip tono={ESTADOS_SOLICITUD[s.estado]?.tono}>
                        {ESTADOS_SOLICITUD[s.estado]?.etiqueta ?? s.estado}
                      </Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginas > 1 && (
            <div className="a-paginacion">
              <button
                type="button"
                className="a-boton secundario pequeno"
                disabled={pagina <= 1}
                onClick={() => cambiar({ pagina: String(pagina - 1) })}
              >
                Anterior
              </button>
              <span>
                Página {pagina} de {paginas} · {datos.total} solicitudes
              </span>
              <button
                type="button"
                className="a-boton secundario pequeno"
                disabled={pagina >= paginas}
                onClick={() => cambiar({ pagina: String(pagina + 1) })}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
      <Dialogo
        abierto={!!id}
        onCerrar={() => cambiar({ id: "" })}
        titulo="Solicitud"
        variante="lateral"
      >
        {id && (
          <Detalle
            id={id}
            onCambio={(s) =>
              setDatos((d) =>
                d ? { ...d, solicitudes: d.solicitudes.map((x) => (x.id === s.id ? s : x)) } : d,
              )
            }
            onBorrada={() => {
              cambiar({ id: "" });
              recargar();
            }}
            onEstado={recargar}
          />
        )}
      </Dialogo>
    </div>
  );
}

function Detalle({
  id,
  onCambio,
  onBorrada,
  onEstado,
}: {
  id: string;
  onCambio: (s: Solicitud) => void;
  onBorrada: () => void;
  onEstado: () => void;
}) {
  const avisar = useAviso();
  const confirmar = useConfirmar();
  const { refrescar } = useMarco();
  const { datos, error, recargar, setDatos } = useCarga(
    () => api<{ solicitud: Solicitud }>(`solicitudes/${id}`),
    [id],
  );
  const [notas, setNotas] = useState("");
  const [ocupado, setOcupado] = useState("");
  useEffect(() => {
    if (datos) setNotas(datos.solicitud.notas);
  }, [datos]);
  if (error) return <ErrorCarga error={error} reintentar={recargar} />;
  if (!datos) return <Cargando />;
  const s = datos.solicitud;

  const actualizar = async (cambios: Partial<Pick<Solicitud, "estado" | "notas">>, mensaje: string) => {
    setOcupado(Object.keys(cambios)[0]);
    try {
      const r = await api<{ solicitud: Solicitud }>(`solicitudes/${id}`, { metodo: "PATCH", cuerpo: cambios });
      setDatos({ solicitud: r.solicitud });
      onCambio(r.solicitud);
      if (cambios.estado) {
        refrescar();
        onEstado();
      }
      avisar(mensaje);
    } catch (e) {
      avisar(mensajeDe(e), "error");
    } finally {
      setOcupado("");
    }
  };
  const reenviar = async () => {
    setOcupado("sheets");
    try {
      await api(`solicitudes/${id}/reenviar`, { metodo: "POST" });
      setDatos({ solicitud: { ...s, sheets: "ok" } });
      avisar("Enviada a Google Sheets.");
    } catch (e) {
      avisar(mensajeDe(e), "error");
    } finally {
      setOcupado("");
    }
  };
  const borrar = async () => {
    if (
      !(await confirmar({
        titulo: "¿Borrar esta solicitud?",
        texto: (
          <>
            <p>Se borrará definitivamente del panel. La copia de Google Sheets, si existe, hay que borrarla allí.</p>
            <p>Hazlo cuando la persona pida que eliminéis sus datos o cuando ya no haga falta conservarlos.</p>
          </>
        ),
        boton: "Borrar definitivamente",
        peligro: true,
      }))
    )
      return;
    try {
      await api(`solicitudes/${id}`, { metodo: "DELETE" });
      avisar("Solicitud borrada.");
      refrescar();
      onBorrada();
    } catch (e) {
      avisar(mensajeDe(e), "error");
    }
  };

  const contactoReferido = s.referido_contacto || "";
  const esEmail = contactoReferido.includes("@");
  return (
    <div className="a-apilado">
      <div>
        <h3 style={{ fontSize: "1.4rem" }}>{s.tipo === "recomendacion" ? s.referido_negocio : s.negocio}</h3>
        <p className="a-suave a-pequeno" style={{ marginTop: 4 }}>
          {s.tipo === "recomendacion" ? "Recomendación" : "Consulta"} recibida el {fechaHora(s.creada)}
        </p>
      </div>
      <div className="a-acciones">
        {s.tipo === "contacto" && s.telefono && (
          <>
            <a className="a-boton" href={enlaceWhatsApp(s.telefono)} target="_blank" rel="noopener">
              <Icono nombre="whatsapp" /> WhatsApp
            </a>
            <a className="a-boton secundario" href={`tel:${s.telefono.replace(/[^\d+]/g, "")}`}>
              <Icono nombre="telefono" /> Llamar
            </a>
          </>
        )}
        {s.tipo === "recomendacion" && contactoReferido && (
          <a
            className="a-boton"
            href={esEmail ? `mailto:${contactoReferido}` : enlaceWhatsApp(contactoReferido)}
            target="_blank"
            rel="noopener"
          >
            <Icono nombre={esEmail ? "email" : "whatsapp"} /> Contactar con el recomendado
          </a>
        )}
      </div>
      <div className="a-campo">
        <label htmlFor="estado">Estado</label>
        <select
          id="estado"
          className="a-entrada"
          value={s.estado}
          disabled={ocupado === "estado"}
          onChange={(e) => actualizar({ estado: e.target.value }, "Estado actualizado.")}
        >
          {Object.entries(ESTADOS_SOLICITUD).map(([clave, e]) => (
            <option key={clave} value={clave}>
              {e.etiqueta}
            </option>
          ))}
        </select>
      </div>
      <dl className="a-datos">
        {s.tipo === "contacto" ? (
          <>
            <dt>Nombre</dt>
            <dd>{s.nombre}</dd>
            <dt>Negocio</dt>
            <dd>{s.negocio}</dd>
            <dt>Teléfono</dt>
            <dd>{s.telefono}</dd>
            <dt>Tipo de empresa</dt>
            <dd>{s.sector}</dd>
            <dt>Plan de interés</dt>
            <dd>{s.plan || "Sin indicar"}</dd>
            <dt>Mensaje</dt>
            <dd>{s.mensaje}</dd>
          </>
        ) : (
          <>
            <dt>Recomienda</dt>
            <dd>
              {s.nombre} ({s.negocio})
            </dd>
            <dt>Negocio recomendado</dt>
            <dd>{s.referido_negocio}</dd>
            <dt>Su contacto</dt>
            <dd>{s.referido_contacto}</dd>
          </>
        )}
        <dt>Google Sheets</dt>
        <dd>
          {s.sheets === "ok" ? (
            <Chip tono="ok">Copiada</Chip>
          ) : s.sheets === "error" ? (
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Chip tono="error">No llegó</Chip>
              <button type="button" className="a-enlace" onClick={reenviar} disabled={ocupado === "sheets"}>
                Reintentar
              </button>
            </span>
          ) : (
            <span className="a-suave">No conectada</span>
          )}
        </dd>
      </dl>
      <div className="a-campo">
        <label htmlFor="notas">Notas internas</label>
        <textarea
          id="notas"
          className="a-entrada"
          rows={4}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Qué habéis hablado, próximos pasos, presupuesto enviado…"
        />
        <div>
          <button
            type="button"
            className="a-boton secundario pequeno"
            disabled={notas === s.notas || ocupado === "notas"}
            onClick={() => actualizar({ notas }, "Notas guardadas.")}
          >
            {ocupado === "notas" && <Giro />}
            Guardar notas
          </button>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--a-borde)", paddingTop: 16 }}>
        <button type="button" className="a-boton peligro pequeno" onClick={borrar}>
          <Icono nombre="borrar" /> Borrar solicitud
        </button>
      </div>
    </div>
  );
}

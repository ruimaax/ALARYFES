"use client";

import { useState } from "react";
import { api } from "../_lib/api";
import { fechaHora } from "../_lib/formato";
import { Cabecera, Cargando, ErrorCarga, useCarga, useTitulo, Vacio } from "../_componentes/comunes";

type Entrada = { id: number; fecha: string; accion: string; detalle: string; ip: string };
type Datos = { registro: Entrada[]; pagina: number; total: number; porPagina: number };

const acciones: Record<string, string> = {
  acceso: "Acceso correcto",
  "acceso.fallido": "Acceso fallido",
  "acceso.codigo-incorrecto": "Código 2FA incorrecto",
  "acceso.clave-configuracion-incorrecta": "Clave de configuración incorrecta",
  salida: "Cierre de sesión",
  "cuenta.creada": "Cuenta creada",
  "cuenta.recuperada": "Cuenta recuperada",
  "cuenta.contraseña": "Contraseña cambiada",
  "cuenta.email": "Email cambiado",
  "cuenta.2fa-activada": "Verificación en dos pasos activada",
  "cuenta.2fa-desactivada": "Verificación en dos pasos desactivada",
  "cuenta.sesion-cerrada": "Sesión cerrada",
  "cuenta.sesiones-cerradas": "Demás sesiones cerradas",
  "contenido.guardado": "Contenido guardado",
  "contenido.descartado": "Borrador de contenido descartado",
  "blog.creado": "Artículo creado",
  "blog.guardado": "Artículo guardado",
  "blog.borrado": "Artículo borrado",
  "medio.subido": "Medio subido",
  "medio.borrado": "Medio borrado",
  publicacion: "Publicación realizada",
  "publicacion.recompilada": "Recompilación solicitada",
  "borrador.descartado": "Borrador descartado",
  "borrador.descartados-todos": "Todos los borradores descartados",
  "historial.restaurado": "Versión restaurada",
  "solicitud.estado": "Estado de solicitud cambiado",
  "solicitud.borrada": "Solicitud borrada",
  "solicitudes.exportadas": "Solicitudes exportadas",
  "sistema.prueba-email": "Email de prueba enviado",
  "sistema.prueba-hoja": "Fila de prueba enviada",
};

export default function Actividad() {
  useTitulo("Actividad");
  const [pagina, setPagina] = useState(1);
  const { datos, error, cargando, recargar } = useCarga(
    () => api<Datos>(`registro?pagina=${pagina}`),
    [pagina],
  );
  const paginas = Math.max(1, Math.ceil((datos?.total || 0) / (datos?.porPagina || 50)));
  return (
    <div className="a-contenedor">
      <Cabecera titulo="Actividad" descripcion="Registro de accesos y cambios importantes realizados desde el panel." />
      {cargando && !datos ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga error={error} reintentar={recargar} />
      ) : !datos?.registro.length ? (
        <div className="a-tarjeta"><Vacio titulo="Todavía no hay actividad" /></div>
      ) : (
        <>
          <div className="a-tabla-envoltorio">
            <table className="a-tabla adaptable">
              <thead><tr><th>Fecha</th><th>Acción</th><th>Detalle</th><th>IP</th></tr></thead>
              <tbody>
                {datos.registro.map((entrada) => (
                  <tr key={entrada.id}>
                    <td className="flojo">{fechaHora(entrada.fecha)}</td>
                    <td className="fuerte">{acciones[entrada.accion] || entrada.accion}</td>
                    <td>{entrada.detalle || <span className="a-suave">—</span>}</td>
                    <td className="flojo a-mono">{entrada.ip || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav className="a-paginacion" aria-label="Páginas del registro">
            <button type="button" className="a-boton secundario pequeno" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1}>Anterior</button>
            <span>Página {datos.pagina} de {paginas} · {datos.total} entradas</span>
            <button type="button" className="a-boton secundario pequeno" onClick={() => setPagina((p) => Math.min(paginas, p + 1))} disabled={pagina >= paginas}>Siguiente</button>
          </nav>
        </>
      )}
    </div>
  );
}

"use client";
import { useRef, useState } from "react";
import { api, mensajeDe } from "../_lib/api";
import { tamano, urlVista } from "../_lib/formato";
import { Dialogo } from "./dialogo";
import { Icono } from "./icono";
import { useAviso } from "./avisos";
import { Cargando, ErrorCarga, Giro, useCarga } from "./comunes";

export type Archivo = {
  ruta: string;
  nombre: string;
  url: string;
  tamano: number;
  tipo: string;
  estado: string;
  fecha?: string;
};

const MAXIMO = 1_400_000;
const LADO = 2000;

const aBase64 = (blob: Blob) =>
  new Promise<string>((resolver, fallar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result).split(",")[1] || "");
    lector.onerror = () => fallar(lector.error);
    lector.readAsDataURL(blob);
  });

async function aWebp(archivo: File) {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext("2d")!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();
  return new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, "image/webp", 0.82));
}

/**
 * Las fotos se reducen a 2000 px y se pasan a WebP en tu navegador antes de
 * subirlas: la web carga más rápido y el repositorio no se llena.
 */
export async function prepararArchivo(archivo: File) {
  if (archivo.type === "image/svg+xml" || /\.svg$/i.test(archivo.name))
    throw new Error(`${archivo.name}: los SVG no se admiten por seguridad. Expórtalo como PNG.`);
  let blob: Blob = archivo;
  let nombre = archivo.name;
  if (/^image\/(jpeg|png|webp)$/.test(archivo.type)) {
    const webp = await aWebp(archivo).catch(() => null);
    // Si el navegador no sabe crear WebP devuelve PNG: entonces se deja el original.
    if (webp && webp.type === "image/webp" && (webp.size < archivo.size || archivo.size > MAXIMO)) {
      blob = webp;
      nombre = `${nombre.replace(/\.[^.]+$/, "")}.webp`;
    }
  }
  if (blob.size > MAXIMO)
    throw new Error(`${archivo.name}: pesa ${tamano(blob.size)} incluso comprimido. El máximo es 1,4 MB.`);
  return { nombre, datos: await aBase64(blob) };
}

export function ZonaSubida({
  onSubidos,
  aceptar = "image/jpeg,image/png,image/webp,image/avif,image/gif,application/pdf",
}: {
  onSubidos: (archivos: Archivo[]) => void;
  aceptar?: string;
}) {
  const [encima, setEncima] = useState(false);
  const [progreso, setProgreso] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const avisar = useAviso();
  const subir = async (lista: FileList) => {
    const archivos = [...lista];
    const subidos: Archivo[] = [];
    for (const [i, archivo] of archivos.entries()) {
      setProgreso(`Subiendo ${i + 1} de ${archivos.length}: ${archivo.name}`);
      try {
        const listo = await prepararArchivo(archivo);
        const { archivo: subido } = await api<{ archivo: Archivo }>("medios", { metodo: "POST", cuerpo: listo });
        subidos.push({ ...subido, estado: "nuevo" });
      } catch (e) {
        avisar(mensajeDe(e), "error");
      }
    }
    setProgreso(null);
    if (subidos.length) {
      avisar(
        subidos.length === 1
          ? "Archivo subido. Irá a la web con la próxima publicación."
          : `${subidos.length} archivos subidos. Irán a la web con la próxima publicación.`,
      );
      onSubidos(subidos);
    }
  };
  return (
    <div
      className={`a-subida ${encima ? "encima" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setEncima(true);
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(e) => {
        e.preventDefault();
        setEncima(false);
        if (e.dataTransfer.files.length) subir(e.dataTransfer.files);
      }}
    >
      {progreso ? (
        <p className="a-cargando" style={{ padding: 0 }}>
          <Giro />
          {progreso}
        </p>
      ) : (
        <>
          <p>
            <strong>Arrastra aquí tus archivos</strong> o{" "}
            <button type="button" className="a-enlace" onClick={() => entrada.current?.click()}>
              elígelos del dispositivo
            </button>
          </p>
          <p className="a-pequeno" style={{ marginTop: 4 }}>
            JPG, PNG, WebP, AVIF, GIF o PDF de hasta 1,4 MB. Las fotos se reducen a 2000 px y se
            convierten a WebP solas.
          </p>
        </>
      )}
      <input
        ref={entrada}
        type="file"
        accept={aceptar}
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) subir(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function VistaMedio({ archivo }: { archivo: Pick<Archivo, "tipo" | "url"> }) {
  return (
    <span className="a-medio-vista">
      {archivo.tipo.startsWith("image/") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlVista(archivo.url)} alt="" loading="lazy" />
      ) : (
        <span>PDF</span>
      )}
    </span>
  );
}

export function SelectorMedios({
  abierto,
  onCerrar,
  onElegir,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onElegir: (archivo: Archivo) => void;
}) {
  const { datos, error, cargando, recargar } = useCarga(
    () => (abierto ? api<{ archivos: Archivo[] }>("medios") : Promise.resolve(null)),
    [abierto],
  );
  const imagenes = (datos?.archivos || []).filter(
    (a) => a.tipo.startsWith("image/") && a.estado !== "borrar",
  );
  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar} titulo="Elegir imagen" variante="ancho">
      <ZonaSubida
        aceptar="image/jpeg,image/png,image/webp,image/avif,image/gif"
        onSubidos={(nuevos) => (nuevos.length === 1 ? onElegir(nuevos[0]) : recargar())}
      />
      {cargando ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga error={error} reintentar={recargar} />
      ) : imagenes.length === 0 ? (
        <p className="a-suave">Todavía no hay imágenes. Sube la primera.</p>
      ) : (
        <div className="a-medios">
          {imagenes.map((a) => (
            <button key={a.ruta} type="button" className="a-medio seleccionable" onClick={() => onElegir(a)}>
              <VistaMedio archivo={a} />
              <span className="a-medio-info">
                <span className="a-medio-nombre">{a.nombre}</span>
                {tamano(a.tamano)}
              </span>
            </button>
          ))}
        </div>
      )}
    </Dialogo>
  );
}

export function CampoImagen({
  id,
  valor,
  onChange,
  invalido,
}: {
  id: string;
  valor: string;
  onChange: (valor: string) => void;
  invalido?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="a-imagen-campo">
      {valor ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="a-miniatura" src={urlVista(valor)} alt="" />
      ) : (
        <span className="a-miniatura">Sin imagen</span>
      )}
      <div className="a-acciones">
        <button
          id={id}
          type="button"
          className="a-boton secundario pequeno"
          aria-invalid={invalido || undefined}
          onClick={() => setAbierto(true)}
        >
          <Icono nombre="medios" />
          {valor ? "Cambiar" : "Elegir imagen"}
        </button>
        {valor && (
          <button type="button" className="a-boton fantasma pequeno" onClick={() => onChange("")}>
            Quitar
          </button>
        )}
      </div>
      <SelectorMedios
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        onElegir={(a) => {
          onChange(a.url);
          setAbierto(false);
        }}
      />
    </div>
  );
}

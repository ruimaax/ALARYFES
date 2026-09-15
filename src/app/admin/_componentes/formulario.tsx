"use client";
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  valorInicial,
  type Campo,
  type CampoGrupo,
  type CampoLista,
} from "@/cms/esquema";
import { Icono } from "./icono";
import { CampoImagen } from "./medios";
import { useConfirmar } from "./dialogo";

// Formulario generado a partir de los esquemas de src/cms/secciones.ts.
type Errores = Record<string, string>;
type Props = {
  campo: Campo;
  valor: unknown;
  onChange: (valor: unknown) => void;
  ruta: string;
  errores: Errores;
  clase?: string;
};

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export const hayError = (errores: Errores, ruta: string) =>
  Object.keys(errores).some((k) => k === ruta || k.startsWith(`${ruta}.`));
export const idCampo = (ruta: string) => `campo-${ruta.replace(/[^\w-]/g, "_")}`;

export function FormularioEsquema({
  esquema,
  valor,
  onChange,
  errores,
}: {
  esquema: CampoGrupo;
  valor: unknown;
  onChange: (valor: unknown) => void;
  errores: Errores;
}) {
  const datos = esObjeto(valor) ? valor : {};
  return (
    <div className="a-esquema">
      {esquema.campos.map((campo) => {
        const props = {
          valor: datos[campo.clave],
          onChange: (v: unknown) => onChange({ ...datos, [campo.clave]: v }),
          ruta: campo.clave,
          errores,
        };
        if (campo.tipo === "grupo") return <Grupo key={campo.clave} {...props} campo={campo} />;
        return (
          <section key={campo.clave} className="a-tarjeta">
            {campo.tipo === "lista" ? (
              <Lista {...props} campo={campo} />
            ) : (
              <Simple {...props} campo={campo} />
            )}
          </section>
        );
      })}
    </div>
  );
}

/** <details> que empieza abierto o cerrado y se abre solo si hay un error. */
function Plegable({
  abierto,
  forzar,
  className,
  resumen,
  children,
}: {
  abierto: boolean;
  forzar: boolean;
  className: string;
  resumen: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const inicial = useRef(abierto);
  useLayoutEffect(() => {
    if (ref.current) ref.current.open = inicial.current;
  }, []);
  useEffect(() => {
    if (forzar && ref.current) ref.current.open = true;
  }, [forzar]);
  return (
    <details ref={ref} className={className}>
      <summary>{resumen}</summary>
      {children}
    </details>
  );
}

function Campos({
  campos,
  datos,
  onChange,
  ruta,
  errores,
}: {
  campos: Campo[];
  datos: Record<string, unknown>;
  onChange: (v: unknown) => void;
  ruta: string;
  errores: Errores;
}) {
  return (
    <>
      {campos.map((c) => (
        <Fragment key={c.clave}>
          {c.apartado && <p className="a-apartado">{c.apartado}</p>}
          <Nodo
            campo={c}
            valor={datos[c.clave]}
            onChange={(v) => onChange({ ...datos, [c.clave]: v })}
            ruta={ruta ? `${ruta}.${c.clave}` : c.clave}
            errores={errores}
            clase={c.medio ? "medio" : ""}
          />
        </Fragment>
      ))}
    </>
  );
}

function Nodo(props: Props) {
  const { campo } = props;
  if (campo.tipo === "grupo") return <Grupo {...props} campo={campo} />;
  if (campo.tipo === "lista") return <Lista {...props} campo={campo} />;
  return <Simple {...props} />;
}

function Grupo({ campo, valor, onChange, ruta, errores, clase = "" }: Props & { campo: CampoGrupo }) {
  const conError = hayError(errores, ruta);
  return (
    <Plegable
      abierto={!campo.plegado}
      forzar={conError}
      className={`a-grupo ${clase} ${conError ? "a-con-error" : ""}`}
      resumen={campo.etiqueta}
    >
      <div className="a-grupo-cuerpo">
        {campo.ayuda && <p className="a-ayuda a-grupo-ayuda">{campo.ayuda}</p>}
        <Campos
          campos={campo.campos}
          datos={esObjeto(valor) ? valor : {}}
          onChange={onChange}
          ruta={ruta}
          errores={errores}
        />
      </div>
    </Plegable>
  );
}

function Lista({ campo, valor, onChange, ruta, errores, clase = "" }: Props & { campo: CampoLista }) {
  const items = Array.isArray(valor) ? valor : [];
  const [nuevo, setNuevo] = useState<number | null>(null);
  const confirmar = useConfirmar();
  const elemento = campo.elemento;
  const tituloDe = (item: unknown, i: number) => {
    const t = campo.titulo && esObjeto(item) ? item[campo.titulo] : null;
    return typeof t === "string" && t.trim() ? t : `${elemento.etiqueta} ${i + 1}`;
  };
  const cambiar = (i: number, v: unknown) => onChange(items.map((x, j) => (j === i ? v : x)));
  const mover = (i: number, d: number) => {
    const copia = [...items];
    [copia[i], copia[i + d]] = [copia[i + d], copia[i]];
    onChange(copia);
  };
  const quitar = async (i: number) => {
    if (
      elemento.tipo === "grupo" &&
      !(await confirmar({
        titulo: "¿Quitar este elemento?",
        texto: `Se quitará «${tituloDe(items[i], i)}». En la web no cambia nada hasta que guardes y publiques.`,
        boton: "Quitar",
        peligro: true,
      }))
    )
      return;
    onChange(items.filter((_, j) => j !== i));
  };
  const anadir = () => {
    onChange([...items, valorInicial(elemento)]);
    setNuevo(items.length);
  };
  const puedeQuitar = campo.min === undefined || items.length > campo.min;
  const controles = (i: number) =>
    campo.fija ? null : (
      // preventDefault evita que pulsar un botón pliegue o despliegue el elemento.
      <div className="a-controles" onClick={(e) => e.preventDefault()}>
        <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir">
          <Icono nombre="arriba" />
        </button>
        <button type="button" onClick={() => mover(i, 1)} disabled={i === items.length - 1} aria-label="Bajar">
          <Icono nombre="abajo" />
        </button>
        <button type="button" className="borrar" onClick={() => quitar(i)} disabled={!puedeQuitar} aria-label="Quitar">
          <Icono nombre="borrar" />
        </button>
      </div>
    );
  return (
    <div className={`a-campo a-lista ${clase}`}>
      <div className="a-lista-cabecera">
        <span className="a-etiqueta">{campo.etiqueta}</span>
        <span className="a-contador">
          {items.length}
          {campo.max ? ` de ${campo.max}` : ""}
        </span>
      </div>
      {campo.ayuda && <p className="a-ayuda">{campo.ayuda}</p>}
      {errores[ruta] && <p className="a-error-campo">{errores[ruta]}</p>}
      {items.map((item, i) => {
        const r = `${ruta}.${i}`;
        if (elemento.tipo === "grupo") {
          const conError = hayError(errores, r);
          return (
            <Plegable
              key={i}
              abierto={i === nuevo}
              forzar={conError || i === nuevo}
              className={`a-elemento ${conError ? "a-con-error" : ""}`}
              resumen={
                <>
                  <span className="a-elemento-titulo">
                    <small>{i + 1}</small>
                    {tituloDe(item, i)}
                  </span>
                  {controles(i)}
                </>
              }
            >
              <div className="a-elemento-cuerpo">
                <Campos
                  campos={elemento.campos}
                  datos={esObjeto(item) ? item : {}}
                  onChange={(v) => cambiar(i, v)}
                  ruta={r}
                  errores={errores}
                />
              </div>
            </Plegable>
          );
        }
        return (
          <div key={i} className="a-elemento-simple">
            <Simple
              campo={{ ...elemento, etiqueta: `${elemento.etiqueta} ${i + 1}` } as Campo}
              valor={item}
              onChange={(v) => cambiar(i, v)}
              ruta={r}
              errores={errores}
              sinEtiqueta
            />
            {controles(i)}
          </div>
        );
      })}
      {!campo.fija && (campo.max === undefined || items.length < campo.max) && (
        <div>
          <button type="button" className="a-boton secundario pequeno" onClick={anadir}>
            <Icono nombre="mas" />
            {campo.etiquetaNuevo || "Añadir"}
          </button>
        </div>
      )}
    </div>
  );
}

function Simple({
  campo,
  valor,
  onChange,
  ruta,
  errores,
  clase = "",
  sinEtiqueta = false,
}: Props & { sinEtiqueta?: boolean }) {
  const id = idCampo(ruta);
  const error = errores[ruta];
  const describe = error ? `${id}-error` : campo.ayuda ? `${id}-ayuda` : undefined;
  const comunes = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describe,
    "aria-label": sinEtiqueta ? campo.etiqueta : undefined,
  };
  const texto = typeof valor === "string" ? valor : valor == null ? "" : String(valor);
  const maximo = campo.tipo === "texto" || campo.tipo === "textoLargo" ? campo.max : undefined;
  let control: ReactNode = null;
  switch (campo.tipo) {
    case "texto":
    case "enlace":
    case "email":
      control = (
        <input
          {...comunes}
          className="a-entrada"
          type={campo.tipo === "email" ? "email" : "text"}
          inputMode={campo.tipo === "enlace" ? "url" : undefined}
          value={texto}
          placeholder={campo.soloLectura ? "—" : undefined}
          readOnly={campo.soloLectura}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case "textoLargo":
      control = (
        <textarea
          {...comunes}
          className="a-entrada"
          rows={campo.filas ?? 3}
          value={texto}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case "numero":
      control = (
        <div className="a-sufijo">
          <input
            {...comunes}
            className="a-entrada"
            type="number"
            inputMode="numeric"
            step={campo.entero ? 1 : "any"}
            min={campo.min}
            max={campo.max}
            value={typeof valor === "number" && Number.isFinite(valor) ? valor : ""}
            onChange={(e) => onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))}
          />
          {campo.sufijo && <span>{campo.sufijo}</span>}
        </div>
      );
      break;
    case "booleano":
      return (
        <div className={`a-campo ${clase}`}>
          <label className="a-interruptor">
            <input {...comunes} type="checkbox" checked={valor === true} onChange={(e) => onChange(e.target.checked)} />
            {campo.etiqueta}
          </label>
          {campo.ayuda && (
            <p id={`${id}-ayuda`} className="a-ayuda">
              {campo.ayuda}
            </p>
          )}
          {error && (
            <p id={`${id}-error`} className="a-error-campo">
              {error}
            </p>
          )}
        </div>
      );
    case "seleccion":
      control = (
        <select {...comunes} className="a-entrada" value={texto} onChange={(e) => onChange(e.target.value)}>
          {campo.opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      );
      break;
    case "fecha":
      control = (
        <input {...comunes} className="a-entrada" type="date" value={texto} onChange={(e) => onChange(e.target.value)} />
      );
      break;
    case "imagen":
      control = <CampoImagen id={id} valor={texto} onChange={onChange} invalido={!!error} />;
      break;
    case "fila": {
      const celdas = Array.isArray(valor) ? valor : campo.columnas.map(() => "");
      control = (
        <div className="a-columnas" role="group" aria-label={campo.etiqueta}>
          {campo.columnas.map((columna, j) => (
            <label key={columna}>
              {columna}
              <input
                className="a-entrada"
                value={String(celdas[j] ?? "")}
                aria-invalid={error ? true : undefined}
                onChange={(e) =>
                  onChange(campo.columnas.map((_, k) => (k === j ? e.target.value : String(celdas[k] ?? ""))))
                }
              />
            </label>
          ))}
        </div>
      );
      break;
    }
  }
  const opcional = !campo.requerido && !campo.soloLectura && campo.tipo !== "fila";
  return (
    <div className={`a-campo ${clase}`}>
      {!sinEtiqueta && (
        <div className="a-etiqueta-fila">
          <label htmlFor={campo.tipo === "fila" ? undefined : id} className="a-etiqueta">
            {campo.etiqueta}
            {opcional && <span className="a-suave" style={{ fontWeight: 400 }}> · opcional</span>}
          </label>
          {maximo && (
            <span className={`a-contador ${texto.length > maximo ? "pasado" : ""}`}>
              {texto.length}/{maximo}
            </span>
          )}
        </div>
      )}
      {control}
      {campo.ayuda && !sinEtiqueta && (
        <p id={`${id}-ayuda`} className="a-ayuda">
          {campo.ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="a-error-campo">
          {error}
        </p>
      )}
    </div>
  );
}

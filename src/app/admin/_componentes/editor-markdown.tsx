"use client";
import { useDeferredValue, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Marked } from "marked";
import { urlVista } from "../_lib/formato";
import { Icono } from "./icono";
import { SelectorMedios } from "./medios";

const escapar = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const segura = (url: string) => /^(https?:|mailto:|tel:|\/|#)/i.test(url.trim());

// La vista previa se comporta como la web: Markdown puro. El HTML se enseña
// como texto y los enlaces que no son web, email o teléfono no se activan.
const md = new Marked({
  gfm: true,
  renderer: {
    html({ text }) {
      return escapar(text);
    },
    link(token) {
      const dentro = this.parser.parseInline(token.tokens);
      return segura(token.href)
        ? `<a href="${escapar(token.href)}" target="_blank" rel="noopener">${dentro}</a>`
        : dentro;
    },
    image({ href, text }) {
      return segura(href) ? `<img src="${escapar(urlVista(href))}" alt="${escapar(text)}">` : escapar(text);
    },
  },
});

type Cambio = (texto: string, a: number, b: number) => { texto: string; a: number; b: number };

export function EditorMarkdown({
  id,
  valor,
  onChange,
}: {
  id?: string;
  valor: string;
  onChange: (valor: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [vista, setVista] = useState<"dividida" | "escribir" | "previa">("dividida");
  const [selector, setSelector] = useState(false);
  const diferido = useDeferredValue(valor);
  const html = useMemo(() => md.parse(diferido, { async: false }) as string, [diferido]);
  const palabras = valor.trim() ? valor.trim().split(/\s+/).length : 0;

  const aplicar = (cambio: Cambio) => {
    const t = ref.current;
    if (!t) return;
    const r = cambio(t.value, t.selectionStart, t.selectionEnd);
    onChange(r.texto);
    requestAnimationFrame(() => {
      t.focus();
      t.setSelectionRange(r.a, r.b);
    });
  };
  const envolver = (antes: string, despues: string, ejemplo: string) =>
    aplicar((texto, a, b) => {
      const sel = texto.slice(a, b) || ejemplo;
      return {
        texto: texto.slice(0, a) + antes + sel + despues + texto.slice(b),
        a: a + antes.length,
        b: a + antes.length + sel.length,
      };
    });
  const lineas = (prefijo: (i: number) => string) =>
    aplicar((texto, a, b) => {
      const inicio = texto.lastIndexOf("\n", a - 1) + 1;
      const bloque = texto
        .slice(inicio, b)
        .split("\n")
        .map((l, i) => prefijo(i) + l.replace(/^(#{1,6} |> |- |\d+\. )/, ""))
        .join("\n");
      return { texto: texto.slice(0, inicio) + bloque + texto.slice(b), a: inicio, b: inicio + bloque.length };
    });
  const insertar = (fragmento: string) =>
    aplicar((texto, a, b) => {
      const separacion = a > 0 && texto[a - 1] !== "\n" ? "\n\n" : "";
      const fin = a + separacion.length + fragmento.length;
      return { texto: `${texto.slice(0, a)}${separacion}${fragmento}\n${texto.slice(b)}`, a: fin, b: fin };
    });
  const enlace = () => {
    const url = window.prompt("Dirección del enlace (https://… o una página de la web como /planes):", "https://");
    if (url) envolver("[", `](${url.trim()})`, "texto del enlace");
  };
  const atajos = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const tecla = e.key.toLowerCase();
    if (tecla === "b") envolver("**", "**", "texto");
    else if (tecla === "i") envolver("_", "_", "texto");
    else if (tecla === "k") enlace();
    else return;
    e.preventDefault();
  };
  const sinTexto = vista === "previa";

  return (
    <div className="a-editor">
      <div className="a-editor-herramientas" role="toolbar" aria-label="Formato del texto">
        <button type="button" disabled={sinTexto} title="Título de sección" onClick={() => lineas(() => "## ")}>
          Título
        </button>
        <button type="button" disabled={sinTexto} title="Subtítulo" onClick={() => lineas(() => "### ")}>
          Subtítulo
        </button>
        <span className="a-separador" />
        <button type="button" disabled={sinTexto} title="Negrita (⌘/Ctrl + B)" onClick={() => envolver("**", "**", "texto")}>
          <strong>B</strong>
        </button>
        <button type="button" disabled={sinTexto} title="Cursiva (⌘/Ctrl + I)" onClick={() => envolver("_", "_", "texto")}>
          <em style={{ fontFamily: "Georgia, serif" }}>I</em>
        </button>
        <button type="button" disabled={sinTexto} title="Enlace (⌘/Ctrl + K)" onClick={enlace} aria-label="Enlace">
          <Icono nombre="enlace" />
        </button>
        <span className="a-separador" />
        <button type="button" disabled={sinTexto} title="Lista" onClick={() => lineas(() => "- ")} aria-label="Lista">
          <Icono nombre="lista" />
        </button>
        <button type="button" disabled={sinTexto} title="Lista numerada" onClick={() => lineas((i) => `${i + 1}. `)} aria-label="Lista numerada">
          <Icono nombre="numeros" />
        </button>
        <button type="button" disabled={sinTexto} title="Cita destacada" onClick={() => lineas(() => "> ")} aria-label="Cita">
          <Icono nombre="cita" />
        </button>
        <button type="button" disabled={sinTexto} title="Insertar imagen" onClick={() => setSelector(true)}>
          <Icono nombre="medios" /> Imagen
        </button>
        <span className="derecha" />
        {(["dividida", "escribir", "previa"] as const).map((v) => (
          <button key={v} type="button" aria-pressed={vista === v} onClick={() => setVista(v)}>
            {v === "dividida" ? "Dividida" : v === "escribir" ? "Escribir" : "Vista previa"}
          </button>
        ))}
      </div>
      <div className={`a-editor-cuerpo ${vista !== "dividida" ? "una" : ""}`}>
        {vista !== "previa" && (
          <textarea
            id={id}
            ref={ref}
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={atajos}
            spellCheck
            lang="es"
            aria-label="Texto del artículo"
            placeholder={"Empieza a escribir…\n\n## Un título de sección\n\nUn párrafo con **negrita** y _cursiva_.\n\n- Una lista\n- De puntos"}
          />
        )}
        {vista !== "escribir" && (
          <div
            className="a-vista-previa"
            dangerouslySetInnerHTML={{
              __html: html || '<p style="color:#947e76">Aquí verás cómo queda el texto.</p>',
            }}
          />
        )}
      </div>
      <p className="a-ayuda" style={{ padding: "8px 12px", borderTop: "1px solid var(--a-borde)" }}>
        {palabras} palabras · {Math.max(1, Math.round(palabras / 220))} min de lectura · Deja una línea
        en blanco entre párrafos.
      </p>
      <SelectorMedios
        abierto={selector}
        onCerrar={() => setSelector(false)}
        onElegir={(a) => {
          setSelector(false);
          // requestAnimationFrame: el textarea debe recuperar el foco tras cerrar el diálogo.
          requestAnimationFrame(() => insertar(`![Describe aquí la imagen](${a.url})`));
        }}
      />
    </div>
  );
}

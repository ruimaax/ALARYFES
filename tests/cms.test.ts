import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { secciones, seccionPorId } from "../src/cms/secciones";
import { validarDocumento, type Campo } from "../src/cms/esquema";

const leer = (archivo: string) => JSON.parse(readFileSync(archivo, "utf8"));

test("every content file validates against its schema without changes", () => {
  for (const seccion of secciones) {
    const datos = leer(seccion.archivo);
    const resultado = validarDocumento(seccion.esquema, datos, datos);
    assert.deepEqual(resultado.errores, {}, seccion.id);
    assert.deepEqual(resultado.datos, datos, seccion.id);
  }
});

// Si alguien añade un texto a un JSON y olvida describirlo, /admin no podría
// editarlo: esta prueba lo detecta.
function sinDescribir(campo: Campo, valor: unknown, ruta: string): string[] {
  if (campo.tipo === "grupo" && valor && typeof valor === "object") {
    const claves = new Map(campo.campos.map((c) => [c.clave, c]));
    return Object.entries(valor).flatMap(([clave, hijo]) => {
      const descrito = claves.get(clave);
      return descrito
        ? sinDescribir(descrito, hijo, `${ruta}.${clave}`)
        : [`${ruta}.${clave}`];
    });
  }
  if (campo.tipo === "lista" && Array.isArray(valor))
    return valor.flatMap((v, i) => sinDescribir(campo.elemento, v, `${ruta}.${i}`));
  return [];
}
test("every key in content files is described by a schema", () => {
  for (const seccion of secciones)
    assert.deepEqual(
      sinDescribir(seccion.esquema, leer(seccion.archivo), seccion.id),
      [],
    );
});

test("read-only fields and fixed lists are protected", () => {
  const seccion = seccionPorId("planes")!;
  const datos = leer(seccion.archivo);
  const cambiado = structuredClone(datos);
  cambiado.planes[0].slug = "otro";
  cambiado.planes[0].lanzamiento.mensual = 120;
  const resultado = validarDocumento(seccion.esquema, cambiado, datos);
  assert.equal(resultado.ok, true);
  const planes = (resultado.datos as typeof datos).planes;
  assert.equal(planes[0].slug, "cimiento");
  assert.equal(planes[0].lanzamiento.mensual, 120);
  const sinPlan = { ...datos, planes: datos.planes.slice(1) };
  assert.equal(validarDocumento(seccion.esquema, sinPlan, datos).ok, false);
});

test("rejects dangerous links, foreign images and malformed values", () => {
  const nav = seccionPorId("navegacion")!;
  const datos = leer(nav.archivo);
  const malo = structuredClone(datos);
  malo.principal[0].href = "javascript:alert(1)";
  assert.ok(
    validarDocumento(nav.esquema, malo, datos).errores["principal.0.href"],
  );
  const ajustes = seccionPorId("ajustes")!;
  const base = leer(ajustes.archivo);
  for (const [ruta, valor] of [
    ["seo.imagenSocial", "../../etc/passwd"],
    ["empresa.email", "no-es-un-email"],
    ["empresa.whatsapp", "+34 600"],
    ["empresa.url", "https://alaryfes.com/"],
  ] as const) {
    const copia = structuredClone(base);
    const [grupo, clave] = ruta.split(".");
    copia[grupo][clave] = valor;
    assert.ok(validarDocumento(ajustes.esquema, copia, base).errores[ruta], ruta);
  }
  const precios = structuredClone(leer(seccionPorId("planes")!.archivo));
  precios.planes[1].normal.alta3 = "999";
  assert.equal(
    validarDocumento(seccionPorId("planes")!.esquema, precios, precios).ok,
    false,
  );
});

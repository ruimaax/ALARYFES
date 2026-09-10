import test from "node:test";
import assert from "node:assert/strict";
import { validateContact, forSpreadsheet } from "../src/lib/contact-validation";
const valid = {
  tipo: "contacto",
  nombre: "Prueba",
  negocio: "Negocio de prueba",
  telefono: "600000000",
  sector: "Estudio de arquitectura",
  plan: "cimiento",
  mensaje: "Prueba automatizada local",
  consentimiento: true,
  website: "",
};
test("requires consent, accepts any company type and rejects oversized content", () => {
  assert.equal(validateContact(valid).ok, true);
  for (const patch of [
    { consentimiento: false },
    { consentimiento: "true" },
    { telefono: "hola" },
    { plan: "inventado" },
    { sector: "" },
    { mensaje: "x".repeat(3001) },
    { tipo: "otro" },
  ])
    assert.equal(validateContact({ ...valid, ...patch }).ok, false);
});
test("referrals require a valid contact; honeypot is swallowed", () => {
  const referral = {
    ...valid,
    tipo: "recomendacion",
    referidoNegocio: "Empresa de prueba",
    referidoContacto: "test@example.test",
  };
  assert.equal(validateContact(referral).ok, true);
  assert.equal(
    validateContact({ ...referral, referidoContacto: "inválido" }).ok,
    false,
  );
  const spam = validateContact({ ...valid, mensaje: "", website: "spam" });
  assert.equal(spam.ok && spam.spam, true);
});
test("neutralizes spreadsheet formulas before sending a contact", () => {
  const result = validateContact({ ...valid, negocio: '=IMPORTXML("url")' });
  assert.ok(result.ok);
  assert.equal(forSpreadsheet(result.data).negocio, '\'=IMPORTXML("url")');
});

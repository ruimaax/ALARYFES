import test from "node:test";
import assert from "node:assert/strict";
import {
  aBase32,
  codigoTotp,
  deBase32,
  hashClave,
  pasoTotp,
  shaGit,
  verificarClave,
} from "../src/server/cripto";

test("TOTP matches the RFC 6238 reference vector and rejects wrong codes", async () => {
  const secreto = aBase32(new TextEncoder().encode("12345678901234567890"));
  assert.equal(secreto, "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  assert.deepEqual(deBase32(secreto), new TextEncoder().encode("12345678901234567890"));
  // RFC 6238, T = 59 s → 94287082 (8 cifras); con 6 cifras, 287082.
  assert.equal(await codigoTotp(secreto, 1), "287082");
  assert.equal(await pasoTotp(secreto, "287082", 59_000), 1);
  assert.equal(await pasoTotp(secreto, "287083", 59_000), null);
  assert.equal(await pasoTotp(secreto, "12ab56", 59_000), null);
});

test("passwords are salted and verified", async () => {
  const a = await hashClave("una clave larga de prueba");
  const b = await hashClave("una clave larga de prueba");
  assert.notEqual(a, b);
  assert.equal(await verificarClave("una clave larga de prueba", a), true);
  assert.equal(await verificarClave("una clave larga de prueba!", a), false);
  assert.equal(await verificarClave("x", "texto-sin-formato"), false);
});

test("git blob hashes match git hash-object", async () => {
  assert.equal(
    await shaGit(new TextEncoder().encode("hello\n")),
    "ce013625030ba8dba906f756967f9e9ca394464a",
  );
});

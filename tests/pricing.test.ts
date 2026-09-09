import test from "node:test";
import assert from "node:assert/strict";
import { enLanzamiento, planes, preciosDe } from "../src/data/planes";
test("switches prices exactly at midnight in Ceuta on 1 January 2027", () => {
  const before = new Date("2026-12-31T22:59:59.999Z");
  const after = new Date("2026-12-31T23:00:00.000Z");
  assert.equal(enLanzamiento(before), true);
  assert.equal(enLanzamiento(after), false);
  for (const plan of planes) {
    assert.deepEqual(preciosDe(plan, before), plan.lanzamiento);
    assert.deepEqual(preciosDe(plan, after), plan.normal);
    assert.equal(plan.lanzamiento.mensual, plan.normal.mensual);
    assert.ok(plan.normal.alta3 > plan.lanzamiento.alta3);
    assert.ok(plan.normal.alta12 > plan.lanzamiento.alta12);
  }
});
test("published plan data retains all supplied features and the Meta-only scope", () => {
  assert.deepEqual(
    planes.map((p) => p.incluye.length),
    [10, 7, 11, 11],
  );
  assert.match(
    planes[3].incluye.find((i) => i.includes("campañas"))!,
    /Meta \(Instagram y Facebook\)/,
  );
  assert.equal(
    planes[3].incluye.some((i) => i.includes("Meta y Google")),
    false,
  );
  assert.equal(planes[3].avisos.length, 3);
});

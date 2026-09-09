import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../src/app/api/contacto/route";
const valid = {
  tipo: "contacto",
  nombre: "Prueba",
  negocio: "Prueba automatizada",
  telefono: "600000000",
  sector: "otro",
  plan: "",
  mensaje: "No enviar, prueba local",
  consentimiento: true,
};
let ip = 0;
const req = (payload: unknown, extra: Record<string, string> = {}) =>
  new Request("http://localhost:3000/api/contacto", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": `test-${ip++}`,
      ...extra,
    },
    body: JSON.stringify(payload),
  });
test("rejects cross-origin requests and malformed payloads", async () => {
  assert.equal(
    (await POST(req(valid, { origin: "https://invalid.example" }))).status,
    403,
  );
  assert.equal(
    (await POST(req({ ...valid, consentimiento: false }))).status,
    422,
  );
  assert.equal(
    (await POST(req({ ...valid, mensaje: "x".repeat(17000) }))).status,
    413,
  );
  assert.equal(
    (await POST(req(valid, { "Content-Type": "text/plain" }))).status,
    415,
  );
});
test("returns an honest preparation status without webhook, and hides honeypot", async () => {
  const original = process.env.CONTACT_WEBHOOK_URL;
  delete process.env.CONTACT_WEBHOOK_URL;
  const info = console.info;
  let recorded = "";
  console.info = (value) => {
    recorded = value;
  };
  try {
    const response = await POST(req(valid));
    const body = await response.json();
    assert.equal(response.status, 202);
    assert.equal(body.status, "pending_configuration");
    assert.match(recorded, /contact.pending_configuration/);
    const spam = await POST(req({ ...valid, website: "bot" }));
    assert.equal(spam.status, 200);
  } finally {
    console.info = info;
    if (original) process.env.CONTACT_WEBHOOK_URL = original;
  }
});
test("handles webhook success and failure without claiming delivery on failure", async () => {
  const original = process.env.CONTACT_WEBHOOK_URL;
  const fetchOriginal = global.fetch;
  process.env.CONTACT_WEBHOOK_URL = "https://webhook.example.test";
  const error = console.error;
  console.error = () => {};
  try {
    global.fetch = async () => new Response("{}", { status: 200 });
    const success = await POST(req(valid));
    assert.equal((await success.json()).status, "received");
    global.fetch = async () => new Response("{}", { status: 500 });
    assert.equal((await POST(req(valid))).status, 502);
  } finally {
    global.fetch = fetchOriginal;
    console.error = error;
    if (original) process.env.CONTACT_WEBHOOK_URL = original;
    else delete process.env.CONTACT_WEBHOOK_URL;
  }
});

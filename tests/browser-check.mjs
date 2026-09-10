import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
const base = process.env.TEST_BASE_URL || "http://localhost:3001";
const routes = [
  "/",
  "/planes",
  "/planes/cimiento",
  "/planes/torre",
  "/planes/alcazaba",
  "/planes/medina",
  "/servicios",
  "/casos",
  "/sobre-nosotros",
  "/recomienda",
  "/blog",
  "/contacto",
  "/aviso-legal",
  "/politica-privacidad",
  "/politica-cookies",
];
await mkdir("test-results", { recursive: true });
const settle = async (page) => {
  await page.evaluate(async () => {
    const step = Math.max(innerHeight * 0.8, 200);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 120));
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );
  });
  // Nada animado puede quedarse invisible: si algo no llega a is-in, es un fallo real.
  await page.waitForFunction(
    () => !document.querySelector("[data-reveal]:not(.is-in)"),
    null,
    { timeout: 8000 },
  );
};
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const result = { routes: [], accessibility: [], interactions: [], errors: [] };
page.on("pageerror", (error) => result.errors.push(error.message));
try {
  for (const route of routes) {
    const response = await page.goto(base + route);
    assert.equal(response.status(), 200, route);
    assert.equal(await page.locator("h1").count(), 1, `${route}: one H1`);
    assert.ok((await page.title()).includes("ALARYFES"), route);
    assert.equal(
      new URL(await page.locator("link[rel=canonical]").getAttribute("href"))
        .href,
      new URL(route, "https://alaryfes.com").href,
    );
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      assert.equal(
        overflow,
        false,
        `${route} has horizontal overflow at ${width}px`,
      );
    }
    result.routes.push({
      route,
      status: response.status(),
      widths: [320, 375, 768, 1440],
    });
  }
  for (const route of [
    "/",
    "/planes",
    "/planes/medina",
    "/recomienda",
    "/contacto",
    "/politica-cookies",
  ]) {
    await page.goto(base + route);
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await settle(page);
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      result.accessibility.push({
        route,
        width,
        violations: audit.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/planes");
  const firstPlan = page.locator(".plan-column").first();
  await firstPlan.getByText("390", { exact: false }).waitFor();
  await page.getByText("3 meses", { exact: true }).click();
  assert.match(await firstPlan.innerText(), /590/);
  await page.getByText("12 meses", { exact: true }).click();
  assert.match(await firstPlan.innerText(), /390/);
  result.interactions.push("Commitment selector changes setup prices");
  await page.goto(base + "/planes/alcazaba");
  const href = await page
    .locator('a[href^="https://wa.me"]')
    .first()
    .getAttribute("href");
  assert.ok(
    decodeURIComponent(href).includes("Hola, me interesa el plan Alcazaba"),
  );
  result.interactions.push("Contextual WhatsApp destination and message");
  const question = page.locator(".faq-list summary").first();
  await question.click();
  assert.equal(
    await page.locator(".faq-list details").first().getAttribute("open"),
    "",
  );
  result.interactions.push("FAQ disclosure");
  await page.goto(base + "/contacto");
  await page.getByRole("button", { name: "Enviar mi consulta" }).click();
  await page
    .getByText(
      "Revisa los campos indicados y acepta la política de privacidad.",
    )
    .waitFor();
  await page.getByLabel("Tu nombre *", { exact: true }).fill("Prueba local");
  await page.getByLabel("Nombre de tu negocio *").fill("Negocio de prueba");
  await page.getByLabel("Teléfono *", { exact: true }).fill("600000000");
  await page
    .getByLabel("Tipo de empresa o proyecto *")
    .fill("Estudio de arquitectura");
  await page
    .getByLabel("¿Qué necesitas? *")
    .fill("Prueba de interfaz. No enviar.");
  await page.locator('input[name="consentimiento"]').check();
  let submitted;
  await page.route("**/api/contacto", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      json: {
        ok: true,
        status: "received",
        message: "Prueba recibida correctamente.",
      },
    });
  });
  await page.getByRole("button", { name: "Enviar mi consulta" }).click();
  await page.getByText("Prueba recibida correctamente.").waitFor();
  assert.equal(submitted.consentimiento, true);
  assert.equal(submitted.sector, "Estudio de arquitectura");
  assert.equal(
    await page.evaluate(() =>
      window.dataLayer.some((e) => e.event === "Contacto"),
    ),
    true,
  );
  result.interactions.push(
    "Contact validation, consent, controlled submission and conversion event",
  );
  await page.unroute("**/api/contacto");
  await page.goto(base + "/contacto?plan=medina");
  await page
    .locator("#contact-plan")
    .evaluate((e) => e.value === "medina" || Promise.reject(e.value));
  result.interactions.push("Plan preseleccionado desde la URL");
  await page.goto(base + "/recomienda");
  await page.getByLabel("Tu nombre *", { exact: true }).fill("Prueba local");
  await page.getByLabel("Nombre de tu negocio *").fill("Negocio de prueba");
  await page
    .getByLabel("Negocio que recomiendas *", { exact: true })
    .fill("Recomendado de prueba");
  await page
    .getByLabel("Teléfono o email de ese negocio *")
    .fill("test@example.test");
  await page.locator('input[name="consentimiento"]').check();
  await page.route("**/api/contacto", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 202,
      json: {
        ok: true,
        status: "pending_configuration",
        message: "Canal pendiente de configuración.",
      },
    });
  });
  await page.getByRole("button", { name: "Registrar recomendación" }).click();
  await page.getByText("Canal pendiente de configuración.").waitFor();
  assert.equal(submitted.tipo, "recomendacion");
  result.interactions.push(
    "Referral form and honest unconfigured endpoint state",
  );
  await page.unroute("**/api/contacto");
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto(base + "/");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page
    .locator("#mobile-nav")
    .getByRole("link", { name: "Planes", exact: true })
    .click();
  await page.waitForURL(base + "/planes");
  assert.equal(await page.locator("#mobile-nav").count(), 0);
  result.interactions.push("Mobile navigation opens, navigates and closes");
  await page.goto(base + "/");
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .locator(".skip-link")
      .evaluate((e) => e === document.activeElement),
    true,
  );
  result.interactions.push("Keyboard skip link receives visible focus");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base + "/planes");
  // Con movimiento reducido no se exige quietud absoluta, sino que nada se
  // desplace y que nada quede escondido esperando una animación.
  const quieto = await page.evaluate(() => {
    const desplazado = [...document.querySelectorAll(".pieza, [data-reveal], .plan-price-value")]
      .filter((e) => {
        const cs = getComputedStyle(e);
        return (
          (cs.transform !== "none" && cs.transform !== "matrix(1, 0, 0, 1, 0, 0)") ||
          Number(cs.opacity) < 1 ||
          parseFloat(cs.animationDuration) > 0.01
        );
      });
    return { desplazado: desplazado.length };
  });
  assert.equal(quieto.desplazado, 0, "movimiento reducido deja elementos animados u ocultos");
  result.interactions.push("Reduced motion keeps everything still and visible");
  for (const route of [
    "/planes/inexistente",
    "/sectores",
    "/blog/inexistente",
    "/pagina-inexistente",
  ])
    assert.equal((await page.goto(base + route)).status(), 404);
  assert.equal((await page.request.get(base + "/robots.txt")).status(), 200);
  assert.equal((await page.request.get(base + "/sitemap.xml")).status(), 200);
  await writeFile(
    "test-results/browser-report.json",
    JSON.stringify(result, null, 2),
  );
  const violations = result.accessibility.reduce(
    (n, a) => n + a.violations.length,
    0,
  );
  console.log(
    JSON.stringify(
      {
        routes: result.routes.length,
        responsiveChecks: result.routes.length * 4,
        accessibilityAudits: result.accessibility.length,
        violations,
        interactions: result.interactions,
        errors: result.errors,
      },
      null,
      2,
    ),
  );
  assert.equal(violations, 0, "Accessibility violations");
  assert.deepEqual(result.errors, []);
} finally {
  await writeFile(
    "test-results/browser-report.json",
    JSON.stringify(result, null, 2),
  );
  await browser.close();
}

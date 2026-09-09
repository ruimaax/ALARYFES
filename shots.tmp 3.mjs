import { chromium } from "@playwright/test";
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 });
await p.goto("http://127.0.0.1:3001/planes");
// fotogramas de la construcción, desde que el bloque entra en pantalla
for (const t of [180, 420, 700, 1100]) {
  await p.waitForTimeout(t === 180 ? 180 : 240);
  await p.locator(".plan-grid").screenshot({ path: `${process.argv[2]}/f-${t}.png` });
}
await p.waitForTimeout(1500);
console.log("animaciones vivas:", await p.evaluate(() =>
  [...new Set(document.getAnimations().map(a => a.animationName).filter(Boolean))]));
console.log("pasos trazados en home:", await (async () => 0)());
await b.close();

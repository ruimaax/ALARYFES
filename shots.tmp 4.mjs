import { chromium } from "@playwright/test";
const out = process.argv[2];
const b = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: out, size: { width: 1280, height: 800 } } });
const p = await ctx.newPage();
await p.goto("http://127.0.0.1:3001/");
await p.waitForTimeout(1800);
// recorrido suave por la home
await p.evaluate(async () => {
  const fin = document.body.scrollHeight - innerHeight;
  for (let y = 0; y <= fin; y += 9) { scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); }
});
await p.waitForTimeout(600);
await p.goto("http://127.0.0.1:3001/planes");
await p.waitForTimeout(2200);
await p.getByText("3 meses", { exact: true }).click();
await p.waitForTimeout(900);
await p.getByText("12 meses", { exact: true }).click();
await p.waitForTimeout(900);
await p.evaluate(async () => { for (let y = 0; y <= 1800; y += 9) { scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); } });
await p.waitForTimeout(800);
await ctx.close();
await b.close();

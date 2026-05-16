/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const root = process.cwd();
  const outputDir = path.join(root, "qa");
  const url = "http://127.0.0.1:3000";

  const executablePath = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].find((candidate) => fs.existsSync(candidate));

  if (!executablePath) {
    throw new Error("No local Chrome or Edge executable found for screenshots.");
  }

  const userDataDir = path.resolve(root, "..", ".cache", "browser-profiles", "namranta-screenshot");
  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath,
    headless: true,
    viewport: { width: 1440, height: 960 },
  });
  const contexts = [
    { name: "desktop-hero", viewport: { width: 1440, height: 960 }, scrollY: 0 },
    { name: "desktop-story", viewport: { width: 1440, height: 960 }, scrollY: 1350 },
    {
      name: "desktop-projects-flip",
      viewport: { width: 1440, height: 960 },
      scrollY: 3200,
      hover: ".project-card:first-child",
    },
    { name: "desktop-blog-papercut", viewport: { width: 1440, height: 960 }, scrollY: 4050 },
    { name: "desktop-menu", viewport: { width: 1440, height: 960 }, scrollY: 0, menu: true },
    { name: "desktop-dark-hero", viewport: { width: 1440, height: 960 }, scrollY: 0, dark: true },
    { name: "mobile-hero", viewport: { width: 390, height: 844 }, scrollY: 0 },
  ];

  for (const item of contexts) {
    const page = await context.newPage();
    await page.setViewportSize(item.viewport);
    await page.addInitScript(() => window.localStorage.removeItem("namranta-theme"));
    await page.goto(url, { waitUntil: "networkidle" });
    if (item.dark) {
      await page.getByRole("button", { name: /Dark|Light/ }).click();
    }
    if (item.menu) {
      await page.getByRole("button", { name: /Menu/ }).click();
    }
    await page.mouse.move(item.viewport.width * 0.66, item.viewport.height * 0.42);
    await page.waitForTimeout(2400);
    if (item.scrollY > 0) {
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), item.scrollY);
      await page.waitForTimeout(2200);
    }
    if (item.hover) {
      await page.hover(item.hover);
      await page.waitForTimeout(900);
    }
    await page.screenshot({
      path: path.join(outputDir, `${item.name}.png`),
      fullPage: false,
    });
    await page.close();
  }

  await context.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

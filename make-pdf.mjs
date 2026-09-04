/**
 * Renders slides.html to ABC-Tutoring-Findings.pdf.
 *
 *   python3 -m http.server 8765 &      # slides must be served, not file://
 *   npx puppeteer browsers install chrome
 *   npx --yes -p puppeteer node make-pdf.mjs
 */
import puppeteer from "puppeteer";

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto("http://localhost:8765/slides.html", { waitUntil: "networkidle0" });
await page.emulateMediaType("print");
await page.pdf({
  path: "ABC-Tutoring-Findings.pdf",
  format: "A4",
  landscape: true,
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  preferCSSPageSize: true
});
await browser.close();
console.log("ABC-Tutoring-Findings.pdf written");

import { chromium } from "playwright";
import fs from "fs";

const url = "https://www.google.com/maps/place/Innovación+Digital+JR+Tech/?hl=es";

async function scrape() {

const browser = await chromium.launch({
headless: true
});

const context = await browser.newContext({
locale: "es-ES",
userAgent:
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
});

const page = await context.newPage();

console.log("Abriendo Google Maps...");

await page.goto(url, { waitUntil: "domcontentloaded" });

await page.waitForTimeout(5000);

console.log("Abriendo panel de reseñas...");

await page.click('button[jsaction*="pane.reviewChart.moreReviews"]');

await page.waitForTimeout(5000);

console.log("Cargando reseñas...");

// Scroll inteligente para cargar muchas reseñas
const scrollContainer = await page.waitForSelector('.m6QErb[role="feed"]');

for (let i = 0; i < 40; i++) {

await scrollContainer.evaluate(el => el.scrollBy(0, 2000));

await page.waitForTimeout(1500);

}

console.log("Extrayendo reseñas...");

const reviews = await page.evaluate(() => {

const nodes = document.querySelectorAll(".jftiEf");

return Array.from(nodes).map(n => {

const name =
n.querySelector(".d4r55")?.innerText || "";

const text =
n.querySelector(".wiI7pd")?.innerText || "";

const ratingText =
n.querySelector(".kvMYJc")?.getAttribute("aria-label") || "";

const rating =
parseInt(ratingText);

const date =
n.querySelector(".rsqaWe")?.innerText || "";

return {
name,
text,
rating,
date
};

});

});

console.log("Reseñas encontradas:", reviews.length);

// Leer reseñas existentes
let existing = [];

if (fs.existsSync("reviews.json")) {

existing = JSON.parse(fs.readFileSync("reviews.json"));

}

// Crear índice para evitar duplicados
const existingTexts = new Set(existing.map(r => r.text));

const merged = [...existing];

reviews.forEach(r => {

if (r.text && !existingTexts.has(r.text)) {

merged.push(r);

}

});

// Guardar archivo
fs.writeFileSync(
"reviews.json",
JSON.stringify(merged, null, 2)
);

console.log("Total reseñas guardadas:", merged.length);

await browser.close();

}

scrape();
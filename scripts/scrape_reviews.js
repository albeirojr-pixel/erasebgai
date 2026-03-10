import { chromium } from "playwright";
import fs from "fs";

const url =
"https://www.google.com/maps/place/Innovación+Digital+JR+Tech/?hl=es";

async function scrape(){

const browser = await chromium.launch({
headless:true,
args:[
"--no-sandbox",
"--disable-blink-features=AutomationControlled"
]
});

const context = await browser.newContext({
locale:"es-ES",
userAgent:
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
});

const page = await context.newPage();

console.log("Abriendo Google Maps...");

await page.goto(url,{waitUntil:"domcontentloaded"});

await page.waitForTimeout(8000);

console.log("Intentando abrir reseñas...");

// intenta varios métodos

try{
await page.getByRole("tab",{name:/reseñas|reviews/i}).click();
}catch{

try{
await page.getByText(/reseñas|reviews/i).first().click();
}catch{

console.log("No se pudo abrir pestaña, intentando forzar panel...");

await page.evaluate(()=>{

const rating = document.querySelector('[aria-label*="estrella"]');

if(rating) rating.click();

});

}

}

await page.waitForTimeout(6000);

console.log("Buscando contenedor de reseñas...");

const scrollContainer = await page.waitForSelector(
'.m6QErb[role="feed"]',
{timeout:60000}
);

console.log("Cargando reseñas...");

let previousHeight = 0;

for(let i=0;i<150;i++){

const height = await scrollContainer.evaluate(
el=>el.scrollHeight
);

if(height===previousHeight){

console.log("No hay más reseñas");

break;

}

previousHeight = height;

await scrollContainer.evaluate(
el=>el.scrollBy(0,4000)
);

await page.waitForTimeout(2000);

}

console.log("Extrayendo reseñas...");

const reviews = await page.evaluate(()=>{

const nodes = document.querySelectorAll(".jftiEf");

return Array.from(nodes).map(n=>{

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

return{
name,
text,
rating,
date
};

});

});

console.log("Reseñas encontradas:",reviews.length);

let existing=[];

if(fs.existsSync("reviews.json")){
existing=JSON.parse(
fs.readFileSync("reviews.json")
);
}

const existingTexts =
new Set(existing.map(r=>r.text));

const merged=[...existing];

reviews.forEach(r=>{

if(r.text && !existingTexts.has(r.text)){
merged.push(r);
}

});

fs.writeFileSync(
"reviews.json",
JSON.stringify(merged,null,2)
);

console.log(
"Total reseñas guardadas:",
merged.length
);

await browser.close();

}

scrape();
import { chromium } from "playwright";
import fs from "fs";

const url = "https://www.google.com/maps/place/Innovación+Digital+JR+Tech/?hl=es";

async function scrape(){

const browser = await chromium.launch({headless:true});
const page = await browser.newPage({
locale: "es-ES"
});

await page.goto(url);

await page.waitForTimeout(5000);

await page.click('button[jsaction*="pane.reviewChart.moreReviews"]');

await page.waitForTimeout(5000);

for(let i=0;i<5;i++){
await page.mouse.wheel(0,3000);
await page.waitForTimeout(2000);
}

const reviews = await page.evaluate(()=>{

const nodes = document.querySelectorAll(".jftiEf");

return Array.from(nodes).map(n=>{

const name = n.querySelector(".d4r55")?.innerText;
const text = n.querySelector(".wiI7pd")?.innerText;
const rating = n.querySelector(".kvMYJc")?.getAttribute("aria-label");

return {
name,
text,
rating
};

});

});

let existing=[];

if(fs.existsSync("reviews.json")){
existing = JSON.parse(fs.readFileSync("reviews.json"));
}

const texts = new Set(existing.map(r=>r.text));

const merged = [...existing];

reviews.forEach(r=>{
if(r.text && !texts.has(r.text)){
merged.push(r);
}
});

fs.writeFileSync("reviews.json",JSON.stringify(merged,null,2));

console.log("Total reseñas:",merged.length);

await browser.close();

}

scrape();
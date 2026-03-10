import fs from "fs";

const PLACE_ID = "ChIJEWZx0nNnJI4RHQrl-9ZMgM4";
const API_KEY = process.env.GOOGLE_MAPS_KEY;

const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews&key=${API_KEY}`;

async function fetchReviews(){

const response = await fetch(url);
const data = await response.json();

if(!data.result || !data.result.reviews){
console.log("No se encontraron reseñas");
return;
}

const reviews = data.result.reviews.map(r => ({
name: r.author_name,
rating: r.rating,
text: r.text,
photo: r.profile_photo_url,
time: r.relative_time_description
}));

fs.writeFileSync("reviews.json", JSON.stringify(reviews,null,2));

console.log("Reseñas actualizadas");

}

fetchReviews();
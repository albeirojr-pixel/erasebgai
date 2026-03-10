import fs from "fs";

const reviews = [
{
name: "Cliente de Google",
rating: 5,
text: "Excelente asesoría para elegir mi computador.",
time: "Hace 1 mes"
},
{
name: "Cliente de Google",
rating: 5,
text: "Muy buena atención y asesoría por WhatsApp.",
time: "Hace 2 meses"
}
];

fs.writeFileSync("reviews.json", JSON.stringify(reviews,null,2));
import fs from "fs"

const html = fs.readFileSync("/tmp/ecoart.html", "utf8")

// Decode escaped next flight payloads
const raw = html.replace(/\\"/g, '"').replace(/\\n/g, "\n")

const names = [...raw.matchAll(/"name":"((?:Buffindia|Green Timekeeper|Eco-Friendly)[^"]+)"/g)].map((m) => m[1])
const prices = [...raw.matchAll(/"price":(\d+)/g)]
  .map((m) => Number(m[1]))
  .filter((n) => n >= 1000) // skip tiny ids, prices are in paise
  .map((n) => n / 100)
const compare = [...raw.matchAll(/"compareAtPrice":(\d+)/g)].map((m) => Number(m[1]) / 100)
const descriptions = [...raw.matchAll(/"description":"([^"]{10,500})"/g)].map((m) => m[1])
const categoryNames = [...new Set([...raw.matchAll(/"categoryName":"([^"]+)"/g)].map((m) => m[1]))]
const imageUrls = [
  ...new Set(
    [...raw.matchAll(/https:\/\/storage\.googleapis\.com\/takeapp\/media\/[a-z0-9]+\.(?:jpg|jpeg|png)/gi)].map(
      (m) => m[0],
    ),
  ),
]

// variant / option blocks
const optionBlocks = [...raw.matchAll(/"options":\[(.*?)\]/gs)].map((m) => m[1])

console.log(
  JSON.stringify(
    {
      productCount: names.length,
      names,
      prices,
      compare,
      descriptions: descriptions.slice(0, 15),
      categoryNames,
      imageUrls,
      optionSample: optionBlocks.slice(0, 3),
    },
    null,
    2,
  ),
)

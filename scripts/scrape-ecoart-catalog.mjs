/**
 * Scrape KraftReborn catalog from take.app category pages.
 * Usage: node scripts/scrape-ecoart-catalog.mjs > lib/ecoart-scraped.json
 */

const CATEGORIES = [
  {
    category: "single-product-delight",
    url: "https://take.app/ecoart/c/cm7rol2tl0002jj0369w97p2w",
  },
  {
    category: "elegant-combos",
    url: "https://take.app/ecoart/c/cm7roni5p000rl903lqycu6gq",
  },
]

const BANNER = "cm7sl6yki000503l2fupx6ztp"
const COLORS = ["Red", "Green", "Yellow", "Blue", "Mix"]

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function slugify(name) {
  return `ecoart-${name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 56)}`
}

function extractProductIds(html) {
  return [...new Set([...html.matchAll(/href="https:\/\/take\.app\/ecoart\/p\/([^"]+)"/g)].map((m) => m[1]))]
}

function extractPrices(html) {
  const prices = [...html.matchAll(/₹([0-9,]+)/g)].map((m) => Number(m[1].replace(/,/g, "")))
  return prices
}

async function fetchProduct(takeAppId, category) {
  const url = `https://ecoart.buffindia.com/p/${takeAppId}`
  const res = await fetch(url)
  const html = await res.text()

  const name = decodeHtml(
    html.match(/property="og:title" content="([^"]+)"/)?.[1] ||
      html.match(/<title>([^<|]+)/)?.[1]?.trim() ||
      takeAppId,
  )

  const priceMatch = html.match(/"price":(\d+)/)
  const compareMatch = html.match(/"compareAtPrice":(\d+)/)
  let price = priceMatch ? Number(priceMatch[1]) / 100 : 0
  let originalPrice = compareMatch ? Number(compareMatch[1]) / 100 : 1000

  if (!price) {
    const visible = extractPrices(html)
    if (visible.length) price = visible[0]
    if (visible.length > 1) originalPrice = visible[1]
  }

  const sourceImageUrls = [
    ...new Set(
      [...html.matchAll(/https:\/\/storage\.googleapis\.com\/takeapp\/media\/[a-z0-9]+\.(?:jpg|jpeg|png)/gi)]
        .map((m) => m[0])
        .filter((u) => !u.includes(BANNER)),
    ),
  ]

  // Try to extract description from page text snippets
  const decoded = html.replace(/\\"/g, '"').replace(/\\n/g, "\n")
  let description = ""
  const bodyPatterns = [
    /"body":"((?:\\.|[^"\\]){40,600})"/,
    /"description":"((?:\\.|[^"\\]){40,600})"/,
  ]
  for (const pat of bodyPatterns) {
    const m = decoded.match(pat)
    if (m) {
      description = m[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\*\*/g, "")
        .trim()
      if (description.length > 40 && !description.includes("{language}")) break
    }
  }

  const tagline = description.split(/[.!?\n]/).find((l) => l.trim().length > 8)?.trim() || name

  if (!description || description.includes("{language}")) {
    description = `${name} — handcrafted sustainable décor from recycled cigarette waste by KraftReborn.`
  }

  return {
    id: slugify(name),
    takeAppId,
    name,
    description,
    tagline: tagline.slice(0, 120),
    price,
    originalPrice: originalPrice > price ? originalPrice : 1000,
    category,
    buttsRescued: Math.max(40, Math.round(price / 2)),
    sourceImageUrls,
    availableColors: COLORS,
    allowsLogo: category === "elegant-combos",
    active: true,
    imageGradient: "from-stone-100 via-emerald-50 to-amber-50",
  }
}

async function main() {
  const products = []
  let sortOrder = 0

  for (const cat of CATEGORIES) {
    const res = await fetch(cat.url)
    const html = await res.text()
    const ids = extractProductIds(html)
    console.error(`Category ${cat.category}: ${ids.length} products`)

    for (const id of ids) {
      console.error(`  fetching ${id}`)
      const p = await fetchProduct(id, cat.category)
      p.sortOrder = sortOrder++
      products.push(p)
      await new Promise((r) => setTimeout(r, 250))
    }
  }

  console.log(JSON.stringify({ scrapedAt: new Date().toISOString(), products }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

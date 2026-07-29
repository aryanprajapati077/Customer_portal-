/**
 * Build lib/kraftreborn-products-data.json from Take App scrape + curated copy.
 * Usage: node scripts/build-ecoart-catalog.mjs && npm run migrate:ecoart
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const scrapedPath = process.argv[2] || "/tmp/ecoart-scraped.json"

const BANNER = "cm7sl6yki000503l2fupx6ztp"
const COLORS = ["Red", "Green", "Yellow", "Blue", "Mix"]

const NAME_BY_ID = {
  cm7slu18y0008la038jskkrpo: "Buffindia EcoTime - Sustainable Desk Clock",
  cm7sly8x10003ky03r3ogugpk: "Buffindia Harmony Oval Planter Set",
  cm7smcdkn001gjv03pdr9oozf: "Buffindia Serenity Round Planter Set",
  cm7smkv4c001dl203m0oz52u8: "Buffindia Deluxe Keyring Collection (Set of 25)",
  cm7smtvm00005jr03yn2u2b2m: "Lunar Glow Candle Stand with Tray",
  cm7sn1iob0001l50326dvap8w: "Petal Radiance Candle Stand with Tray",
  cm7sn8nxs0006l8032zrcft2t: "Test-tube Greenery Set",
  cm7so59310001l803ur6afe5t: "Classic Card Keeper",
  cm7sob6ej0003ju039abskq5h: "Prestige Pen Holder",
  cm7sp6mzc000nju03krbhwzxy: "Elegance Hexa Tray",
  cm7spbosu000cla033p86h3ch: "Buffindia Eco Frame - Sustainable Desk Photo frame",
  cm7svxihd0001ju03c34bj20o: "Buffindia Mobile Stand",
  cm7sph7ys000hju03hj4hdfar: "Buffindia EcoBloom Oval DIY Planter Kit",
  cm7spsbfv000el103jny0w1i1: "Green Timekeeper & Business Card Buddy",
  cm7sqj8mt000tlb03en73rga4: "Eco-Friendly Time & Photo Duo",
  cm7sqvtcc0004ju03ysm6ol6d: "Buffindia EcoSprout Round DIY Planter Kit",
  cm7sr2v200002jx03ovu1muxx: "Flourish & Organize Kit [DIY Planter Kit (Oval) and Visiting Card Holder]",
  cm7srgp1c000ci3039ml2d878: "Classic Pen & Card Holder",
  cm7sx7a4l0002ih03gi5nv1yi:
    "Sophisticated Office Trio (Pen Stand, Visiting Card Holder and Desk Photo Frame)",
  cm7sxuzt2001jkv031b4r4468: "Memoir Desk Duo (Desk Photo Frame and Visiting Card Holder)",
  cm7sy48px0007k003rvmqof90:
    "Moonlit Moments Kit [DIY Planter Kit (Oval), Moon Shape Candle Stand and Desk Photoframe]",
  cm7syovlz0001l4036qpikb77:
    "Moonlight Harmony Trio [DIY Planter Kit (Oval), Moon Shape Candle Stand and Desk Clock]",
  cm7sywn8m000cjm03921ipx26: "Petal Harmony Candle and Planter Kit (Oval Tray)",
  cm7sz3r45001zlh03xvmgfoia: "Green Memories Duo (Desk Photo Frame & Testtube Planter)",
  cm7szis0k000elb03aau44wat:
    "Moonlit Planter Ensemble [DIY Planter Kit (Oval) and Moon Shape Candle Stand]",
  cm7t01wr60003l7031kfth3oa:
    "Floral Harmony Kit [DIY Planter Kit (Oval), Flower Shape Candle Stand and Desk Photoframe]",
  cm7t08u87000ajo03rzild26e: "Green Time Harmony (Desk Clock & Testtube Planter)",
  cm7t0jff10003i8030a2fy8vy:
    "Flourish & Organize Kit [DIY Planter Kit (Round) and Visiting Card Holder]",
  cm7t0wucx000kii03b0umqi6y:
    "Petal Serenity Trio [DIY Planter Kit (Oval), Flower Shape Candle Stand and Desk Clock]",
}

const COPY_BY_ID = {
  cm7slu18y0008la038jskkrpo: {
    tagline: "Time with a Purpose",
    description:
      "Elevate your workspace with the KraftReborn Desk Clock, meticulously crafted from recycled cigarette waste. A sustainable statement piece for conscious professionals.",
  },
  cm7sly8x10003ky03r3ogugpk: {
    tagline: "Grow Green with Purpose",
    description:
      "Introducing the KraftReborn DIY Planter Kit with an Oval Tray — an eco-friendly and stylish way to bring nature indoors. Handcrafted from recycled cigarette waste.",
  },
  cm7smcdkn001gjv03pdr9oozf: {
    tagline: "Eco-Friendly Elegance",
    description:
      "Introducing the KraftReborn Planter with Round Tray — a sustainable and stylish addition to any space. Perfect for desks, shelves, and conscious gifting.",
  },
  cm7smkv4c001dl203m0oz52u8: {
    tagline: "Sustainable Style on the Go",
    description:
      "Introducing the KraftReborn Keyring Set — a unique and eco-friendly corporate gifting option. Set of 25 handcrafted keyrings from recycled cigarette waste.",
  },
  cm7smtvm00005jr03yn2u2b2m: {
    tagline: "Moonlit warmth, zero waste",
    description:
      "Illuminate your space with the Lunar Glow Candle Stand and Tray — moon-inspired sustainable décor handcrafted from recycled cigarette waste.",
  },
  cm7sn1iob0001l50326dvap8w: {
    tagline: "Petal-perfect ambiance",
    description:
      "The Petal Radiance Candle Stand with Tray blends floral elegance and circular craft — a beautiful sustainable accent for home or office.",
  },
  cm7sn8nxs0006l8032zrcft2t: {
    tagline: "Greenery meets circular craft",
    description:
      "The Test-tube Greenery Set brings minimalist planting to your desk — a sustainable kit crafted from upcycled cigarette waste.",
  },
  cm7so59310001l803ur6afe5t: {
    tagline: "Organised. Elegant. Eco.",
    description:
      "Classic Card Keeper — a compact visiting card holder handcrafted from rescued cigarette waste for a refined desk setup.",
  },
  cm7sob6ej0003ju039abskq5h: {
    tagline: "Desk essentials, sustainably made",
    description:
      "Prestige Pen Holder — keep your workspace tidy with this artisan pen stand made from recycled cigarette waste.",
  },
  cm7sp6mzc000nju03krbhwzxy: {
    tagline: "Hexagonal sustainable style",
    description:
      "Elegance Hexa Tray — a hexagonal catch-all tray for keys, cards, and daily essentials, crafted from circular craft materials.",
  },
  cm7spbosu000cla033p86h3ch: {
    tagline: "Frame memories, not plastic",
    description:
      "Buffindia Eco Frame — a sustainable desk photoframe handcrafted from recycled cigarette waste. Display memories with measurable impact.",
  },
  cm7svxihd0001ju03c34bj20o: {
    tagline: "Hands-free, waste-free",
    description:
      "Buffindia Mobile Stand — a sturdy desktop phone stand made from upcycled cigarette waste. Simple, sustainable, everyday useful.",
  },
  cm7sph7ys000hju03hj4hdfar: {
    tagline: "Grow Green with Style",
    description:
      "The KraftReborn DIY Planter Kit with an Oval Tray brings sustainability and elegance together. Ideal for corporate gifting and conscious home décor.",
  },
  cm7spsbfv000el103jny0w1i1: {
    tagline: "Timeless Elegance Meets Functionality",
    description:
      "KraftReborn Desk Clock with Visiting Card Holder — a perfect desk companion that blends sustainable craft with everyday utility.",
  },
  cm7sqj8mt000tlb03en73rga4: {
    tagline: "A Stylish Duo for Your Desk",
    description:
      "KraftReborn Desk Clock with Desk Photoframe — a harmonious blend of function and sentiment, handcrafted from recycled cigarette waste.",
  },
  cm7sqvtcc0004ju03ysm6ol6d: {
    tagline: "Cultivate Sustainability and Elegance",
    description:
      "The KraftReborn DIY Planter Kit with a Round Tray offers a beautiful way to grow. Sustainable, handmade, and gift-ready.",
  },
  cm7sr2v200002jx03ovu1muxx: {
    tagline: "Flourish & organise",
    description:
      "Flourish & Organize Kit combines an Oval DIY Planter Kit with a Visiting Card Holder — grow green while keeping your desk organised.",
  },
  cm7srgp1c000ci3039ml2d878: {
    tagline: "Classic desk duo",
    description:
      "Classic Pen & Card Holder set — essential desk organisers handcrafted from recycled cigarette waste for everyday corporate use.",
  },
  cm7sx7a4l0002ih03gi5nv1yi: {
    tagline: "Complete sustainable workspace",
    description:
      "Sophisticated Office Trio includes Pen Stand, Visiting Card Holder, and Desk Photo Frame — a premium circular craft set for executive desks.",
  },
  cm7sxuzt2001jkv031b4r4468: {
    tagline: "Memories & connections",
    description:
      "Memoir Desk Duo pairs a Desk Photo Frame with a Visiting Card Holder — thoughtful sustainable gifting for clients and teams.",
  },
  cm7sy48px0007k003rvmqof90: {
    tagline: "Moonlit desk moments",
    description:
      "Moonlit Moments Kit bundles an Oval DIY Planter, Moon Shape Candle Stand, and Desk Photoframe — ambience, greenery, and memories in one set.",
  },
  cm7syovlz0001l4036qpikb77: {
    tagline: "Harmony after dusk",
    description:
      "Moonlight Harmony Trio combines an Oval DIY Planter, Moon Shape Candle Stand, and Desk Clock — sustainable elegance for the modern workspace.",
  },
  cm7sywn8m000cjm03921ipx26: {
    tagline: "Petal glow & green growth",
    description:
      "Petal Harmony Candle and Planter Kit with Oval Tray — floral candle stand meets DIY planter in one conscious craft combo.",
  },
  cm7sz3r45001zlh03xvmgfoia: {
    tagline: "Green memories on your desk",
    description:
      "Green Memories Duo pairs a Desk Photo Frame with a Test-tube Planter — display what matters while growing something green.",
  },
  cm7szis0k000elb03aau44wat: {
    tagline: "Moonlit planter ensemble",
    description:
      "Moonlit Planter Ensemble includes an Oval DIY Planter Kit and Moon Shape Candle Stand — cultivate calm, circular living.",
  },
  cm7t01wr60003l7031kfth3oa: {
    tagline: "Floral desk harmony",
    description:
      "Floral Harmony Kit bundles an Oval DIY Planter, Flower Shape Candle Stand, and Desk Photoframe — a blooming sustainable desk collection.",
  },
  cm7t08u87000ajo03rzild26e: {
    tagline: "Time & greenery united",
    description:
      "Green Time Harmony combines a Desk Clock with a Test-tube Planter — track time while nurturing desk greenery, all from rescued materials.",
  },
  cm7t0jff10003i8030a2fy8vy: {
    tagline: "Round tray, organised desk",
    description:
      "Flourish & Organize Kit with Round DIY Planter and Visiting Card Holder — sustainable organisation with a touch of green.",
  },
  cm7t0wucx000kii03b0umqi6y: {
    tagline: "Petal serenity for your desk",
    description:
      "Petal Serenity Trio includes an Oval DIY Planter, Flower Shape Candle Stand, and Desk Clock — a complete conscious workspace upgrade.",
  },
}

const PRICE_BY_ID = {
  cm7sqj8mt000tlb03en73rga4: { price: 1300, originalPrice: 1500 },
  cm7sx7a4l0002ih03gi5nv1yi: { price: 1000, originalPrice: 2000 },
  cm7sy48px0007k003rvmqof90: { price: 1200, originalPrice: 2000 },
  cm7syovlz0001l4036qpikb77: { price: 1300, originalPrice: 1500 },
  cm7sz3r45001zlh03xvmgfoia: { price: 900, originalPrice: 1500 },
  cm7t01wr60003l7031kfth3oa: { price: 1200, originalPrice: 1500 },
  cm7t08u87000ajo03rzild26e: { price: 1000, originalPrice: 1500 },
  cm7t0wucx000kii03b0umqi6y: { price: 1400, originalPrice: 1500 },
}

function slugify(name) {
  return `ecoart-${name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 56)}`
}

function withoutBanner(urls) {
  return urls.filter((u) => !u.includes(BANNER))
}

const scraped = JSON.parse(fs.readFileSync(scrapedPath, "utf8"))
const products = scraped.products.map((p) => {
  const name = NAME_BY_ID[p.takeAppId] || p.name
  const copy = COPY_BY_ID[p.takeAppId] || {
    tagline: name.split(/[-–[\(]/)[0].trim(),
    description: `${name} — handcrafted sustainable décor from recycled cigarette waste by KraftReborn.`,
  }
  const prices = PRICE_BY_ID[p.takeAppId] || { price: p.price, originalPrice: p.originalPrice }
  const category = p.category
  return {
    id: slugify(name),
    takeAppId: p.takeAppId,
    name,
    description: copy.description,
    tagline: copy.tagline,
    price: prices.price,
    originalPrice: prices.originalPrice,
    category,
    buttsRescued: Math.max(40, Math.round(prices.price / 2)),
    sourceImageUrls: withoutBanner(p.sourceImageUrls),
    availableColors: COLORS,
    allowsLogo: category === "elegant-combos" || p.takeAppId === "cm7smkv4c001dl203m0oz52u8",
    active: true,
    sortOrder: p.sortOrder,
    imageGradient: p.imageGradient || "from-stone-100 via-emerald-50 to-amber-50",
  }
})

const outPath = path.join(__dirname, "../lib/kraftreborn-products-data.json")
fs.writeFileSync(outPath, JSON.stringify({ updatedAt: new Date().toISOString(), products }, null, 2))
console.error(`Wrote ${products.length} products → ${outPath}`)

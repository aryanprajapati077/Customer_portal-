import React from "react"
import path from "path"
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import { comparisonRecommendation, computeMulti, computePreService, fmtKg, fmtWater, inr, preDate, type PreServiceConfig } from "@/lib/preservice"
import { COLS, LAYOUT, textWidth, type TableLayout } from "@/lib/preservice-multi-layout"

const font = (f: string) => path.join(process.cwd(), "public", "fonts", f)
const img = (f: string) => path.join(process.cwd(), "public", "quotation-assets", "preservice", f)

let ready = false
function registerFonts() {
  if (ready) return
  Font.register({
    family: "Poppins",
    fonts: [
      { src: font("Poppins-Regular.ttf"), fontWeight: 400 },
      { src: font("Poppins-Medium.ttf"), fontWeight: 500 },
      { src: font("Poppins-Bold.ttf"), fontWeight: 700 },
    ],
  })
  Font.register({ family: "Lora", src: font("Lora-Subset.ttf") })
  Font.registerHyphenationCallback((w) => [w])
  ready = true
}

const GREEN = "#14532d"
const INK = "#1b1d2a"
const ORANGE = "#f26a1b"
const W = 595.28
const H = 841.89

const st = StyleSheet.create({
  page: { width: W, height: H, position: "relative" },
  bg: { position: "absolute", top: 0, left: 0, width: W, height: H },
})

type Opts = { size: number; color: string; weight?: 400 | 500 | 700; align?: "left" | "center" }

/** Text box whose line box matches the sample's text bbox. `x` is the left edge (left) or the centre (center). */
function T({ children, x, y, size, color, weight = 400, align = "left", w = 300, family = "Poppins" }: Opts & { children: string; x: number; y: number; w?: number; family?: string }) {
  const left = align === "center" ? x - w / 2 : x
  return (
    <Text
      style={{
        position: "absolute", top: y, left, width: w, textAlign: align,
        fontFamily: family, fontSize: size, color, fontWeight: weight, lineHeight: 1.4,
      }}
      wrap={false}
    >
      {children}
    </Text>
  )
}

/** Shrink font for long strings so they stay inside `chars` characters of width. */
const fit = (text: string, base: number, chars: number) => {
  // Uppercase letters are ~25% wider, so weight them more when estimating width.
  const len = Array.from(text).reduce((n, ch) => n + (ch !== ch.toLowerCase() ? 1.25 : 1), 0)
  return len > chars ? Math.max(base * (chars / len), base * 0.5) : base
}

function Logo({ x, y, w = 138 }: { x: number; y: number; w?: number }) {
  return <Image src={img("logo.png")} style={{ position: "absolute", left: x, top: y, width: w, height: (w * 196) / 600 }} />
}

function SingleDoc({ c }: { c: PreServiceConfig }) {
  registerFonts()
  const m = computePreService(c)
  const dash = (n: number | null, f: (v: number) => string = inr) => (n == null ? "—" : f(n))

  return (
    <Document title={`Pre-Service Proposal - ${c.name}`} author="Buffindia Receptacles Private Limited">
      {/* 1 — Cover */}
      <Page size={[W, H]} style={{ padding: 0 }}>
        <View style={st.page}>
        <Image src={img("bg1.jpg")} style={st.bg} />
        <Logo x={37} y={34} w={156} />
        {c.customerLogo ? (
          <View style={{ position: "absolute", left: 387, top: 25, width: 174, height: 66, backgroundColor: "#ffffff", borderRadius: 10, borderWidth: 1, borderColor: "#c9ccd1", alignItems: "center", justifyContent: "center", padding: 6 }}>
            <Image src={c.customerLogo} style={{ width: 160, height: 52, objectFit: "contain" }} />
          </View>
        ) : null}
        <T x={43} y={371} size={fit(c.name, 22, 24)} color={GREEN} weight={700} w={330}>{c.name}</T>
        <T x={82} y={440} size={fit(c.name, 16.1, 30)} color={INK} w={300}>{c.name}</T>
        <T x={82} y={498} size={fit(c.address, 16.1, 30)} color={INK} w={300}>{c.address || c.city}</T>
        <T x={92} y={630} size={15.5} color={INK} w={140}>{preDate(c.surveyDate)}</T>
        <T x={294} y={630} size={15.5} color={INK} w={140}>{preDate(c.proposalDate)}</T>
        <T x={481} y={630} size={15.5} color={INK} w={100}>{c.locations === 1 ? "1 (Single)" : String(c.locations)}</T>
        <T x={452} y={792} size={11.2} color={GREEN} weight={500} w={110}>{c.refNo}</T>
        </View>
      </Page>

      {/* 2 — Site survey */}
      <Page size={[W, H]} style={{ padding: 0 }}>
        <View style={st.page}>
        <Image src={img("bg2.jpg")} style={st.bg} />
        <Logo x={30} y={18} />
        <T x={336} y={223} size={fit(c.name, 16.1, 26)} color={INK} w={230}>{c.name}</T>
        <T x={147} y={297} size={25.8} color={ORANGE} weight={500} w={130} align="center">{dash(c.occupancy)}</T>
        <T x={332} y={297} size={25.8} color={ORANGE} weight={500} w={110} align="center">{dash(m.smokers)}</T>
        <T x={501} y={297} size={25.8} color={ORANGE} weight={500} w={80} align="center">{dash(c.zones)}</T>
        <T x={202} y={518} size={37.4} color={ORANGE} weight={500} w={90} align="center">{m.showBasic ? dash(c.basicUnits) : "—"}</T>
        <T x={494} y={518} size={37.4} color={ORANGE} weight={500} w={90} align="center">{m.showAdvance ? dash(c.advanceUnits) : "—"}</T>
        </View>
      </Page>

      {/* 3 — Impact */}
      <Page size={[W, H]} style={{ padding: 0 }}>
        <View style={st.page}>
        <Image src={img("bg3.jpg")} style={st.bg} />
        <Logo x={30} y={18} />
        <T x={330} y={172} size={17.4} color={GREEN} weight={500} w={200} align="center">{c.locations === 1 ? "Single Location" : `${c.locations} Locations`}</T>
        <T x={98} y={334} size={25.8} color={INK} weight={500} w={120} align="center">{dash(m.butts)}</T>
        <T x={239.5} y={334} size={25.8} color={INK} weight={500} w={110} align="center">{fmtKg(m.wasteKg)}</T>
        <T x={366} y={334} size={25.8} color={INK} weight={500} w={110} align="center">{fmtKg(m.microKg)}</T>
        <T x={503} y={337} size={fit(fmtWater(m.waterL), 22.4, 12)} color={INK} weight={500} w={150} align="center">{fmtWater(m.waterL)}</T>
        </View>
      </Page>

      {/* 4 — Annual commercials */}
      <Page size={[W, H]} style={{ padding: 0 }}>
        <View style={st.page}>
        <Image src={img("bg4.jpg")} style={st.bg} />
        <Logo x={29} y={20} w={129} />
        <T x={125} y={216} size={fit(c.name, 17.4, 20)} color={INK} weight={500} w={200}>{c.name}</T>
        <T x={417} y={216} size={fit(c.city, 17.4, 14)} color={INK} weight={500} w={130}>{c.city}</T>
        <T x={224} y={374} size={19.3} color={GREEN} weight={500} w={110} align="center">{m.showBasic && c.basicUnits != null ? `${c.basicUnits} Units` : "—"}</T>
        <T x={234} y={440} size={25.8} color={GREEN} weight={700} w={130} align="center">{m.showBasic && c.basicPrice != null ? `₹${inr(c.basicPrice)}` : "—"}</T>
        <T x={507} y={374} size={19.3} color={GREEN} weight={500} w={110} align="center">{m.showAdvance && c.advanceUnits != null ? `${c.advanceUnits} Units` : "—"}</T>
        <T x={518} y={440} size={25.8} color={GREEN} weight={700} w={130} align="center">{m.showAdvance && c.advancePrice != null ? `₹${inr(c.advancePrice)}` : "—"}</T>
        <T x={377} y={685} size={18.7} color={GREEN} weight={700} w={200}>Complimentary</T>
        <T x={377} y={710} size={14.9} color={GREEN} weight={700} w={200}>Kraft Reborn Products</T>
        </View>
      </Page>

      {/* 5 — Basic vs Advance comparison */}
      {comparison(c)}

      {/* Static pages */}
      {["static5.jpg", "static6.jpg", "static7.jpg"].map((f) => (
        <Page key={f} size={[W, H]} style={{ padding: 0 }}>
        <View style={st.page}>
          <Image src={img(f)} style={st.bg} />
          </View>
      </Page>
      ))}
    </Document>
  )
}

// ───────────────────────── Basic vs Advance comparison ─────────────────────────

const kioskImg = (f: string) => path.join(process.cwd(), "public", "quotation-assets", f)
const CARD_BG = "#f2f3f1"
const DARK = "#1c2b2a"
const MUTED = "#5f6470"
const SOFT_GREEN = "#e7f1e2"
const LEAF = "#6a9a3a"

/** Feature, Basic, Advance — edit here to change the comparison table. */
const COMPARE: [string, string, string][] = [
  ["Design", "Functional, standard format", "Premium, contemporary format"],
  ["Waste capacity", "Approx. 2,000 butts", "Approx. 8,000 butts"],
  ["Capacity advantage", "Moderate holding capacity", "About 4x Basic capacity"],
  ["Emptying frequency", "More frequent checks", "Potentially fewer emptying cycles"],
  ["Housekeeping", "Routine emptying", "Reduced emptying frequency"],
  ["Branding visibility", "Standard signage / branding", "Prominent front branding"],
  ["Awareness messaging", "Standard awareness display", "High-visibility messaging"],
  ["Ideal placement", "Outdoor smoking zones", "Premium / semi-outdoor zones"],
  ["Usage intensity", "Moderate footfall", "Moderate to high footfall"],
  ["Deployment", "Compact, flexible setup", "Planned premium installation"],
  ["Commercial positioning", "Cost-conscious option", "Premium infrastructure option"],
  ["Collection & recycling", "Included in service", "Included in service"],
  ["Environmental reporting", "Included in service", "Included in service"],
]

function ComparisonPage({ c, rec }: { c: PreServiceConfig; rec: { basic: number; advance: number } }) {
  const L = 36
  const CW = W - 2 * L
  const two = (n: number) => String(n).padStart(2, "0")
  const kiosks = [
    { name: "BASIC KIOSK", label: "Basic", tag: "Efficient & economical", file: "kiosk-basic.jpg", img: { width: 104, height: 138 }, n: rec.basic },
    { name: "ADVANCE KIOSK", label: "Advance", tag: "Premium & high-capacity", file: "kiosk-advance.jpg", img: { width: 78, height: 138 }, n: rec.advance },
  ]
  const recs = kiosks.filter((k) => k.n > 0)
  const col = [CW * 0.36, CW * 0.31, CW * 0.33]
  const P = (size: number, color = INK, weight: 400 | 500 | 700 = 400) => ({ fontFamily: "Poppins", fontSize: size, color, fontWeight: weight })
  return (
    <Page size={[W, H]} style={{ padding: 0 }}>
      <View style={st.page}>
        <Image src={img("header-strip.jpg")} style={{ position: "absolute", top: 0, left: 0, width: W, height: (W * 250) / 1848 }} />
        <Logo x={30} y={18} />
        <View style={{ position: "absolute", top: 92, left: L, width: CW }}>
          <Text style={P(24, GREEN, 700)}>Basic vs Advance Kiosk</Text>
          <View style={{ width: 66, height: 3, borderRadius: 2, backgroundColor: ORANGE, marginTop: 6 }} />

          {recs.length > 0 && (
            <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", backgroundColor: SOFT_GREEN, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 14 }}>
              <View style={{ width: 150 }}>
                <Text style={P(7.5, LEAF, 700)}>OUR RECOMMENDATION</Text>
                <Text style={{ ...P(fit(c.name || "your site", 10, 26), GREEN, 700), marginTop: 1 }}>{`For ${c.name || "your site"}`}</Text>
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                {recs.map((k, i) => (
                  <React.Fragment key={k.label}>
                    {i > 0 && (
                      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", marginHorizontal: 14 }}>
                        <Text style={P(8.5, GREEN, 700)}>OR</Text>
                      </View>
                    )}
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={P(24, ORANGE, 700)}>{two(k.n)}</Text>
                      <Text style={{ ...P(11, DARK, 500), marginLeft: 6 }}>{`${k.label} ${k.n === 1 ? "Kiosk" : "Kiosks"}`}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          )}

          <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }}>
            {kiosks.map((k) => (
              <View key={k.name} style={{ flex: 1, flexDirection: "row", backgroundColor: CARD_BG, borderRadius: 10, padding: 12, height: 162 }}>
                <View style={{ flex: 1 }}>
                  <Text style={P(13, ORANGE, 700)}>{k.name}</Text>
                  <Text style={{ ...P(8.5, MUTED), marginTop: 2 }}>{k.tag}</Text>
                  {k.n > 0 && (
                    <View style={{ marginTop: "auto" }}>
                      <Text style={P(7.5, MUTED, 500)}>Recommended</Text>
                      <Text style={P(20, GREEN, 700)}>
                        {two(k.n)}
                        <Text style={P(10, GREEN, 500)}>{k.n === 1 ? " Unit" : " Units"}</Text>
                      </Text>
                    </View>
                  )}
                </View>
                <Image src={kioskImg(k.file)} style={{ ...k.img, objectFit: "cover", borderRadius: 4 }} />
              </View>
            ))}
          </View>

          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: "row", backgroundColor: DARK, borderRadius: 6, height: 25, alignItems: "center" }}>
              {["COMPARISON", "BASIC", "ADVANCE"].map((h, i) => (
                <Text key={h} style={{ ...P(9, "#ffffff", 700), width: col[i], paddingLeft: 12 }}>{h}</Text>
              ))}
            </View>
            {COMPARE.map(([f, b, a], r) => (
              <View key={f} style={{ flexDirection: "row", alignItems: "center", height: 20.5, backgroundColor: r % 2 === 0 ? CARD_BG : "#ffffff" }}>
                <Text style={{ ...P(8.5, DARK, 700), width: col[0], paddingLeft: 12 }}>{f}</Text>
                <Text style={{ ...P(8.3, MUTED), width: col[1], paddingLeft: 12 }}>{b}</Text>
                <Text style={{ ...P(8.3, DARK), width: col[2], paddingLeft: 12 }}>{a}</Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 12, backgroundColor: SOFT_GREEN, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12 }}>
            <Text style={P(9.5, LEAF, 700)}>WHY CONSIDER ADVANCE?</Text>
            <Text style={{ ...P(9, DARK), marginTop: 3 }}>Greater capacity   |   Fewer emptying cycles   |   Premium corporate presentation</Text>
          </View>

          <Text style={{ ...P(7.8, MUTED), marginTop: 9, lineHeight: 1.45 }}>
            {"Both options support Buffindia's end-to-end cigarette waste management service.\nCapacity figures are approximate; actual emptying needs depend on site usage."}
          </Text>
        </View>
        <View style={{ position: "absolute", left: 0, bottom: 0, width: W, height: 9, backgroundColor: GREEN }} />
      </View>
    </Page>
  )
}

const comparison = (c: PreServiceConfig) => (c.showComparison ? <ComparisonPage c={c} rec={comparisonRecommendation(c)} /> : null)

// ───────────────────────── Multi-location ─────────────────────────
// Table pages replay the sample PDFs for 2–12 locations: each count has its own background (with the
// banner / notes positioned exactly as in the sample) and its own row height and font sizes.

const LINE = "#c6d4bf"
const ZEBRA = "#e8f3e3"
const TOTAL_BG = "#e3f0dc"
const EXTRA_W = 0.68
const YELLOW = "#ffe34d"
const NAME_LH = 1.12

/** Font size that keeps `text` on one line within `w`. */
const fitW = (text: string, size: number, w: number, bold = false) => {
  const tw = textWidth(text, size, bold)
  return tw <= w ? size : Math.max((size * w) / tw, size * 0.5)
}

/** Lay out a name the way the samples do: one line if it (nearly) fits, else two balanced lines, else shrink. */
function fitName(text: string, size: number, w: number, h: number): { text: string; size: number } {
  const one = textWidth(text, size)
  if (one <= w) return { text, size }
  if (one * 0.9 <= w) return { text, size: (size * w) / one }
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length > 1) {
    let best = { a: "", b: "", m: Infinity }
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" ")
      const b = words.slice(i).join(" ")
      const m = Math.max(textWidth(a, size), textWidth(b, size))
      if (m < best.m) best = { a, b, m }
    }
    const s2 = best.m <= w ? size : Math.max((size * w) / best.m, size * 0.6)
    const s2h = Math.min(s2, (h - 2) / (2 * NAME_LH))
    if (s2h >= size * 0.6) return { text: `${best.a}\n${best.b}`, size: s2h }
  }
  return { text, size: Math.max((size * w) / one, size * 0.5) }
}

function Cell({ x0, x1, y, h, children, size, color = INK, weight = 400, align = "center", pad = 0, lineHeight = 1.15 }: {
  x0: number; x1: number; y: number; h: number; children: React.ReactNode; size: number; color?: string; weight?: 400 | 500 | 700; align?: "center" | "left"; pad?: number; lineHeight?: number
}) {
  return (
    <View style={{ position: "absolute", left: x0, top: y, width: x1 - x0, height: h, justifyContent: "center", paddingLeft: align === "left" ? pad : 0 }}>
      <Text style={{ fontFamily: "Poppins", fontSize: size, color, fontWeight: weight, textAlign: align, lineHeight }}>{children}</Text>
    </View>
  )
}

/** Numeric cell, shrunk to fit its column. */
function Num({ xs, c, y, h, size, text, color = INK, bold = false }: { xs: number[]; c: number; y: number; h: number; size: number; text: string; color?: string; bold?: boolean }) {
  return <Cell x0={xs[c]} x1={xs[c + 1]} y={y} h={h} size={fitW(text, size, xs[c + 1] - xs[c] - 6, bold)} color={color} weight={bold ? 700 : 400}>{text}</Cell>
}

/** Left-aligned text cell (name / city). */
function Txt({ xs, c, y, h, size, pad, text }: { xs: number[]; c: number; y: number; h: number; size: number; pad: number; text: string }) {
  const f = fitName(text, size, xs[c + 1] - xs[c] - pad - 3, h)
  return <Cell x0={xs[c]} x1={xs[c + 1]} y={y} h={h} size={f.size} align="left" pad={pad} lineHeight={NAME_LH}>{f.text}</Cell>
}

/** Zebra rows + column rules for a table body. */
function Grid({ xs, y0, rowH, n, hLines = false, shade }: { xs: number[]; y0: number; rowH: number; n: number; hLines?: boolean; shade?: { x0: number; x1: number; color: string } }) {
  const left = xs[0]
  const right = xs[xs.length - 1]
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <View key={i} style={{ position: "absolute", left, top: y0 + i * rowH, width: right - left, height: rowH, backgroundColor: hLines || i % 2 === 0 ? "#ffffff" : ZEBRA, borderBottomWidth: hLines ? EXTRA_W : 0, borderBottomColor: LINE }}>
          {shade ? <View style={{ position: "absolute", left: shade.x0 - left, top: 0, width: shade.x1 - shade.x0, height: rowH, backgroundColor: shade.color }} /> : null}
        </View>
      ))}
      {xs.map((x, i) => (
        <View key={i} style={{ position: "absolute", left: x - EXTRA_W / 2, top: y0, width: EXTRA_W, height: n * rowH, backgroundColor: LINE }} />
      ))}
    </>
  )
}

const chunk = <A,>(a: A[], n: number): A[][] => {
  const out: A[][] = []
  for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n))
  return out.length ? out : [[]]
}

type TablePage<R> = { L: TableLayout; rows: R[]; total: boolean }

/** Split rows over pages using the sample layout that matches each page's row count. */
function paginate<R>(rows: R[], kind: "p3" | "p5" | "p7"): TablePage<R>[] {
  const per = kind === "p7" ? 11 : 12
  const at = (k: number) => LAYOUT[kind][Math.min(Math.max(k, 2), 12)]
  if (rows.length <= per) return [{ L: at(rows.length), rows, total: true }]
  const parts = chunk(rows, per)
  return parts.map((part, i) => {
    const last = i === parts.length - 1
    if (!last) return { L: kind === "p7" ? LAYOUT.p7[12] : at(12), rows: part, total: false }
    return { L: kind === "p7" && part.length === 1 ? LAYOUT.p7c[12] : at(part.length), rows: part, total: true }
  })
}

function MultiDoc({ c }: { c: PreServiceConfig }) {
  const m = computeMulti(c)
  const n = m.sites
  const rows = m.rows.map((r, i) => ({ ...r, i }))
  const locLabel = `${n} ${n === 1 ? "Location" : "Locations"}`
  const period = c.surveyDate === c.surveyDateTo ? preDate(c.surveyDate) : `${preDate(c.surveyDate)} - ${preDate(c.surveyDateTo)}`
  const kg = fmtKg
  const X3 = COLS.p3
  const X5 = COLS.p5
  const X7 = COLS.p7

  const bgPage = (key: string, file: string, body: React.ReactNode) => (
    <Page key={key} size={[W, H]} style={{ padding: 0 }}>
      <View style={st.page}>
        <Image src={img(file)} style={st.bg} />
        {body}
      </View>
    </Page>
  )

  return (
    <Document title={`Pre-Service Proposal (Multi-location) - ${c.name}`} author="Buffindia Receptacles Private Limited">
      {/* 1 — Cover */}
      {bgPage("p1", "ml1.jpg", (
        <>
          <Logo x={35} y={29} w={152} />
          {c.customerLogo ? (
            <View style={{ position: "absolute", left: 387, top: 25, width: 174, height: 66, backgroundColor: "#ffffff", borderRadius: 10, borderWidth: 1, borderColor: "#c9ccd1", alignItems: "center", justifyContent: "center", padding: 6 }}>
              <Image src={c.customerLogo} style={{ width: 160, height: 52, objectFit: "contain" }} />
            </View>
          ) : null}
          <T x={41} y={376} size={fit(c.name, 22.3, 24)} color={GREEN} weight={700} w={330}>{c.name}</T>
          <T x={83} y={459} size={fit(c.address || c.city, 15.8, 30)} color={INK} w={300}>{c.address || c.city}</T>
          <T x={90} y={634} size={fitW(period, 10.4, 168)} color={INK} w={175}>{period}</T>
          <T x={326} y={632} size={14.1} color={INK} w={130}>{preDate(c.proposalDate)}</T>
          <T x={495} y={632} size={14.1} color={INK} w={80}>{`${n} ${n === 1 ? "Site" : "Sites"}`}</T>
          <T x={452} y={791} size={11.4} color={GREEN} weight={500} w={110}>{c.refNo}</T>
        </>
      ))}

      {/* 2 — Consolidated survey */}
      {bgPage("p2", "ml2.jpg", (
        <>
          <Logo x={30} y={17} w={130} />
          <T x={79} y={271} size={24.8} color={ORANGE} weight={500} w={90} align="center">{String(n)}</T>
          <T x={239.5} y={271} size={fitW(inr(m.occupancy), 24.8, 100)} color={ORANGE} weight={500} w={110} align="center">{inr(m.occupancy)}</T>
          <T x={382} y={271} size={fitW(inr(m.smokers), 24.8, 90)} color={ORANGE} weight={500} w={100} align="center">{inr(m.smokers)}</T>
          <T x={504.5} y={271} size={24.8} color={ORANGE} weight={500} w={70} align="center">{inr(m.zones)}</T>
          <T x={207} y={497} size={37.2} color={ORANGE} weight={500} w={100} align="center">{String(m.basic)}</T>
          <T x={490.3} y={497} size={37.2} color={ORANGE} weight={500} w={100} align="center">{String(m.adv)}</T>
        </>
      ))}

      {/* 3 — Location-wise kiosk recommendation */}
      {paginate(rows, "p3").map(({ L, rows: pr, total }, pi) => bgPage(`p3-${pi}`, L.bg, (
        <>
          <Grid xs={X3} y0={L.y0} rowH={L.rowH} n={pr.length} />
          {pr.map((r, k) => {
            const y = L.y0 + k * L.rowH
            const h = L.rowH
            return (
              <React.Fragment key={r.i}>
                <Num xs={X3} c={0} y={y} h={h} size={L.size[0]} text={String(r.i + 1)} />
                <Txt xs={X3} c={1} y={y} h={h} size={L.size[1]} pad={L.pad[0]} text={r.name} />
                <Num xs={X3} c={2} y={y} h={h} size={L.size[2]} text={inr(r.occupancy ?? 0)} />
                <Num xs={X3} c={3} y={y} h={h} size={L.size[3]} text={inr(r.smokers)} />
                <Num xs={X3} c={4} y={y} h={h} size={L.size[4]} text={String(r.zones ?? 0)} />
                <Num xs={X3} c={5} y={y} h={h} size={L.size[5]} text={String(r.basic)} />
                <Num xs={X3} c={6} y={y} h={h} size={L.size[6]} text={String(r.adv)} />
              </React.Fragment>
            )
          })}
          {total && L.total && (() => {
            const y = L.y0 + pr.length * L.rowH
            const h = L.total[1] - L.total[0]
            const s = L.tot.val
            return (
              <>
                <View style={{ position: "absolute", left: X3[0], top: y, width: X3[7] - X3[0], height: h, backgroundColor: TOTAL_BG, borderWidth: EXTRA_W, borderColor: LINE, borderBottomLeftRadius: 9, borderBottomRightRadius: 9, overflow: "hidden" }}>
                  <View style={{ position: "absolute", left: X3[5] - X3[0], top: 0, width: X3[6] - X3[5], height: h, backgroundColor: "#fbdcc0" }} />
                </View>
                {X3.slice(1, 7).map((x) => <View key={x} style={{ position: "absolute", left: x - EXTRA_W / 2, top: y, width: EXTRA_W, height: h, backgroundColor: LINE }} />)}
                <Cell x0={X3[0]} x1={X3[2]} y={y} h={h} size={L.tot.label} weight={700}>Total</Cell>
                <Num xs={X3} c={2} y={y} h={h} size={s} bold text={inr(m.occupancy)} />
                <Num xs={X3} c={3} y={y} h={h} size={s} bold text={inr(m.smokers)} />
                <Num xs={X3} c={4} y={y} h={h} size={s} bold text={String(m.zones)} />
                <Num xs={X3} c={5} y={y} h={h} size={s} bold color={ORANGE} text={String(m.basic)} />
                <Num xs={X3} c={6} y={y} h={h} size={s} bold color={GREEN} text={String(m.adv)} />
              </>
            )
          })()}
        </>
      )))}

      {/* 4 — Consolidated impact */}
      {bgPage("p4", "ml4.jpg", (
        <>
          <Logo x={28} y={14} w={130} />
          <T x={360} y={175} size={17.5} color={GREEN} weight={500} w={200}>{locLabel}</T>
          <T x={97.5} y={339} size={fitW(inr(m.butts), 23.7, 118)} color={INK} weight={500} w={125} align="center">{inr(m.butts)}</T>
          <T x={236.5} y={339} size={fitW(kg(m.wasteKg), 23.7, 104)} color={INK} weight={500} w={110} align="center">{kg(m.wasteKg)}</T>
          <T x={366.5} y={339} size={fitW(kg(m.microKg), 23.7, 104)} color={INK} weight={500} w={110} align="center">{kg(m.microKg)}</T>
          <T x={504} y={345} size={fitW(fmtWater(m.waterL), 18.1, 124)} color={INK} weight={500} w={150} align="center">{fmtWater(m.waterL)}</T>
        </>
      ))}

      {/* 5 — Location-wise impact */}
      {paginate(rows, "p5").map(({ L, rows: pr, total }, pi) => bgPage(`p5-${pi}`, L.bg, (
        <>
          <T x={360} y={191.5} size={17.5} color={GREEN} weight={500} w={200}>{locLabel}</T>
          <Grid xs={X5} y0={L.y0} rowH={L.rowH} n={pr.length} />
          {pr.map((r, k) => {
            const y = L.y0 + k * L.rowH
            const h = L.rowH
            return (
              <React.Fragment key={r.i}>
                <Num xs={X5} c={0} y={y} h={h} size={L.size[0]} text={String(r.i + 1)} />
                <Txt xs={X5} c={1} y={y} h={h} size={L.size[1]} pad={L.pad[0]} text={r.name} />
                <Txt xs={X5} c={2} y={y} h={h} size={L.size[2]} pad={L.pad[1]} text={r.city} />
                <Num xs={X5} c={3} y={y} h={h} size={L.size[3]} text={inr(r.butts)} />
                <Num xs={X5} c={4} y={y} h={h} size={L.size[4]} text={kg(r.wasteKg)} />
                <Num xs={X5} c={5} y={y} h={h} size={L.size[5]} text={kg(r.microKg)} />
                <Num xs={X5} c={6} y={y} h={h} size={L.size[6]} text={fmtWater(r.waterL)} />
              </React.Fragment>
            )
          })}
          {total && L.total && (() => {
            const y = L.y0 + pr.length * L.rowH
            const h = L.total[1] - L.total[0]
            const s = L.tot.val
            const label = `Total (${locLabel})`
            return (
              <>
                <View style={{ position: "absolute", left: X5[0], top: y, width: X5[7] - X5[0], height: h, backgroundColor: "#0f4d2a", borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }} />
                {X5.slice(3, 7).map((x) => <View key={x} style={{ position: "absolute", left: x - EXTRA_W / 2, top: y, width: EXTRA_W, height: h, backgroundColor: "#2f7a4b" }} />)}
                <Cell x0={L.tot.labelX} x1={X5[3]} y={y} h={h} size={fitW(label, L.tot.label, X5[3] - L.tot.labelX - 4, true)} weight={700} color="#ffffff" align="left">{label}</Cell>
                <Num xs={X5} c={3} y={y} h={h} size={s} bold color={YELLOW} text={inr(m.butts)} />
                <Num xs={X5} c={4} y={y} h={h} size={s} bold color={YELLOW} text={kg(m.wasteKg)} />
                <Num xs={X5} c={5} y={y} h={h} size={s} bold color={YELLOW} text={kg(m.microKg)} />
                <Num xs={X5} c={6} y={y} h={h} size={s} bold color={YELLOW} text={fmtWater(m.waterL)} />
              </>
            )
          })()}
        </>
      )))}

      {/* 6 — Consolidated commercials */}
      {bgPage("p6", "ml6.jpg", (
        <>
          <Logo x={31.6} y={18.6} w={114} />
          <T x={99.7} y={229} size={20.3} color={INK} weight={500} w={90} align="center">{String(n)}</T>
          <T x={270.7} y={229} size={20.3} color={INK} weight={500} w={90} align="center">{String(m.kiosks)}</T>
          <T x={488} y={236} size={fitW(`${m.basic} Basic | ${m.adv} Advanced`, 13.6, 160)} color={INK} weight={500} w={170} align="center">{`${m.basic} Basic | ${m.adv} Advanced`}</T>
          {(() => {
            const ps = Math.min(31.2, (31.2 * 250) / (textWidth(`₹${inr(m.price)}`, 31.2, true) + textWidth(" + GST", 19.2, true)))
            return (
              <Text style={{ position: "absolute", top: 336, left: 289, width: 280, textAlign: "center", fontFamily: "Poppins", fontWeight: 700, fontSize: ps, color: GREEN, lineHeight: 1.4 }} wrap={false}>
                {`₹${inr(m.price)}`}
                <Text style={{ fontSize: (19.2 * ps) / 31.2 }}>{" + GST"}</Text>
              </Text>
            )
          })()}
          <T x={356} y={446.5} size={18.6} color={INK} weight={500} w={110} align="center">{`${m.basic} Units`}</T>
          <T x={506} y={446.5} size={18.6} color={INK} weight={500} w={110} align="center">{`${m.adv} Units`}</T>
          <T x={353.2} y={689} size={11.9} color={GREEN} w={230} family="Lora">Complimentary Kraft Reborn Products</T>
        </>
      ))}

      {/* 7 — Location-wise commercials */}
      {paginate(rows, "p7").map(({ L, rows: pr, total }, pi) => bgPage(`p7-${pi}`, L.bg, (
        <>
          <Grid xs={X7} y0={L.y0} rowH={L.rowH} n={pr.length} hLines shade={{ x0: X7[4], x1: X7[5], color: "#eef6ea" }} />
          {pr.map((r, k) => {
            const y = L.y0 + k * L.rowH
            const h = L.rowH
            return (
              <React.Fragment key={r.i}>
                <Num xs={X7} c={0} y={y} h={h} size={L.size[0]} text={String(r.i + 1)} />
                <Txt xs={X7} c={1} y={y} h={h} size={L.size[1]} pad={L.pad[0]} text={r.name} />
                <Txt xs={X7} c={2} y={y} h={h} size={L.size[2]} pad={L.pad[1]} text={r.city} />
                <Num xs={X7} c={3} y={y} h={h} size={L.size[3]} text={String(r.basic)} />
                <Num xs={X7} c={4} y={y} h={h} size={L.size[4]} text={String(r.adv)} />
                <Num xs={X7} c={5} y={y} h={h} size={L.size[5]} text={String(r.kiosks)} />
                <Num xs={X7} c={6} y={y} h={h} size={L.size[6]} text={inr(r.price)} />
              </React.Fragment>
            )
          })}
          {total && L.total && (() => {
            const y = L.y0 + pr.length * L.rowH
            const h = L.total[1] - L.total[0]
            const s = L.tot.val
            const price = `₹ ${inr(m.price)}`
            const pw = textWidth(price, 14.9, true) + textWidth(" + GST", 10.72, true)
            const k = Math.min(1, (X7[7] - X7[6] - 8) / pw)
            return (
              <>
                <View style={{ position: "absolute", left: X7[0], top: y, width: X7[7] - X7[0], height: h, backgroundColor: TOTAL_BG, borderWidth: EXTRA_W, borderColor: LINE, borderBottomLeftRadius: 9, borderBottomRightRadius: 9 }} />
                {X7.slice(1, 7).map((x) => <View key={x} style={{ position: "absolute", left: x - EXTRA_W / 2, top: y, width: EXTRA_W, height: h, backgroundColor: LINE }} />)}
                <Cell x0={X7[0]} x1={X7[3]} y={y} h={h} size={L.tot.label} weight={700}>Total</Cell>
                <Num xs={X7} c={3} y={y} h={h} size={s} bold color={GREEN} text={String(m.basic)} />
                <Num xs={X7} c={4} y={y} h={h} size={s} bold color={GREEN} text={String(m.adv)} />
                <Num xs={X7} c={5} y={y} h={h} size={s} bold color={GREEN} text={String(m.kiosks)} />
                <View style={{ position: "absolute", left: X7[6], top: y, width: X7[7] - X7[6], height: h, justifyContent: "center" }}>
                  <Text style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 14.9 * k, color: GREEN, textAlign: "center" }}>
                    {price}
                    <Text style={{ fontSize: 10.72 * k }}>{" + GST"}</Text>
                  </Text>
                </View>
              </>
            )
          })()}
        </>
      )))}

      {/* Basic vs Advance comparison */}
      {comparison(c)}

      {/* Static pages */}
      {/* The multi-location artwork has no Buffindia logo; place it where the single-location pages (5, 7) have it. */}
      {bgPage("mlstatic8.jpg", "mlstatic8.jpg", <Logo x={29} y={19.6} w={128.7} />)}
      {bgPage("mlstatic9.jpg", "mlstatic9.jpg", null)}
      {bgPage("mlstatic10.jpg", "mlstatic10.jpg", <Logo x={31} y={27.3} w={138} />)}
    </Document>
  )
}

export function PreServiceDocument({ config }: { config: PreServiceConfig }) {
  registerFonts()
  return config.mode === "multi" ? <MultiDoc c={config} /> : <SingleDoc c={config} />
}

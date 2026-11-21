import React from "react"
import path from "path"
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import {
  QUOTATION_PRODUCTS,
  computeQuotation,
  partyAddress,
  formatDate,
  formatInrNumber,
  plainRupees,
  type Computed,
  type QuotationConfig,
} from "@/lib/quotation"

// Layout follows the redesigned Buffindia proposal (A4, points).
const NAVY = "#22284c"
const ORANGE = "#d3720f"
const TINT = "#f6f4f0"
const HAIR = "#e2e4e9"
const GRID = "#aeb3c1"
const INK = "#1b1d2a"
const MUTED = "#6b6f80"

const font = (f: string) => path.join(process.cwd(), "public", "fonts", f)
const asset = (...p: string[]) => path.join(process.cwd(), "public", "quotation-assets", ...p)
const KIOSK_IMG = { basic: asset("kiosk-basic.jpg"), advance: asset("kiosk-advance.jpg") }

let fontsReady = false
function registerFonts() {
  if (fontsReady) return
  Font.register({
    family: "Poppins",
    fonts: [
      { src: font("Poppins-Regular.ttf"), fontWeight: 400 },
      { src: font("Poppins-Medium.ttf"), fontWeight: 500 },
      { src: font("Poppins-SemiBold.ttf"), fontWeight: 600 },
      { src: font("Poppins-Bold.ttf"), fontWeight: 700 },
      { src: font("Poppins-Italic.ttf"), fontWeight: 400, fontStyle: "italic" },
    ],
  })
  Font.registerHyphenationCallback((w) => [w])
  fontsReady = true
}

const T = (size: number, color = INK, weight: 400 | 500 | 600 | 700 = 400) => ({
  fontFamily: "Poppins",
  fontSize: size,
  color,
  fontWeight: weight,
})

const PAGE_W = 595.28
const MARGIN = 57
const HEADER_H = 66.4

const s = StyleSheet.create({
  page: { backgroundColor: "#ffffff", paddingTop: 90, paddingBottom: 66, paddingHorizontal: MARGIN },
  header: { position: "absolute", top: 0, left: 0, width: PAGE_W, height: HEADER_H },
  footer: {
    position: "absolute", bottom: 34, left: MARGIN, right: MARGIN, flexDirection: "row",
    justifyContent: "space-between", borderTopWidth: 0.6, borderTopColor: HAIR, paddingTop: 9,
  },
  h1: { ...T(19, NAVY, 700), marginBottom: 2 },
  sub: { ...T(11, MUTED) },
  rule: { width: 51, height: 2.2, backgroundColor: ORANGE, marginTop: 14, marginBottom: 22 },
  p: { ...T(10, INK), lineHeight: 1.5, marginBottom: 8 },
  pb: { ...T(10, INK, 700), lineHeight: 1.5 },
  eyebrow: { ...T(9, ORANGE, 700), marginTop: 10, marginBottom: 6 },
  hl: { flexDirection: "row", alignItems: "center", height: 25, borderBottomWidth: 0.5, borderBottomColor: HAIR },
  hlNo: { ...T(9, ORANGE, 700), width: 31 },
  hlTx: { ...T(10.5, NAVY, 700) },
  secT: { ...T(9, ORANGE, 700), paddingBottom: 5, borderBottomWidth: 0.6, borderBottomColor: HAIR, marginBottom: 8 },
  li: { flexDirection: "row", marginBottom: 3.5 },
  liNo: { ...T(10.2, INK), width: 17 },
  liTx: { ...T(10.2, INK), flex: 1, lineHeight: 1.45 },
  subLi: { flexDirection: "row", marginBottom: 1.5, marginLeft: 17 },
  subNo: { ...T(10.2, INK), width: 20 },
  para: { ...T(10.2, INK), lineHeight: 1.45 },
  dRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: HAIR },
  dLab: { ...T(8.5, MUTED, 700), width: 91 },
  dVal: { ...T(10, INK), flex: 1, lineHeight: 1.4 },
  kioskCap: { ...T(9.5, ORANGE, 700), marginTop: 7, textAlign: "center" },
  strip: { flexDirection: "row", borderTopWidth: 2, borderTopColor: ORANGE, backgroundColor: TINT, height: 72 },
  stripLab: { ...T(7.8, MUTED, 700), marginBottom: 4 },
  special: {
    flexDirection: "row", alignItems: "center", marginTop: 17, backgroundColor: TINT,
    borderLeftWidth: 2.2, borderLeftColor: ORANGE, minHeight: 40, paddingVertical: 8, paddingHorizontal: 12,
  },
  cell: { ...T(8.2, INK), lineHeight: 1.4 },
  cellB: { ...T(8.2, INK, 700), lineHeight: 1.4 },
  cellM: { ...T(8.2, MUTED), lineHeight: 1.4 },
  th: { ...T(7.8, "#ffffff", 700) },
  sigBox: { flex: 1, borderWidth: 0.7, borderColor: HAIR, padding: 9, height: 119 },
})

function Footer({ dark = false }: { dark?: boolean }) {
  const color = dark ? "#d1d9e6" : MUTED
  return (
    <View fixed style={dark ? { ...s.footer, bottom: 6, borderTopWidth: 0 } : s.footer}>
      <Text style={T(dark ? 6.8 : 7.4, color)}>www.buffindia.com   ·   accounts@buffindia.com</Text>
      <Text style={T(dark ? 6.8 : 7.4, color)} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Image fixed src={asset("header.jpg")} style={s.header} />
      {children}
      <Footer />
    </>
  )
}

function Title({ title, sub }: { title: string; sub: string }) {
  return (
    <View>
      <Text style={s.h1}>{title}</Text>
      <Text style={s.sub}>{sub}</Text>
      <View style={s.rule} />
    </View>
  )
}

function Section({ title, first = false }: { title: string; first?: boolean }) {
  return <Text style={{ ...s.secT, marginTop: first ? 0 : 14 }}>{title}</Text>
}

function Num({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <View style={s.li} wrap={false}>
      <Text style={s.liNo}>{n}</Text>
      <Text style={s.liTx}>{children}</Text>
    </View>
  )
}

// ── 1. Cover letter ──────────────────────────────────────────────────────

function Cover({ c }: { c: QuotationConfig }) {
  const hl = [
    "Educative Disposal Units to encourage responsible disposal",
    "On-site Engagement to drive behavioural change",
    "Door-to-Door Collection for hassle-free maintenance",
    "Monthly Environmental Impact Reporting",
    "Certification as a “Cigarette Waste-Free Premises”",
    "Cost-effective and value-driven sustainability model",
  ]
  return (
    <Page size="A4" style={{ ...s.page, paddingTop: 92 }}>
      <Frame>
        <Text style={{ ...s.p, marginBottom: 16 }}>Date: {formatDate(c.date)}</Text>
        <Text style={{ ...s.p, marginBottom: 0 }}>To</Text>
        <Text style={s.pb}>{c.clientName}</Text>
        {c.city ? <Text style={s.pb}>{c.city}</Text> : null}
        <Text style={{ ...T(10, NAVY, 700), marginTop: 16, marginBottom: 16 }}>
          Subject: Proforma for Cigarette Waste Management Solution
        </Text>
        <Text style={s.p}>Dear Sustainability Partner,</Text>
        <Text style={s.p}>
          Thank you for your interest in Buffindia’s Cigarette Waste Management Solution — an initiative focused on making
          urban spaces cleaner and healthier.
        </Text>
        <Text style={s.p}>
          We are pleased to share our customized proposal for the installation and servicing of our educative cigarette
          disposal kiosk.
        </Text>
        <Text style={s.eyebrow}>KEY SOLUTION HIGHLIGHTS</Text>
        <View style={{ marginBottom: 14 }}>
          {hl.map((t, i) => (
            <View key={t} style={s.hl}>
              <Text style={s.hlNo}>{String(i + 1).padStart(2, "0")}</Text>
              <Text style={s.hlTx}>{t}</Text>
            </View>
          ))}
        </View>
        <Text style={s.p}>
          This proposal has been tailored to your site’s requirements. We would be happy to connect and take this forward.
        </Text>
        <Text style={s.p}>We look forward to building a long-term sustainable partnership.</Text>
        <Text style={{ ...s.p, marginTop: 10, marginBottom: 4 }}>Warm regards,</Text>
        <Image src={asset("signature.png")} style={{ width: 56, height: 55, marginBottom: 4 }} />
        <Text style={s.pb}>Ketan Prajapati</Text>
        <Text style={{ ...s.p, marginBottom: 0 }}>Founding Director</Text>
        <Text style={{ ...s.p, marginBottom: 0 }}>Buffindia Receptacles Pvt Ltd</Text>
        <Text style={{ ...s.p, marginBottom: 0 }}>www.buffindia.com</Text>
        <Text style={{ ...s.p, marginBottom: 0 }}>ketan@buffindia.com</Text>
      </Frame>
    </Page>
  )
}

// ── 2. Proposed commercials ──────────────────────────────────────────────

function Commercials({ c, k }: { c: QuotationConfig; k: Computed }) {
  const sub =
    k.singleType && k.singleType !== "Combo"
      ? `Annual AMC with Disposal Units on Rent (For ${k.singleType} Kiosk)`
      : "Annual AMC with Disposal Units on Rent"
  const showAdv = k.advanceUnits > 0
  const showBasic = k.basicUnits > 0 || !showAdv
  const both = showAdv && showBasic
  const rows: [string, string][] = [
    ["Company Name", c.clientName],
    ["Location", c.city || "—"],
    ["Kiosk Type", k.kioskLabel],
    ["Basic Kiosk", String(k.basicUnits)],
    ["Advance Kiosk", String(k.advanceUnits)],
    ["Total Units", String(k.totalUnits)],
    ["Service Duration", k.durationLabel],
  ]
  const strip: [string, string, number][] = [
    ["Total Cost", `₹${plainRupees(k.totalCost)}`, 88],
    ["Surcharge", `₹${plainRupees(k.surcharge)}`, 82],
    [k.taxType === "SEZ" ? "GST (SEZ 0%)" : "GST (18%)", `₹${plainRupees(k.igst)}`, 88],
    ["Total Amount", `₹${plainRupees(k.grandTotal)}`, 133],
    ["Complimentary", `₹${plainRupees(k.complimentary)}`, 0],
  ]
  const panelW = both ? 260 : 226
  const rowH = both ? 38 : 44
  return (
    <Page size="A4" style={s.page}>
      <Frame>
        <Title title="Proposed Commercials" sub={sub} />
        <View style={{ flexDirection: "row", gap: both ? 17 : 29 }}>
          <View style={{ width: panelW, alignSelf: "flex-start", backgroundColor: TINT, padding: 7, paddingTop: 10, paddingBottom: 9, flexDirection: "row", justifyContent: "center", gap: 14 }}>
            {showBasic && (
              <View style={{ width: both ? 133 : 213 }}>
                <Image src={KIOSK_IMG.basic} style={both ? { width: 133, height: 177 } : { width: 213, height: 284 }} />
                <Text style={s.kioskCap}>Basic Kiosk</Text>
              </View>
            )}
            {showAdv && (
              <View style={{ width: both ? 99 : 160 }}>
                <Image src={KIOSK_IMG.advance} style={both ? { width: 99, height: 177 } : { width: 160, height: 284 }} />
                <Text style={s.kioskCap}>Advance Kiosk</Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1, borderTopWidth: 0.5, borderTopColor: HAIR }}>
            {rows.map(([l, v]) => (
              <View key={l} style={{ ...s.dRow, minHeight: rowH, paddingVertical: 6 }}>
                <Text style={s.dLab}>{l}</Text>
                <Text style={s.dVal}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ ...s.strip, marginTop: both ? 37 : 52 }} wrap={false}>
          {strip.map(([l, v, w], i) => {
            const hi = i === 3
            return (
              <View
                key={l}
                style={{
                  ...(w ? { width: w } : { flex: 1 }),
                  paddingTop: 14,
                  paddingHorizontal: 10,
                  backgroundColor: hi ? NAVY : TINT,
                  borderRightWidth: i < 2 ? 0.5 : 0,
                  borderRightColor: HAIR,
                }}
              >
                <Text style={{ ...s.stripLab, color: hi ? "#c9ccdc" : MUTED }}>{l}</Text>
                <Text style={T(hi ? (v.length > 11 ? 15 : 18) : v.length > 9 ? 12.5 : 16, hi ? "#ffffff" : NAVY, 700)}>{v}</Text>
              </View>
            )
          })}
        </View>
        <View style={s.special} wrap={false}>
          <Text style={{ ...T(8, ORANGE, 700), width: 136 }}>SPECIAL CONDITIONS</Text>
          <Text style={{ ...T(10, INK), flex: 1 }}>{c.specialConditions || "—"}</Text>
        </View>
      </Frame>
    </Page>
  )
}

// ── 3. Kraft Reborn complimentary products ───────────────────────────────

function Complimentary({ c }: { c: QuotationConfig }) {
  const items = QUOTATION_PRODUCTS.filter((p) => c.complimentaryProducts.includes(p.slug))
  const cols = 4
  const rowsN = Math.max(1, Math.ceil(items.length / cols))
  const gap = 6.5
  const cardW = (537 - gap * (cols - 1)) / cols
  const cardH = Math.min(136, (421 - gap * (rowsN - 1)) / rowsN)
  return (
    <Page size="A4" style={{ position: "relative" }}>
      <Image src={asset("kraft-reborn-bg.jpg")} style={{ position: "absolute", top: 0, left: 0, width: PAGE_W, height: 841 }} />
      <View style={{ position: "absolute", top: 190, left: 30, width: 537, flexDirection: "row", flexWrap: "wrap", gap }}>
        {items.map((p) => (
          <View
            key={p.slug}
            style={{
              width: cardW, height: cardH, backgroundColor: "#fbfbfb", borderWidth: 0.8, borderColor: "#e3e3e3",
              borderRadius: 5, alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingBottom: 10, paddingHorizontal: 6,
            }}
          >
            <Image src={asset("products", `${p.slug}.png`)} style={{ width: cardW - 22, height: cardH - 50, objectFit: "contain" }} />
            <Text style={{ ...T(9.4, INK, 500), textAlign: "center", lineHeight: 1.25 }}>{p.name}</Text>
          </View>
        ))}
      </View>
      <Text style={{ position: "absolute", top: 711, left: 0, width: PAGE_W, textAlign: "center", ...T(9.4, NAVY, 500) }}>
        For more products, visit <Text style={T(9.4, ORANGE, 700)}>kraftreborn.com</Text>
      </Text>
      <Footer dark />
    </Page>
  )
}

// ── 4. Proforma invoice ──────────────────────────────────────────────────

type Col = { key: string; label: string; w: number; right?: boolean }

function invoiceCols(cgst: boolean): Col[] {
  return cgst
    ? [
        { key: "no", label: "No.", w: 26 }, { key: "img", label: "Image", w: 60 }, { key: "item", label: "Item & Description", w: 134 },
        { key: "hsn", label: "HSN / SAC", w: 50 }, { key: "qty", label: "Qty", w: 28, right: true }, { key: "rate", label: "Rate (₹)", w: 62, right: true },
        { key: "cgst", label: "CGST 9%", w: 53, right: true }, { key: "sgst", label: "SGST 9%", w: 53, right: true }, { key: "amt", label: "Amount (₹)", w: 73, right: true },
      ]
    : [
        { key: "no", label: "No.", w: 32 }, { key: "img", label: "Image", w: 76 }, { key: "item", label: "Item & Description", w: 152 },
        { key: "hsn", label: "HSN / SAC", w: 63 }, { key: "qty", label: "Qty", w: 35, right: true }, { key: "rate", label: "Rate (₹)", w: 67, right: true },
        { key: "igst", label: "IGST", w: 44, right: true }, { key: "amt", label: "Amount (₹)", w: 70, right: true },
      ]
}

const box = { borderWidth: 0.7, borderColor: GRID }
const vLine = { borderRightWidth: 0.5, borderRightColor: GRID }

function Party({ p }: { p: QuotationConfig["bill"] }) {
  return (
    <View style={{ paddingHorizontal: 6, paddingVertical: 5 }}>
      <Text style={s.cellB}>{p.name}</Text>
      <Text style={s.cellM}>{partyAddress(p)}</Text>
      {p.gstin ? <Text style={s.cellM}>GSTIN : {p.gstin}</Text> : null}
    </View>
  )
}

function Invoice({ c, k }: { c: QuotationConfig; k: Computed }) {
  const cgst = k.taxType === "CGST_SGST"
  const cols = invoiceCols(cgst)
  const meta: [string, string, boolean][] = [
    ["PI No.", c.piNo, true],
    ["Date", formatDate(c.date), false],
    ["Valid till", formatDate(k.validTill), false],
  ]
  const cellPad = { paddingHorizontal: 5, paddingVertical: 4 }
  const lineCell = (key: string, l: Computed["lines"][number]) => {
    switch (key) {
      case "no":
        return <Text style={s.cell}>{l.no}</Text>
      case "img":
        return (
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 3 }}>
            {l.images.map((im) => (
              <Image
                key={im}
                src={KIOSK_IMG[im]}
                style={{ width: l.images.length > 1 ? 26 : 54, height: l.images.length > 1 ? 40 : 71, objectFit: "contain" }}
              />
            ))}
          </View>
        )
      case "item":
        return (
          <View>
            <Text style={s.cellB}>{l.name}</Text>
            {l.description.map((d, i) => (
              <Text key={i} style={s.cellM}>{d}</Text>
            ))}
            {l.notes.map((n, i) => (
              <Text key={`n${i}`} style={{ ...s.cellM, fontStyle: "italic", color: INK }}>{i === 0 ? "Note: " : ""}{n}</Text>
            ))}
          </View>
        )
      case "hsn":
        return <Text style={s.cell}>{l.sac}</Text>
      case "qty":
        return <Text style={{ ...s.cell, textAlign: "right" }}>{l.qty}</Text>
      case "rate":
        return <Text style={{ ...s.cell, textAlign: "right" }}>{formatInrNumber(l.rate)}</Text>
      case "igst":
        return <Text style={{ ...s.cell, textAlign: "right" }}>{(k.gstRate * 100).toFixed(2)}%</Text>
      case "cgst":
        return <Text style={{ ...s.cell, fontSize: 7.8, textAlign: "right" }}>{formatInrNumber(l.cgst)}</Text>
      case "sgst":
        return <Text style={{ ...s.cell, fontSize: 7.8, textAlign: "right" }}>{formatInrNumber(l.sgst)}</Text>
      default:
        return <Text style={{ ...T(8.2, NAVY, 700), textAlign: "right" }}>{formatInrNumber(l.amount)}</Text>
    }
  }
  const totals: [string, string][] = [
    ...(k.surcharge > 0
      ? ([["Sub Total (₹)", formatInrNumber(k.totalCost)], ["Add Surcharge (₹)", formatInrNumber(k.surcharge)]] as [string, string][])
      : []),
    ["Total Amount before Tax (₹)", formatInrNumber(k.taxable)],
    ...(cgst
      ? ([["Add CGST 9% (₹)", formatInrNumber(k.cgst)], ["Add SGST 9% (₹)", formatInrNumber(k.sgst)]] as [string, string][])
      : ([[k.taxType === "SEZ" ? "IGST – SEZ zero-rated (₹)" : "Add IGST (₹)", formatInrNumber(k.igst)]] as [string, string][])),
  ]
  const bankW = [127, 174, 143, 95]
  return (
    <Page size="A4" style={{ ...s.page, paddingHorizontal: 28, paddingTop: 96 }}>
      <Frame>
        <View wrap={false}>
          <View style={{ backgroundColor: NAVY, height: 32, alignItems: "center", justifyContent: "center" }}>
            <Text style={T(12, "#ffffff", 700)}>PROFORMA INVOICE</Text>
          </View>
          <View style={{ ...box, borderTopWidth: 0, flexDirection: "row" }}>
            <View style={{ flex: 1, paddingHorizontal: 6, paddingVertical: 6 }}>
              <Text style={{ ...T(9, NAVY, 700), marginBottom: 2 }}>Buffindia Receptacles Private Limited</Text>
              <Text style={s.cellM}>GSTIN : 24AAICB0616J1ZY</Text>
              <Text style={s.cellM}>CIN : U36999GJ2018PTC104688</Text>
              <Text style={s.cellM}>accounts@buffindia.com  ·  9512120366</Text>
            </View>
            <View style={{ width: 196, borderLeftWidth: 0.5, borderLeftColor: GRID }}>
              {meta.map(([l, v, b], i) => (
                <View key={l} style={{ flexDirection: "row", height: 21.7, borderTopWidth: i ? 0.5 : 0, borderTopColor: GRID }}>
                  <View style={{ width: 69, justifyContent: "center", paddingLeft: 6 }}>
                    <Text style={s.cellM}>{l}</Text>
                  </View>
                  <View style={{ flex: 1, justifyContent: "center", borderLeftWidth: 0.5, borderLeftColor: GRID, paddingLeft: 6 }}>
                    <Text style={b ? s.cellB : s.cell}>{v}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ ...box, marginTop: 9 }} wrap={false}>
          <View style={{ flexDirection: "row", backgroundColor: TINT, borderBottomWidth: 0.5, borderBottomColor: GRID, height: 21 }}>
            <View style={{ flex: 1, justifyContent: "center", paddingLeft: 6, ...vLine }}>
              <Text style={T(7.8, NAVY, 700)}>Billing Address</Text>
            </View>
            <View style={{ flex: 1, justifyContent: "center", paddingLeft: 6 }}>
              <Text style={T(7.8, NAVY, 700)}>Shipping Address</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1, ...vLine }}>
              <Party p={c.bill} />
            </View>
            <View style={{ flex: 1 }}>
              <Party p={c.ship} />
            </View>
          </View>
        </View>

        <View style={{ ...box, marginTop: 9, borderBottomWidth: 0 }}>
          <View fixed style={{ flexDirection: "row", backgroundColor: NAVY, minHeight: 23 }}>
            {cols.map((col, i) => (
              <View
                key={col.key}
                style={{ width: col.w, justifyContent: "center", ...cellPad, borderRightWidth: i < cols.length - 1 ? 0.5 : 0, borderRightColor: "#494f77" }}
              >
                <Text style={{ ...s.th, textAlign: col.right ? "right" : "left" }}>{col.label}</Text>
              </View>
            ))}
          </View>
          {k.lines.map((l) => (
            <View
              key={l.no}
              wrap={false}
              style={{ flexDirection: "row", borderBottomWidth: 0.7, borderBottomColor: GRID, minHeight: l.images.length ? 93 : 26 }}
            >
              {cols.map((col, i) => (
                <View key={col.key} style={{ width: col.w, ...cellPad, paddingTop: 5, borderRightWidth: i < cols.length - 1 ? 0.5 : 0, borderRightColor: GRID }}>
                  {lineCell(col.key, l)}
                </View>
              ))}
            </View>
          ))}
        </View>

        <View wrap={false}>
          <View style={{ ...box, marginTop: 9, flexDirection: "row" }}>
            <View style={{ flex: 1, paddingHorizontal: 6, paddingVertical: 7 }}>
              <Text style={s.cellM}>Total PI Amount in Words :</Text>
              <Text style={{ ...T(9, NAVY, 700), marginTop: 4, lineHeight: 1.35 }}>{k.words}</Text>
              {k.taxType === "SEZ" && (
                <Text style={{ ...s.cellM, marginTop: 4 }}>Supply to Special Economic Zone (SEZ) - zero-rated, IGST 0%.</Text>
              )}
            </View>
            <View style={{ width: 273, borderLeftWidth: 0.5, borderLeftColor: GRID }}>
              {totals.map(([l, v]) => (
                <View key={l} style={{ flexDirection: "row", height: 24, borderBottomWidth: 0.5, borderBottomColor: GRID }}>
                  <View style={{ width: 153, justifyContent: "center", paddingLeft: 6, ...vLine }}>
                    <Text style={s.cellM}>{l}</Text>
                  </View>
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "flex-end", paddingRight: 6 }}>
                    <Text style={s.cell}>{v}</Text>
                  </View>
                </View>
              ))}
              <View style={{ flexDirection: "row", height: 28, backgroundColor: NAVY }}>
                <View style={{ width: 153, justifyContent: "center", paddingLeft: 6, borderRightWidth: 0.5, borderRightColor: "#494f77" }}>
                  <Text style={T(8.6, "#ffffff", 700)}>Grand Total (₹)</Text>
                </View>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "flex-end", paddingRight: 6 }}>
                  <Text style={T(9.4, "#ffffff", 700)}>{formatInrNumber(k.grandTotal)}</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={{ ...s.cellB, marginTop: 8, marginBottom: 4 }}>Bank Details :</Text>
          <View style={box}>
            {[
              { bg: TINT, st: T(7.8, NAVY, 700), vals: ["Bank Name", "Branch", "Account No.", "IFSC"] },
              { bg: "#ffffff", st: s.cell, vals: ["HDFC Bank Ltd", "Odhav Kathwada Branch", "50200035165761", "HDFC0004289"] },
            ].map((r, ri) => (
              <View key={ri} style={{ flexDirection: "row", backgroundColor: r.bg, height: 21, borderTopWidth: ri ? 0.5 : 0, borderTopColor: GRID }}>
                {r.vals.map((v, i) => (
                  <View key={v} style={{ width: bankW[i], justifyContent: "center", paddingLeft: 6, borderRightWidth: i < 3 ? 0.5 : 0, borderRightColor: GRID }}>
                    <Text style={r.st}>{v}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={{ ...box, marginTop: 9, flexDirection: "row", minHeight: 24 }}>
            <View style={{ width: 184, backgroundColor: TINT, justifyContent: "center", paddingLeft: 6, ...vLine }}>
              <Text style={T(7.8, NAVY, 700)}>Special Conditions (if applicable)</Text>
            </View>
            <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 6, paddingVertical: 4 }}>
              <Text style={s.cell}>{c.specialConditions || "—"}</Text>
            </View>
          </View>

          <View style={{ ...box, marginTop: 9, flexDirection: "row" }}>
            <View style={{ flex: 1, padding: 6, ...vLine }}>
              <Text style={{ ...s.cellB, marginBottom: 4 }}>Terms & Conditions :</Text>
              {[
                "Proforma is valid for 15 days",
                "Payment: 100% Advance",
                "Confidentiality: Client info is secure, disclosed only by law.",
                "Liability: Limited to fees paid; no indirect damages.",
                "Non-Payment: May lead to service suspension and record hold.",
                "Disputes: Raise within 15 Days subject to Ahmedabad jurisdiction.",
                "We are an MSME registered company. Payments are due within 45 days from the invoice date.",
              ].map((t) => (
                <Text key={t} style={T(7.6, MUTED)}>•  {t}</Text>
              ))}
              <Text style={{ ...T(7.6, MUTED), marginTop: 8 }}>This is a computer-generated proforma invoice. E. & O. E.</Text>
            </View>
            <View style={{ width: 184, padding: 6, alignItems: "center" }}>
              <Text style={{ ...T(7.6, INK), textAlign: "center" }}>For, Buffindia Receptacles Private Limited</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 8 }}>
                <Image src={asset("signature.png")} style={{ width: 51, height: 50 }} />
                <Image src={asset("stamp.png")} style={{ width: 50, height: 47, marginLeft: 14 }} />
              </View>
              <Text style={T(7.6, INK, 700)}>Authorised Signatory</Text>
            </View>
          </View>
        </View>
      </Frame>
    </Page>
  )
}

// ── 5. Scope & responsibilities ──────────────────────────────────────────

const SCOPE = [
  "Installation of cigarette waste disposal units on rental basis",
  "Maintenance of cigarette waste disposal units",
  "Door collection of cigarette waste as per agreed schedule",
  "Service impact reporting",
  "Cigarette waste management certification",
  "Providing recycled products equivalent to the commercial value (taxable amount) as per mutual agreement",
]
const PROVIDER = [
  "The Service Provider shall provide cigarette waste management services as part of the agreed service plan.",
  "The Service Provider shall collect cigarette waste as per the agreed service schedule.",
  "The Service Provider shall provide periodic service impact reports covering collection, processing, recycling, and environmental impact.",
  "The Service Provider shall provide certification for maintaining a cigarette waste-free premise.",
  "The Service Provider shall provide recycled products equivalent to the taxable commercial value, based on mutual agreement with the Client.",
  "In case any kiosk or disposal unit is found missing from the Client’s premises, a charge of ₹10,000 for Advance Kiosk and ₹5,000 for Basic Kiosk will be applicable.",
]
const STEPS: [string, string][] = [
  ["Install", "Disposal units installed at your premises on a rental basis"],
  ["Collect", "Cigarette waste collected from your door as per the agreed schedule"],
  ["Recycle", "Waste processed and recycled into eco-friendly products"],
  ["Report", "Service impact reports and cigarette waste management certification"],
]

function Scope() {
  return (
    <Page size="A4" style={s.page}>
      <Frame>
        <Title title="Scope & Responsibilities" sub="Scope of services and Service Provider responsibilities" />
        <Section title="SCOPE OF SERVICES" first />
        {SCOPE.map((t, i) => (
          <Num key={t} n={`${i + 1}.`}>{t}</Num>
        ))}
        <Section title="SERVICE PROVIDER RESPONSIBILITIES" />
        {PROVIDER.map((t, i) => (
          <Num key={t} n={`${i + 1}.`}>{t}</Num>
        ))}
        <View wrap={false}>
          <Section title="HOW IT WORKS" />
          <View style={{ flexDirection: "row", gap: 8.5 }}>
            {STEPS.map(([title, desc], i) => (
              <View key={title} style={{ flex: 1, backgroundColor: TINT, borderTopWidth: 2.2, borderTopColor: ORANGE, padding: 9, paddingTop: 7, minHeight: 111 }}>
                <Text style={T(20, ORANGE, 700)}>{String(i + 1).padStart(2, "0")}</Text>
                <Text style={{ ...T(10.2, NAVY, 700), marginBottom: 3 }}>{title}</Text>
                <Text style={{ ...T(8.6, MUTED), lineHeight: 1.45 }}>{desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </Frame>
    </Page>
  )
}

// ── 6. Client responsibilities & acknowledgement ─────────────────────────

const CLIENT_A = [
  "The Client’s housekeeping team shall collect and store cigarette waste from disposal units into the provided storage container on a daily basis.",
  "The Client shall allocate designated smoking areas within the premises for certification purposes.",
]
const CLIENT_APPROVALS = [
  "Entry and exit of the Service Provider",
  "Interaction with employees, facility management teams, and visitors for awareness activities",
  "Space for conducting awareness and engagement activities",
  "Display and broadcasting of awareness-related materials",
  "Use of the Client’s logo, name, and branding for promotional and reporting purposes",
  "Public communication of cigarette waste management progress via digital and media channels",
]
const CLIENT_B = [
  "The Client shall provide storage space and electricity access if required during the service duration.",
  "The Client shall make 100% payment within the agreed timeline from the date of installation of services.",
]

function ClientPage({ c }: { c: QuotationConfig }) {
  const line = (label: string) => (
    <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 5 }}>
      <Text style={{ ...T(8.4, INK), width: 68 }}>{label}</Text>
      <View style={{ flex: 1, borderBottomWidth: 0.5, borderBottomColor: MUTED, marginBottom: 2 }} />
    </View>
  )
  return (
    <Page size="A4" style={s.page}>
      <Frame>
        <Title title="Client Responsibilities & Acknowledgement" sub="Client obligations, liability, ownership and authorised signatures" />
        <Section title="CLIENT RESPONSIBILITIES" first />
        {CLIENT_A.map((t, i) => (
          <Num key={t} n={`${i + 1}.`}>{t}</Num>
        ))}
        <Num n="3.">The Client shall provide necessary approvals for:</Num>
        {CLIENT_APPROVALS.map((t, i) => (
          <View key={t} style={s.subLi} wrap={false}>
            <Text style={s.subNo}>{String.fromCharCode(97 + i)}.</Text>
            <Text style={s.liTx}>{t}</Text>
          </View>
        ))}
        {CLIENT_B.map((t, i) => (
          <Num key={t} n={`${i + 4}.`}>{t}</Num>
        ))}
        <Section title="RESPONSIBILITY" />
        <Text style={s.para}>The Client shall be responsible for any fire-related hazards arising from improper use of the disposal units.</Text>
        <Section title="OWNERSHIP" />
        <Text style={s.para}>
          This is a rental-based service, and all installed units and related infrastructure shall remain the property of the Service Provider.
        </Text>
        <View wrap={false} style={{ flexDirection: "row", gap: 11, marginTop: 22 }}>
          <View style={s.sigBox}>
            <Text style={{ ...T(8.8, NAVY, 700), marginBottom: 6 }}>For Buffindia Receptacles Private Limited</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image src={asset("signature.png")} style={{ width: 48, height: 47 }} />
              <Image src={asset("stamp.png")} style={{ width: 48, height: 45, marginLeft: 14 }} />
            </View>
            <Text style={{ ...T(8.4, INK, 700), marginTop: 5 }}>Ketan Prajapati</Text>
            <Text style={T(8.4, INK)}>Founding Director</Text>
            <Text style={T(8.4, INK)}>Date: {formatDate(c.date)}</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={{ ...T(8.8, NAVY, 700), width: 185 }}>For {c.clientName}</Text>
            <View style={{ width: 185, borderBottomWidth: 0.6, borderBottomColor: INK, marginTop: 10 }} />
            <Text style={{ ...T(8.4, INK), marginTop: 2 }}>Authorized Signatory</Text>
            <View style={{ width: 185 }}>
              {line("Name:")}
              {line("Designation:")}
              {line("Date:")}
            </View>
          </View>
        </View>
      </Frame>
    </Page>
  )
}

export function QuotationDocument({ config }: { config: QuotationConfig }) {
  registerFonts()
  const k = computeQuotation(config)
  if (!config.ship.name && !config.ship.address) config = { ...config, ship: config.bill }
  return (
    <Document title={`Buffindia Proposal - ${config.clientName}`} author="Buffindia Receptacles Private Limited">
      <Cover c={config} />
      <Commercials c={config} k={k} />
      {config.complimentaryProducts.length > 0 && <Complimentary c={config} />}
      <Invoice c={config} k={k} />
      <Scope />
      <ClientPage c={config} />
    </Document>
  )
}

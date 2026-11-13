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

const NAVY = "#22284c"
const ORANGE = "#d3720f"
const TINT = "#f6f4f1"
const HAIR = "#e3e4ea"
const INK = "#22284c"
const MUTED = "#6b6f85"

const font = (f: string) => path.join(process.cwd(), "public", "fonts", f)
const asset = (...p: string[]) => path.join(process.cwd(), "public", "quotation-assets", ...p)

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

const MM20 = 56.7
const HEADER_H = 66.4

const s = StyleSheet.create({
  page: { backgroundColor: "#ffffff", paddingTop: HEADER_H + 22, paddingBottom: 58, paddingHorizontal: MM20 },
  header: { position: "absolute", top: 0, left: 0, width: 595.28, height: HEADER_H },
  footer: {
    position: "absolute", bottom: 22, left: MM20, right: MM20, flexDirection: "row",
    justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: HAIR, paddingTop: 6,
  },
  h1: { ...T(18, NAVY, 700), marginBottom: 3 },
  sub: { ...T(9.5, MUTED), marginBottom: 6 },
  rule: { width: 30, height: 2, backgroundColor: ORANGE, marginBottom: 18 },
  p: { ...T(9, INK), lineHeight: 1.5, marginBottom: 8 },
  pb: { ...T(9, INK, 700), lineHeight: 1.5 },
  eyebrow: { ...T(8, ORANGE, 700), letterSpacing: 0.6, marginBottom: 6, marginTop: 8 },
  hl: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: HAIR },
  hlNo: { ...T(8, ORANGE, 700), width: 24 },
  hlTx: { ...T(9, INK, 700) },
  // commercials
  kioskWrap: { flexDirection: "row", gap: 8, width: 210, alignItems: "flex-start" },
  kioskCard: { backgroundColor: TINT, padding: 6, alignItems: "center" },
  kioskCap: { ...T(8, ORANGE, 700), marginTop: 5, marginBottom: 1 },
  dRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: HAIR },
  dLab: { ...T(7.5, MUTED, 700), width: 92 },
  dVal: { ...T(9, INK), flex: 1 },
  strip: { flexDirection: "row", borderTopWidth: 2, borderTopColor: ORANGE, backgroundColor: TINT, marginTop: 22 },
  stripCell: { flex: 1, paddingVertical: 11, paddingHorizontal: 10 },
  stripLab: { ...T(7, MUTED, 700), marginBottom: 5 },
  stripVal: { ...T(13, NAVY, 700) },
  special: {
    flexDirection: "row", alignItems: "center", marginTop: 14, backgroundColor: TINT,
    borderLeftWidth: 3, borderLeftColor: ORANGE, paddingVertical: 11, paddingHorizontal: 12,
  },
  specialLab: { ...T(7.5, ORANGE, 700), width: 100 },
  specialVal: { ...T(9, INK), flex: 1 },
  // products
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 4 },
  card: {
    width: 150, height: 128, borderWidth: 0.6, borderColor: HAIR, borderRadius: 7,
    backgroundColor: "#fff", alignItems: "center", paddingTop: 8, paddingHorizontal: 6,
  },
  cardName: { ...T(7.5, INK, 500), textAlign: "center", marginTop: 4 },
  // invoice
  bar: { backgroundColor: NAVY, paddingVertical: 8, alignItems: "center" },
  box: { borderWidth: 0.6, borderColor: HAIR },
  cell: { ...T(7.5, INK), lineHeight: 1.4 },
  cellB: { ...T(7.5, INK, 700), lineHeight: 1.4 },
  cellM: { ...T(7, MUTED), lineHeight: 1.4 },
  th: { ...T(7, "#fff", 700) },
  // text sections
  secT: { ...T(9, ORANGE, 700), letterSpacing: 0.6, marginTop: 12, marginBottom: 6 },
  li: { flexDirection: "row", marginBottom: 4 },
  liNo: { ...T(8.5, ORANGE, 700), width: 18 },
  liTx: { ...T(8.5, INK), flex: 1, lineHeight: 1.45 },
  para: { ...T(8.5, INK), lineHeight: 1.45 },
  subLi: { flexDirection: "row", marginBottom: 3, marginLeft: 18 },
  sigBox: { flex: 1, borderWidth: 0.6, borderColor: HAIR, padding: 10, minHeight: 112 },
})

function Frame({ children, totalLabel }: { children: React.ReactNode; totalLabel?: string }) {
  void totalLabel
  return (
    <>
      <Image fixed src={asset("header.jpg")} style={s.header} />
      {children}
      <View fixed style={s.footer}>
        <Text style={T(7.5, MUTED)}>www.buffindia.com   ·   accounts@buffindia.com</Text>
        <Text
          style={T(7.5, MUTED)}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </View>
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

function Num({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <View style={s.li} wrap={false}>
      <Text style={s.liNo}>{n}</Text>
      <Text style={s.liTx}>{children}</Text>
    </View>
  )
}

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
    <Page size="A4" style={s.page}>
      <Frame>
        <Text style={s.p}>Date: {formatDate(c.date)}</Text>
        <Text style={{ ...s.p, marginBottom: 2 }}>To</Text>
        <Text style={{ ...s.pb, marginBottom: 0 }}>{c.clientName}</Text>
        <Text style={{ ...s.pb, marginBottom: 12 }}>{c.city}</Text>
        <Text style={{ ...s.pb, marginBottom: 12 }}>Subject: Proforma for Cigarette Waste Management Solution</Text>
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
        <View style={{ marginBottom: 12 }}>
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
        <Text style={{ ...s.p, marginTop: 6, marginBottom: 4 }}>Warm regards,</Text>
        <Image src={asset("signature.png")} style={{ width: 58, height: 56, marginBottom: 2 }} />
        <Text style={s.pb}>Ketan Prajapati</Text>
        <Text style={{ ...s.p, marginBottom: 0 }}>Founding Director</Text>
        <Text style={{ ...s.p, marginBottom: 0 }}>Buffindia Receptacles Pvt Ltd</Text>
        <Text style={{ ...s.p, marginBottom: 0 }}>www.buffindia.com</Text>
        <Text style={{ ...s.p, marginBottom: 0 }}>ketan@buffindia.com</Text>
      </Frame>
    </Page>
  )
}

function Commercials({ c, k }: { c: QuotationConfig; k: Computed }) {
  const sub =
    k.singleType && k.singleType !== "Combo"
      ? `Annual AMC with Disposal Units on Rent (For ${k.singleType} Kiosk)`
      : "Annual AMC with Disposal Units on Rent"
  const showAdv = k.advanceUnits > 0
  const showBasic = k.basicUnits > 0 || !showAdv
  const rows: [string, string][] = [
    ["Company Name", c.clientName],
    ["Location", c.city],
    ["Kiosk Type", k.kioskLabel],
    ["Basic Kiosk", String(k.basicUnits)],
    ["Advance Kiosk", String(k.advanceUnits)],
    ["Total Units", String(k.totalUnits)],
    ["Service Duration", c.duration],
  ]
  const strip: [string, string, boolean][] = [
    ["Total Cost", `₹${plainRupees(k.totalCost)}`, false],
    ["Surcharge", `₹${plainRupees(k.surcharge)}`, false],
    [k.taxType === "SEZ" ? "GST (SEZ 0%)" : "GST (18%)", `₹${plainRupees(k.igst)}`, false],
    ["Total Amount", `₹${plainRupees(k.grandTotal)}`, true],
    ["Complimentary", `₹${plainRupees(k.complimentary)}`, false],
  ]
  return (
    <Page size="A4" style={s.page}>
      <Frame>
        <Title title="Proposed Commercials" sub={sub} />
        <View style={{ flexDirection: "row", gap: 18 }}>
          <View style={s.kioskWrap}>
            {showBasic && (
              <View style={{ ...s.kioskCard, width: showAdv ? 100 : 130 }}>
                <Image src={asset("kiosk-basic.jpg")} style={{ width: showAdv ? 88 : 118, height: showAdv ? 117 : 157 }} />
                <Text style={s.kioskCap}>Basic Kiosk</Text>
              </View>
            )}
            {showAdv && (
              <View style={{ ...s.kioskCard, width: showBasic ? 100 : 130 }}>
                <Image src={asset("kiosk-advance.jpg")} style={{ width: showBasic ? 66 : 88, height: showBasic ? 117 : 157 }} />
                <Text style={s.kioskCap}>Advance Kiosk</Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            {rows.map(([l, v]) => (
              <View key={l} style={s.dRow}>
                <Text style={s.dLab}>{l.toUpperCase()}</Text>
                <Text style={s.dVal}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.strip} wrap={false}>
          {strip.map(([l, v, hi]) => (
            <View key={l} style={{ ...s.stripCell, backgroundColor: hi ? NAVY : TINT }}>
              <Text style={{ ...s.stripLab, color: hi ? "#fff" : MUTED }}>{l}</Text>
              <Text style={{ ...s.stripVal, color: hi ? "#fff" : NAVY }}>{v}</Text>
            </View>
          ))}
        </View>
        <View style={s.special} wrap={false}>
          <Text style={s.specialLab}>SPECIAL CONDITIONS</Text>
          <Text style={s.specialVal}>{c.specialConditions || "—"}</Text>
        </View>
      </Frame>
    </Page>
  )
}

function Complimentary({ c }: { c: QuotationConfig }) {
  const items = QUOTATION_PRODUCTS.filter((p) => c.complimentaryProducts.includes(p.slug))
  return (
    <Page size="A4" style={s.page}>
      <Frame>
        <Title title="Complimentary Products" sub="Eco-friendly recycled products provided as part of the agreed service plan" />
        <View style={s.grid}>
          {items.map((p) => (
            <View key={p.slug} style={s.card} wrap={false}>
              <Image src={asset("products", `${p.slug}.png`)} style={{ width: 72, height: 90 }} />
              <Text style={s.cardName}>{p.name}</Text>
            </View>
          ))}
        </View>
        <Text style={{ ...T(9, INK), textAlign: "center", marginTop: 18 }}>
          For more products, visit <Text style={T(9, ORANGE, 500)}>kraftreborn.com</Text>
        </Text>
      </Frame>
    </Page>
  )
}

const COLS = { no: 22, img: 50, hsn: 44, qty: 26, rate: 52, igst: 40, cgst: 38, amt: 58 }

function Party({ label, p }: { label: string; p: QuotationConfig["bill"] }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: TINT, padding: 4, borderBottomWidth: 0.6, borderBottomColor: HAIR }}>
        <Text style={s.cellB}>{label}</Text>
      </View>
      <View style={{ padding: 6 }}>
        <Text style={s.cellB}>{p.name}</Text>
        <Text style={s.cellM}>{partyAddress(p)}</Text>
        {p.gstin ? <Text style={s.cellM}>GSTIN : {p.gstin}</Text> : null}
      </View>
    </View>
  )
}

function Invoice({ c, k }: { c: QuotationConfig; k: Computed }) {
  const meta: [string, string][] = [
    ["PI No.", c.piNo],
    ["Date", formatDate(c.date)],
    ["Valid till", formatDate(k.validTill)],
  ]
  return (
    <Page size="A4" style={s.page} break>
      <Frame>
        <View style={s.bar}>
          <Text style={T(10, "#fff", 700)}>PROFORMA INVOICE</Text>
        </View>
        <View style={{ ...s.box, flexDirection: "row", borderTopWidth: 0 }} wrap={false}>
          <View style={{ flex: 1, padding: 6 }}>
            <Text style={{ ...s.cellB, marginBottom: 3 }}>Buffindia Receptacles Private Limited</Text>
            <Text style={s.cellM}>GSTIN : 24AAICB0616J1ZY</Text>
            <Text style={s.cellM}>CIN : U36999GJ2018PTC104688</Text>
            <Text style={s.cellM}>accounts@buffindia.com  ·  9512120366</Text>
          </View>
          <View style={{ width: 160, borderLeftWidth: 0.6, borderLeftColor: HAIR }}>
            {meta.map(([l, v], i) => (
              <View key={l} style={{ flexDirection: "row", borderTopWidth: i ? 0.6 : 0, borderTopColor: HAIR }}>
                <Text style={{ ...s.cellM, width: 60, padding: 4 }}>{l}</Text>
                <Text style={{ ...s.cellB, flex: 1, padding: 4, borderLeftWidth: 0.6, borderLeftColor: HAIR }}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ ...s.box, flexDirection: "row", borderTopWidth: 0 }} wrap={false}>
          <Party label="Billing Address" p={c.bill} />
          <View style={{ width: 0.6, backgroundColor: HAIR }} />
          <Party label="Shipping Address" p={c.ship} />
        </View>

        {/* items */}
        <View style={{ marginTop: 8 }}>
          <View fixed style={{ flexDirection: "row", backgroundColor: NAVY, paddingVertical: 5 }}>
            <Text style={{ ...s.th, width: COLS.no, paddingLeft: 4 }}>No.</Text>
            <Text style={{ ...s.th, width: COLS.img }}>Image</Text>
            <Text style={{ ...s.th, flex: 1 }}>Item & Description</Text>
            <Text style={{ ...s.th, width: COLS.hsn }}>HSN / SAC</Text>
            <Text style={{ ...s.th, width: COLS.qty }}>Qty</Text>
            <Text style={{ ...s.th, width: COLS.rate, textAlign: "right" }}>Rate (₹)</Text>
            {k.taxType === "CGST_SGST" ? (
              <>
                <Text style={{ ...s.th, width: COLS.cgst, textAlign: "right" }}>CGST 9%</Text>
                <Text style={{ ...s.th, width: COLS.cgst, textAlign: "right" }}>SGST 9%</Text>
              </>
            ) : (
              <Text style={{ ...s.th, width: COLS.igst, textAlign: "right" }}>IGST</Text>
            )}
            <Text style={{ ...s.th, width: COLS.amt, textAlign: "right", paddingRight: 4 }}>Amount (₹)</Text>
          </View>
          {k.lines.map((l) => (
            <View
              key={l.no}
              wrap={false}
              style={{ flexDirection: "row", paddingVertical: 5, borderBottomWidth: 0.6, borderBottomColor: HAIR, borderLeftWidth: 0.6, borderRightWidth: 0.6, borderColor: HAIR }}
            >
              <Text style={{ ...s.cell, width: COLS.no, paddingLeft: 4 }}>{l.no}</Text>
              <View style={{ width: COLS.img }}>
                {l.image ? <Image src={asset(l.image === "basic" ? "kiosk-basic.jpg" : "kiosk-advance.jpg")} style={{ width: 38, height: 50, objectFit: "contain" }} /> : null}
              </View>
              <View style={{ flex: 1, paddingRight: 4 }}>
                <Text style={s.cellB}>{l.name}</Text>
                {l.description.map((d) => (
                  <Text key={d} style={s.cellM}>{d}</Text>
                ))}
              </View>
              <Text style={{ ...s.cell, width: COLS.hsn }}>{l.sac}</Text>
              <Text style={{ ...s.cell, width: COLS.qty }}>{l.qty}</Text>
              <Text style={{ ...s.cell, width: COLS.rate, textAlign: "right" }}>{formatInrNumber(l.rate)}</Text>
              {k.taxType === "CGST_SGST" ? (
                <>
                  <Text style={{ ...s.cell, width: COLS.cgst, textAlign: "right" }}>{formatInrNumber(l.cgst)}</Text>
                  <Text style={{ ...s.cell, width: COLS.cgst, textAlign: "right" }}>{formatInrNumber(l.sgst)}</Text>
                </>
              ) : (
                <Text style={{ ...s.cell, width: COLS.igst, textAlign: "right" }}>{(k.gstRate * 100).toFixed(2)}%</Text>
              )}
              <Text style={{ ...s.cellB, width: COLS.amt, textAlign: "right", paddingRight: 4 }}>{formatInrNumber(l.amount)}</Text>
            </View>
          ))}
        </View>

        {/* totals … signatory: kept together */}
        <View wrap={false} style={{ marginTop: 8 }}>
          <View style={{ ...s.box, flexDirection: "row" }}>
            <View style={{ flex: 1, padding: 6 }}>
              <Text style={s.cellM}>Total PI Amount in Words :</Text>
              <Text style={{ ...s.cellB, marginTop: 3 }}>{k.words}</Text>
              {k.taxType === "SEZ" && <Text style={{ ...s.cellM, marginTop: 4 }}>Supply to Special Economic Zone (SEZ) - zero-rated, IGST 0%.</Text>}
            </View>
            <View style={{ width: 190, borderLeftWidth: 0.6, borderLeftColor: HAIR }}>
              {[
                ["Total Amount before Tax (₹)", formatInrNumber(k.taxable)],
                ...(k.taxType === "CGST_SGST"
                  ? [["Add CGST 9% (₹)", formatInrNumber(k.cgst)], ["Add SGST 9% (₹)", formatInrNumber(k.sgst)]]
                  : [[k.taxType === "SEZ" ? "IGST – SEZ zero-rated (₹)" : "Add IGST (₹)", formatInrNumber(k.igst)]]),
              ].map(([l, v]) => (
                <View key={l} style={{ flexDirection: "row", justifyContent: "space-between", padding: 4, borderBottomWidth: 0.6, borderBottomColor: HAIR }}>
                  <Text style={s.cellM}>{l}</Text>
                  <Text style={s.cell}>{v}</Text>
                </View>
              ))}
              <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 5, backgroundColor: NAVY }}>
                <Text style={T(8, "#fff", 700)}>Grand Total (₹)</Text>
                <Text style={T(8, "#fff", 700)}>{formatInrNumber(k.grandTotal)}</Text>
              </View>
            </View>
          </View>

          <Text style={{ ...s.cellB, marginTop: 8, marginBottom: 3 }}>Bank Details :</Text>
          <View style={s.box}>
            <View style={{ flexDirection: "row", backgroundColor: TINT }}>
              {["Bank Name", "Branch", "Account No.", "IFSC"].map((h) => (
                <Text key={h} style={{ ...s.cellB, flex: 1, padding: 4 }}>{h}</Text>
              ))}
            </View>
            <View style={{ flexDirection: "row", borderTopWidth: 0.6, borderTopColor: HAIR }}>
              {["HDFC Bank Ltd", "Odhav Kathwada Branch", "50200035165761", "HDFC0004289"].map((v) => (
                <Text key={v} style={{ ...s.cell, flex: 1, padding: 4 }}>{v}</Text>
              ))}
            </View>
          </View>

          <View style={{ ...s.box, flexDirection: "row", marginTop: 8 }}>
            <Text style={{ ...s.cellB, width: 120, padding: 5, backgroundColor: TINT }}>Special Conditions (if applicable)</Text>
            <Text style={{ ...s.cell, flex: 1, padding: 5 }}>{c.specialConditions || "—"}</Text>
          </View>

          <View style={{ ...s.box, flexDirection: "row", marginTop: 8 }}>
            <View style={{ flex: 1, padding: 6 }}>
              <Text style={{ ...s.cellB, marginBottom: 3 }}>Terms & Conditions :</Text>
              {[
                "Proforma is valid for 15 days",
                "Payment: 100% Advance",
                "Confidentiality: Client info is secure, disclosed only by law.",
                "Liability: Limited to fees paid; no indirect damages.",
                "Non-Payment: May lead to service suspension and record hold.",
                "Disputes: Raise within 15 Days subject to Ahmedabad jurisdiction.",
                "We are an MSME registered company. Payments are due within 45 days from the invoice date.",
              ].map((t) => (
                <Text key={t} style={s.cellM}>•  {t}</Text>
              ))}
              <Text style={{ ...s.cellM, marginTop: 5 }}>This is a computer-generated proforma invoice. E. & O. E.</Text>
            </View>
            <View style={{ width: 170, borderLeftWidth: 0.6, borderLeftColor: HAIR, padding: 6, alignItems: "center" }}>
              <Text style={{ ...s.cellM, textAlign: "center" }}>For, Buffindia Receptacles Private Limited</Text>
              <View style={{ flexDirection: "row", marginVertical: 4 }}>
                <Image src={asset("signature.png")} style={{ width: 46, height: 45 }} />
                <Image src={asset("stamp.png")} style={{ width: 46, height: 43, marginLeft: 4 }} />
              </View>
              <Text style={s.cellB}>Authorised Signatory</Text>
            </View>
          </View>
        </View>
      </Frame>
    </Page>
  )
}

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

function Scope() {
  return (
    <Page size="A4" style={s.page} break>
      <Frame>
        <Title title="Scope & Responsibilities" sub="Scope of services and Service Provider responsibilities" />
        <Text style={s.secT}>SCOPE OF SERVICES</Text>
        {SCOPE.map((t, i) => <Num key={t} n={`${i + 1}.`}>{t}</Num>)}
        <Text style={s.secT}>SERVICE PROVIDER RESPONSIBILITIES</Text>
        {PROVIDER.map((t, i) => <Num key={t} n={`${i + 1}.`}>{t}</Num>)}
      </Frame>
    </Page>
  )
}

function ClientPage({ c }: { c: QuotationConfig }) {
  return (
    <Page size="A4" style={s.page} break>
      <Frame>
        <Title title="Client Responsibilities & Acknowledgement" sub="Client obligations, liability, ownership and authorised signatures" />
        <Text style={s.secT}>CLIENT RESPONSIBILITIES</Text>
        {CLIENT_A.map((t, i) => <Num key={t} n={`${i + 1}.`}>{t}</Num>)}
        <Num n="3.">The Client shall provide necessary approvals for:</Num>
        {CLIENT_APPROVALS.map((t, i) => (
          <View key={t} style={s.subLi} wrap={false}>
            <Text style={s.liNo}>{String.fromCharCode(97 + i)}.</Text>
            <Text style={s.liTx}>{t}</Text>
          </View>
        ))}
        {CLIENT_B.map((t, i) => <Num key={t} n={`${i + 4}.`}>{t}</Num>)}
        <Text style={s.secT}>RESPONSIBILITY</Text>
        <Text style={s.para}>The Client shall be responsible for any fire-related hazards arising from improper use of the disposal units.</Text>
        <Text style={s.secT}>OWNERSHIP</Text>
        <Text style={s.para}>
          This is a rental-based service, and all installed units and related infrastructure shall remain the property of the Service Provider.
        </Text>
        <View wrap={false} style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
          <View style={s.sigBox}>
            <Text style={{ ...s.cellB, marginBottom: 4 }}>For Buffindia Receptacles Private Limited</Text>
            <View style={{ flexDirection: "row" }}>
              <Image src={asset("signature.png")} style={{ width: 46, height: 45 }} />
              <Image src={asset("stamp.png")} style={{ width: 46, height: 43, marginLeft: 6 }} />
            </View>
            <Text style={s.cellB}>Ketan Prajapati</Text>
            <Text style={s.cellM}>Founding Director</Text>
            <Text style={{ ...s.cellM, marginTop: 4 }}>Date: {formatDate(c.date)}</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={{ ...s.cellB, marginBottom: 30 }}>For {c.clientName}</Text>
            <Text style={s.cellB}>Authorized Signatory</Text>
            <Text style={{ ...s.cellM, marginTop: 6 }}>Name:</Text>
            <Text style={{ ...s.cellM, marginTop: 6 }}>Designation:</Text>
            <Text style={{ ...s.cellM, marginTop: 6 }}>Date:</Text>
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
    <Document title={`Buffindia Proposal - ${config.clientName}`} author="Buffindia Receptacles Pvt Ltd">
      <Cover c={config} />
      <Commercials c={config} k={k} />
      {config.complimentaryProducts.length > 0 && <Complimentary c={config} />}
      <Invoice c={config} k={k} />
      <Scope />
      <ClientPage c={config} />
    </Document>
  )
}

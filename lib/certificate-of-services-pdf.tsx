import React from "react"
import path from "path"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Path,
  Link,
} from "@react-pdf/renderer"

const GREEN = "#1B4332"
const GOLD = "#B8954A"
const DARK = "#1A1A1A"
const MUTED = "#5C6570"
const LINE = "#C9CED4"
const WHITE = "#FFFFFF"
const PAGE_BG = "#FAFAF8"

function asset(...parts: string[]) {
  return path.join(process.cwd(), "public", "report-assets", ...parts)
}

const PAGE_PAD = 14

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    backgroundColor: PAGE_BG,
    padding: PAGE_PAD,
  },
  outer: {
    height: 595.28 - PAGE_PAD * 2,
    width: 841.89 - PAGE_PAD * 2,
    borderWidth: 2.4,
    borderColor: GREEN,
    padding: 4,
  },
  inner: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: GOLD,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 22,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  supported: {
    fontSize: 7,
    color: MUTED,
    textAlign: "right",
    marginBottom: 4,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 34,
    color: GREEN,
    textAlign: "center",
    letterSpacing: 2,
  },
  subtitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 2,
    gap: 10,
  },
  goldLine: {
    height: 1,
    width: 88,
    backgroundColor: GOLD,
  },
  subtitle: {
    fontSize: 10,
    color: GOLD,
    fontFamily: "Times-Bold",
    letterSpacing: 1.4,
    textAlign: "center",
  },
  flourish: {
    alignSelf: "center",
    marginBottom: 12,
  },
  orgName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    textAlign: "center",
    marginBottom: 8,
    marginTop: 2,
  },
  narrative: {
    fontSize: 9,
    lineHeight: 1.45,
    color: "#3F4A55",
    textAlign: "center",
    maxWidth: 620,
    alignSelf: "center",
    marginBottom: 16,
  },
  panel: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: WHITE,
  },
  panelHead: {
    alignSelf: "center",
    marginTop: -1,
    backgroundColor: GREEN,
    paddingVertical: 5,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  panelHeadText: {
    color: WHITE,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textAlign: "center",
  },
  panelBody: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  metricCard: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  metricValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    textAlign: "center",
    marginTop: 6,
  },
  metricUnit: {
    fontSize: 8,
    color: MUTED,
    textAlign: "center",
    marginTop: 1,
  },
  metricLabel: {
    fontSize: 6.5,
    color: MUTED,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 1.25,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  certRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  isoCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 3,
    padding: 8,
    backgroundColor: "#F7F9F7",
    alignItems: "center",
  },
  isoEyebrow: {
    fontSize: 6,
    color: GOLD,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
    letterSpacing: 0.4,
  },
  isoTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    textAlign: "center",
  },
  isoScope: {
    fontSize: 6.5,
    color: MUTED,
    marginTop: 3,
    textAlign: "center",
    lineHeight: 1.25,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginTop: 4,
  },
  signBlock: {
    alignItems: "center",
    minWidth: 180,
  },
  signLine: {
    width: 150,
    height: 1,
    backgroundColor: GOLD,
    marginTop: 2,
    marginBottom: 4,
  },
  signTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    letterSpacing: 0.4,
  },
  signRole: {
    fontSize: 7,
    color: MUTED,
    marginTop: 1,
    textAlign: "center",
  },
  metaStrip: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: LINE,
  },
  metaText: {
    fontSize: 6.5,
    color: MUTED,
  },
  metaStrong: {
    fontSize: 6.5,
    color: DARK,
    fontFamily: "Helvetica-Bold",
  },
})

function GoldFlourish() {
  return (
    <Svg width={28} height={10} viewBox="0 0 28 10" style={styles.flourish}>
      <Path d="M2 5 H11" stroke={GOLD} strokeWidth={1} />
      <Path d="M14 2 L16 5 L14 8 L12 5 Z" fill={GOLD} />
      <Path d="M17 5 H26" stroke={GOLD} strokeWidth={1} />
    </Svg>
  )
}

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#E8F2EA",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  )
}

function BinIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M6 8h12l-1 12H7L6 8zM9 8V6h6v2M4 8h16" stroke={GREEN} strokeWidth={1.6} fill="none" />
    </Svg>
  )
}

function ButtsIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M3 13h12v4H3zM15 13h4v4h-4zM20 11c1-2 2-3.5 3-5" stroke={GREEN} strokeWidth={1.5} fill="none" />
    </Svg>
  )
}

function RecycleIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M7 8l2-4h6l2 4M4 13l-2 4h7m9-4l2 4h-7M9 20l3-4 3 4"
        stroke={GREEN}
        strokeWidth={1.4}
        fill="none"
      />
    </Svg>
  )
}

function LoopIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M4 12a8 8 0 0114-5l2 2M20 12a8 8 0 01-14 5l-2-2" stroke={GREEN} strokeWidth={1.4} fill="none" />
      <Path d="M20 4v5h-5M4 20v-5h5" stroke={GREEN} strokeWidth={1.4} fill="none" />
    </Svg>
  )
}

export interface ServiceCertificateData {
  certificateNumber: string
  companyName: string
  location: string
  fiscalYear: string
  totalWasteKg: number
  cigaretteButts: number
  microplasticUpcycledKg: number
  recycledPercent: number
  issuedBy: string
  issueDate: string
  validTill: string
  customerId: string
  logoUrl?: string | null
  verifyUrl: string
  phone?: string
}

export function CertificateOfServicesPdf({ data }: { data: ServiceCertificateData }) {
  const waste = Number(data.totalWasteKg || 0)
  const butts = Math.max(0, Math.round(Number(data.cigaretteButts || 0)))
  const micro = Number(data.microplasticUpcycledKg || 0)

  const isos = [
    { standard: "ISO 9001:2015", scope: "Quality Management System" },
    { standard: "ISO 14001:2015", scope: "Environmental Management System" },
    { standard: "ISO 45001:2018", scope: "Occupational Health & Safety\nManagement System" },
  ]

  const metrics = [
    {
      icon: <BinIcon />,
      value: `${waste.toFixed(2)} KG`,
      label: "CIGARETTE WASTE\nCOLLECTED",
    },
    {
      icon: <ButtsIcon />,
      value: butts.toLocaleString("en-IN"),
      label: "NO. OF CIGARETTE\nBUTTS COLLECTED",
    },
    {
      icon: <RecycleIcon />,
      value: `${micro.toFixed(2)} KG`,
      label: "MICROPLASTIC\nRECYCLED",
    },
    {
      icon: <LoopIcon />,
      value: `${data.recycledPercent || 80}%`,
      label: "RECYCLED INTO\nSUSTAINABLE PRODUCTS",
    },
  ]

  return (
    <Document title={`Certificate of Clean Environmental Partnership — ${data.companyName}`}>
      <Page size="A4" orientation="landscape" wrap={false} style={styles.page}>
        <View style={styles.outer} wrap={false}>
          <View style={styles.inner} wrap={false}>
            <View style={styles.header}>
              <Image
                src={asset("buffindia-logo-brand.png")}
                style={{ width: 190, height: 44, objectFit: "contain" }}
              />
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.supported}>Proudly supported by</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Link src="https://iimaventures.com">
                    <Image src={asset("iima.png")} style={{ width: 52, height: 24, objectFit: "contain" }} />
                  </Link>
                  <Link src="https://www.kotak.bank.in/en/about-us/kotak-bizlabs.html">
                    <Image src={asset("kotak.png")} style={{ width: 72, height: 22, objectFit: "contain" }} />
                  </Link>
                </View>
              </View>
            </View>

            <Text style={styles.title}>CERTIFICATE</Text>
            <View style={styles.subtitleWrap}>
              <View style={styles.goldLine} />
              <Text style={styles.subtitle}>OF CLEAN ENVIRONMENTAL PARTNERSHIP</Text>
              <View style={styles.goldLine} />
            </View>
            <GoldFlourish />

            <Text style={styles.orgName}>{data.companyName || "Partner Organization"}</Text>
            <Text style={styles.narrative}>
              is an esteemed partner of Buffindia Receptacles Pvt. Ltd. for responsible cigarette waste
              management and contributing to a cleaner, healthier and more sustainable environment. This
              partnership supports the circular economy and drives measurable environmental and social
              impact.
            </Text>

            <View style={styles.panel}>
              <View style={styles.panelHead}>
                <Text style={styles.panelHeadText}>YOUR IMPACT WITH BUFFINDIA</Text>
              </View>
              <View style={styles.panelBody}>
                <View style={styles.metricsRow}>
                  {metrics.map((m) => (
                    <View key={m.label} style={styles.metricCard}>
                      <IconCircle>{m.icon}</IconCircle>
                      <Text style={styles.metricValue}>{m.value}</Text>
                      <Text style={styles.metricLabel}>{m.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHead}>
                <Text style={styles.panelHeadText}>YOUR CERTIFICATIONS</Text>
              </View>
              <View style={styles.panelBody}>
                <View style={styles.certRow}>
                  {isos.map((iso) => (
                    <View key={iso.standard} style={styles.isoCard}>
                      <Text style={styles.isoEyebrow}>ISO CERTIFIED</Text>
                      <Text style={styles.isoTitle}>{iso.standard}</Text>
                      <Text style={styles.isoScope}>{iso.scope}</Text>
                    </View>
                  ))}
                  <View style={[styles.isoCard, { flex: 1.15 }]}>
                    <Text style={styles.isoEyebrow}>GRS CERTIFIED</Text>
                    <Text style={styles.isoTitle}>Global Recycled Standard</Text>
                    <Text style={styles.isoScope}>GRS CERTIFICATE NO.{"\n"}ACL25050801</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.signBlock}>
                <Image
                  src={asset("ketan-signature.png")}
                  style={{ width: 120, height: 28, objectFit: "contain", marginBottom: 2 }}
                />
                <View style={styles.signLine} />
                <Text style={styles.signTitle}>KETAN PRAJAPATI</Text>
                <Text style={styles.signRole}>Founder & CEO</Text>
                <Text style={styles.signRole}>Buffindia Receptacles Pvt. Ltd.</Text>
              </View>
            </View>

            <View style={styles.metaStrip}>
              <Text style={styles.metaText}>
                Cert No. <Text style={styles.metaStrong}>{data.certificateNumber}</Text>
              </Text>
              <Text style={styles.metaText}>
                Issued <Text style={styles.metaStrong}>{data.issueDate}</Text>
              </Text>
              <Text style={styles.metaText}>
                Valid <Text style={styles.metaStrong}>{data.validTill || "Lifetime"}</Text>
              </Text>
              <Text style={styles.metaText}>
                ID <Text style={styles.metaStrong}>{data.customerId}</Text>
              </Text>
              <Text style={styles.metaText}>
                Location <Text style={styles.metaStrong}>{data.location || "India"}</Text>
              </Text>
              <Link src={data.verifyUrl}>
                <Text style={[styles.metaStrong, { color: GREEN }]}>Verify online</Text>
              </Link>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

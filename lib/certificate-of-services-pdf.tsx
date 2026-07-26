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
  Circle,
  Link,
} from "@react-pdf/renderer"

const GREEN = "#1B4332"
const GOLD = "#B8954A"
const DARK = "#1A1A1A"
const MUTED = "#5C6570"
const LINE = "#D8DDE3"
const CREAM = "#F7F4EC"
const WHITE = "#FFFFFF"

function asset(...parts: string[]) {
  return path.join(process.cwd(), "public", "report-assets", ...parts)
}

/** A4 landscape usable area after page padding */
const PAGE_PAD = 10

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: DARK,
    backgroundColor: CREAM,
    padding: PAGE_PAD,
  },
  frame: {
    height: 595.28 - PAGE_PAD * 2,
    width: 841.89 - PAGE_PAD * 2,
    borderWidth: 2.2,
    borderColor: GOLD,
    padding: 3,
  },
  inner: {
    flex: 1,
    borderWidth: 1.1,
    borderColor: GREEN,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
    position: "relative",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  brandSub: {
    fontSize: 5.5,
    color: GREEN,
    letterSpacing: 0.8,
    marginTop: 2,
    fontWeight: "bold",
  },
  supported: {
    fontSize: 6,
    color: MUTED,
    textAlign: "right",
    marginBottom: 2,
  },
  body: {
    flexDirection: "row",
    height: 430,
  },
  sidebar: {
    width: 145,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: LINE,
  },
  main: {
    flex: 1,
    paddingLeft: 12,
  },
  seal: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2.5,
    borderColor: GOLD,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 4,
    padding: 6,
  },
  sealText: {
    fontSize: 5,
    color: GREEN,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 1.2,
    fontWeight: "bold",
  },
  ribbon: {
    alignSelf: "center",
    backgroundColor: GREEN,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 2,
    marginBottom: 8,
  },
  ribbonText: {
    color: WHITE,
    fontSize: 5,
    fontWeight: "bold",
  },
  metaLabel: {
    fontSize: 6,
    color: MUTED,
    fontWeight: "bold",
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  metaValue: {
    fontSize: 8,
    color: DARK,
    fontWeight: "bold",
    marginBottom: 7,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 26,
    color: GREEN,
    textAlign: "center",
    letterSpacing: 1.5,
  },
  goldRule: {
    height: 1,
    backgroundColor: GOLD,
    width: "65%",
    alignSelf: "center",
    marginVertical: 3,
  },
  subtitle: {
    fontSize: 9,
    color: GOLD,
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 6,
  },
  certify: {
    fontSize: 8,
    color: MUTED,
    textAlign: "center",
    marginBottom: 2,
  },
  orgName: {
    fontSize: 14,
    fontWeight: "bold",
    color: GREEN,
    textAlign: "center",
    marginBottom: 4,
  },
  narrative: {
    fontSize: 7,
    lineHeight: 1.4,
    color: "#3F4A55",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  panel: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 7,
    backgroundColor: WHITE,
  },
  panelHead: {
    backgroundColor: GREEN,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  panelHeadText: {
    color: WHITE,
    fontSize: 7.5,
    fontWeight: "bold",
    letterSpacing: 0.7,
    textAlign: "center",
  },
  panelBody: {
    padding: 6,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 4,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 3,
    alignItems: "center",
    backgroundColor: CREAM,
  },
  metricValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: GREEN,
    textAlign: "center",
    marginTop: 3,
  },
  metricUnit: {
    fontSize: 5.5,
    color: MUTED,
    textAlign: "center",
  },
  metricLabel: {
    fontSize: 5,
    color: MUTED,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 1.2,
    fontWeight: "bold",
  },
  certRow: {
    flexDirection: "row",
    gap: 4,
  },
  isoCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 3,
    padding: 4,
    backgroundColor: CREAM,
  },
  isoEyebrow: {
    fontSize: 5,
    color: GOLD,
    fontWeight: "bold",
    marginBottom: 1,
  },
  isoTitle: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: GREEN,
  },
  isoScope: {
    fontSize: 5.5,
    color: MUTED,
    marginTop: 1,
  },
  signBlock: {
    alignItems: "flex-end",
    marginTop: 2,
  },
  signName: {
    fontFamily: "Times-Italic",
    fontSize: 12,
    color: GREEN,
  },
  signTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: DARK,
  },
  signRole: {
    fontSize: 6,
    color: MUTED,
  },
  footer: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 5,
  },
  valuesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  valueText: {
    fontSize: 5.5,
    color: MUTED,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
  },
  contactText: {
    fontSize: 6,
    color: MUTED,
  },
})

function Corner({ position }: { position: "tl" | "br" }) {
  if (position === "tl") {
    return (
      <Svg style={{ position: "absolute", top: 0, left: 0 }} width={42} height={42} viewBox="0 0 42 42">
        <Path d="M0 0 H42 L0 42 Z" fill={GREEN} />
        <Path d="M0 0 H30 L0 30 Z" fill={GOLD} />
      </Svg>
    )
  }
  return (
    <Svg style={{ position: "absolute", bottom: 0, right: 0 }} width={42} height={42} viewBox="0 0 42 42">
      <Path d="M42 42 H0 L42 0 Z" fill={GREEN} />
      <Path d="M42 42 H12 L42 12 Z" fill={GOLD} />
    </Svg>
  )
}

function Leaf({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3c5 2 8 7 8 12-4 1-8 1-12-1C6 10 8 5 12 3z" stroke={GREEN} strokeWidth={1.6} fill="none" />
      <Path d="M12 21V9" stroke={GREEN} strokeWidth={1.4} fill="none" />
    </Svg>
  )
}

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#E7F2EA",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  )
}

function CigaretteIcon() {
  return (
    <Svg width={9} height={9} viewBox="0 0 24 24">
      <Path d="M2 13h13v4H2zM15 13h4v4h-4zM20 11c1-2 2-3.5 3-5" stroke={GREEN} strokeWidth={1.5} fill="none" />
    </Svg>
  )
}

function Co2Icon() {
  return (
    <Svg width={9} height={9} viewBox="0 0 24 24">
      <Path d="M12 3c3 4 6 7 6 11a6 6 0 11-12 0c0-4 3-7 6-11z" stroke={GREEN} strokeWidth={1.5} fill="none" />
    </Svg>
  )
}

function RecycleIcon() {
  return (
    <Svg width={9} height={9} viewBox="0 0 24 24">
      <Path d="M7 8l2-4h6l2 4M4 13l-2 4h7m9-4l2 4h-7M9 20l3-4 3 4" stroke={GREEN} strokeWidth={1.4} fill="none" />
    </Svg>
  )
}

function PeopleIcon() {
  return (
    <Svg width={9} height={9} viewBox="0 0 24 24">
      <Circle cx="9" cy="8" r="3" stroke={GREEN} strokeWidth={1.4} fill="none" />
      <Circle cx="17" cy="9" r="2.2" stroke={GREEN} strokeWidth={1.3} fill="none" />
      <Path d="M3 19c1-3 3.5-5 6-5s5 2 6 5M14 14c2 0 4 1 5 3" stroke={GREEN} strokeWidth={1.4} fill="none" />
    </Svg>
  )
}

export interface ServiceCertificateData {
  certificateNumber: string
  companyName: string
  location: string
  fiscalYear: string
  totalWasteKg: number
  co2PreventedKg: number
  tobaccoAshKg: number
  recycledPercent: number
  peopleImpacted: number
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
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=4&data=${encodeURIComponent(data.verifyUrl)}`

  const isos = [
    { standard: "ISO 9001:2015", scope: "Quality Management" },
    { standard: "ISO 14001:2015", scope: "Environmental Mgmt" },
    { standard: "ISO 45001:2018", scope: "Health & Safety" },
    { standard: "ISO 27001:2022", scope: "Information Security" },
  ]

  const metrics = [
    { icon: <CigaretteIcon />, value: waste.toFixed(2), unit: "KG", label: "CIGARETTE WASTE\nCOLLECTED" },
    {
      icon: <Co2Icon />,
      value: data.co2PreventedKg.toLocaleString("en-IN"),
      unit: "KG CO₂",
      label: "CO₂ EMISSIONS\nPREVENTED",
    },
    { icon: <Leaf size={9} />, value: data.tobaccoAshKg.toFixed(2), unit: "KG", label: "TOBACCO & ASH\nCOMPOSTED" },
    {
      icon: <RecycleIcon />,
      value: String(data.recycledPercent),
      unit: "%",
      label: "RECYCLED INTO\nSUSTAINABLE PRODUCTS",
    },
    {
      icon: <PeopleIcon />,
      value: data.peopleImpacted.toLocaleString("en-IN"),
      unit: "PEOPLE",
      label: "IMPACTING HEALTHIER\nCOMMUNITIES",
    },
  ]

  return (
    <Document title={`Certificate of Clean Environmental Partnership — ${data.companyName}`}>
      <Page size="A4" orientation="landscape" wrap={false} style={styles.page}>
        <View style={styles.frame} wrap={false}>
          <View style={styles.inner} wrap={false}>
            <Corner position="tl" />
            <Corner position="br" />

            <View style={styles.header}>
              <View>
                <Image
                  src={asset("buffindia-logo-clear.png")}
                  style={{ width: 148, height: 50, objectFit: "contain" }}
                />
                <Text style={styles.brandSub}>CIGARETTE WASTE MANAGEMENT</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.supported}>Proudly supported by</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Link src="https://iimaventures.com">
                    <Image src={asset("iima.png")} style={{ width: 48, height: 22, objectFit: "contain" }} />
                  </Link>
                  <Link src="https://www.kotak.bank.in/en/about-us/kotak-bizlabs.html">
                    <Image src={asset("kotak.png")} style={{ width: 68, height: 20, objectFit: "contain" }} />
                  </Link>
                </View>
              </View>
            </View>

            <View style={styles.body}>
              <View style={styles.sidebar}>
                <View style={styles.seal}>
                  <Leaf size={18} />
                  <Text style={styles.sealText}>Towards a Cleaner{"\n"}Tomorrow. Together.</Text>
                </View>
                <View style={styles.ribbon}>
                  <Text style={styles.ribbonText}>OFFICIAL PARTNERSHIP</Text>
                </View>

                {data.logoUrl ? (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: LINE,
                      borderRadius: 4,
                      padding: 4,
                      marginBottom: 8,
                      alignItems: "center",
                      backgroundColor: WHITE,
                    }}
                  >
                    <Image src={data.logoUrl} style={{ width: 72, height: 34, objectFit: "contain" }} />
                  </View>
                ) : null}

                <Text style={styles.metaLabel}>CERTIFICATE NO.</Text>
                <Text style={styles.metaValue}>{data.certificateNumber || "BUFF-CEP-000"}</Text>
                <Text style={styles.metaLabel}>DATE OF ISSUE</Text>
                <Text style={styles.metaValue}>{data.issueDate || "—"}</Text>
                <Text style={styles.metaLabel}>VALID TILL</Text>
                <Text style={styles.metaValue}>{data.validTill || "Lifetime"}</Text>
                <Text style={styles.metaLabel}>CUSTOMER ID</Text>
                <Text style={styles.metaValue}>{data.customerId || "—"}</Text>
                <Text style={styles.metaLabel}>LOCATION(S)</Text>
                <Text style={styles.metaValue}>{data.location || "India"}</Text>
              </View>

              <View style={styles.main}>
                <Text style={styles.title}>CERTIFICATE</Text>
                <View style={styles.goldRule} />
                <Text style={styles.subtitle}>OF CLEAN ENVIRONMENTAL PARTNERSHIP</Text>
                <Text style={styles.certify}>This is to certify that</Text>
                <Text style={styles.orgName}>{data.companyName || "Partner Organization"}</Text>
                <Text style={styles.narrative}>
                  is an esteemed partner of Buffindia Receptacles Pvt. Ltd. for responsible cigarette
                  waste management. Through this partnership, they have contributed to a cleaner
                  environment, reduced toxic litter, and advanced circular recovery of cigarette waste
                  into sustainable products — creating measurable environmental and social impact for a
                  Butt Free India.
                </Text>

                <View style={styles.panel}>
                  <View style={styles.panelHead}>
                    <Text style={styles.panelHeadText}>
                      YOUR IMPACT WITH BUFFINDIA ({data.fiscalYear})
                    </Text>
                  </View>
                  <View style={styles.panelBody}>
                    <View style={styles.metricsRow}>
                      {metrics.map((m) => (
                        <View key={m.label} style={styles.metricCard}>
                          <IconCircle>{m.icon}</IconCircle>
                          <Text style={styles.metricValue}>{m.value}</Text>
                          <Text style={styles.metricUnit}>{m.unit}</Text>
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
                      <View style={[styles.isoCard, { flex: 1.1 }]}>
                        <Text style={styles.isoEyebrow}>GRS CERTIFIED</Text>
                        <Text style={styles.isoTitle}>Global Recycled Standard</Text>
                        <Text style={styles.isoScope}>Circular product recovery</Text>
                      </View>
                      <View
                        style={{
                          width: 72,
                          borderWidth: 1,
                          borderColor: LINE,
                          borderRadius: 3,
                          padding: 4,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: WHITE,
                        }}
                      >
                        <Image src={qrSrc} style={{ width: 44, height: 44 }} />
                        <Text style={{ fontSize: 4.5, color: MUTED, textAlign: "center", marginTop: 2 }}>
                          Scan to verify
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.signBlock}>
                  <Text style={styles.signName}>Ketan Prajapati</Text>
                  <Text style={styles.signTitle}>KETAN PRAJAPATI</Text>
                  <Text style={styles.signRole}>Founder & CEO, Buffindia Receptacles Pvt. Ltd.</Text>
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.valuesRow}>
                {[
                  "End-to-End Waste Management",
                  "Environmentally Responsible",
                  "Measurable Impact",
                  "Driving the Circular Economy",
                  "Aligned with UN SDGs",
                ].map((label) => (
                  <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: GREEN }} />
                    <Text style={styles.valueText}>{label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.contactRow}>
                <Text style={styles.contactText}>www.buffindia.com</Text>
                <Text style={styles.contactText}>info@buffindia.com</Text>
                <Text style={styles.contactText}>{data.phone || "+91 63595 66528"}</Text>
                <Link src={data.verifyUrl}>
                  <Text style={[styles.contactText, { color: GREEN, fontWeight: "bold" }]}>Verify online</Text>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

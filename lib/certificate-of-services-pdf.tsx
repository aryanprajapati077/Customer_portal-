import React from "react"
import path from "path"
import { Document, Page, Text, View, StyleSheet, Image, Svg, Path, Circle } from "@react-pdf/renderer"

const GREEN = "#1F4A30"
const GREEN_LIGHT = "#E8F5EE"
const ORANGE = "#F37021"
const DARK = "#1A1A1A"
const MUTED = "#6B7280"
const BORDER = "#E5E7EB"

function asset(...parts: string[]) {
  return path.join(process.cwd(), "public", "report-assets", ...parts)
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    backgroundColor: "#FFFFFF",
    paddingTop: 0,
    paddingBottom: 44,
  },
  content: {
    paddingHorizontal: 36,
    paddingTop: 22,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  badge: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5.5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 7.5,
    fontWeight: "bold",
    letterSpacing: 0.55,
  },
  brandSub: {
    fontSize: 5.5,
    color: DARK,
    letterSpacing: 0.85,
    textAlign: "right",
    marginTop: 2,
  },
  heroBand: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 22,
    paddingHorizontal: 22,
    marginBottom: 18,
  },
  heroEyebrow: {
    color: "#C8F000",
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroAccent: {
    color: ORANGE,
    fontSize: 14,
    fontStyle: "italic",
  },
  presented: {
    fontSize: 10,
    color: MUTED,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  recipientCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: GREEN_LIGHT,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
    alignItems: "center",
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: GREEN,
    marginBottom: 4,
    textAlign: "center",
  },
  recipientMeta: {
    fontSize: 9,
    color: MUTED,
    textAlign: "center",
  },
  body: {
    fontSize: 10,
    lineHeight: 1.55,
    color: "#374151",
    textAlign: "center",
    marginBottom: 18,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  metricCard: {
    width: "48.5%",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  metricLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: MUTED,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: GREEN,
  },
  metricUnit: {
    fontSize: 7,
    color: MUTED,
    marginTop: 2,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
  detailsBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    backgroundColor: "#FAFCFA",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 8,
    color: MUTED,
    fontWeight: "bold",
  },
  detailValue: {
    fontSize: 8.5,
    color: DARK,
    fontWeight: "bold",
  },
  signRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 8,
  },
  signLabel: {
    fontSize: 7.5,
    color: MUTED,
    marginBottom: 3,
  },
  signValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: GREEN,
  },
  logoBox: {
    width: 78,
    height: 52,
    borderWidth: 1,
    borderColor: "#D7E8DC",
    borderRadius: 8,
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 34,
    backgroundColor: GREEN,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  footerText: {
    fontSize: 7,
    color: "#FFFFFF",
  },
})

function Leaf({ size = 12, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3c5 2 8 7 8 12-4 1-8 1-12-1C6 10 8 5 12 3z"
        stroke={color}
        strokeWidth={1.6}
        fill="none"
      />
      <Path d="M12 21V9" stroke={color} strokeWidth={1.4} fill="none" />
    </Svg>
  )
}

function Shield({ size = 12, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  )
}

function Globe({ size = 9, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke={color} strokeWidth={1.2} fill="none" />
    </Svg>
  )
}

export interface ServiceCertificateData {
  certificateNumber: string
  companyName: string
  location: string
  fiscalYear: string
  totalWasteKg: number
  issuedBy: string
  issueDate: string
  logoUrl?: string | null
  customerId?: string
}

export function CertificateOfServicesPdf({ data }: { data: ServiceCertificateData }) {
  const waste = Number(data.totalWasteKg || 0)
  const butts = Math.round(waste * 3000)

  return (
    <Document title={`Certificate of Services - ${data.companyName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>CERTIFICATE OF SERVICES</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Image
                src={asset("buffindia-logo-clear.png")}
                style={{ width: 96, height: 23, objectFit: "contain" }}
              />
              <Text style={styles.brandSub}>CIGARETTE WASTE MANAGEMENT</Text>
            </View>
          </View>

          <View style={styles.heroBand}>
            <Text style={styles.heroEyebrow}>BUFFINDIA · OFFICIAL RECOGNITION</Text>
            <Text style={styles.heroTitle}>Certificate of Services</Text>
            <Text style={styles.heroAccent}>A cleaner today. A better tomorrow.</Text>
          </View>

          <Text style={styles.presented}>PRESENTED TO</Text>

          <View style={styles.recipientCard}>
            {data.logoUrl ? (
              <View style={[styles.logoBox, { marginBottom: 10 }]}>
                <Image src={data.logoUrl} style={{ width: 68, height: 42, objectFit: "contain" }} />
              </View>
            ) : null}
            <Text style={styles.recipientName}>{data.companyName}</Text>
            <Text style={styles.recipientMeta}>{data.location}</Text>
            {data.customerId ? (
              <Text style={[styles.recipientMeta, { marginTop: 3 }]}>Customer ID: {data.customerId}</Text>
            ) : null}
          </View>

          <Text style={styles.body}>
            In recognition of your commitment to sustainability and support for BuffIndia — Cigarette
            Waste Litter Free India Campaign. Your partnership has contributed to a cleaner
            environment and supported employment for stay-at-home mothers, university students, and
            unskilled labour. For {data.fiscalYear}, cumulative waste recovered was{" "}
            {waste.toFixed(2)} kg, meticulously upcycled into eco-friendly Kraftreborn products.
          </Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: GREEN_LIGHT,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Leaf size={11} />
                </View>
                <Text style={styles.metricLabel}>WASTE RECOVERED</Text>
              </View>
              <Text style={styles.metricValue}>{waste.toFixed(2)}</Text>
              <Text style={styles.metricUnit}>KG · {data.fiscalYear}</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: "#FFF1E8",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield size={11} color={ORANGE} />
                </View>
                <Text style={styles.metricLabel}>BUTTS EQUIVALENT</Text>
              </View>
              <Text style={styles.metricValue}>{butts.toLocaleString("en-IN")}</Text>
              <Text style={styles.metricUnit}>CIGARETTE BUTTS (~3,000 / KG)</Text>
            </View>
          </View>

          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Certificate No.</Text>
              <Text style={styles.detailValue}>{data.certificateNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fiscal Year</Text>
              <Text style={styles.detailValue}>{data.fiscalYear}</Text>
            </View>
            <View style={[styles.detailRow, { marginBottom: 0 }]}>
              <Text style={styles.detailLabel}>Issue Date</Text>
              <Text style={styles.detailValue}>{data.issueDate}</Text>
            </View>
          </View>

          <View style={styles.signRow}>
            <View>
              <Text style={styles.signLabel}>Issued by</Text>
              <Text style={styles.signValue}>{data.issuedBy}</Text>
              <Text style={styles.signLabel}>CEO, Buffindia Receptacles Pvt Ltd</Text>
            </View>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                borderWidth: 2,
                borderColor: ORANGE,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#FFF8F3",
              }}
            >
              <Text style={{ fontSize: 7, fontWeight: "bold", color: GREEN }}>BUFF</Text>
              <Text style={{ fontSize: 7, fontWeight: "bold", color: ORANGE }}>INDIA</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Globe />
            <Text style={styles.footerText}>www.buffindia.com</Text>
          </View>
          <Text style={styles.footerText}>
            A cleaner today. <Text style={{ color: ORANGE, fontWeight: "bold" }}>A better tomorrow.</Text>
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.footerText, { fontSize: 6 }]}>Proudly supported by</Text>
            <Image src={asset("iima.png")} style={{ width: 22, height: 16, objectFit: "contain" }} />
            <Image src={asset("kotak.png")} style={{ width: 42, height: 14, objectFit: "contain" }} />
          </View>
        </View>
      </Page>
    </Document>
  )
}

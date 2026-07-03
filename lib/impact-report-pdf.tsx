import React from "react"
import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer"
import type { ImpactReportData } from "@/lib/esg-metrics"
import { formatMetricNumber } from "@/lib/esg-metrics"

const ORANGE = "#E85D04"
const GREEN = "#2D6A4F"
const DARK = "#1A1A1A"
const MUTED = "#6B7280"
const LIGHT_BG = "#F8F9FA"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 36,
    backgroundColor: "#FFFFFF",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  topBarLabel: {
    fontSize: 7,
    letterSpacing: 1.2,
    color: MUTED,
    textTransform: "uppercase",
  },
  topBarBrand: {
    fontSize: 8,
    fontWeight: "bold",
    color: ORANGE,
    letterSpacing: 0.8,
  },
  pageNumber: {
    fontSize: 18,
    color: "#D1D5DB",
    fontWeight: "bold",
  },
  coverCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  coverTag: {
    fontSize: 7,
    letterSpacing: 2,
    color: MUTED,
    textTransform: "uppercase",
    marginBottom: 24,
  },
  coverEsgBadge: {
    fontSize: 10,
    color: GREEN,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
    alignSelf: "flex-end",
    marginRight: 60,
  },
  coverTitle: {
    fontSize: 52,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 11,
    color: MUTED,
    textAlign: "center",
    lineHeight: 1.5,
    marginTop: 16,
  },
  coverMeta: {
    flexDirection: "row",
    gap: 24,
    marginTop: 32,
  },
  coverMetaBox: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: LIGHT_BG,
    borderRadius: 4,
  },
  coverMetaLabel: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  coverMetaValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: DARK,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 8,
    color: MUTED,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  businessGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  businessField: {
    width: "30%",
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: DARK,
  },
  envGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  envCard: {
    width: "31%",
    backgroundColor: LIGHT_BG,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: ORANGE,
  },
  envCardGreen: {
    borderLeftColor: GREEN,
  },
  envValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 2,
  },
  envUnit: {
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  envNote: {
    fontSize: 7,
    color: MUTED,
    lineHeight: 1.3,
  },
  socialGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  socialCard: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
  },
  highlightBox: {
    backgroundColor: "#ECFDF5",
    borderRadius: 6,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  highlightTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: GREEN,
    marginBottom: 6,
  },
  thankYou: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    color: ORANGE,
    marginVertical: 14,
  },
  refTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 8,
  },
  refText: {
    fontSize: 8,
    color: MUTED,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  refLink: {
    fontSize: 8,
    color: ORANGE,
    marginBottom: 4,
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 0.8,
  },
  footerBrand: {
    fontSize: 8,
    fontWeight: "bold",
    color: ORANGE,
  },
})

function PageFooter({
  left,
  page,
  customerId,
}: {
  left: string
  page: string
  customerId: string
}) {
  return (
    <View style={styles.footer}>
      <View>
        <Text style={styles.footerBrand}>BUFFINDIA</Text>
        <Text style={styles.footerText}>{left}</Text>
      </View>
      <Text style={styles.footerText}>
        {customerId} / {page}
      </Text>
      <Text style={styles.pageNumber}>{page.split(" ").pop()}</Text>
    </View>
  )
}

function EnvMetric({
  label,
  value,
  unit,
  note,
  green,
}: {
  label: string
  value: string
  unit: string
  note?: string
  green?: boolean
}) {
  return (
    <View style={[styles.envCard, green ? styles.envCardGreen : {}]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.envValue}>{value}</Text>
      <Text style={styles.envUnit}>{unit}</Text>
      {note ? <Text style={styles.envNote}>{note}</Text> : null}
    </View>
  )
}

export function ImpactReportPdfDocument({ data }: { data: ImpactReportData }) {
  const kraftrebornDisplay =
    data.kraftrebornCredits > 0 ? formatMetricNumber(data.kraftrebornCredits) : "Coming Soon"

  return (
    <Document title={`${data.customerId} ESG Impact Report`} author="Buffindia">
      {/* Page 1 — Cover */}
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar}>
          <Text style={styles.topBarLabel}>Buffindia Customer Impact Report</Text>
          <Text style={styles.topBarBrand}>BUFFINDIA</Text>
        </View>

        <View style={styles.coverCenter}>
          <Text style={styles.coverTag}>Cigarette Waste Management</Text>
          <Text style={styles.coverEsgBadge}>ESG</Text>
          <Text style={styles.coverTitle}>Impact</Text>
          <Text style={styles.coverTitle}>Report</Text>
          <Text style={styles.coverSubtitle}>
            {data.companyName} – Cigarette Waste Management{"\n"}
            Buffindia ESG Report
          </Text>
          <View style={styles.coverMeta}>
            <View style={styles.coverMetaBox}>
              <Text style={styles.coverMetaLabel}>Customer ID</Text>
              <Text style={styles.coverMetaValue}>{data.customerId}</Text>
            </View>
            <View style={styles.coverMetaBox}>
              <Text style={styles.coverMetaLabel}>Reporting Period</Text>
              <Text style={styles.coverMetaValue}>{data.reportingPeriod}</Text>
            </View>
          </View>
        </View>

        <PageFooter
          left="Cigarette Waste Management ESG Report"
          page="01"
          customerId={data.customerId}
        />
      </Page>

      {/* Page 2 — Business + Environmental */}
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar}>
          <Text style={styles.topBarLabel}>Buffindia What&apos;s New</Text>
          <Text style={styles.topBarBrand}>BUFFINDIA</Text>
        </View>

        <Text style={styles.sectionTitle}>Business Details</Text>
        <View style={styles.businessGrid}>
          <View style={styles.businessField}>
            <Text style={styles.fieldLabel}>Business Name</Text>
            <Text style={styles.fieldValue}>{data.companyName}</Text>
          </View>
          <View style={styles.businessField}>
            <Text style={styles.fieldLabel}>Location</Text>
            <Text style={styles.fieldValue}>{data.location}</Text>
          </View>
          <View style={styles.businessField}>
            <Text style={styles.fieldLabel}>Customer ID</Text>
            <Text style={styles.fieldValue}>{data.customerId}</Text>
          </View>
          <View style={styles.businessField}>
            <Text style={styles.fieldLabel}>Units Installed</Text>
            <Text style={styles.fieldValue}>{String(data.disposalUnitsInstalled)}</Text>
          </View>
          <View style={styles.businessField}>
            <Text style={styles.fieldLabel}>Installation Date</Text>
            <Text style={styles.fieldValue}>{data.installationDate}</Text>
          </View>
          <View style={styles.businessField}>
            <Text style={styles.fieldLabel}>Reporting Period Till</Text>
            <Text style={styles.fieldValue}>{data.reportingPeriod}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Environmental Impacts</Text>
        <Text style={styles.sectionSubtitle}>Cumulative Till Date</Text>

        <View style={styles.envGrid}>
          <EnvMetric
            label="Total Waste Collected"
            value={formatMetricNumber(data.totalWasteKg)}
            unit="KG"
            note="Collected waste has been routed into Buffindia's recycling process."
          />
          <EnvMetric
            label="Cigarette Butts Collected"
            value={formatMetricNumber(data.cigaretteButts)}
            unit="IN NUMBER"
            green
          />
          <EnvMetric
            label="Total Waste Recycled"
            value={formatMetricNumber(data.totalWasteRecycledKg)}
            unit="KG"
          />
          <EnvMetric
            label="Microplastic Upcycled"
            value={formatMetricNumber(data.microplasticUpcycledKg)}
            unit="KG"
            green
          />
          <EnvMetric
            label="Water Resources Protected"
            value={formatMetricNumber(data.waterResourcesProtectedL)}
            unit="LITRES"
          />
          <EnvMetric
            label="Kraftreborn Credits"
            value={kraftrebornDisplay}
            unit={data.kraftrebornCredits > 0 ? "CREDITS" : ""}
          />
        </View>

        <PageFooter left="Environmental Impact" page="02" customerId={data.customerId} />
      </Page>

      {/* Page 3 — Social + References */}
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar}>
          <Text style={styles.topBarLabel}>Buffindia Social Impact</Text>
          <Text style={styles.topBarBrand}>BUFFINDIA</Text>
        </View>

        <Text style={styles.sectionTitle}>Social Impacts</Text>
        <Text style={styles.sectionSubtitle}>
          Your Support Contributed To The Following Social Impacts (PAN India)
        </Text>

        <View style={styles.socialGrid}>
          <View style={styles.socialCard}>
            <Text style={styles.fieldLabel}>Habit Change</Text>
            <Text style={styles.envValue}>{formatMetricNumber(data.habitChange)}</Text>
          </View>
          <View style={styles.socialCard}>
            <Text style={styles.fieldLabel}>Employment (Labour)</Text>
            <Text style={styles.envValue}>{formatMetricNumber(data.employment)}</Text>
          </View>
          <View style={styles.socialCard}>
            <Text style={styles.fieldLabel}>Women Employment</Text>
            <Text style={styles.envValue}>{formatMetricNumber(data.womenEmployment)}</Text>
          </View>
        </View>

        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Sustainable Product Conversion</Text>
          <Text style={styles.refText}>
            Collected cigarette waste has been responsibly upcycled into eco-friendly decor
            and gifting solutions
          </Text>
        </View>

        <Text style={styles.thankYou}>
          Thank you for supporting Buffindia – Cigarette Waste Litter Free India Campaign!
        </Text>

        <Text style={styles.refTitle}>Report Calculations &amp; References</Text>
        <Text style={styles.refText}>1 Kg Cigarette Waste ≈ 3,000 Cigarette Butts</Text>
        <Text style={styles.refText}>
          Microplastic Content is estimated at approximately 80% of total cigarette waste
        </Text>
        <Text style={styles.refText}>
          Water Pollution Impact: A single cigarette butt can contaminate up to 500 litres of
          water. For conservative calculation, Buffindia considers 1 cigarette butt = 100 litres
          of water protected.
        </Text>

        <Text style={[styles.refTitle, { marginTop: 10 }]}>References</Text>
        <Link src="https://cpcb.nic.in/" style={styles.refLink}>
          • Central Pollution Control Board (CPCB) Guidelines (2022) – View Source
        </Link>
        <Link src="https://www.surfrider.eu/" style={styles.refLink}>
          • Surfrider Foundation Europe Cigarette Butt Pollution Impact – View Source
        </Link>
        <Link src="https://www.unav.edu/" style={styles.refLink}>
          • University of Navarra Biodiversity Institute – View Source
        </Link>

        <PageFooter left="Social Impact & References" page="03" customerId={data.customerId} />
      </Page>
    </Document>
  )
}

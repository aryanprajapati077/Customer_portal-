import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { ImpactEstimate } from "@/lib/impact-calculator"
import { formatCompactLitres, formatInr } from "@/lib/impact-calculator"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    padding: 36,
    paddingBottom: 56,
    backgroundColor: "#F7F6F2",
    color: "#141414",
  },
  headerBar: {
    backgroundColor: "#1B7339",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderRadius: 6,
  },
  headerBrand: {
    fontSize: 9,
    letterSpacing: 2,
    color: "#C8F000",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 10,
    color: "#E8F5E9",
    marginTop: 4,
  },
  section: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E2DA",
  },
  sectionTitle: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: "#1B7339",
    marginBottom: 8,
    fontFamily: "Helvetica-Bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  label: {
    fontSize: 9,
    color: "#5A5A5A",
    width: "55%",
  },
  value: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    width: "45%",
    textAlign: "right",
  },
  muted: {
    fontSize: 9,
    color: "#5A5A5A",
    lineHeight: 1.4,
    marginBottom: 3,
  },
  bullet: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 3,
    paddingLeft: 4,
  },
  priceTable: {
    marginTop: 4,
  },
  priceHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E2DA",
    paddingBottom: 4,
    marginBottom: 4,
  },
  priceHeaderLabel: {
    width: "70%",
    fontSize: 8,
    color: "#8A8A8A",
    fontFamily: "Helvetica-Bold",
  },
  priceHeaderAmt: {
    width: "30%",
    fontSize: 8,
    color: "#8A8A8A",
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  priceRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  priceLabel: {
    width: "70%",
    fontSize: 9,
    color: "#374151",
  },
  priceAmt: {
    width: "30%",
    fontSize: 9,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  totalBlock: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1B7339",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#141414",
  },
  totalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1B7339",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metric: {
    width: "48%",
    padding: 8,
    backgroundColor: "#F4F9F5",
    borderRadius: 4,
    marginBottom: 6,
    marginRight: "2%",
  },
  metricLabel: {
    fontSize: 7,
    color: "#6B6B6B",
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  metricNote: {
    fontSize: 7,
    color: "#6B6B6B",
    marginTop: 2,
  },
  note: {
    fontSize: 9,
    color: "#2A4A32",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#E5E2DA",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: "#8A8A8A",
    marginBottom: 2,
  },
})

export type ProposalLead = {
  fullName: string
  companyName: string
  email: string
  phone: string
  city: string
}

export type ProposalPdfData = {
  lead: ProposalLead
  estimate: ImpactEstimate
  generatedAt: string
}

function MetricBox({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note?: string
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {note ? <Text style={styles.metricNote}>{note}</Text> : null}
    </View>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

export function ProposalPdfDocument({ lead, estimate, generatedAt }: ProposalPdfData) {
  const pricing = estimate.pricing

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <Text style={styles.headerBrand}>BUFFINDIA · DETAILED PROPOSAL</Text>
          <Text style={styles.headerTitle}>{estimate.packageName}</Text>
          <Text style={styles.headerSub}>
            Prepared for {lead.companyName} · {generatedAt}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. CUSTOMER DETAILS</Text>
          <Row label="Full name" value={lead.fullName} />
          <Row label="Company" value={lead.companyName} />
          <Row label="Work email" value={lead.email} />
          <Row label="Phone" value={lead.phone} />
          <Row label="City" value={lead.city} />
          <Row label="Industry" value={estimate.industry} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. CALCULATOR INPUTS</Text>
          {estimate.inputs.employees != null ? (
            <Row label="Total employees" value={formatInr(estimate.inputs.employees)} />
          ) : null}
          {estimate.inputs.locations != null ? (
            <Row label="Number of locations" value={String(estimate.inputs.locations)} />
          ) : null}
          {estimate.inputs.estimatedSmokers != null ? (
            <Row
              label="Estimated smokers (18%)"
              value={formatInr(estimate.inputs.estimatedSmokers)}
            />
          ) : null}
          {estimate.inputs.smokingZones != null ? (
            <Row label="Smoking zones" value={String(estimate.inputs.smokingZones)} />
          ) : null}
          {estimate.kioskType ? <Row label="Kiosk preference" value={estimate.kioskType} /> : null}
          {Object.keys(estimate.inputs).length === 0 && !estimate.kioskType ? (
            <Text style={styles.muted}>Fixed industry package — no variable inputs required.</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. RECOMMENDED PACKAGE</Text>
          <Row label="Package" value={estimate.packageName} />
          {estimate.kioskType ? <Row label="Kiosk type" value={estimate.kioskType} /> : null}
          {estimate.recommendedKiosks != null ? (
            <Row label="Recommended kiosks" value={String(estimate.recommendedKiosks)} />
          ) : null}
          {estimate.kraftRebornValue != null ? (
            <Row
              label="Complimentary KraftReborn entitlement"
              value={`₹${formatInr(estimate.kraftRebornValue)}`}
            />
          ) : null}
        </View>

        {pricing ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. PRICING BREAKDOWN (ANNUAL)</Text>
            {pricing.rateCard.map((line) => (
              <Text key={line} style={styles.muted}>
                • {line}
              </Text>
            ))}

            <View style={styles.priceTable}>
              <View style={styles.priceHeader}>
                <Text style={styles.priceHeaderLabel}>DESCRIPTION</Text>
                <Text style={styles.priceHeaderAmt}>AMOUNT (₹)</Text>
              </View>
              {pricing.lineItems.map((item) => (
                <View key={item.label} style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{item.label}</Text>
                  <Text style={styles.priceAmt}>{formatInr(item.amount)}</Text>
                </View>
              ))}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal (excl. GST)</Text>
                <Text style={styles.priceAmt}>{formatInr(pricing.subtotalExclGst)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>GST @ {pricing.gstRatePct}%</Text>
                <Text style={styles.priceAmt}>{formatInr(pricing.gstAmount)}</Text>
              </View>
              <View style={styles.totalBlock}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Estimated annual investment (incl. GST)</Text>
                  <Text style={styles.totalValue}>₹{formatInr(pricing.totalInclGst)}</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>WHAT IS INCLUDED</Text>
            {pricing.inclusions.map((inc) => (
              <Text key={inc} style={styles.bullet}>
                • {inc}
              </Text>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. PRICING</Text>
            <Text style={styles.note}>
              Please contact our team for a customised proposal with site-specific pricing.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. ENVIRONMENTAL IMPACT SUMMARY</Text>
          {estimate.mode === "quantified" ? (
            <View style={styles.grid}>
              {estimate.buttsDiverted != null ? (
                <MetricBox
                  label="Cigarette butts diverted"
                  value={formatInr(estimate.buttsDiverted)}
                  note="per year"
                />
              ) : null}
              {estimate.waterLitres != null ? (
                <MetricBox
                  label="Water pollution prevented"
                  value={`${formatCompactLitres(estimate.waterLitres)} L`}
                />
              ) : null}
              {estimate.wasteKg != null ? (
                <MetricBox
                  label="Waste recovered"
                  value={`${Number(estimate.wasteKg.toFixed(1))} kg`}
                  note="approx. / year"
                />
              ) : null}
              <MetricBox
                label="Waste recycled"
                value={`${estimate.wasteRecycledPct}%`}
                note="recovery rate"
              />
              <MetricBox label="Tobacco & ash" value={`${estimate.tobaccoAshPct}%`} />
              <MetricBox
                label="Microplastic filter"
                value={`${estimate.microplasticFilterPct}%`}
              />
            </View>
          ) : (
            <Text style={styles.note}>
              {estimate.impactNote ||
                "Environmental impact will be confirmed after implementation / site survey."}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. ESG & SDG ALIGNMENT</Text>
          <Text style={styles.note}>
            Buffindia’s cigarette-butt recovery programme supports cleaner public spaces, circular
            material recovery, and measurable ESG reporting — aligned with SDG 11 (Sustainable
            Cities), SDG 12 (Responsible Consumption & Production), and SDG 14 (Life Below Water).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. BUFFINDIA CONTACT</Text>
          <Row label="Website" value="impact.buffindia.com" />
          <Row label="Sales" value="sales@buffindia.com" />
          <Text style={[styles.muted, { marginTop: 6 }]}>
            This proposal is generated from the Buffindia Impact Calculator (FRD v1.0). Final
            commercials may be refined after a site survey or commercial discussion.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Buffindia · Circular cigarette-butt recovery</Text>
          <Text style={styles.footerText}>
            Confidential — prepared for {lead.companyName} · {generatedAt}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    padding: 48,
    backgroundColor: "#FAF8F5",
  },
  frame: {
    borderWidth: 2,
    borderColor: "#1A1A1A",
    padding: 36,
    flex: 1,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 2,
    textAlign: "center",
    color: "#888",
    marginBottom: 8,
  },
  brand: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  subbrand: {
    fontSize: 9,
    textAlign: "center",
    color: "#666",
    marginBottom: 28,
  },
  certifies: {
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  contributed: {
    fontSize: 10,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 16,
    color: "#555",
  },
  metric: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 9,
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 16,
  },
  impactLine: {
    fontSize: 10,
    textAlign: "center",
    color: "#444",
    marginBottom: 32,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#DDD",
    paddingTop: 16,
  },
  footerCol: {
    width: "30%",
  },
  footerLabel: {
    fontSize: 8,
    color: "#888",
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 9,
    fontWeight: "bold",
  },
  seal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  sealText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  website: {
    fontSize: 8,
    textAlign: "center",
    color: "#888",
    marginTop: 12,
  },
})

export interface KraftRebornCertificateData {
  contactName: string
  orderId: string
  issueDate: string
  butts: number
  soilSqFt: number
  waterLitres: number
  productCount: number
}

export function KraftRebornCertificatePdf({ data }: { data: KraftRebornCertificateData }) {
  return (
    <Document title={`Kraft Reborn Impact - ${data.orderId}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.frame}>
          <Text style={styles.eyebrow}>CERTIFICATE OF IMPACT</Text>
          <Text style={styles.brand}>Kraft Reborn</Text>
          <Text style={styles.subbrand}>Buffindia Receptacles Pvt. Ltd. · Gujarat, India</Text>

          <Text style={styles.certifies}>This certifies that</Text>
          <Text style={styles.name}>{data.contactName}</Text>
          <Text style={styles.contributed}>has directly contributed to the rescue of</Text>

          <Text style={styles.metric}>{data.butts}</Text>
          <Text style={styles.metricLabel}>CIGARETTE BUTTS FROM INDIA&apos;S ENVIRONMENT</Text>

          <Text style={styles.impactLine}>
            protecting {data.soilSqFt} sq ft of soil · {data.waterLitres}L of water · supporting
            women artisans in Gujarat
          </Text>

          <View style={styles.footer}>
            <View style={styles.footerCol}>
              <Text style={styles.footerLabel}>ORDER</Text>
              <Text style={styles.footerValue}>{data.orderId}</Text>
              <Text style={styles.footerLabel}>DATE</Text>
              <Text style={styles.footerValue}>{data.issueDate}</Text>
            </View>
            <View style={styles.seal}>
              <Text style={styles.sealText}>KR</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerLabel}>VERIFIED BY</Text>
              <Text style={styles.footerValue}>Kraft Reborn Studio</Text>
              <Text style={styles.footerLabel}>PRODUCTS</Text>
              <Text style={styles.footerValue}>{data.productCount} piece(s)</Text>
            </View>
          </View>

          <Text style={styles.website}>
            kraftreborn.in · circular craft · zero plastic · handmade india
          </Text>
        </View>
      </Page>
    </Document>
  )
}

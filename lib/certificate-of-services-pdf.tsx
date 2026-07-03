import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    padding: 40,
    backgroundColor: "#FFFFFF",
    borderWidth: 8,
    borderColor: "#B8C5D6",
  },
  certNo: {
    fontSize: 9,
    fontStyle: "italic",
    color: "#666",
    marginBottom: 20,
  },
  brand: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#E85D04",
    textAlign: "center",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 9,
    textAlign: "center",
    color: "#2D6A4F",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    color: "#1E3A5F",
    textAlign: "center",
    marginBottom: 8,
    fontStyle: "italic",
  },
  presented: {
    fontSize: 11,
    textAlign: "center",
    color: "#444",
    marginBottom: 12,
  },
  recipientBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 40,
    marginBottom: 24,
    alignItems: "center",
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E3A5F",
    marginBottom: 4,
  },
  recipientLocation: {
    fontSize: 11,
    color: "#555",
  },
  body: {
    fontSize: 11,
    lineHeight: 1.6,
    color: "#333",
    textAlign: "center",
    marginHorizontal: 30,
    marginBottom: 40,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 30,
  },
  footerLabel: {
    fontSize: 9,
    color: "#666",
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  seal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#C9A227",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  sealText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#C9A227",
  },
})

export interface ServiceCertificateData {
  certificateNumber: string
  companyName: string
  location: string
  fiscalYear: string
  totalWasteKg: number
  issuedBy: string
  issueDate: string
}

export function CertificateOfServicesPdf({ data }: { data: ServiceCertificateData }) {
  return (
    <Document title={`Certificate of Services - ${data.companyName}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.certNo}>Certificate No. {data.certificateNumber}</Text>
        <Text style={styles.brand}>BUFFINDIA</Text>
        <Text style={styles.tagline}>Creating a Cleaner Future</Text>

        <Text style={styles.title}>Certificate of Services</Text>
        <Text style={styles.presented}>Presented to</Text>

        <View style={styles.recipientBox}>
          <Text style={styles.recipientName}>{data.companyName}</Text>
          <Text style={styles.recipientLocation}>{data.location}</Text>
        </View>

        <Text style={styles.body}>
          In recognition of your commitment to sustainability and support for Buffindia - Cigarette
          Waste Litter Free India Campaign. Your partnership has not only contributed to a cleaner
          environment but also encouraged employment opportunities for stay-at-home mothers,
          university students, and unskilled labour. The cumulative waste generated for the{" "}
          {data.fiscalYear} was {data.totalWasteKg.toFixed(2)} kg, which was meticulously upcycled
          into eco-friendly products.
        </Text>

        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>Issued by</Text>
            <Text style={styles.footerValue}>{data.issuedBy}</Text>
            <Text style={styles.footerLabel}>CEO Buffindia Receptacles Pvt Ltd</Text>
            <Text style={styles.footerLabel}>Issued on: {data.issueDate}</Text>
          </View>
          <View style={styles.seal}>
            <Text style={styles.sealText}>BUFF</Text>
            <Text style={styles.sealText}>INDIA</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

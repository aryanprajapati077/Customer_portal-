import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { formatInr } from "@/lib/kraftreborn-products"
import { orderStatusLabel } from "@/lib/shop-constants"

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1a1a1a" },
  header: { marginBottom: 24, borderBottomWidth: 2, borderBottomColor: "#E85D04", paddingBottom: 12 },
  brand: { fontSize: 18, fontWeight: "bold", color: "#E85D04" },
  subtitle: { fontSize: 9, color: "#666", marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { color: "#666", width: 100 },
  value: { flex: 1 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f0",
    padding: 8,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableRow: { flexDirection: "row", padding: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  col1: { width: "45%" },
  col2: { width: "15%", textAlign: "center" },
  col3: { width: "20%", textAlign: "right" },
  col4: { width: "20%", textAlign: "right" },
  total: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16, fontSize: 12, fontWeight: "bold" },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, fontSize: 8, color: "#888", textAlign: "center" },
  logoNote: { marginTop: 12, padding: 10, backgroundColor: "#fff8f0", fontSize: 9 },
})

export interface OrderSheetData {
  orderNumber: string
  status: string
  createdAt: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  subtotal: number
  useKrCredits: boolean
  logoRequested: boolean
  logoUrl?: string | null
  notes?: string | null
  items: { productName: string; quantity: number; price: number; allowsLogo: boolean }[]
}

export function OrderSheetPdf({ data }: { data: OrderSheetData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>Kraft Reborn · Order Sheet</Text>
          <Text style={styles.subtitle}>Buffindia Receptacles Pvt. Ltd. · Packing & fulfilment list</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Order #</Text>
          <Text style={styles.value}>{data.orderNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{orderStatusLabel(data.status)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{new Date(data.createdAt).toLocaleString("en-IN")}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment</Text>
          <Text style={styles.value}>{data.useKrCredits ? "KR Credits (deduct on completion)" : "Other"}</Text>
        </View>

        <Text style={styles.sectionTitle}>Ship To</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Company</Text>
          <Text style={styles.value}>{data.companyName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Contact</Text>
          <Text style={styles.value}>{data.contactPerson}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{data.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{data.phone || "—"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{data.address || "—"}</Text>
        </View>

        <Text style={styles.sectionTitle}>Line Items</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Product</Text>
          <Text style={styles.col2}>Qty</Text>
          <Text style={styles.col3}>Unit</Text>
          <Text style={styles.col4}>Total</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.col1}>
              {item.productName}
              {item.allowsLogo ? " (logo customisation)" : ""}
            </Text>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col3}>{formatInr(item.price)}</Text>
            <Text style={styles.col4}>{formatInr(item.price * item.quantity)}</Text>
          </View>
        ))}

        <View style={styles.total}>
          <Text>Total: {formatInr(data.subtotal)}</Text>
        </View>

        {data.logoRequested && (
          <View style={styles.logoNote}>
            <Text>Custom logo requested{data.logoUrl ? " — logo file attached in order record" : ""}</Text>
          </View>
        )}

        {data.notes ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Notes</Text>
            <Text>{data.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>kraftreborn.in · circular craft · zero plastic · handmade india</Text>
      </Page>
    </Document>
  )
}

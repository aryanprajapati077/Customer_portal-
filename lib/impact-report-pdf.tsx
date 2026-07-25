import React from "react"
import path from "path"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
  Svg,
  Path,
  Circle,
  Rect,
} from "@react-pdf/renderer"
import type { ImpactReportData } from "@/lib/esg-metrics"
import { formatMetricNumber } from "@/lib/esg-metrics"

const GREEN = "#1F4A30"
const GREEN_MID = "#2D6A4F"
const GREEN_LIGHT = "#E8F5EE"
const GREEN_PALE = "#F4F9F5"
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
    marginBottom: 18,
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
  brandName: {
    fontSize: 12.5,
    fontWeight: "bold",
    color: ORANGE,
    textAlign: "right",
  },
  brandSub: {
    fontSize: 5.5,
    color: DARK,
    letterSpacing: 0.85,
    textAlign: "right",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: GREEN,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 8.5,
    color: MUTED,
    marginBottom: 14,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 6.5,
    color: MUTED,
  },
  darkFooter: {
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
  darkFooterText: {
    fontSize: 7,
    color: "#FFFFFF",
  },
})

function Leaf({ size = 14, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3C12 3 5 8 5 14a7 7 0 0 0 14 0c0-6-7-11-7-11z"
        stroke={color}
        strokeWidth={1.6}
        fill="none"
      />
      <Path d="M12 21V10" stroke={color} strokeWidth={1.6} fill="none" />
    </Svg>
  )
}

function Drop({ size = 14, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z"
        stroke={color}
        strokeWidth={1.6}
        fill="none"
      />
    </Svg>
  )
}

function Recycle({ size = 14, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M7 8l2-3h6l2 3M17 16l-2 3H9l-2-3M12 5v4M18.5 10.5l-3.5 2M5.5 10.5l3.5 2"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
    </Svg>
  )
}

function People({ size = 14, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="8" r="2.2" stroke={color} strokeWidth={1.5} fill="none" />
      <Circle cx="7" cy="9" r="1.6" stroke={color} strokeWidth={1.3} fill="none" />
      <Circle cx="17" cy="9" r="1.6" stroke={color} strokeWidth={1.3} fill="none" />
      <Path
        d="M6 17c0-2 2.2-3.2 6-3.2S18 15 18 17"
        stroke={color}
        strokeWidth={1.4}
        fill="none"
      />
    </Svg>
  )
}

function Bin({ size = 14, color = ORANGE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 8h10l-1 12H8L7 8zM5 8h14M10 8V6h4v2" stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  )
}

function Gift({ size = 14, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="5" y="11" width="14" height="9" rx="1" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M5 11h14V9H5v2zM12 9v11" stroke={color} strokeWidth={1.4} fill="none" />
    </Svg>
  )
}

function Building({ size = 12, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 20V9l8-5 8 5v11H4zM9 20v-6h6v6" stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  )
}

function Pin({ size = 12, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      <Circle cx="12" cy="11" r="2" stroke={color} strokeWidth={1.4} fill="none" />
    </Svg>
  )
}

function IdCard({ size = 12, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth={1.5} fill="none" />
      <Circle cx="9" cy="12" r="2" stroke={color} strokeWidth={1.3} fill="none" />
      <Path d="M13 11h5M13 14h4" stroke={color} strokeWidth={1.3} fill="none" />
    </Svg>
  )
}

function Calendar({ size = 12, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="4" y="5" width="16" height="15" rx="2" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M8 3v4M16 3v4M4 10h16" stroke={color} strokeWidth={1.4} fill="none" />
    </Svg>
  )
}

function Globe({ size = 10, color = MUTED }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.5} fill="none" />
      <Path
        d="M3 12h18M12 3c2.5 2.8 2.5 15.2 0 18M12 3c-2.5 2.8-2.5 15.2 0 18"
        stroke={color}
        strokeWidth={1.3}
        fill="none"
      />
    </Svg>
  )
}

function Book({ size = 12, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 5h7a3 3 0 0 1 3 3v11H7a3 3 0 0 0-3 3V5zm16 0h-7a3 3 0 0 0-3 3v11h7a3 3 0 0 1 3 3V5z"
        stroke={color}
        strokeWidth={1.4}
        fill="none"
      />
    </Svg>
  )
}

function Cigarette({ size = 14, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M3 14h11v3H3v-3zM14 14h5l2-1.5V16L19 17h-5v-3zM16 10l1-3M18.5 10.5l1.2-2.5"
        stroke={color}
        strokeWidth={1.45}
        fill="none"
      />
    </Svg>
  )
}

function MicroDots({ size = 14, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="8" cy="9" r="1.4" fill={color} />
      <Circle cx="13" cy="7" r="1.1" fill={color} />
      <Circle cx="17" cy="10" r="1.3" fill={color} />
      <Circle cx="10" cy="14" r="1.2" fill={color} />
      <Circle cx="15" cy="15" r="1.5" fill={color} />
      <Circle cx="7" cy="17" r="1" fill={color} />
      <Path d="M4 12a8 8 0 1 0 16 0" stroke={color} strokeWidth={1.3} fill="none" />
    </Svg>
  )
}

function Truck({ size = 14, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M3 7h11v9H3V7zm11 3h4l3 3v3h-7v-6z"
        stroke={color}
        strokeWidth={1.4}
        fill="none"
      />
      <Circle cx="7" cy="17.5" r="1.6" stroke={color} strokeWidth={1.3} fill="none" />
      <Circle cx="17" cy="17.5" r="1.6" stroke={color} strokeWidth={1.3} fill="none" />
    </Svg>
  )
}

function Filter({ size = 14, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" stroke={color} strokeWidth={1.45} fill="none" />
    </Svg>
  )
}

function Broom({ size = 14, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M14 3l7 7M9 20l-4-1 1-4 9-9 4 4-10 10z" stroke={color} strokeWidth={1.4} fill="none" />
    </Svg>
  )
}

function Shield({ size = 14, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z"
        stroke={color}
        strokeWidth={1.4}
        fill="none"
      />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={1.4} fill="none" />
    </Svg>
  )
}

function Chart({ size = 14, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6" stroke={color} strokeWidth={1.45} fill="none" />
    </Svg>
  )
}

function Brain({ size = 14, color = GREEN }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M9 5a3 3 0 0 0-3 3v1a2.5 2.5 0 0 0 0 5v1a3 3 0 0 0 3 3M15 5a3 3 0 0 1 3 3v1a2.5 2.5 0 0 1 0 5v1a3 3 0 0 1-3 3M9 5h6M9 19h6M12 5v14"
        stroke={color}
        strokeWidth={1.35}
        fill="none"
      />
    </Svg>
  )
}

function GlobeArt({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="32" r="18" stroke={GREEN} strokeWidth={1.6} fill="none" />
      <Path d="M14 32h36M32 14c5 5 5 31 0 36M32 14c-5 5-5 31 0 36" stroke={GREEN} strokeWidth={1.3} fill="none" />
      <Path d="M24 48c2-6 6-9 8-10 2 1 6 4 8 10" stroke={GREEN} strokeWidth={1.4} fill="none" />
      <Path d="M28 42c0-4 2-7 4-8 2 1 4 4 4 8" stroke={GREEN_MID} strokeWidth={1.2} fill="none" />
      <Path d="M22 50h20" stroke={GREEN} strokeWidth={1.3} fill="none" />
      <Path d="M40 22c3-1 6 0 8 2M18 26c2-3 5-4 8-3" stroke={GREEN_MID} strokeWidth={1.1} fill="none" />
    </Svg>
  )
}

function Brand({ width = 88 }: { width?: number }) {
  return (
    <View style={{ alignItems: "flex-end" }}>
      <Image
        src={asset("buffindia-logo-clear.png")}
        style={{ width, height: width * 0.24, objectFit: "contain" }}
      />
      <Text style={[styles.brandSub, { marginTop: 3 }]}>CIGARETTE WASTE MANAGEMENT</Text>
    </View>
  )
}

function PageFooter({ dark = false }: { dark?: boolean }) {
  if (dark) {
    return (
      <View style={styles.darkFooter}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Globe size={9} color="#FFFFFF" />
          <Text style={styles.darkFooterText}>www.buffindia.com</Text>
        </View>
        <Text style={styles.darkFooterText}>
          A cleaner today. <Text style={{ color: ORANGE, fontWeight: "bold" }}>A better tomorrow.</Text>
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[styles.darkFooterText, { fontSize: 6 }]}>Proudly supported by</Text>
          <Image src={asset("iima.png")} style={{ width: 22, height: 16, objectFit: "contain" }} />
          <Image src={asset("kotak.png")} style={{ width: 42, height: 14, objectFit: "contain" }} />
        </View>
      </View>
    )
  }
  return (
    <View style={styles.footer}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Globe size={9} color={GREEN} />
        <Text style={styles.footerText}>www.buffindia.com</Text>
      </View>
      <Text style={styles.footerText}>
        A cleaner today. <Text style={{ color: ORANGE, fontWeight: "bold" }}>A better tomorrow.</Text>
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <Text style={[styles.footerText, { fontSize: 6 }]}>Proudly supported by</Text>
        <Image src={asset("iima.png")} style={{ width: 20, height: 14, objectFit: "contain" }} />
        <Image src={asset("kotak.png")} style={{ width: 40, height: 12, objectFit: "contain" }} />
      </View>
    </View>
  )
}

function MetricCard({
  label,
  value,
  unit,
  note,
  accent,
  icon,
}: {
  label: string
  value: string
  unit: string
  note: string
  accent: string
  icon: React.ReactNode
}) {
  const tint = accent === ORANGE ? "#FFF1E8" : GREEN_LIGHT
  return (
    <View
      style={{
        width: "31.8%",
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 9,
        paddingTop: 0,
        paddingBottom: 11,
        paddingHorizontal: 11,
        minHeight: 118,
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: 3.5,
          backgroundColor: accent,
          marginHorizontal: -11,
          marginBottom: 10,
        }}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: tint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
        <Text
          style={{
            fontSize: 6.2,
            fontWeight: "bold",
            color: MUTED,
            flex: 1,
            letterSpacing: 0.25,
            lineHeight: 1.25,
          }}
        >
          {label}
        </Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: "bold", color: GREEN, letterSpacing: -0.3 }}>
        {value}
      </Text>
      <Text
        style={{
          fontSize: 6.5,
          color: MUTED,
          letterSpacing: 0.45,
          marginTop: 1,
          marginBottom: 6,
          fontWeight: "bold",
        }}
      >
        {unit}
      </Text>
      <Text style={{ fontSize: 6.2, color: MUTED, lineHeight: 1.35 }}>{note}</Text>
    </View>
  )
}

function IconCircle({ children, size = 24 }: { children: React.ReactNode; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: GREEN_LIGHT,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 7,
      }}
    >
      {children}
    </View>
  )
}

export function ImpactReportPdfDocument({ data }: { data: ImpactReportData }) {
  const kraft =
    data.kraftrebornCredits > 0 ? formatMetricNumber(data.kraftrebornCredits) : "Coming Soon"
  const kraftUnit = data.kraftrebornCredits > 0 ? "CREDITS" : ""
  const waste = formatMetricNumber(data.totalWasteKg)
  const butts = formatMetricNumber(data.cigaretteButts)
  const recycled = formatMetricNumber(data.totalWasteRecycledKg)
  const micro = formatMetricNumber(data.microplasticUpcycledKg)
  const water = formatMetricNumber(data.waterResourcesProtectedL)

  const bizFields = [
    { label: "BUSINESS NAME", value: data.companyName, icon: <Building size={13} /> },
    { label: "LOCATION", value: data.location, icon: <Pin size={13} /> },
    { label: "CUSTOMER ID", value: data.customerId, icon: <IdCard size={13} /> },
    { label: "UNITS INSTALLED", value: String(data.disposalUnitsInstalled), icon: <Building size={13} /> },
    { label: "INSTALLATION DATE", value: data.installationDate, icon: <Calendar size={13} /> },
    { label: "REPORTING PERIOD", value: data.reportingPeriodRange, icon: <Calendar size={13} /> },
  ]

  const benefits = [
    {
      title: "Cleaner Smoking Zones",
      text: "Dedicated disposal reduces litter and keeps premises clean and pleasant.",
      icon: <Cigarette size={12} />,
    },
    {
      title: "Housekeeping Efficiency",
      text: "Reduces manual collection of cigarette butts and improves operational efficiency.",
      icon: <Broom size={12} />,
    },
    {
      title: "Landfill Diversion",
      text: "Cigarette waste is diverted from landfills and routed towards responsible processing.",
      icon: <Bin size={12} color={GREEN} />,
    },
    {
      title: "Circular Economy Contribution",
      text: "Waste is upcycled into useful products creating value and reducing resource extraction.",
      icon: <Recycle size={12} />,
    },
    {
      title: "ESG Contribution",
      text: "Supports measurable waste diversion and strengthens your sustainability reporting.",
      icon: <Chart size={12} />,
    },
    {
      title: "Behavioural Change",
      text: "Encourages responsible disposal habits among smokers and promotes environmental awareness.",
      icon: <Brain size={12} />,
    },
    {
      title: "Reduced Microplastic Pollution",
      text: "Prevents cellulose acetate filters from breaking down into microplastics in soil and water bodies.",
      icon: <MicroDots size={12} />,
    },
    {
      title: "Responsible Disposal",
      text: "Ensures cigarette waste is collected, processed and managed in an eco-responsible manner.",
      icon: <Shield size={12} />,
    },
  ]

  const sdgs = [
    { id: 3, note: "Reduces exposure to toxic chemicals and promotes a healthier environment." },
    { id: 6, note: "Prevents millions of litres of water from contamination by cigarette waste." },
    { id: 11, note: "Keeps public spaces clean and supports sustainable urban environments." },
    { id: 12, note: "Promotes responsible waste management and the upcycling of materials." },
    { id: 13, note: "Reduces pollution and supports climate action through waste diversion." },
    { id: 14, note: "Prevents microplastics and toxic chemicals from entering rivers and oceans." },
    { id: 15, note: "Protects soil and ecosystems from plastic pollution and chemical leaching." },
  ]

  const journey = [
    {
      title: "COLLECTION",
      text: "Cigarette waste is collected from dedicated disposal units at your premises.",
      icon: <Truck size={13} color="#FFFFFF" />,
    },
    {
      title: "SEGREGATION",
      text: "Collected waste is safely segregated and prepared for recycling.",
      icon: <Filter size={13} color="#FFFFFF" />,
    },
    {
      title: "RECYCLING",
      text: "Filters are processed to recover cellulose acetate and other materials.",
      icon: <Recycle size={13} color="#FFFFFF" />,
    },
    {
      title: "KRAFTREBORN",
      text: "Recycled material is upcycled into sustainable decor and gifting solutions.",
      icon: <Gift size={13} color="#FFFFFF" />,
    },
  ]

  const pillars = [
    {
      title: "Reduce Pollution",
      text: "Preventing toxic waste from entering our environment.",
      icon: <Leaf size={16} />,
    },
    {
      title: "Protect Water",
      text: "Safeguarding millions of litres of water from contamination.",
      icon: <Drop size={16} />,
    },
    {
      title: "Enable Circularity",
      text: "Upcycling waste into sustainable and useful products.",
      icon: <Recycle size={16} />,
    },
    {
      title: "Drive Social Impact",
      text: "Creating awareness, livelihoods and a cleaner tomorrow.",
      icon: <People size={16} />,
    },
  ]

  const references = [
    {
      logo: asset("citations", "cpcb.png"),
      source: "Central Pollution Control Board (CPCB) Guidelines (2022)",
      desc: "Guidelines for Management of Cigarette Waste and Extended Producer Responsibility.",
      href: "https://cpcb.nic.in/",
    },
    {
      logo: asset("citations", "surfrider.png"),
      source: "Surfrider Foundation Europe",
      desc: "Cigarette Butt Pollution Impact Report and Data.",
      href: "https://www.surfrider.eu/",
    },
    {
      logo: asset("citations", "navarra.png"),
      source: "University of Navarra Biodiversity Institute",
      desc: "Study on Cigarette Butts and Their Impact on Biodiversity and Ecosystems.",
      href: "https://www.unav.edu/",
    },
  ]

  return (
    <Document title={`${data.customerId} ESG Impact Report`} author="Buffindia">
      {/* ── PAGE 1: Cover ── */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.content, { paddingTop: 26, paddingBottom: 148 }]}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 30,
            }}
          >
            <View
              style={{
                width: 88,
                height: 58,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: data.logoUrl ? "#D7E8DC" : "#C5D8C8",
                borderStyle: data.logoUrl ? "solid" : "dashed",
                backgroundColor: GREEN_PALE,
                alignItems: "center",
                justifyContent: "center",
                padding: 6,
              }}
            >
              {data.logoUrl ? (
                <Image
                  src={data.logoUrl}
                  style={{ width: 72, height: 44, objectFit: "contain" }}
                />
              ) : (
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 7, fontWeight: "bold", color: GREEN, letterSpacing: 0.4 }}>
                    CUSTOMER LOGO
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Brand width={108} />
              <View
                style={{
                  borderWidth: 1.15,
                  borderColor: GREEN,
                  borderRadius: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 9, color: GREEN, fontWeight: "bold", letterSpacing: 1.1 }}>
                  ESG
                </Text>
              </View>
            </View>
          </View>

          {/* Hero title */}
          <View style={{ alignItems: "center", marginBottom: 22 }}>
            <Text
              style={{
                fontSize: 8.5,
                color: MUTED,
                letterSpacing: 3.2,
                fontWeight: "bold",
                marginBottom: 12,
              }}
            >
              CIGARETTE WASTE MANAGEMENT
            </Text>
            <Text
              style={{
                fontFamily: "Times-Bold",
                fontSize: 56,
                color: GREEN,
                letterSpacing: 1.5,
                lineHeight: 1,
              }}
            >
              ESG
            </Text>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "bold",
                color: DARK,
                letterSpacing: 2.4,
                marginTop: 2,
              }}
            >
              IMPACT
            </Text>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "bold",
                color: DARK,
                letterSpacing: 2.4,
                marginTop: -2,
              }}
            >
              REPORT
            </Text>
            <View
              style={{
                width: 52,
                height: 3.5,
                backgroundColor: ORANGE,
                borderRadius: 2,
                marginTop: 12,
                marginBottom: 12,
              }}
            />
            <Text style={{ fontSize: 10.5, color: MUTED, textAlign: "center", maxWidth: 400, lineHeight: 1.45 }}>
              Transforming cigarette waste into{" "}
              <Text style={{ fontWeight: "bold", color: GREEN }}>measurable environmental impact.</Text>
            </Text>
          </View>

          {/* Pillars — 4 columns */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: BORDER,
              paddingTop: 16,
              marginBottom: 20,
              flexDirection: "row",
            }}
          >
            {pillars.map((p, i) => (
              <View
                key={p.title}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingHorizontal: 8,
                  borderRightWidth: i < pillars.length - 1 ? 1 : 0,
                  borderRightColor: BORDER,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: GREEN_LIGHT,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  {p.icon}
                </View>
                <Text
                  style={{
                    fontSize: 8.5,
                    fontWeight: "bold",
                    color: GREEN,
                    textAlign: "center",
                    marginBottom: 4,
                  }}
                >
                  {p.title}
                </Text>
                <Text style={{ fontSize: 7, color: MUTED, textAlign: "center", lineHeight: 1.35 }}>
                  {p.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Identity cards — sit just above greenery */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 10,
                paddingVertical: 15,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: "#E2EBE4",
              }}
            >
              <Text style={{ fontSize: 6.5, fontWeight: "bold", color: MUTED, letterSpacing: 0.7 }}>
                CUSTOMER NAME
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "bold", color: DARK, marginTop: 5, marginBottom: 10 }}>
                {data.companyName}
              </Text>
              <View style={{ height: 1, backgroundColor: "#E5E7EB", marginBottom: 10 }} />
              <Text style={{ fontSize: 6.5, fontWeight: "bold", color: GREEN, letterSpacing: 0.6 }}>
                CUSTOMER ID
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "bold", color: DARK, marginTop: 4 }}>
                {data.customerId}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 10,
                paddingVertical: 15,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: "#E2EBE4",
              }}
            >
              <Text style={{ fontSize: 6.5, fontWeight: "bold", color: MUTED, letterSpacing: 0.7 }}>
                REPORTING PERIOD
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "bold", color: DARK, marginTop: 5, marginBottom: 10 }}>
                {data.reportingPeriodLabel}
              </Text>
              <View style={{ height: 1, backgroundColor: "#E5E7EB", marginBottom: 10 }} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Calendar size={12} />
                <Text style={{ fontSize: 10, fontWeight: "bold", color: DARK }}>
                  {data.reportingPeriodRange}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 34,
            height: 110,
          }}
        >
          <Image
            src={asset("cover-greenery.png")}
            style={{ width: "100%", height: 110, objectFit: "cover" }}
          />
        </View>

        <PageFooter dark />
      </Page>

      {/* ── PAGE 2: Impact Summary ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>02  ·  IMPACT SUMMARY</Text>
            </View>
            <Brand />
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.sectionTitle}>IMPACT SUMMARY</Text>
              <Text style={[styles.sectionSub, { marginBottom: 0 }]}>
                Environmental impact achieved during this reporting period.
              </Text>
            </View>
            <View
              style={{
                width: 210,
                backgroundColor: GREEN_LIGHT,
                borderRadius: 10,
                padding: 11,
                flexDirection: "row",
                alignItems: "center",
                gap: 9,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: GREEN,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Leaf size={12} color="#FFFFFF" />
              </View>
              <Text style={{ fontSize: 7.8, color: GREEN_MID, flex: 1, lineHeight: 1.35 }}>
                Every butt collected today{" "}
                <Text style={{ fontWeight: "bold", color: GREEN }}>protects our tomorrow.</Text>
              </Text>
            </View>
          </View>

          {/* Business info */}
          <View
            style={{
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                backgroundColor: GREEN_PALE,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderBottomWidth: 1,
                borderBottomColor: BORDER,
              }}
            >
              <Building size={12} />
              <Text style={{ fontSize: 8.5, fontWeight: "bold", color: GREEN, letterSpacing: 0.45 }}>
                BUSINESS INFORMATION
              </Text>
            </View>
            <View style={{ flexDirection: "row", backgroundColor: "#FAFBFA" }}>
              {bizFields.map((f, i) => (
                <View
                  key={f.label}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 5,
                    borderRightWidth: i < bizFields.length - 1 ? 1 : 0,
                    borderRightColor: BORDER,
                  }}
                >
                  {f.icon}
                  <Text
                    style={{
                      fontSize: 5.5,
                      color: MUTED,
                      marginTop: 5,
                      marginBottom: 4,
                      letterSpacing: 0.25,
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {f.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 7.2,
                      fontWeight: "bold",
                      color: DARK,
                      textAlign: "center",
                      lineHeight: 1.25,
                    }}
                  >
                    {f.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Metrics header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: GREEN,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Leaf size={10} color="#FFFFFF" />
              </View>
              <Text style={{ fontSize: 11, fontWeight: "bold", color: GREEN, letterSpacing: 0.4 }}>
                KEY ENVIRONMENTAL METRICS
              </Text>
            </View>
            <View
              style={{
                backgroundColor: GREEN,
                borderRadius: 11,
                paddingHorizontal: 10,
                paddingVertical: 3.5,
              }}
            >
              <Text style={{ color: "#FFF", fontSize: 6.2, fontWeight: "bold", letterSpacing: 0.45 }}>
                CUMULATIVE TILL DATE
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
            <MetricCard
              label="TOTAL WASTE COLLECTED"
              value={waste}
              unit="KG"
              note="Collected waste has been routed into Buffindia's recycling process."
              accent={ORANGE}
              icon={<Bin size={12} />}
            />
            <MetricCard
              label="CIGARETTE BUTTS COLLECTED"
              value={butts}
              unit="IN NUMBER"
              note="Butts collected and prevented from littering our environment."
              accent={GREEN}
              icon={<Cigarette size={12} />}
            />
            <MetricCard
              label="TOTAL WASTE RECYCLED"
              value={recycled}
              unit="KG"
              note="Waste responsibly processed through our recycling system."
              accent={ORANGE}
              icon={<Recycle size={12} color={ORANGE} />}
            />
            <MetricCard
              label="MICROPLASTICS UPCYCLED"
              value={micro}
              unit="KG"
              note="Microplastics prevented from entering soil and water bodies."
              accent={GREEN}
              icon={<MicroDots size={12} />}
            />
            <MetricCard
              label="WATER RESOURCES PROTECTED"
              value={water}
              unit="LITRES"
              note="Potential contamination prevented from entering our water resources."
              accent={ORANGE}
              icon={<Drop size={12} color={ORANGE} />}
            />
            <MetricCard
              label="KRAFTREBORN CREDITS"
              value={kraft}
              unit={kraftUnit}
              note="Generated credits towards sustainable product conversion."
              accent={GREEN}
              icon={<Gift size={12} />}
            />
          </View>

          <View
            style={{
              marginTop: 14,
              backgroundColor: GREEN_LIGHT,
              borderRadius: 11,
              borderWidth: 1,
              borderColor: "#C8E6D4",
              padding: 13,
              flexDirection: "row",
              alignItems: "center",
              gap: 11,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: GREEN,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Leaf size={16} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 8.5,
                  fontWeight: "bold",
                  color: GREEN,
                  marginBottom: 4,
                  letterSpacing: 0.35,
                }}
              >
                OUR IMPACT STATEMENT
              </Text>
              <Text style={{ fontSize: 8.2, color: GREEN_MID, lineHeight: 1.42 }}>
                During this reporting period,{" "}
                <Text style={{ fontWeight: "bold", color: GREEN }}>{data.companyName}</Text>{" "}
                responsibly diverted{" "}
                <Text style={{ fontWeight: "bold", color: GREEN }}>{waste} kg</Text> of cigarette
                waste, preventing approximately{" "}
                <Text style={{ fontWeight: "bold", color: GREEN }}>{water} litres</Text> of water
                contamination and reducing plastic litter and microplastic pollution.
              </Text>
            </View>
            <GlobeArt size={52} />
          </View>

          <View style={{ flexDirection: "row", gap: 6, marginTop: 11, alignItems: "flex-start" }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: GREEN_LIGHT,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}
            >
              <Text style={{ fontSize: 7, color: GREEN, fontWeight: "bold" }}>i</Text>
            </View>
            <Text style={{ fontSize: 7, color: MUTED, flex: 1, lineHeight: 1.4 }}>
              The above impact is calculated based on conservative industry standards and verified
              internal conversion factors. For details, please refer to the Methodology & References
              section.
            </Text>
          </View>
        </View>
        <PageFooter />
      </Page>

      {/* ── PAGE 3: Sustainability & SDGs ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>03  ·  SUSTAINABILITY & SDG IMPACT</Text>
            </View>
            <Brand />
          </View>

          <Text style={styles.sectionTitle}>SUSTAINABILITY BENEFITS</Text>
          <Text style={styles.sectionSub}>
            Your partnership with Buffindia creates a positive impact across environment, operations
            and society.
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {benefits.map((b) => (
              <View
                key={b.title}
                style={{
                  width: "23.6%",
                  borderWidth: 1,
                  borderColor: BORDER,
                  borderRadius: 9,
                  padding: 10,
                  minHeight: 102,
                  backgroundColor: "#FFFFFF",
                }}
              >
                <IconCircle size={26}>{b.icon}</IconCircle>
                <Text
                  style={{
                    fontSize: 7.4,
                    fontWeight: "bold",
                    color: GREEN,
                    marginBottom: 4,
                    lineHeight: 1.25,
                  }}
                >
                  {b.title}
                </Text>
                <Text style={{ fontSize: 6.1, color: MUTED, lineHeight: 1.35 }}>{b.text}</Text>
              </View>
            ))}
          </View>

          <View
            style={{
              height: 1.5,
              backgroundColor: GREEN,
              marginBottom: 12,
              borderRadius: 1,
            }}
          />

          <Text style={[styles.sectionTitle, { fontSize: 12.5 }]}>
            YOUR CONTRIBUTION TO THE UN SUSTAINABLE DEVELOPMENT GOALS
          </Text>
          <Text style={styles.sectionSub}>
            Through responsible cigarette waste management, you are contributing to a better and more
            sustainable world.
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
            {sdgs.map((s) => (
              <View key={s.id} style={{ width: 70, alignItems: "center" }}>
                <Image
                  src={asset("sdg", `sdg-${s.id}.png`)}
                  style={{
                    width: 62,
                    height: 62,
                    objectFit: "contain",
                    marginBottom: 6,
                    borderRadius: 4,
                  }}
                />
                <Text style={{ fontSize: 5.2, color: MUTED, textAlign: "center", lineHeight: 1.28 }}>
                  {s.note}
                </Text>
              </View>
            ))}
          </View>
          <Text style={{ fontSize: 5, color: MUTED, marginBottom: 14, fontStyle: "italic" }}>
            Official UN Sustainable Development Goals icons. Learn more at
            www.un.org/sustainabledevelopment
          </Text>

          <Text style={[styles.sectionTitle, { fontSize: 13 }]}>OUR CIRCULAR JOURNEY</Text>
          <Text style={styles.sectionSub}>
            From collection to conversion – creating value from waste.
          </Text>

          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            {journey.map((step, i) => (
              <React.Fragment key={step.title}>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: GREEN,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 7,
                    }}
                  >
                    {step.icon}
                  </View>
                  <View
                    style={{
                      width: "100%",
                      borderWidth: 1,
                      borderColor: BORDER,
                      borderRadius: 9,
                      padding: 10,
                      alignItems: "center",
                      backgroundColor: GREEN_PALE,
                      minHeight: 86,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 6,
                        fontWeight: "bold",
                        color: ORANGE,
                        textAlign: "center",
                        marginBottom: 2,
                        letterSpacing: 0.4,
                      }}
                    >
                      STEP {i + 1}
                    </Text>
                    <Text
                      style={{
                        fontSize: 7.4,
                        fontWeight: "bold",
                        color: GREEN,
                        textAlign: "center",
                        marginBottom: 5,
                        letterSpacing: 0.3,
                      }}
                    >
                      {step.title}
                    </Text>
                    <Text style={{ fontSize: 6.1, color: MUTED, textAlign: "center", lineHeight: 1.35 }}>
                      {step.text}
                    </Text>
                  </View>
                </View>
                {i < journey.length - 1 ? (
                  <View style={{ width: 14, marginTop: 38, alignItems: "center" }}>
                    <Svg width={12} height={10} viewBox="0 0 12 10">
                      <Path d="M1 5h8M6 2l3.5 3L6 8" stroke={GREEN} strokeWidth={1.4} fill="none" />
                    </Svg>
                  </View>
                ) : null}
              </React.Fragment>
            ))}
          </View>

          <View
            style={{
              marginTop: 16,
              backgroundColor: "#F3F4F6",
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Leaf size={13} />
            <Text style={{ fontSize: 8.5, color: DARK }}>
              Less Waste. Less Pollution. More Value.{" "}
              <Text style={{ color: ORANGE, fontWeight: "bold" }}>A Better Tomorrow.</Text>
            </Text>
          </View>
        </View>
        <PageFooter />
      </Page>

      {/* ── PAGE 4: Methodology & References ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>04  ·  METHODOLOGY & REFERENCES</Text>
            </View>
            <Brand />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 5 }}>
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
              <Text style={{ fontSize: 10, color: GREEN, fontWeight: "bold" }}>∑</Text>
            </View>
            <Text style={{ fontSize: 12.5, fontWeight: "bold", color: GREEN, letterSpacing: 0.35 }}>
              IMPACT CALCULATION METHODOLOGY
            </Text>
          </View>
          <Text style={styles.sectionSub}>
            Our impact calculations are based on conservative industry standards, scientific research
            and verified conversion factors.
          </Text>

          <View style={{ flexDirection: "row", gap: 9, marginBottom: 12 }}>
            {[
              {
                title: "CIGARETTE WASTE TO BUTTS",
                body: "1 kg of cigarette waste is estimated to be equal to",
                value: "3,000",
                unit: "cigarette butts",
                icon: <Bin size={13} color={GREEN} />,
              },
              {
                title: "MICROPLASTIC CONTENT",
                body: "Cigarette filters are estimated to contain",
                value: "~80%",
                unit: "microplastic (cellulose acetate).",
                icon: <Recycle size={13} />,
              },
              {
                title: "WATER POLLUTION IMPACT",
                body: "A single cigarette butt can contaminate up to",
                value: "100 litres",
                unit: "of water.",
                icon: <Drop size={13} />,
              },
            ].map((c) => (
              <View
                key={c.title}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: BORDER,
                  borderRadius: 10,
                  padding: 12,
                  backgroundColor: GREEN_PALE,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: "#FFFFFF",
                      borderWidth: 1,
                      borderColor: "#D7E8DC",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {c.icon}
                  </View>
                  <Text
                    style={{
                      fontSize: 6.8,
                      fontWeight: "bold",
                      color: GREEN,
                      letterSpacing: 0.2,
                      flex: 1,
                      lineHeight: 1.25,
                    }}
                  >
                    {c.title}
                  </Text>
                </View>
                <Text style={{ fontSize: 7.2, color: MUTED, lineHeight: 1.4, marginBottom: 8 }}>
                  {c.body}
                </Text>
                <Text style={{ fontSize: 17, fontWeight: "bold", color: GREEN, letterSpacing: -0.2 }}>
                  {c.value}
                </Text>
                <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 2 }}>{c.unit}</Text>
              </View>
            ))}
          </View>

          <View
            style={{
              backgroundColor: GREEN_PALE,
              borderRadius: 9,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: "#C8E6D4",
              padding: 11,
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Leaf size={13} />
            <Text style={{ fontSize: 7.8, color: MUTED, flex: 1, lineHeight: 1.4 }}>
              All calculations are cumulative till date and conservative in nature to ensure the{" "}
              <Text style={{ fontWeight: "bold", color: GREEN }}>credibility and transparency</Text> of
              reported impact.
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <Book size={13} />
            <Text style={{ fontSize: 12.5, fontWeight: "bold", color: GREEN, letterSpacing: 0.35 }}>
              REFERENCES
            </Text>
          </View>
          <Text style={{ fontSize: 8.2, color: MUTED, marginBottom: 10, lineHeight: 1.35 }}>
            Impact factors are derived from recognized government guidelines, research studies and
            environmental reports.
          </Text>

          <View
            style={{
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                backgroundColor: GREEN,
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{ color: "#FFF", fontSize: 7.2, fontWeight: "bold", width: "38%", letterSpacing: 0.4 }}>
                SOURCE
              </Text>
              <Text style={{ color: "#FFF", fontSize: 7.2, fontWeight: "bold", width: "44%", letterSpacing: 0.4 }}>
                DESCRIPTION
              </Text>
              <Text style={{ color: "#FFF", fontSize: 7.2, fontWeight: "bold", width: "18%", letterSpacing: 0.4 }}>
                LINK
              </Text>
            </View>
            {references.map((row) => (
              <View
                key={row.source}
                style={{
                  flexDirection: "row",
                  borderTopWidth: 1,
                  borderTopColor: BORDER,
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <View
                  style={{
                    width: "38%",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingRight: 6,
                  }}
                >
                  <Image
                    src={row.logo}
                    style={{ width: 34, height: 34, objectFit: "contain" }}
                  />
                  <Text
                    style={{
                      fontSize: 7,
                      fontWeight: "bold",
                      color: DARK,
                      flex: 1,
                      lineHeight: 1.3,
                    }}
                  >
                    {row.source}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 7,
                    color: MUTED,
                    width: "44%",
                    lineHeight: 1.35,
                    paddingRight: 6,
                  }}
                >
                  {row.desc}
                </Text>
                <Link
                  src={row.href}
                  style={{
                    fontSize: 7.2,
                    color: ORANGE,
                    width: "18%",
                    textDecoration: "none",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: ORANGE, fontSize: 7.2, fontWeight: "bold" }}>View Source ↗</Text>
                </Link>
              </View>
            ))}
          </View>

          <View
            style={{
              borderWidth: 1,
              borderColor: "#C8E6D4",
              backgroundColor: GREEN_LIGHT,
              borderRadius: 10,
              padding: 12,
              marginBottom: 12,
              flexDirection: "row",
              gap: 10,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: GREEN,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "bold" }}>✓</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8.8, fontWeight: "bold", color: GREEN, marginBottom: 3 }}>
                IMPORTANT NOTE
              </Text>
              <Text style={{ fontSize: 7.5, color: GREEN_MID, lineHeight: 1.4 }}>
                The provided data represents the impact of cigarette waste collected and processed by
                Buffindia. Figures are calculated using conservative assumptions and may vary based on
                actual conditions and external environmental factors.
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: GREEN,
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Leaf size={14} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: 8.5, color: "#FFFFFF", flex: 1, lineHeight: 1.4 }}>
              Thank you for being a part of the change.{" "}
              <Text style={{ fontWeight: "bold", color: ORANGE }}>
                Together, we are building a cleaner, greener and healthier future.
              </Text>
            </Text>
          </View>
        </View>

        <View
          style={{
            position: "absolute",
            left: 36,
            right: 36,
            bottom: 13,
            borderTopWidth: 1,
            borderTopColor: GREEN,
            paddingTop: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Globe size={9} color={GREEN} />
              <Text style={{ fontSize: 7, color: MUTED }}>www.buffindia.com</Text>
            </View>
            <Text style={{ fontSize: 7, color: MUTED }}>
              Customer ID: {data.customerId}  ·  Reporting Period: {data.reportingPeriodRange}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 6.5, color: MUTED }}>
              A cleaner today.{" "}
              <Text style={{ color: ORANGE, fontWeight: "bold" }}>A better tomorrow.</Text>
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Text style={{ fontSize: 6, color: MUTED }}>Proudly supported by</Text>
              <Image src={asset("iima.png")} style={{ width: 20, height: 14, objectFit: "contain" }} />
              <Image src={asset("kotak.png")} style={{ width: 40, height: 12, objectFit: "contain" }} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

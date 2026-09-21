export const KNOWN_EMAIL_KINDS = ["esg_report", "welcome", "renewal", "newsletter"] as const

export const EMAIL_KIND_LABELS: Record<string, string> = {
  esg_report: "ESG Report",
  welcome: "Welcome",
  renewal: "Renewal",
  newsletter: "Newsletter",
  inbound: "Inbound",
  unknown: "Other",
}

export function emailKindLabel(kind: string) {
  return EMAIL_KIND_LABELS[kind] || kind.replace(/_/g, " ")
}

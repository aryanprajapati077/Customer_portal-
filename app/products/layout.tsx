import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Products | KraftReborn by BuffIndia – Sustainable Decor & Gifting",
  description:
    "World's first e-commerce store for sustainable decor & gifting. Handcrafted from recycled cigarette waste. Budget-friendly, eco-friendly products.",
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}

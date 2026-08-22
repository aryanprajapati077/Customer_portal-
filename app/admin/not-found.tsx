import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, LayoutDashboard } from "lucide-react"

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="admin-eyebrow mb-4">404</p>
      <h1 className="admin-page-title">Page not found</h1>
      <p className="mt-2 max-w-md text-[14px] text-[#6b6b6b]">
        This admin page does not exist or you may not have permission to view it.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/admin">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Admin home
          </Link>
        </Button>
        <Button asChild className="rounded-full bg-[#1B7339] hover:bg-[#145a2c]">
          <Link href="/admin/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Manage clients
          </Link>
        </Button>
      </div>
    </div>
  )
}

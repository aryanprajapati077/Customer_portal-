"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsOverview } from "@/components/dashboard/stats-overview"
import { CollectionHistory } from "@/components/dashboard/collection-history"
import { CertificatesSection } from "@/components/dashboard/certificates-section"
import { ReportsSection } from "@/components/dashboard/reports-section"
import { ImpactVisualization } from "@/components/dashboard/impact-visualization"
import { CustomerProfile } from "@/components/dashboard/customer-profile"
import { GroupWasteBreakdown } from "@/components/dashboard/group-waste-breakdown"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DownloadReportButton } from "@/components/dashboard/download-report-button"

export default function DashboardPage() {
  const { customer, isLoading } = useAuth()
  const router = useRouter()
  const [customerView, setCustomerView] = useState(customer)
  const [viewingAsId, setViewingAsId] = useState<string | null>(null)
  const [childCompanies, setChildCompanies] = useState<{ id: string; companyName: string; email: string }[]>([])
  const [collections, setCollections] = useState([])
  const [certificates, setCertificates] = useState([])
  const [reports, setReports] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const effectiveCustomerId = viewingAsId || customer?.id

  useEffect(() => {
    if (!isLoading && !customer) {
      router.push("/login")
    }
  }, [customer, isLoading, router])

  useEffect(() => {
    setCustomerView(customer)
    setViewingAsId(null)
  }, [customer])

  useEffect(() => {
    const isGroup = customerView?.isGroup || customer?.isGroup
    if (!isGroup || !customer?.id) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/customer/children?customerId=${customer.id}`)
        const data = await res.json()
        if (cancelled) return
        if (data?.success && data.children) setChildCompanies(data.children)
      } catch {
        // ignore
      }
    })()
    return () => { cancelled = true }
  }, [customer?.id, customer?.isGroup, customerView?.isGroup])

  const fetchCustomerData = useCallback(async () => {
    if (!effectiveCustomerId) return

    setDataLoading(true)
    try {
      const [collectionsRes, certificatesRes, reportsRes, profileRes] = await Promise.all([
        fetch(`/api/customer/collections?customerId=${effectiveCustomerId}`),
        fetch(`/api/customer/certificates?customerId=${effectiveCustomerId}`),
        fetch(`/api/customer/reports?customerId=${effectiveCustomerId}`),
        fetch(`/api/customer/profile?customerId=${effectiveCustomerId}`),
      ])

      const [collectionsData, certificatesData, reportsData, profileData] = await Promise.all([
        collectionsRes.json(),
        certificatesRes.json(),
        reportsRes.json(),
        profileRes.json(),
      ])

      if (collectionsData.success) setCollections(collectionsData.collections)
      if (certificatesData.success) setCertificates(certificatesData.certificates)
      if (reportsData.success) setReports(reportsData.reports)
      if (profileData.success && profileData.customer) {
        setCustomerView(profileData.customer)
        if (effectiveCustomerId === customer?.id) {
          localStorage.setItem("buffindia_customer", JSON.stringify(profileData.customer))
        }
      }
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Error fetching customer data:", error)
    }
    setDataLoading(false)
  }, [effectiveCustomerId, customer?.id])

  useEffect(() => {
    if (effectiveCustomerId) {
      fetchCustomerData()
    }
  }, [effectiveCustomerId, fetchCustomerData])

  const handleCompanySwitch = useCallback((customerId: string) => {
    setViewingAsId(customerId === customer?.id ? null : customerId)
  }, [customer?.id])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchCustomerData()
    setIsRefreshing(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-primary/20 animate-ping" />
            <Loader2 className="w-12 h-12 animate-spin text-primary relative" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!customerView) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-primary/3 to-secondary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <DashboardHeader
          customer={(customerView || customer)!}
          childCompanies={childCompanies}
          viewingAsId={viewingAsId ?? undefined}
          onCompanySwitch={(customerView?.isGroup || customer?.isGroup) ? handleCompanySwitch : undefined}
        />

        <main className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
          {/* Refresh Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm text-muted-foreground">
              {lastRefresh && <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>}
            </div>
            <div className="flex items-center gap-2">
              <DownloadReportButton customerId={effectiveCustomerId!} variant="outline" size="sm" />
              <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-transparent"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <StatsOverview customer={customerView} collections={collections} />

          {/* Group Waste by Client (when group views "My company") */}
          {customer?.isGroup && !viewingAsId && (
            <GroupWasteBreakdown groupCustomerId={customer.id} />
          )}

          {/* Customer Profile Card */}
          <CustomerProfile customer={customerView} collections={collections} />

          {/* Impact Visualization */}
          <ImpactVisualization customer={customerView} collections={collections} />

          {/* Two Column Layout for Collections and Certificates */}
          <div className="grid lg:grid-cols-2 gap-8">
            <CollectionHistory collections={collections} isLoading={dataLoading} />
            <CertificatesSection
              certificates={certificates}
              isLoading={dataLoading}
              customerId={effectiveCustomerId!}
              contactName={customerView.contactPerson?.split(" ")[0] || customerView.companyName}
            />
          </div>

          {/* Reports Section */}
          <ReportsSection reports={reports} isLoading={dataLoading} customerId={effectiveCustomerId!} />
        </main>
      </div>
    </div>
  )
}

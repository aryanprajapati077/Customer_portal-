"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type Customer } from "@/lib/auth-context"
import { computePortalMetrics, type CollectionLike, type PortalMetrics } from "@/lib/portal-metrics"

export type PortalReport = {
  id: string
  name: string
  date: string
  type?: string
  driveFileUrl?: string
  size?: string
  description?: string
  period?: string
}

export type PortalCertificate = {
  id: string
  name: string
  issueDate: string
  type?: string
  description?: string
  driveFileUrl?: string
  certificateNumber?: string
}

export function usePortalData() {
  const { customer, isLoading } = useAuth()
  const router = useRouter()
  const [customerView, setCustomerView] = useState<Customer | null>(customer)
  const [collections, setCollections] = useState<CollectionLike[]>([])
  const [certificates, setCertificates] = useState<PortalCertificate[]>([])
  const [reports, setReports] = useState<PortalReport[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    if (!isLoading && !customer) router.push("/login")
  }, [customer, isLoading, router])

  useEffect(() => {
    setCustomerView(customer)
  }, [customer])

  const fetchCustomerData = useCallback(async () => {
    if (!customer?.id) return
    setDataLoading(true)
    try {
      const [collectionsRes, certificatesRes, reportsRes, profileRes] = await Promise.all([
        fetch(`/api/customer/collections?customerId=${customer.id}`),
        fetch(`/api/customer/certificates?customerId=${customer.id}`),
        fetch(`/api/customer/reports?customerId=${customer.id}`),
        fetch(`/api/customer/profile?customerId=${customer.id}`),
      ])
      const [collectionsData, certificatesData, reportsData, profileData] = await Promise.all([
        collectionsRes.json(),
        certificatesRes.json(),
        reportsRes.json(),
        profileRes.json(),
      ])
      if (collectionsData.success) setCollections(collectionsData.collections || [])
      if (certificatesData.success) setCertificates(certificatesData.certificates || [])
      if (reportsData.success) setReports(reportsData.reports || [])
      if (profileData.success && profileData.customer) {
        setCustomerView(profileData.customer)
        localStorage.setItem("buffindia_customer", JSON.stringify(profileData.customer))
      }
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Error fetching portal data:", error)
    }
    setDataLoading(false)
  }, [customer?.id])

  useEffect(() => {
    if (customer?.id) fetchCustomerData()
  }, [customer?.id, fetchCustomerData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchCustomerData()
    setIsRefreshing(false)
  }

  const activeCustomer = customerView || customer
  const metrics: PortalMetrics = computePortalMetrics(
    collections,
    activeCustomer?.totalWasteCollected,
    activeCustomer?.kraftrebornCredits,
  )

  return {
    customer: activeCustomer,
    authLoading: isLoading,
    dataLoading,
    isRefreshing,
    lastRefresh,
    collections,
    certificates,
    reports,
    metrics,
    handleRefresh,
    refetch: fetchCustomerData,
  }
}

"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type Customer } from "@/lib/auth-context"
import { computePortalMetrics, type CollectionLike, type PortalMetrics } from "@/lib/portal-metrics"
import type { GroupLocationOption } from "@/components/portal/group-location-switcher"

export type PortalReport = {
  id: string
  name: string
  date: string
  type?: string
  driveFileUrl?: string
  size?: string
  description?: string
  period?: string
  locationName?: string
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

export type CollectionWithLocation = CollectionLike & {
  locationName?: string
  locationCity?: string | null
}

const LOCATION_KEY = "buffindia_group_location"

export function usePortalData() {
  const { customer, isLoading } = useAuth()
  const router = useRouter()
  const [customerView, setCustomerView] = useState<Customer | null>(customer)
  const [groupLocations, setGroupLocations] = useState<GroupLocationOption[]>([])
  const [selectedLocationId, setSelectedLocationIdState] = useState<string | null>(null)
  const [collections, setCollections] = useState<CollectionWithLocation[]>([])
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

  useEffect(() => {
    if (!customer?.isGroup) {
      setGroupLocations([])
      setSelectedLocationIdState(null)
      return
    }
    try {
      const saved = sessionStorage.getItem(`${LOCATION_KEY}_${customer.id}`)
      if (saved && saved !== "all") setSelectedLocationIdState(saved)
    } catch {
      /* ignore */
    }
    fetch("/api/customer/group-locations")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && Array.isArray(d.locations)) setGroupLocations(d.locations)
      })
      .catch(() => {})
  }, [customer?.id, customer?.isGroup])

  const setSelectedLocationId = useCallback(
    (id: string | null) => {
      setSelectedLocationIdState(id)
      if (customer?.id) {
        try {
          sessionStorage.setItem(`${LOCATION_KEY}_${customer.id}`, id || "all")
        } catch {
          /* ignore */
        }
      }
    },
    [customer?.id],
  )

  const fetchCustomerData = useCallback(async () => {
    if (!customer?.id) return
    setDataLoading(true)
    const locQs = selectedLocationId ? `&locationId=${encodeURIComponent(selectedLocationId)}` : ""
    try {
      const [collectionsRes, certificatesRes, reportsRes, profileRes] = await Promise.all([
        fetch(`/api/customer/collections?customerId=${customer.id}${locQs}`),
        fetch(`/api/customer/certificates?customerId=${customer.id}${locQs}`),
        fetch(`/api/customer/reports?customerId=${customer.id}${locQs}`),
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
        if (Array.isArray(profileData.customer.groupLocations)) {
          setGroupLocations(profileData.customer.groupLocations)
        }
        localStorage.setItem("buffindia_customer", JSON.stringify(profileData.customer))
      }
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Error fetching portal data:", error)
    }
    setDataLoading(false)
  }, [customer?.id, selectedLocationId])

  useEffect(() => {
    if (customer?.id) fetchCustomerData()
  }, [customer?.id, fetchCustomerData])

  useEffect(() => {
    const onLoc = (e: Event) => {
      const id = (e as CustomEvent<string | null>).detail ?? null
      setSelectedLocationIdState(id)
    }
    window.addEventListener("buffindia-group-location", onLoc)
    return () => window.removeEventListener("buffindia-group-location", onLoc)
  }, [])

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
    groupLocations,
    selectedLocationId,
    setSelectedLocationId,
    isGroupView: Boolean(customer?.isGroup),
  }
}

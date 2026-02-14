"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { CollectionHistory } from "@/components/dashboard/collection-history";
import { CertificatesSection } from "@/components/dashboard/certificates-section";
import { ReportsSection } from "@/components/dashboard/reports-section";
import { ImpactVisualization } from "@/components/dashboard/impact-visualization";
import { CustomerProfile } from "@/components/dashboard/customer-profile";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { customer, isLoading } = useAuth();
  const router = useRouter();
  const [collections, setCollections] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [reports, setReports] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (!isLoading && !customer) {
      router.push("/login");
    }
  }, [customer, isLoading, router]);

  const fetchCustomerData = useCallback(async () => {
    if (!customer?.id) return;

    setDataLoading(true);
    try {
      const [collectionsRes, certificatesRes, reportsRes] = await Promise.all([
        fetch(`/api/customer/collections?customerId=${customer.id}`),
        fetch(`/api/customer/certificates?customerId=${customer.id}`),
        fetch(`/api/customer/reports?customerId=${customer.id}`),
      ]);

      const [collectionsData, certificatesData, reportsData] =
        await Promise.all([
          collectionsRes.json(),
          certificatesRes.json(),
          reportsRes.json(),
        ]);

      if (collectionsData.success) setCollections(collectionsData.collections);
      if (certificatesData.success)
        setCertificates(certificatesData.certificates);
      if (reportsData.success) setReports(reportsData.reports);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
    setDataLoading(false);
  }, [customer?.id]);

  useEffect(() => {
    if (customer?.id) {
      fetchCustomerData();
    }
  }, [customer?.id, fetchCustomerData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCustomerData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-primary/20 animate-ping" />
            <Loader2 className="w-12 h-12 animate-spin text-primary relative" />
          </div>
          <p className="text-muted-foreground animate-pulse">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
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
        <DashboardHeader customer={customer} />

        <main className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
          {/* Refresh Bar */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {lastRefresh && (
                <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-transparent"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>

          {/* Stats Overview */}
          <StatsOverview customer={customer} collections={collections} />

          {/* Customer Profile Card */}
          <CustomerProfile customer={customer} />

          {/* Impact Visualization */}
          <ImpactVisualization customer={customer} collections={collections} />

          {/* Two Column Layout for Collections and Certificates */}
          <div className="grid lg:grid-cols-2 gap-8">
            <CollectionHistory
              collections={collections}
              isLoading={dataLoading}
            />
            <CertificatesSection
              certificates={certificates}
              isLoading={dataLoading}
            />
          </div>

          {/* Reports Section */}
          <ReportsSection reports={reports} isLoading={dataLoading} />
        </main>
      </div>
    </div>
  );
}

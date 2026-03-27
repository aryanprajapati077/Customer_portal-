"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, Calendar, MapPin, TrendingUp, Recycle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePreferences } from "@/lib/preferences-context"

interface Collection {
  id: string
  date: string
  weight: number
  location: string
  status: string
  [key: string]: string | number | null | undefined
}

interface CollectionHistoryProps {
  collections: Collection[]
  isLoading: boolean
}

export function CollectionHistory({ collections, isLoading }: CollectionHistoryProps) {
  const { formatWeight } = usePreferences()
  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return { color: "bg-secondary/10 text-secondary border-secondary/20", dot: "bg-secondary" }
      case "pending":
        return { color: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary animate-pulse" }
      case "scheduled":
        return { color: "bg-accent/10 text-accent border-accent/20", dot: "bg-accent" }
      default:
        return { color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" }
    }
  }

  // Calculate totals
  const totalWeight = collections.reduce((sum, c) => sum + (Number(c.weight) || 0), 0)
  const totalMicroplastics = collections.reduce((sum, c) => sum + (Number(c.weight) || 0) * 0.8, 0)
  const totalWeightFmt = formatWeight(totalWeight, { decimals: 1 })
  const totalMicroFmt = formatWeight(totalMicroplastics, { decimals: 1 })

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Collection History
            </CardTitle>
            <CardDescription>Recent waste collection records</CardDescription>
          </div>
          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
            {collections.length} Collections
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total Collected</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {totalWeightFmt.label} {totalWeightFmt.unit}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/10">
                <div className="flex items-center gap-2 mb-1">
                  <Recycle className="w-4 h-4 text-secondary" />
                  <span className="text-xs text-muted-foreground">Microplastics Upcycled</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {totalMicroFmt.label} {totalMicroFmt.unit}
                </p>
              </div>
            </div>

            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-3">
                {collections.map((collection, index) => {
                  const config = getStatusConfig(collection.status?.toString() || "")
                  const microplastics = (Number(collection.weight) || 0) * 0.8
                  const weightFmt = formatWeight(Number(collection.weight) || 0, { decimals: 1 })
                  const microFmt = formatWeight(microplastics, { decimals: 1 })

                  return (
                    <div
                      key={collection.id || index}
                      className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {collection.date
                                ? new Date(collection.date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className={config.color}>
                          {collection.status || "Unknown"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{collection.location || "N/A"}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-foreground">
                            {weightFmt.label} {weightFmt.unit}
                          </span>
                          <p className="text-xs text-secondary">
                            {microFmt.label} {microFmt.unit} microplastics upcycled
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  )
}


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getEmailProcessingMetrics } from "@/services/gmailService";
import { ChartBar, Clock, List, ListCheck } from "lucide-react";

export function QuickStats() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['emailMetrics'],
    queryFn: getEmailProcessingMetrics,
    refetchInterval: 60000, // Refresh every minute
    placeholderData: {
      totalQuotes: 0,
      pendingEmails: 0,
      successRate: 0,
      avgResponseTime: 0
    }
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Quotes
          </CardTitle>
          <ListCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isLoading ? "..." : metrics.totalQuotes}</div>
          <p className="text-xs text-muted-foreground">
            Across all time
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Emails
          </CardTitle>
          <List className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isLoading ? "..." : metrics.pendingEmails}</div>
          <p className="text-xs text-muted-foreground">
            Requires processing
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Quote Success Rate
          </CardTitle>
          <ChartBar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isLoading ? "..." : `${metrics.successRate}%`}</div>
          <p className="text-xs text-muted-foreground">
            Auto-processing success
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg. Response Time
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isLoading ? "..." : `${metrics.avgResponseTime} hrs`}</div>
          <p className="text-xs text-muted-foreground">
            From request to quote sent
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuickStats;

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, CheckCircle2, MailWarning } from "lucide-react";
import { useEffect, useState } from "react";
import { getEmailProcessingMetrics } from "@/services/gmailService";

export function QuickStats() {
  const [metrics, setMetrics] = useState({
    totalQuotes: 52,
    pendingEmails: 3,
    successRate: 85,
    avgResponseTime: 2.4
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const fetchedMetrics = await getEmailProcessingMetrics();
        setMetrics(fetchedMetrics);
      } catch (error) {
        console.error("Error fetching metrics:", error);
        // Optionally, handle the error, e.g., display a message to the user
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Quotes Generated
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalQuotes}</div>
          <p className="text-sm text-muted-foreground">
            {metrics.successRate}% increase in conversion
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Email Requests
          </CardTitle>
          <MailWarning className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.pendingEmails}</div>
          <p className="text-sm text-muted-foreground">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
            {metrics.pendingEmails} less than last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <ArrowUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.successRate}%</div>
          <p className="text-sm text-muted-foreground">
            +10% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg. Response Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.avgResponseTime}m</div>
          <p className="text-sm text-muted-foreground">
            +3m from last week
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuickStats;

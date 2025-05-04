
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteStatistics } from "@/types";
import { useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

// Demo data
const demoStats: QuoteStatistics = {
  totalQuotes: 0,
  pendingEmails: 1,
  quoteSuccessRate: 60,
  avgResponseTime: 0, // No data yet
  changeFromPrevious: {
    totalQuotes: -100, // -100%
    avgResponseTime: -0.5, // 30 min improvement
  }
};

// Function to fetch statistics (in a real app would call an API)
const fetchStatistics = async (): Promise<QuoteStatistics> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return demoStats;
};

export function QuickStats() {
  const { toast } = useToast();
  
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchStatistics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const handleRefreshStats = useCallback(async () => {
    toast({
      title: "Refreshing statistics",
      description: "Updating dashboard data..."
    });
    await refetch();
  }, [refetch, toast]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Quotes
          </CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-muted-foreground"
          >
            <rect width="16" height="20" x="4" y="2" rx="2" />
            <line x1="8" x2="16" y1="6" y2="6" />
            <line x1="8" x2="16" y1="10" y2="10" />
            <line x1="8" x2="12" y1="14" y2="14" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isLoading ? '...' : stats?.totalQuotes}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.changeFromPrevious.totalQuotes === 0 
              ? 'No change from last month' 
              : `${stats?.changeFromPrevious.totalQuotes > 0 ? '+' : ''}${stats?.changeFromPrevious.totalQuotes}% from last month`}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Emails
          </CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M21 8v5a4 4 0 0 1-8 0V8a4 4 0 0 1 8 0Z" />
            <path d="M11 2v10a4 4 0 0 1-8 0V2" />
            <path d="M3 8h18" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isLoading ? '...' : stats?.pendingEmails}</div>
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{isLoading ? '...' : `${stats?.quoteSuccessRate}%`}</div>
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-muted-foreground"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </CardHeader>
        <CardContent>
          {stats?.avgResponseTime ? (
            <>
              <div className="text-2xl font-bold">{stats.avgResponseTime.toFixed(1)} hrs</div>
              <p className="text-xs text-muted-foreground">
                {stats.changeFromPrevious.avgResponseTime <= 0 
                  ? `${Math.abs(stats.changeFromPrevious.avgResponseTime * 60).toFixed(0)} minutes faster than last week` 
                  : `${Math.abs(stats.changeFromPrevious.avgResponseTime * 60).toFixed(0)} minutes slower than last week`}
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">No data</div>
              <p className="text-xs text-muted-foreground">
                Insufficient data
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Refresh stats button */}
      <div className="lg:col-span-4 flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
          onClick={handleRefreshStats}
        >
          <RefreshCw className="h-3 w-3" />
          Refresh Stats
        </Button>
      </div>
    </div>
  );
}

export default QuickStats;

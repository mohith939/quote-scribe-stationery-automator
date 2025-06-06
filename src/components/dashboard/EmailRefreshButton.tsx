
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailRefreshButtonProps {
  onRefresh: (incremental?: boolean) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

export function EmailRefreshButton({ onRefresh, isLoading, disabled }: EmailRefreshButtonProps) {
  const { toast } = useToast();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = async () => {
    try {
      const isIncremental = lastRefresh !== null;
      await onRefresh(isIncremental);
      setLastRefresh(new Date());
      
      toast({
        title: "Emails Refreshed",
        description: isIncremental ? "Latest emails fetched" : "All emails refreshed",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: error instanceof Error ? error.message : "Failed to refresh emails",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleRefresh}
        disabled={isLoading || disabled}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </Button>
      {lastRefresh && (
        <span className="text-xs text-slate-500">
          Last: {lastRefresh.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}


import { GOOGLE_APPS_SCRIPT_URL, isDemoMode } from "./serviceConfig";

// Get email processing metrics
export const getEmailProcessingMetrics = async (): Promise<{
  totalQuotes: number;
  pendingEmails: number;
  successRate: number;
  avgResponseTime: number;
}> => {
  // Default metrics to use when API fails or in demo mode
  const defaultMetrics = {
    totalQuotes: 52,
    pendingEmails: 3,
    successRate: 85,
    avgResponseTime: 2.4
  };

  // In demo mode, just return default metrics without API call
  if (isDemoMode) {
    console.log("Demo mode: Using mock email metrics data");
    return defaultMetrics;
  }
  
  try {
    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=getMetrics`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      totalQuotes: data.totalQuotes,
      pendingEmails: data.pendingEmails,
      successRate: data.successRate,
      avgResponseTime: data.avgResponseTime
    };
  } catch (error) {
    console.error("Error fetching email processing metrics:", error);
    // Return default metrics if API call fails
    return defaultMetrics;
  }
}

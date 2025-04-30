
import { GOOGLE_APPS_SCRIPT_URL } from "./serviceConfig";

// Get email processing metrics
export const getEmailProcessingMetrics = async (): Promise<{
  totalQuotes: number;
  pendingEmails: number;
  successRate: number;
  avgResponseTime: number;
}> => {
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
    // Return some default metrics if API call fails
    return {
      totalQuotes: 52,
      pendingEmails: 3,
      successRate: 85,
      avgResponseTime: 2.4
    };
  }
}

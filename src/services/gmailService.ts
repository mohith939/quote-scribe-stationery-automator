
import { EmailMessage } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Function to get the user's Google Apps Script URL from database
const getGoogleAppsScriptUrl = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('google_apps_script_config')
      .select('script_url, is_connected')
      .eq('user_id', user.id)
      .eq('is_connected', true)
      .maybeSingle();

    if (error || !data) {
      console.error('No connected Google Apps Script found:', error);
      return null;
    }

    return data.script_url;
  } catch (error) {
    console.error('Error getting Google Apps Script URL:', error);
    return null;
  }
};

// Configuration for email processing
const EMAIL_CONFIG = {
  autoProcessHighConfidence: true,  // Auto-process emails with high confidence
  checkInterval: 5 * 60 * 1000,     // Check for new emails every 5 minutes (in ms)
  maxEmailsPerCheck: 10,            // Maximum number of emails to process in each check
};

// Function to fetch unread emails from Gmail via Google Apps Script
export const fetchUnreadEmails = async (): Promise<EmailMessage[]> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      throw new Error('Google Apps Script not configured or connected');
    }

    const response = await fetch(`${scriptUrl}?action=fetchUnreadEmails&_=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch emails: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch emails');
    }
    
    return (data.emails || []).map((email: any) => ({
      id: email.id,
      from: email.from,
      subject: email.subject,
      body: email.body,
      date: email.date
    }));
  } catch (error) {
    console.error("Error fetching unread emails:", error);
    throw error;
  }
};

// Mark an email as read in Gmail
export const markEmailAsRead = async (emailId: string): Promise<boolean> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      throw new Error('Google Apps Script not configured or connected');
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'markAsRead',
        emailId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to mark email as read: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error marking email as read:", error);
    return false;
  }
};

// Send a quote email response
export const sendQuoteEmail = async (
  to: string, 
  subject: string, 
  body: string,
  originalEmailId?: string // Optional reference to the original email
): Promise<boolean> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      throw new Error('Google Apps Script not configured or connected');
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sendEmail',
        to,
        subject,
        body,
        originalEmailId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

// Log quote information to Google Sheets
export const logQuoteToSheet = async (quoteData: {
  timestamp: string;
  customerName: string;
  emailAddress: string;
  product: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  status: 'Sent' | 'Failed' | 'Pending' | 'Manual';
}): Promise<boolean> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      throw new Error('Google Apps Script not configured or connected');
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'logQuote',
        quoteData
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to log quote: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error logging quote to sheet:", error);
    return false;
  }
};

// Function to test the Google Apps Script connection
export const testGoogleAppsScriptConnection = async (): Promise<{
  success: boolean;
  message: string;
  services?: { gmail: boolean; sheets: boolean };
}> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      return {
        success: false,
        message: 'Google Apps Script not configured or connected'
      };
    }

    const response = await fetch(`${scriptUrl}?action=testConnection&_=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: data.success,
      message: data.message || 'Connection test completed',
      services: data.services
    };
  } catch (error) {
    console.error("Error testing connection:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed'
    };
  }
};

// Set up auto-processing of emails
export const setupAutoEmailProcessing = (
  callback: (emails: EmailMessage[]) => void,
  checkIntervalMs = EMAIL_CONFIG.checkInterval
): { start: () => void; stop: () => void } => {
  let intervalId: number | null = null;
  
  // Start the polling
  const start = () => {
    if (intervalId !== null) {
      console.warn("Auto email processing already running");
      return;
    }
    
    // Perform initial check
    processEmails();
    
    // Set up interval for subsequent checks
    intervalId = window.setInterval(processEmails, checkIntervalMs);
    console.log(`Started auto email processing (checking every ${checkIntervalMs/1000} seconds)`);
  };
  
  // Stop the polling
  const stop = () => {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
      console.log("Stopped auto email processing");
    }
  };
  
  // Function that fetches and processes emails
  const processEmails = async () => {
    try {
      console.log("Checking for new emails...");
      const emails = await fetchUnreadEmails();
      
      if (emails.length > 0) {
        console.log(`Found ${emails.length} new emails to process`);
        callback(emails.slice(0, EMAIL_CONFIG.maxEmailsPerCheck));
      } else {
        console.log("No new emails found");
      }
    } catch (error) {
      console.error("Error in auto email processing:", error);
    }
  };
  
  return { start, stop };
};

// Auto-process an email batch
export const autoProcessEmails = async (
  emails: EmailMessage[],
  processCallback?: (email: EmailMessage, success: boolean, autoProcessed: boolean) => void
): Promise<void> => {
  for (const email of emails) {
    try {
      // Process the email automatically
      const result = await autoProcessSingleEmail(email);
      processCallback?.(email, result.success, true);
    } catch (error) {
      console.error(`Error auto-processing email ${email.id}:`, error);
      processCallback?.(email, false, true);
    }
  }
};

// Auto-process a single email
export const autoProcessSingleEmail = async (email: EmailMessage): Promise<{
  success: boolean;
  status: string;
  message: string;
}> => {
  try {
    // This would integrate with email parsing and quote generation
    // For now, just mark as processed
    const emailMarked = await markEmailAsRead(email.id);
    
    return {
      success: emailMarked,
      status: emailMarked ? 'processed' : 'failed',
      message: emailMarked 
        ? `Email processed successfully`
        : 'Failed to mark email as read'
    };
  } catch (error) {
    console.error("Error in auto-processing email:", error);
    return {
      success: false,
      status: 'processing_error',
      message: `Error processing email: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

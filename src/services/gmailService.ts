
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

// Function to fetch unread emails from Gmail via Google Apps Script (Enhanced version)
export const fetchUnreadEmails = async (): Promise<EmailMessage[]> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      console.warn('Google Apps Script not configured');
      return [];
    }

    console.log('Fetching emails from enhanced script:', scriptUrl);
    
    // Use the 'getEmails' action that your enhanced script expects
    const response = await fetch(`${scriptUrl}?action=getEmails&_=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseText = await response.text();
    console.log('Raw response length:', responseText.length);
    
    // Check if response is HTML (error page) or JSON
    if (responseText.startsWith('<!DOCTYPE html>') || responseText.includes('<html>')) {
      throw new Error('Google Apps Script returned an HTML error page. Please check your script deployment settings and ensure it\'s deployed as a web app with proper permissions.');
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', responseText.substring(0, 500));
      throw new Error('Invalid JSON response from Google Apps Script. Please check your script configuration.');
    }
    
    console.log('Enhanced Gmail API response:', {
      success: data.success,
      emailCount: data.emails?.length || 0,
      hasError: !!data.error
    });
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch emails');
    }
    
    // Map the enhanced email data with all the enhanced fields
    const emails = (data.emails || []).map((email: any) => ({
      id: email.id,
      from: email.from,
      to: email.to || '',
      subject: email.subject,
      body: email.body,
      htmlBody: email.htmlBody || '',
      date: email.date,
      threadId: email.threadId || '',
      attachments: email.attachments || [],
      hasAttachments: email.hasAttachments || false,
      snippet: email.body?.substring(0, 200) + '...' || '',
      // Enhanced fields from your script
      isQuoteRequest: email.isQuoteRequest || false,
      products: email.products || [],
      quantities: email.quantities || [],
      confidence: email.confidence || 'none',
      processingStatus: email.processingStatus || 'pending',
      category: email.category || 'pending_classification',
      processingConfidence: email.processingConfidence || 'none'
    }));

    console.log(`Successfully fetched ${emails.length} unread emails with enhanced data`);
    return emails;
  } catch (error) {
    console.error("Error fetching unread emails:", error);
    throw error;
  }
};

// Mark an email as read in Gmail (works with enhanced script)
export const markEmailAsRead = async (emailId: string): Promise<boolean> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      throw new Error('Google Apps Script not configured');
    }

    const response = await fetch(`${scriptUrl}?action=markAsRead&emailId=${emailId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
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

// Send a quote email using the enhanced script
export const sendQuoteEmail = async (
  to: string,
  subject: string,
  body: string,
  originalEmailId?: string
): Promise<boolean> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      throw new Error('Google Apps Script not configured');
    }

    // Use URL parameters for the enhanced script
    const params = new URLSearchParams({
      action: 'sendEmail',
      to: to,
      subject: subject,
      body: body
    });

    if (originalEmailId) {
      params.append('emailId', originalEmailId);
    }

    const response = await fetch(`${scriptUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error sending quote email:", error);
    return false;
  }
};

// Log quote to Google Sheets using enhanced script
export const logQuoteToSheet = async (quoteData: {
  timestamp: string;
  customerName: string;
  emailAddress: string;
  product: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  status: 'Sent' | 'Failed';
}): Promise<boolean> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      throw new Error('Google Apps Script not configured');
    }

    const params = new URLSearchParams({
      action: 'logQuote',
      quoteData: JSON.stringify(quoteData)
    });

    const response = await fetch(`${scriptUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
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

// Process email using enhanced script features
export const processEmailById = async (emailId: string): Promise<any> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      throw new Error('Google Apps Script not configured');
    }

    const response = await fetch(`${scriptUrl}?action=processEmail&emailId=${emailId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to process email: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error processing email:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Get dashboard stats using enhanced script
export const getDashboardStats = async (): Promise<any> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      throw new Error('Google Apps Script not configured');
    }

    const response = await fetch(`${scriptUrl}?action=getDashboardStats&_=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get dashboard stats: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test the enhanced Google Apps Script connection
export const testGoogleAppsScriptConnection = async (): Promise<{
  success: boolean;
  message: string;
  services?: { gmail: boolean; sheets: boolean };
  emailCount?: number;
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
    
    const responseText = await response.text();
    
    // Check if response is HTML (error page)
    if (responseText.startsWith('<!DOCTYPE html>') || responseText.includes('<html>')) {
      return {
        success: false,
        message: 'Google Apps Script returned an HTML error page. Please check your script deployment settings and ensure it\'s deployed as a web app with proper permissions.'
      };
    }
    
    const data = JSON.parse(responseText);
    return {
      success: data.success,
      message: data.message || 'Connection test completed',
      services: data.services,
      emailCount: data.emailCount
    };
  } catch (error) {
    console.error("Error testing connection:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed'
    };
  }
};

// Legacy functions for backward compatibility
export const sendTemplateEmail = sendQuoteEmail;
export const fetchUnreadEmails as fetchAllUnreadEmails = fetchUnreadEmails;


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

// Function to fetch unread emails from Gmail via Google Apps Script
export const fetchUnreadEmails = async (): Promise<EmailMessage[]> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      console.warn('Google Apps Script not configured');
      return [];
    }

    console.log('Fetching emails from:', scriptUrl);
    
    // Use the correct action name that matches the Google Apps Script
    const response = await fetch(`${scriptUrl}?action=fetchUnreadEmails&_=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseText = await response.text();
    console.log('Raw response:', responseText.substring(0, 500) + '...');
    
    // Check if response is HTML (error page) or JSON
    if (responseText.startsWith('<!DOCTYPE html>') || responseText.includes('<html>') || responseText.includes('<HTML>')) {
      throw new Error('Google Apps Script returned an HTML error page. Please ensure your script is deployed as a web app with "Execute as: Me" and "Access: Anyone" permissions.');
    }
    
    // Check if it's a simple success message without JSON
    if (responseText.includes('QuoteScribe Gmail Integration Active')) {
      console.log('Script is active but returned status message, treating as no emails found');
      return [];
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error('Invalid JSON response from Google Apps Script. Response: ' + responseText.substring(0, 200));
    }
    
    console.log('Gmail API response:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch emails');
    }
    
    // Map the email data with enhanced fields
    return (data.emails || []).map((email: any) => ({
      id: email.id,
      from: email.from,
      to: email.to || '',
      subject: email.subject,
      body: email.body,
      htmlBody: email.htmlBody || '',
      date: email.date,
      threadId: email.threadId,
      attachments: email.attachments || [],
      hasAttachments: email.hasAttachments || false,
      snippet: email.snippet || email.body?.substring(0, 200) + '...'
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
      throw new Error('Google Apps Script not configured');
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

// Send a quote email
export const sendQuoteEmail = async (
  to: string,
  subject: string,
  body: string
): Promise<boolean> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      throw new Error('Google Apps Script not configured');
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
        body
      })
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

// Log quote to Google Sheets
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

// Test the Google Apps Script connection
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
    
    const responseText = await response.text();
    
    // Check if response is HTML (error page)
    if (responseText.startsWith('<!DOCTYPE html>') || responseText.includes('<html>')) {
      return {
        success: false,
        message: 'Google Apps Script returned an HTML error page. Please check your script deployment settings and ensure it\'s deployed as a web app with "Execute as: Me" and "Access: Anyone" permissions.'
      };
    }
    
    // Check for simple success message
    if (responseText.includes('QuoteScribe Gmail Integration Active')) {
      return {
        success: true,
        message: 'Google Apps Script is active and connected',
        services: { gmail: true, sheets: true }
      };
    }
    
    const data = JSON.parse(responseText);
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

// Legacy function aliases
export const sendTemplateEmail = sendQuoteEmail;

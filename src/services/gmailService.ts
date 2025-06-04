
import { EmailMessage } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Get user's Google Apps Script URL
const getGoogleAppsScriptUrl = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('google_apps_script_config')
      .select('script_url, is_connected')
      .eq('user_id', user.id)
      .eq('is_connected', true)
      .maybeSingle();

    return data?.script_url || null;
  } catch (error) {
    console.error('Error getting script URL:', error);
    return null;
  }
};

// Simple and fast email fetching
export const fetchUnreadEmails = async (): Promise<EmailMessage[]> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      console.warn('Google Apps Script not configured');
      return [];
    }

    console.log('Fetching emails from:', scriptUrl);
    
    const response = await fetch(`${scriptUrl}?action=getAllUnreadEmails&_=${Date.now()}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const text = await response.text();
    console.log('Response received, length:', text.length);
    
    // Check for HTML error pages
    if (text.includes('<html>') || text.includes('<!DOCTYPE')) {
      throw new Error('Received HTML error page - check script deployment');
    }
    
    const data = JSON.parse(text);
    console.log('Parsed response:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch emails');
    }
    
    // Map emails to our interface
    const emails = (data.emails || []).map((email: any) => ({
      id: email.id,
      from: email.from,
      to: email.to,
      subject: email.subject,
      body: email.body,
      date: email.date,
      threadId: email.threadId,
      snippet: email.snippet,
      attachments: email.attachments || [],
      hasAttachments: email.hasAttachments || false,
      // Add default values for enhanced fields
      isQuoteRequest: false,
      products: [],
      quantities: [],
      confidence: 'none',
      processingStatus: 'pending',
      category: 'general',
      processingConfidence: 'none',
      htmlBody: ''
    }));

    console.log(`Successfully fetched ${emails.length} emails`);
    return emails;
    
  } catch (error) {
    console.error("Email fetch error:", error);
    throw error;
  }
};

// Test connection - simple version
export const testGoogleAppsScriptConnection = async (): Promise<{
  success: boolean;
  message: string;
  emailCount?: number;
}> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      return {
        success: false,
        message: 'Google Apps Script not configured'
      };
    }

    const response = await fetch(`${scriptUrl}?action=testConnection&_=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const text = await response.text();
    
    if (text.includes('<html>')) {
      return {
        success: false,
        message: 'Script deployment error - check permissions'
      };
    }
    
    const data = JSON.parse(text);
    return {
      success: data.success,
      message: data.message || 'Connection test completed',
      emailCount: data.emailCount
    };
    
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed'
    };
  }
};

// Mark email as read - simple implementation
export const markEmailAsRead = async (emailId: string): Promise<boolean> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      console.warn('Google Apps Script not configured');
      return false;
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'markAsRead',
        emailId: emailId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error('Error marking email as read:', error);
    return false;
  }
};

// Send quote email - simple implementation
export const sendQuoteEmail = async (to: string, subject: string, body: string): Promise<boolean> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      console.warn('Google Apps Script not configured');
      return false;
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sendEmail',
        to: to,
        subject: subject,
        body: body
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Log quote to sheet - simple implementation
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
      console.warn('Google Apps Script not configured');
      return false;
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'logQuote',
        quoteData: quoteData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error('Error logging quote to sheet:', error);
    return false;
  }
};

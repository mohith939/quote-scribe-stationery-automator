
import { EmailMessage } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Get user's Google Apps Script URL
const getGoogleAppsScriptUrl = async (): Promise<string | null> => {
  try {
    // Try to get from localStorage first for quick access
    const localUrl = localStorage.getItem('google_apps_script_url');
    if (localUrl) {
      return localUrl;
    }

    // Fallback to database
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
    return localStorage.getItem('google_apps_script_url');
  }
};

// Enhanced email fetching with quota handling
export const fetchUnreadEmails = async (maxEmails: number = 10): Promise<EmailMessage[]> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      console.warn('Google Apps Script not configured');
      return [];
    }

    console.log(`Fetching up to ${maxEmails} emails from:`, scriptUrl);
    
    // Add maxEmails parameter to limit the fetch
    const response = await fetch(`${scriptUrl}?action=getAllUnreadEmails&maxResults=${maxEmails}&_=${Date.now()}`, {
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
      // Handle quota exceeded error specifically
      if (data.error && data.error.includes('Service invoked too many times')) {
        throw new Error('Gmail quota exceeded for today. Try again tomorrow or reduce email fetch limit.');
      }
      throw new Error(data.error || 'Failed to fetch emails');
    }
    
    // Map emails to our interface with enhanced processing
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
      htmlBody: email.htmlBody || '',
      // Enhanced fields with Apps Script processing
      isQuoteRequest: email.isQuoteRequest || false,
      products: email.products || [],
      quantities: email.quantities || [],
      confidence: email.confidence || 'none',
      processingStatus: email.processingStatus || 'pending',
      category: email.category || 'general',
      processingConfidence: email.processingConfidence || 'none'
    }));

    console.log(`Successfully fetched ${emails.length} emails`);
    return emails;
    
  } catch (error) {
    console.error("Email fetch error:", error);
    throw error;
  }
};

// Test connection with better error handling
export const testGoogleAppsScriptConnection = async (): Promise<{
  success: boolean;
  message: string;
  emailCount?: number;
  quotaExceeded?: boolean;
}> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      return {
        success: false,
        message: 'Google Apps Script URL not configured. Please add your script URL in settings.'
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
        message: 'Script deployment error - check permissions and deployment settings'
      };
    }
    
    const data = JSON.parse(text);
    
    if (!data.success && data.error && data.error.includes('Service invoked too many times')) {
      return {
        success: false,
        message: 'Gmail quota exceeded for today. Connection works but no more API calls allowed.',
        quotaExceeded: true
      };
    }
    
    return {
      success: data.success,
      message: data.message || 'Connection test completed',
      emailCount: data.emailCount || data.unreadEmails || 0
    };
    
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed'
    };
  }
};

// Mark email as read
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

// Enhanced quote email sending with reply capability
export const sendQuoteEmail = async (to: string, subject: string, body: string, originalEmailId?: string): Promise<boolean> => {
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
        body: body,
        emailId: originalEmailId // For marking original as read
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

// Enhanced quote logging
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

// Get dashboard statistics from Apps Script
export const getDashboardStats = async (): Promise<{
  success: boolean;
  stats?: {
    unreadEmails: number;
    quoteRequests: number;
    processedToday: number;
    successRate: number;
  };
}> => {
  try {
    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      return { success: false };
    }

    const response = await fetch(`${scriptUrl}?action=getDashboardStats&_=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return { success: false };
  }
};

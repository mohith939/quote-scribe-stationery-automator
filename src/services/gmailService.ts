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
    
    const response = await fetch(`${scriptUrl}?action=getEmails&_=${Date.now()}`, {
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

// Keep other functions simple
export const markEmailAsRead = async (emailId: string): Promise<boolean> => {
  console.log('Mark as read not implemented in simple version');
  return true;
};

export const sendQuoteEmail = async (to: string, subject: string, body: string): Promise<boolean> => {
  console.log('Send email not implemented in simple version');
  return true;
};

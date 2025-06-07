import { EmailMessage } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Quota management
const QUOTA_STORAGE_KEY = 'gmail_quota_tracker';
const MAX_DAILY_CALLS = 200; // Conservative limit
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const EMAIL_CACHE_KEY = 'cached_emails';
const LAST_FETCH_KEY = 'last_email_fetch';

interface QuotaTracker {
  date: string;
  callCount: number;
  lastReset: number;
}

// Get and manage quota tracking
const getQuotaTracker = (): QuotaTracker => {
  try {
    const stored = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (stored) {
      const tracker = JSON.parse(stored);
      const today = new Date().toDateString();
      
      // Reset if it's a new day
      if (tracker.date !== today) {
        return {
          date: today,
          callCount: 0,
          lastReset: Date.now()
        };
      }
      return tracker;
    }
  } catch (error) {
    console.error('Error reading quota tracker:', error);
  }
  
  return {
    date: new Date().toDateString(),
    callCount: 0,
    lastReset: Date.now()
  };
};

const updateQuotaTracker = (tracker: QuotaTracker) => {
  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(tracker));
  } catch (error) {
    console.error('Error saving quota tracker:', error);
  }
};

const canMakeApiCall = (): { allowed: boolean; remaining: number } => {
  const tracker = getQuotaTracker();
  const remaining = MAX_DAILY_CALLS - tracker.callCount;
  return {
    allowed: tracker.callCount < MAX_DAILY_CALLS,
    remaining: Math.max(0, remaining)
  };
};

const incrementApiCall = () => {
  const tracker = getQuotaTracker();
  tracker.callCount += 1;
  updateQuotaTracker(tracker);
};

// Enhanced caching system
const getCachedEmails = (): { emails: EmailMessage[]; timestamp: number } | null => {
  try {
    const cached = localStorage.getItem(EMAIL_CACHE_KEY);
    const lastFetch = localStorage.getItem(LAST_FETCH_KEY);
    
    if (cached && lastFetch) {
      const timestamp = parseInt(lastFetch);
      const now = Date.now();
      
      // Check if cache is still valid (within CACHE_DURATION)
      if (now - timestamp < CACHE_DURATION) {
        return {
          emails: JSON.parse(cached),
          timestamp
        };
      }
    }
  } catch (error) {
    console.error('Error reading email cache:', error);
  }
  return null;
};

const setCachedEmails = (emails: EmailMessage[]) => {
  try {
    const timestamp = Date.now();
    localStorage.setItem(EMAIL_CACHE_KEY, JSON.stringify(emails));
    localStorage.setItem(LAST_FETCH_KEY, timestamp.toString());
  } catch (error) {
    console.error('Error caching emails:', error);
  }
};

// Get user's Google Apps Script URL
const getGoogleAppsScriptUrl = async (): Promise<string | null> => {
  try {
    // Try to get from localStorage first for quick access
    const localUrl = localStorage.getItem('google_apps_script_url') || 
                    localStorage.getItem('gmail_script_url');
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
    return localStorage.getItem('google_apps_script_url') || 
           localStorage.getItem('gmail_script_url');
  }
};

// Enhanced error detection for different error types
const isCorsError = (error: any): boolean => {
  const errorMessage = error?.message || '';
  return errorMessage.includes('CORS') || 
         errorMessage.includes('Access-Control-Allow-Origin') ||
         errorMessage.includes('cross-origin') ||
         errorMessage.includes('preflight') ||
         errorMessage.includes('blocked by CORS policy');
};

const isNetworkError = (error: any): boolean => {
  const errorMessage = error?.message || '';
  return errorMessage.includes('Failed to fetch') ||
         errorMessage.includes('ERR_FAILED') ||
         errorMessage.includes('NetworkError') ||
         errorMessage.includes('net::');
};

// Enhanced error detection for HTML responses
const isHtmlResponse = (text: string): boolean => {
  const htmlIndicators = [
    '<!DOCTYPE html>',
    '<html>',
    '<HTML>',
    '<!doctype html>',
    '<head>',
    '<body>',
    'text/html'
  ];
  
  const lowerText = text.toLowerCase().trim();
  return htmlIndicators.some(indicator => lowerText.includes(indicator.toLowerCase()));
};

// Parse error details from HTML response
const parseHtmlError = (htmlText: string): string => {
  // Common Google Apps Script error patterns
  if (htmlText.includes('Script function not found')) {
    return 'Apps Script function not found - check your script has the correct functions (doGet, doPost)';
  }
  if (htmlText.includes('Authorization required')) {
    return 'Apps Script authorization required - redeploy with proper permissions';
  }
  if (htmlText.includes('Access denied')) {
    return 'Apps Script access denied - check deployment permissions (should be "Anyone")';
  }
  if (htmlText.includes('Service invoked too many times')) {
    return 'Apps Script quota exceeded - try again later';
  }
  if (htmlText.includes('ScriptError')) {
    return 'Apps Script execution error - check script logs in Google Apps Script console';
  }
  
  return 'HTML error page received - script deployment or permissions issue';
};

// Enhanced error handler with specific CORS guidance
const handleFetchError = (error: any): string => {
  if (isCorsError(error)) {
    return `CORS Error: Your Google Apps Script needs proper CORS configuration.

SOLUTION:
1. Open your Google Apps Script project
2. Make sure your doGet and doPost functions include these CORS headers:
   
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type'
   };

3. Return responses with these headers:
   return ContentService.createTextOutput(JSON.stringify(data))
     .setMimeType(ContentService.MimeType.JSON)
     .setHeaders(corsHeaders);

4. Deploy as "Execute as: Me" and "Access: Anyone"
5. Copy the new URL and update it in settings

The script should handle OPTIONS requests for CORS preflight.`;
  }
  
  if (isNetworkError(error)) {
    return `Network Error: Unable to reach your Google Apps Script.

COMMON CAUSES:
- Script URL is incorrect or incomplete
- Apps Script is not deployed as a web app
- Google Services are temporarily unavailable
- Script was deleted or permissions changed

SOLUTIONS:
1. Verify your script URL is complete and correct
2. Test the URL directly in a browser
3. Redeploy your script as a new web app
4. Check Google Apps Script status page`;
  }

  return error?.message || 'Unknown error occurred';
};

// Smart email fetching with quota management and caching
export const fetchUnreadEmails = async (maxEmails: number = 100, forceRefresh: boolean = false): Promise<EmailMessage[]> => {
  try {
    // Check quota first
    const quotaCheck = canMakeApiCall();
    if (!quotaCheck.allowed) {
      throw new Error(`Daily Gmail quota exceeded. Remaining calls: ${quotaCheck.remaining}. Try again tomorrow or contact support.`);
    }

    // Try cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = getCachedEmails();
      if (cached) {
        console.log(`Using cached emails (${cached.emails.length} emails, cached ${Math.round((Date.now() - cached.timestamp) / 1000)}s ago)`);
        return cached.emails.slice(0, maxEmails);
      }
    }

    const scriptUrl = await getGoogleAppsScriptUrl();
    if (!scriptUrl) {
      console.warn('Google Apps Script not configured');
      return [];
    }

    console.log(`Fetching up to ${maxEmails} emails from Apps Script (${quotaCheck.remaining} calls remaining today)`);
    console.log('Script URL:', scriptUrl);
    
    // Increment quota counter
    incrementApiCall();
    
    // Add maxEmails parameter to limit the fetch
    const fullUrl = `${scriptUrl}?action=getAllUnreadEmails&maxResults=${maxEmails}&_=${Date.now()}`;
    console.log('Fetching from URL:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}. Check script deployment and permissions.`);
    }
    
    const text = await response.text();
    console.log('Response received, length:', text.length);
    console.log('Response preview (first 500 chars):', text.substring(0, 500));
    
    // Enhanced HTML error detection
    if (isHtmlResponse(text)) {
      const errorMessage = parseHtmlError(text);
      console.error('HTML Response Details:', text.substring(0, 1000));
      throw new Error(errorMessage);
    }
    
    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', text);
      throw new Error('Invalid JSON response from Apps Script. Check script execution and logs.');
    }
    
    console.log('Parsed response:', data);
    
    if (!data.success) {
      // Handle quota exceeded error specifically
      if (data.error && data.error.includes('Service invoked too many times')) {
        throw new Error('Gmail quota exceeded for today. Try again tomorrow or reduce email fetch limit.');
      }
      throw new Error(data.error || 'Failed to fetch emails from Apps Script');
    }
    
    // Map emails to our interface with enhanced processing and sort by date (latest first)
    const emails = (data.emails || [])
      .map((email: any) => ({
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
      }))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort latest first

    // Cache the results
    setCachedEmails(emails);

    console.log(`Successfully fetched ${emails.length} emails (sorted latest first)`);
    return emails;
    
  } catch (error) {
    console.error("Email fetch error:", error);
    
    // Enhanced error handling with specific guidance
    const enhancedError = new Error(handleFetchError(error));
    throw enhancedError;
  }
};

// Get quota status for UI display
export const getQuotaStatus = () => {
  const tracker = getQuotaTracker();
  const quotaCheck = canMakeApiCall();
  
  return {
    callsUsed: tracker.callCount,
    callsRemaining: quotaCheck.remaining,
    maxCalls: MAX_DAILY_CALLS,
    canMakeCall: quotaCheck.allowed,
    resetTime: new Date(tracker.lastReset + 24 * 60 * 60 * 1000).toLocaleString()
  };
};

// Clear cache manually
export const clearEmailCache = () => {
  try {
    localStorage.removeItem(EMAIL_CACHE_KEY);
    localStorage.removeItem(LAST_FETCH_KEY);
    console.log('Email cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Reset quota (for testing/admin)
export const resetQuota = () => {
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
    console.log('Quota tracker reset');
  } catch (error) {
    console.error('Error resetting quota:', error);
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

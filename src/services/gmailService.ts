
import { EmailMessage } from "@/types";

// Base URL of our deployed Google Apps Script web app
// This would be replaced with your actual deployed script URL
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/your-script-id/exec";

// Configuration for email processing
const EMAIL_CONFIG = {
  autoProcessHighConfidence: true,  // Auto-process emails with high confidence
  checkInterval: 5 * 60 * 1000,     // Check for new emails every 5 minutes (in ms)
  maxEmailsPerCheck: 10,            // Maximum number of emails to process in each check
};

// Function to fetch unread emails from Gmail via Google Apps Script
export const fetchUnreadEmails = async (): Promise<EmailMessage[]> => {
  try {
    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=fetchUnreadEmails`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch emails: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.emails.map((email: any) => ({
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
}

// Mark an email as read in Gmail
export const markEmailAsRead = async (emailId: string): Promise<boolean> => {
  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
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
}

// Send a quote email response
export const sendQuoteEmail = async (
  to: string, 
  subject: string, 
  body: string,
  originalEmailId?: string // Optional reference to the original email
): Promise<boolean> => {
  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
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
}

// Log quote information to Google Sheets (Phase 6)
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
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
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
}

// New function: Set up auto-processing of emails
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

// New function: Auto-process an email batch
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

// New function: Auto-process a single email
export const autoProcessSingleEmail = async (email: EmailMessage): Promise<{
  success: boolean;
  status: string;
  message: string;
}> => {
  // Import required services
  const { parseEmailForQuotation } = await import('./emailParserService');
  const { calculatePrice } = await import('./pricingService');
  const { mockProducts } = await import('@/data/mockData');
  const { defaultQuoteTemplate, generateEmailSubject, generateQuoteEmailBody } = await import('./quoteService');
  
  try {
    // Parse the email
    const parsedInfo = parseEmailForQuotation(email);
    
    // If confidence is too low, don't process automatically
    if (parsedInfo.confidence !== 'high' && parsedInfo.confidence !== 'medium') {
      return {
        success: false,
        status: 'manual_required',
        message: 'Email requires manual processing due to low confidence in parsing'
      };
    }
    
    // Ensure we have product and quantity
    if (!parsedInfo.product || !parsedInfo.quantity) {
      return {
        success: false,
        status: 'incomplete_data',
        message: 'Could not extract complete product and quantity information'
      };
    }
    
    // Calculate price
    const pricing = calculatePrice(parsedInfo.product, parsedInfo.quantity, mockProducts);
    if (!pricing) {
      return {
        success: false,
        status: 'pricing_error',
        message: `Could not calculate price for ${parsedInfo.product} with quantity ${parsedInfo.quantity}`
      };
    }
    
    // Generate email content
    const emailSubject = generateEmailSubject(defaultQuoteTemplate, parsedInfo.product);
    const emailBody = generateQuoteEmailBody(
      defaultQuoteTemplate,
      parsedInfo,
      pricing.pricePerUnit,
      pricing.totalPrice
    );
    
    // Send the email
    const emailSent = await sendQuoteEmail(
      parsedInfo.emailAddress,
      emailSubject,
      emailBody,
      email.id
    );
    
    // Mark email as read
    await markEmailAsRead(email.id);
    
    // Log the quote
    await logQuoteToSheet({
      timestamp: new Date().toISOString(),
      customerName: parsedInfo.customerName,
      emailAddress: parsedInfo.emailAddress,
      product: parsedInfo.product,
      quantity: parsedInfo.quantity,
      pricePerUnit: pricing.pricePerUnit,
      totalAmount: pricing.totalPrice,
      status: emailSent ? 'Sent' as const : 'Failed' as const
    });
    
    return {
      success: emailSent,
      status: emailSent ? 'sent' : 'send_failed',
      message: emailSent 
        ? `Successfully sent quote for ${parsedInfo.quantity} units of ${parsedInfo.product}`
        : 'Failed to send email response'
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

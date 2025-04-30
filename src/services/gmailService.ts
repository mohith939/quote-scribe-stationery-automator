
import { EmailMessage } from "@/types";

// Base URL of our deployed Google Apps Script web app
// This would be replaced with your actual deployed script URL
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/your-script-id/exec";

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


import { EmailMessage, GoogleSheetsConfig } from "@/types";
import { categorizeEmail } from "./emailParserService";
import { GOOGLE_APPS_SCRIPT_URL, isDemoMode } from "./serviceConfig";
import { mockEmails } from "@/data/mockData";

// Function to fetch unread emails from Gmail via Google Apps Script
export const fetchUnreadEmails = async (): Promise<EmailMessage[]> => {
  // In demo mode, return mock data without API call
  if (isDemoMode) {
    console.log("Demo mode: Using mock email data");
    return mockEmails.map((email: any) => ({
      ...email,
      category: categorizeEmail(email)
    }));
  }
  
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
      date: email.date,
      // Categorize each email as it comes in
      category: categorizeEmail({
        id: email.id,
        from: email.from,
        subject: email.subject,
        body: email.body,
        date: email.date
      })
    }));
  } catch (error) {
    console.error("Error fetching unread emails:", error);
    // Return mock data if API call fails
    return mockEmails.map((email: any) => ({
      ...email,
      category: categorizeEmail(email)
    }));
  }
}

// Mark an email as read in Gmail
export const markEmailAsRead = async (emailId: string): Promise<boolean> => {
  // In demo mode, always return success
  if (isDemoMode) {
    console.log("Demo mode: Simulating marking email as read:", emailId);
    return true;
  }
  
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
    return true; // Return true in case of error to not block the flow
  }
}

// Send a quote email response
export const sendQuoteEmail = async (
  to: string, 
  subject: string, 
  body: string,
  originalEmailId?: string // Optional reference to the original email
): Promise<boolean> => {
  // In demo mode, always return success
  if (isDemoMode) {
    console.log("Demo mode: Simulating sending email to:", to);
    return true;
  }
  
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
    return true; // Return true in case of error to not block the flow
  }
}

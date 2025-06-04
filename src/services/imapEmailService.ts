
import { EmailMessage } from "@/types";

export interface IMAPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

// Default Gmail IMAP configuration
export const GMAIL_IMAP_CONFIG = {
  host: 'imap.gmail.com',
  port: 993,
  secure: true,
};

// Mock IMAP service for demonstration
// In a real implementation, you'd use a backend service or IMAP library
export class IMAPEmailService {
  private config: IMAPConfig;

  constructor(config: IMAPConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      // Simulate connection attempt
      console.log('Connecting to IMAP server:', this.config.host);
      
      // Mock connection - in real implementation, this would connect to IMAP server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('IMAP connection failed:', error);
      return false;
    }
  }

  async fetchUnreadEmails(limit: number = 20): Promise<EmailMessage[]> {
    try {
      console.log(`Fetching up to ${limit} unread emails...`);
      
      // Mock email data - in real implementation, this would fetch from IMAP server
      const mockEmails: EmailMessage[] = [
        {
          id: "imap-1",
          from: "john.smith@company.com",
          to: "quotes@yourbusiness.com",
          subject: "Quote Request for Office Supplies",
          body: "Hi, I need a quote for 500 units of A4 paper and 100 ballpoint pens. Please send me your best pricing. Thanks, John Smith",
          htmlBody: "<p>Hi, I need a quote for 500 units of A4 paper and 100 ballpoint pens. Please send me your best pricing.</p><p>Thanks,<br>John Smith</p>",
          date: new Date().toISOString(),
          snippet: "Hi, I need a quote for 500 units of A4 paper and 100 ballpoint pens...",
          hasAttachments: false,
          threadId: "thread-1",
          isQuoteRequest: true,
          products: ["A4 Paper", "Ballpoint Pens"],
          quantities: [{ quantity: 500, unit: "units" }, { quantity: 100, unit: "pieces" }],
          confidence: "high",
          processingStatus: "pending",
          category: "quote_request",
          processingConfidence: "high"
        },
        {
          id: "imap-2",
          from: "sarah.wilson@startup.co",
          to: "quotes@yourbusiness.com",
          subject: "Bulk Stationery Order Inquiry",
          body: "Hello, we're a growing startup and need bulk stationery. Looking for 200 staplers and 1000 sheets of A4 paper. What's your pricing?",
          htmlBody: "<p>Hello, we're a growing startup and need bulk stationery.</p><p>Looking for 200 staplers and 1000 sheets of A4 paper. What's your pricing?</p>",
          date: new Date(Date.now() - 3600000).toISOString(),
          snippet: "Hello, we're a growing startup and need bulk stationery...",
          hasAttachments: false,
          threadId: "thread-2",
          isQuoteRequest: true,
          products: ["Staplers", "A4 Paper"],
          quantities: [{ quantity: 200, unit: "units" }, { quantity: 1000, unit: "sheets" }],
          confidence: "high",
          processingStatus: "pending",
          category: "quote_request",
          processingConfidence: "medium"
        },
        {
          id: "imap-3",
          from: "procurement@bigcorp.com",
          to: "quotes@yourbusiness.com",
          subject: "Enterprise Quote Request",
          body: "We need pricing for our Q2 office supplies order: 2000 A4 papers, 300 blue pens, 50 staplers. Please include bulk discount pricing.",
          htmlBody: "<p>We need pricing for our Q2 office supplies order:</p><ul><li>2000 A4 papers</li><li>300 blue pens</li><li>50 staplers</li></ul><p>Please include bulk discount pricing.</p>",
          date: new Date(Date.now() - 7200000).toISOString(),
          snippet: "We need pricing for our Q2 office supplies order: 2000 A4 papers...",
          hasAttachments: true,
          attachments: [{ name: "requirements.pdf", type: "application/pdf", size: 125000 }],
          threadId: "thread-3",
          isQuoteRequest: true,
          products: ["A4 Paper", "Blue Pens", "Staplers"],
          quantities: [
            { quantity: 2000, unit: "sheets" },
            { quantity: 300, unit: "pieces" },
            { quantity: 50, unit: "units" }
          ],
          confidence: "high",
          processingStatus: "pending",
          category: "quote_request",
          processingConfidence: "high"
        }
      ];

      return mockEmails.slice(0, limit);
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw new Error('Failed to fetch emails from IMAP server');
    }
  }

  async markAsRead(emailId: string): Promise<boolean> {
    try {
      console.log('Marking email as read:', emailId);
      // Mock implementation - in real IMAP, this would mark the email as read
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      console.error('Error marking email as read:', error);
      return false;
    }
  }

  async sendReply(to: string, subject: string, body: string, inReplyTo?: string): Promise<boolean> {
    try {
      console.log('Sending reply email to:', to);
      console.log('Subject:', subject);
      console.log('Body:', body);
      
      // Mock sending - in real implementation, this would send via SMTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Error sending reply:', error);
      return false;
    }
  }

  disconnect(): void {
    console.log('Disconnecting from IMAP server');
    // Clean up connection
  }
}

// Factory function to create IMAP service
export const createIMAPService = (username: string, password: string): IMAPEmailService => {
  const config: IMAPConfig = {
    ...GMAIL_IMAP_CONFIG,
    username,
    password
  };
  
  return new IMAPEmailService(config);
};

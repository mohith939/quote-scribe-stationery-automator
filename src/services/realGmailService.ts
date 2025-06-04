
import { EmailMessage } from "@/types";

// Gmail API configuration
const GMAIL_API_BASE_URL = 'https://gmail.googleapis.com/gmail/v1';

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body: { data?: string };
    }>;
  };
  internalDate: string;
}

interface GmailListResponse {
  messages: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export class RealGmailService {
  private accessToken: string | null = null;

  constructor() {
    // Initialize with stored access token if available
    this.accessToken = localStorage.getItem('gmail_access_token');
  }

  // Initialize Google OAuth and get access token
  async initializeAuth(): Promise<boolean> {
    try {
      // This would typically use Google's OAuth flow
      // For now, we'll simulate the auth process
      console.log('Gmail authentication would be initiated here');
      
      // In a real implementation, this would:
      // 1. Redirect to Google OAuth
      // 2. Handle the callback
      // 3. Exchange code for access token
      // 4. Store the token securely
      
      return true;
    } catch (error) {
      console.error('Gmail auth initialization failed:', error);
      return false;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Fetch unread emails from Gmail
  async fetchUnreadEmails(maxResults: number = 50): Promise<EmailMessage[]> {
    if (!this.accessToken) {
      throw new Error('Gmail not authenticated. Please authenticate first.');
    }

    try {
      console.log('Fetching unread emails from Gmail...');

      // Step 1: Get list of unread message IDs
      const listResponse = await this.makeGmailRequest<GmailListResponse>(
        `/users/me/messages?q=is:unread&maxResults=${maxResults}`
      );

      if (!listResponse.messages || listResponse.messages.length === 0) {
        console.log('No unread messages found');
        return [];
      }

      console.log(`Found ${listResponse.messages.length} unread messages`);

      // Step 2: Fetch full message details for each message
      const emailPromises = listResponse.messages.map(msg => 
        this.fetchMessageDetails(msg.id)
      );

      const gmailMessages = await Promise.all(emailPromises);
      
      // Step 3: Convert Gmail messages to our EmailMessage format
      const emails = gmailMessages
        .filter(msg => msg !== null)
        .map(msg => this.convertGmailMessage(msg!));

      console.log(`Successfully processed ${emails.length} emails`);
      return emails;

    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw new Error('Failed to fetch emails from Gmail');
    }
  }

  // Fetch detailed message information
  private async fetchMessageDetails(messageId: string): Promise<GmailMessage | null> {
    try {
      return await this.makeGmailRequest<GmailMessage>(`/users/me/messages/${messageId}`);
    } catch (error) {
      console.error(`Error fetching message ${messageId}:`, error);
      return null;
    }
  }

  // Convert Gmail message format to our EmailMessage format
  private convertGmailMessage(gmailMessage: GmailMessage): EmailMessage {
    const headers = gmailMessage.payload.headers;
    
    // Extract header values
    const getHeader = (name: string): string => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };

    const from = getHeader('From');
    const to = getHeader('To');
    const subject = getHeader('Subject');
    const date = new Date(parseInt(gmailMessage.internalDate)).toISOString();

    // Extract email body
    let body = '';
    let htmlBody = '';

    if (gmailMessage.payload.body?.data) {
      body = this.decodeBase64(gmailMessage.payload.body.data);
    } else if (gmailMessage.payload.parts) {
      // Handle multipart messages
      for (const part of gmailMessage.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body = this.decodeBase64(part.body.data);
        } else if (part.mimeType === 'text/html' && part.body.data) {
          htmlBody = this.decodeBase64(part.body.data);
        }
      }
    }

    // Use snippet as fallback if no body found
    if (!body && !htmlBody) {
      body = gmailMessage.snippet;
    }

    // Basic quote detection
    const isQuoteRequest = this.detectQuoteRequest(body + ' ' + subject);
    
    return {
      id: gmailMessage.id,
      from,
      to,
      subject,
      body,
      htmlBody,
      date,
      threadId: gmailMessage.threadId,
      snippet: gmailMessage.snippet,
      hasAttachments: false, // Would need additional logic to detect attachments
      attachments: [],
      isQuoteRequest,
      products: [],
      quantities: [],
      confidence: isQuoteRequest ? 'medium' : 'none',
      processingStatus: isQuoteRequest ? 'pending' : 'non_quote',
      category: isQuoteRequest ? 'quote_request' : 'general',
      processingConfidence: isQuoteRequest ? 'medium' : 'none'
    };
  }

  // Make authenticated request to Gmail API
  private async makeGmailRequest<T>(endpoint: string): Promise<T> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${GMAIL_API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear it
        this.accessToken = null;
        localStorage.removeItem('gmail_access_token');
        throw new Error('Gmail authentication expired. Please re-authenticate.');
      }
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Make authenticated POST request to Gmail API
  private async makeGmailPostRequest<T>(endpoint: string, body: any): Promise<T> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${GMAIL_API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear it
        this.accessToken = null;
        localStorage.removeItem('gmail_access_token');
        throw new Error('Gmail authentication expired. Please re-authenticate.');
      }
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Decode base64 URL-safe string
  private decodeBase64(data: string): string {
    try {
      // Convert base64url to base64
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if needed
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
      return atob(padded);
    } catch (error) {
      console.error('Error decoding base64:', error);
      return '';
    }
  }

  // Basic quote detection logic
  private detectQuoteRequest(text: string): boolean {
    const keywords = [
      'quote', 'quotation', 'pricing', 'price', 'cost', 'estimate',
      'how much', 'inquiry', 'enquiry', 'interested in', 'purchase',
      'buy', 'order', 'supply', 'provide', 'need', 'require'
    ];
    
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  }

  // Mark email as read
  async markAsRead(messageId: string): Promise<boolean> {
    if (!this.accessToken) {
      console.warn('Gmail not authenticated');
      return false;
    }

    try {
      await this.makeGmailPostRequest(`/users/me/messages/${messageId}/modify`, {
        removeLabelIds: ['UNREAD']
      });
      return true;
    } catch (error) {
      console.error('Error marking email as read:', error);
      return false;
    }
  }

  // Send email reply
  async sendReply(to: string, subject: string, body: string, threadId?: string): Promise<boolean> {
    if (!this.accessToken) {
      console.warn('Gmail not authenticated');
      return false;
    }

    try {
      // Create email message in RFC 2822 format
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/html; charset="UTF-8"`,
        '',
        body
      ].join('\r\n');

      // Encode email in base64url
      const encodedEmail = btoa(email)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const requestBody = {
        raw: encodedEmail,
        threadId: threadId
      };

      await fetch(`${GMAIL_API_BASE_URL}/users/me/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Test Gmail connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.accessToken) {
      return {
        success: false,
        message: 'Gmail not authenticated. Please authenticate first.'
      };
    }

    try {
      const profile = await this.makeGmailRequest<any>('/users/me/profile');
      return {
        success: true,
        message: `Connected to Gmail: ${profile.emailAddress}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Gmail connection failed: ${error}`
      };
    }
  }
}

// Create singleton instance
export const realGmailService = new RealGmailService();

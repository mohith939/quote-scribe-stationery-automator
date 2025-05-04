
export interface Product {
  id: string;
  name: string;
  minQuantity: number;
  maxQuantity: number;
  pricePerUnit: number;
}

export interface QuoteLog {
  id: string;
  timestamp: string;
  customerName: string;
  emailAddress: string;
  originalMessage: string;
  extractedDetails: {
    product: string;
    quantity: number;
  };
  totalQuotedAmount: number;
  status: 'Sent' | 'Failed' | 'Pending' | 'Manual';
}

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  productsAdded: number;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  subject: string;
  greeting: string;
  body: string;
  signoff: string;
}

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'xlsx';
  includeCompanyLogo: boolean;
  includeTimestamp: boolean;
}

export interface GmailConnectionConfig {
  isConnected: boolean;
  lastSyncTime: string | null;
  autoRefreshInterval: number; // in minutes
  userName: string | null;
}

export interface GoogleSheetsConfig {
  isConnected: boolean;
  spreadsheetId: string | null;
  quotesSheetName: string;
  productsSheetName: string;
}

// New types for processing queue
export interface ProcessingQueueItem {
  id: string;
  emailId: string;
  from: string;
  subject: string;
  date: string;
  status: 'pending' | 'processed' | 'failed';
  confidence: 'high' | 'medium' | 'low' | 'none';
  product?: string;
  quantity?: number;
}

// Enhanced QuoteStatistics interface
export interface QuoteStatistics {
  totalQuotes: number;
  pendingEmails: number;
  quoteSuccessRate: number;
  avgResponseTime: number; // in hours
  changeFromPrevious: {
    totalQuotes: number;
    avgResponseTime: number; // can be negative (improvement)
  };
}

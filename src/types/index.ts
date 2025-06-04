
export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  snippet?: string;
  hasAttachments?: boolean;
  isQuoteRequest?: boolean;
  detectedProducts?: Array<{
    product: string;
    quantity: number;
    confidence: 'high' | 'medium' | 'low';
    productCode?: string;
    brand?: string;
  }>;
  confidence?: 'high' | 'medium' | 'low' | 'none';
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  product_code: string;
  brand?: string;
  unit_price: number;
  gst_rate: number;
  category?: string;
  min_quantity?: number;
  max_quantity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface QuoteRequest {
  id: string;
  emailId: string;
  customerName: string;
  customerEmail: string;
  products: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  status: 'pending' | 'sent' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
}

export interface GoogleSheetsConfig {
  isConnected: boolean;
  spreadsheetId: string | null;
  quotesSheetName: string;
  productsSheetName: string;
}

export interface QuoteLog {
  timestamp: string;
  customerName: string;
  emailAddress: string;
  product: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  status: 'Sent' | 'Failed';
}

export interface ProcessingQueueItem {
  id: string;
  email: EmailMessage;
  detectedProducts: Array<{
    product: string;
    quantity: number;
    confidence: 'high' | 'medium' | 'low';
    productCode?: string;
    brand?: string;
  }>;
  customerInfo: {
    name: string;
    email: string;
  };
  dateAdded: string;
  status: 'pending' | 'processing' | 'completed';
}

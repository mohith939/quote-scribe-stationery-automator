
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

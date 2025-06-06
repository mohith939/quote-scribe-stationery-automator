
import { EmailMessage, Product } from "@/types";

export interface EmailClassification {
  isQuoteRequest: boolean;
  confidence: 'high' | 'medium' | 'low';
  detectedProduct?: {
    name: string;
    code: string;
    description?: string;
  };
  reasoning: string;
}

export const classifyEmail = (email: EmailMessage, products: Product[]): EmailClassification => {
  const text = `${email.subject} ${email.body}`.toLowerCase();
  
  // Quote request keywords
  const quoteKeywords = [
    'quote', 'quotation', 'pricing', 'price', 'cost', 'estimate',
    'how much', 'inquiry', 'enquiry', 'interested in', 'purchase',
    'buy', 'order', 'supply', 'provide', 'need', 'require'
  ];

  // Check for quote keywords
  const quoteMatches = quoteKeywords.filter(keyword => text.includes(keyword));
  const isQuoteRequest = quoteMatches.length > 0;

  // Product matching
  let detectedProduct: EmailClassification['detectedProduct'];
  let bestMatch = 0;

  for (const product of products) {
    const productText = `${product.name} ${product.product_code} ${product.brand || ''}`.toLowerCase();
    const productWords = productText.split(/\s+/);
    
    let matchScore = 0;
    for (const word of productWords) {
      if (word.length > 2 && text.includes(word)) {
        matchScore += word.length; // Longer matches get higher scores
      }
    }

    if (matchScore > bestMatch) {
      bestMatch = matchScore;
      detectedProduct = {
        name: product.name,
        code: product.product_code,
        description: `${product.brand || ''} - ${product.category || 'General'}`
      };
    }
  }

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (isQuoteRequest && detectedProduct && bestMatch > 10) {
    confidence = 'high';
  } else if (isQuoteRequest || detectedProduct) {
    confidence = 'medium';
  }

  const reasoning = `Found ${quoteMatches.length} quote keywords${detectedProduct ? `, matched product: ${detectedProduct.name}` : ', no product match'}`;

  return {
    isQuoteRequest,
    confidence,
    detectedProduct,
    reasoning
  };
};

export const getDisplayText = (email: EmailMessage, classification: EmailClassification): string => {
  if (classification.detectedProduct) {
    return `${classification.detectedProduct.name} (${classification.detectedProduct.code})`;
  }
  
  // Fallback to email subject if no product detected
  return email.subject?.substring(0, 50) + (email.subject?.length > 50 ? '...' : '');
};

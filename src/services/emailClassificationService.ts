
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
  
  // Enhanced quote request keywords with weighted scoring
  const highConfidenceKeywords = [
    'quote', 'quotation', 'pricing', 'price list', 'cost estimate', 'quote request',
    'need pricing', 'send quote', 'quotation request', 'price inquiry'
  ];
  
  const mediumConfidenceKeywords = [
    'price', 'cost', 'estimate', 'how much', 'inquiry', 'enquiry', 
    'interested in', 'purchase', 'buy', 'order', 'supply', 'provide', 
    'need', 'require', 'looking for', 'want to buy', 'procurement'
  ];

  // Check for quote keywords with weighted scoring
  let quoteScore = 0;
  
  highConfidenceKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      quoteScore += 3;
    }
  });
  
  mediumConfidenceKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      quoteScore += 1;
    }
  });

  // Enhanced product matching
  let detectedProduct: EmailClassification['detectedProduct'];
  let bestMatch = 0;

  for (const product of products) {
    const productText = `${product.name} ${product.product_code} ${product.brand || ''} ${product.category || ''}`.toLowerCase();
    const productWords = productText.split(/\s+/);
    
    let matchScore = 0;
    for (const word of productWords) {
      if (word.length > 2 && text.includes(word)) {
        matchScore += word.length;
        // Bonus for exact product code matches
        if (text.includes(product.product_code.toLowerCase())) {
          matchScore += 10;
        }
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

  // Determine if it's a quote request
  const isQuoteRequest = quoteScore >= 2 || (quoteScore >= 1 && bestMatch > 5);

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (isQuoteRequest && detectedProduct && quoteScore >= 3) {
    confidence = 'high';
  } else if (isQuoteRequest && (detectedProduct || quoteScore >= 2)) {
    confidence = 'medium';
  } else if (isQuoteRequest) {
    confidence = 'low';
  }

  const reasoning = `Quote score: ${quoteScore}, Product match: ${bestMatch > 0 ? detectedProduct?.name : 'None'}`;

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
  
  return email.subject?.substring(0, 50) + (email.subject && email.subject.length > 50 ? '...' : '');
};

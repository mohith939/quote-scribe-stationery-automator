
import { EmailMessage, Product } from "@/types";

export interface EnhancedEmailClassification {
  isQuoteRequest: boolean;
  confidence: 'high' | 'medium' | 'low';
  score: number; // 0-100 confidence score
  detectedProducts: Array<{
    name: string;
    code: string;
    brand?: string;
    description?: string;
    matchScore: number;
    unitPrice?: number;
    gstRate?: number;
  }>;
  reasoning: string;
  categories: string[];
  extractedQuantities: Array<{
    product: string;
    quantity: number;
    confidence: number;
  }>;
}

export class EnhancedEmailClassifier {
  private products: Product[];
  
  constructor(products: Product[]) {
    this.products = products;
  }

  // Enhanced quote request detection with weighted scoring
  private detectQuoteIntent(text: string): { score: number; matches: string[] } {
    const lowerText = text.toLowerCase();
    
    // High-priority quote indicators (weight: 3)
    const highPriorityKeywords = [
      'quote', 'quotation', 'price quote', 'pricing', 'estimate', 'cost estimate',
      'how much', 'what is the price', 'price list', 'rate card'
    ];
    
    // Medium-priority quote indicators (weight: 2)
    const mediumPriorityKeywords = [
      'price', 'cost', 'rates', 'charges', 'amount', 'invoice',
      'purchase', 'buy', 'order', 'procurement', 'tender'
    ];
    
    // Low-priority quote indicators (weight: 1)
    const lowPriorityKeywords = [
      'inquiry', 'enquiry', 'interested', 'need', 'require', 'supply',
      'provide', 'available', 'stock', 'delivery'
    ];
    
    // Negative indicators (weight: -2)
    const negativeKeywords = [
      'complaint', 'issue', 'problem', 'return', 'refund', 'cancel',
      'support', 'help', 'question', 'information only'
    ];
    
    let score = 0;
    const matches: string[] = [];
    
    // Check high priority keywords
    highPriorityKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        score += 3;
        matches.push(keyword);
      }
    });
    
    // Check medium priority keywords
    mediumPriorityKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        score += 2;
        matches.push(keyword);
      }
    });
    
    // Check low priority keywords
    lowPriorityKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        score += 1;
        matches.push(keyword);
      }
    });
    
    // Check negative indicators
    negativeKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        score -= 2;
        matches.push(`-${keyword}`);
      }
    });
    
    return { score: Math.max(0, score), matches };
  }

  // Advanced product matching with fuzzy logic
  private matchProducts(text: string): Array<{
    product: Product;
    matchScore: number;
    matchedTerms: string[];
  }> {
    const lowerText = text.toLowerCase();
    const matches: Array<{
      product: Product;
      matchScore: number;
      matchedTerms: string[];
    }> = [];
    
    this.products.forEach(product => {
      let matchScore = 0;
      const matchedTerms: string[] = [];
      
      // Exact product code match (highest priority)
      if (lowerText.includes(product.product_code.toLowerCase())) {
        matchScore += 50;
        matchedTerms.push(product.product_code);
      }
      
      // Product name matching with word boundaries
      const productNameWords = product.name.toLowerCase().split(/[\s\-_,]/);
      productNameWords.forEach(word => {
        if (word.length > 2 && lowerText.includes(word)) {
          matchScore += word.length * 2; // Longer words get higher scores
          matchedTerms.push(word);
        }
      });
      
      // Brand matching
      if (product.brand && lowerText.includes(product.brand.toLowerCase())) {
        matchScore += 15;
        matchedTerms.push(product.brand);
      }
      
      // Fuzzy matching for partial product names
      const productNameLower = product.name.toLowerCase();
      if (this.calculateSimilarity(lowerText, productNameLower) > 0.7) {
        matchScore += 25;
        matchedTerms.push('fuzzy_match');
      }
      
      // Boost score if multiple terms match
      if (matchedTerms.length > 1) {
        matchScore *= 1.5;
      }
      
      if (matchScore > 5) { // Minimum threshold
        matches.push({
          product,
          matchScore: Math.round(matchScore),
          matchedTerms
        });
      }
    });
    
    // Sort by match score and return top matches
    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
  }

  // Calculate string similarity using Jaccard coefficient
  private calculateSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  // Enhanced quantity extraction
  private extractQuantities(text: string, detectedProducts: string[]): Array<{
    product: string;
    quantity: number;
    confidence: number;
  }> {
    const quantities: Array<{
      product: string;
      quantity: number;
      confidence: number;
    }> = [];
    
    // Patterns for quantity detection
    const quantityPatterns = [
      // Direct quantity patterns
      /(\d+)\s*(?:units?|pieces?|pcs?\.?|nos?\.?|qty|quantity)/gi,
      /(?:quantity|qty)\s*[:=]?\s*(\d+)/gi,
      /(\d+)\s*(?:of|x)\s+([a-zA-Z0-9\s\-]+)/gi,
      // Context-specific patterns
      /(?:need|require|want|order)\s+(\d+)\s*(?:units?|pieces?|pcs?)?/gi,
      /(\d+)\s*(?:sets?|boxes?|cartons?|packets?)/gi
    ];
    
    quantityPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const quantity = parseInt(match[1]);
        if (quantity > 0 && quantity < 1000000) {
          // Try to associate with detected products
          if (detectedProducts.length > 0) {
            detectedProducts.forEach(productName => {
              const confidence = this.calculateQuantityConfidence(text, match.index || 0, productName);
              quantities.push({
                product: productName,
                quantity,
                confidence
              });
            });
          } else {
            // Generic quantity without specific product
            quantities.push({
              product: 'generic',
              quantity,
              confidence: 0.5
            });
          }
        }
      }
    });
    
    return quantities;
  }

  // Calculate confidence for quantity-product association
  private calculateQuantityConfidence(text: string, quantityIndex: number, productName: string): number {
    const productIndex = text.toLowerCase().indexOf(productName.toLowerCase());
    if (productIndex === -1) return 0.3;
    
    const distance = Math.abs(quantityIndex - productIndex);
    const proximity = Math.max(0, 1 - distance / 100); // Closer = higher confidence
    
    return Math.min(0.9, 0.5 + proximity);
  }

  // Main classification method
  classify(email: EmailMessage): EnhancedEmailClassification {
    const text = `${email.subject} ${email.body}`.toLowerCase();
    
    // Detect quote intent
    const quoteIntent = this.detectQuoteIntent(text);
    
    // Match products
    const productMatches = this.matchProducts(text);
    
    // Extract detected product names
    const detectedProductNames = productMatches.map(match => match.product.name);
    
    // Extract quantities
    const quantities = this.extractQuantities(text, detectedProductNames);
    
    // Calculate overall confidence
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let overallScore = quoteIntent.score;
    
    // Boost score based on product matches
    if (productMatches.length > 0) {
      overallScore += productMatches[0].matchScore / 10;
    }
    
    // Boost score based on quantity detection
    if (quantities.length > 0) {
      overallScore += 10;
    }
    
    // Determine confidence levels
    if (overallScore >= 15 && productMatches.length > 0) {
      confidence = 'high';
    } else if (overallScore >= 8 || productMatches.length > 0) {
      confidence = 'medium';
    }
    
    // Determine if it's a quote request
    const isQuoteRequest = overallScore >= 5;
    
    // Build reasoning
    const reasoning = this.buildReasoning(quoteIntent, productMatches, quantities, overallScore);
    
    // Categorize email
    const categories = this.categorizeEmail(text, isQuoteRequest, productMatches.length);
    
    return {
      isQuoteRequest,
      confidence,
      score: Math.round(overallScore),
      detectedProducts: productMatches.map(match => ({
        name: match.product.name,
        code: match.product.product_code,
        brand: match.product.brand,
        description: match.product.category || '',
        matchScore: match.matchScore,
        unitPrice: match.product.unit_price,
        gstRate: match.product.gst_rate
      })),
      reasoning,
      categories,
      extractedQuantities: quantities
    };
  }

  private buildReasoning(
    quoteIntent: { score: number; matches: string[] },
    productMatches: Array<{ matchScore: number; matchedTerms: string[] }>,
    quantities: Array<{ quantity: number; confidence: number }>,
    overallScore: number
  ): string {
    const parts: string[] = [];
    
    if (quoteIntent.matches.length > 0) {
      parts.push(`Quote keywords: ${quoteIntent.matches.join(', ')}`);
    }
    
    if (productMatches.length > 0) {
      parts.push(`${productMatches.length} product(s) detected`);
    }
    
    if (quantities.length > 0) {
      parts.push(`${quantities.length} quantity mention(s)`);
    }
    
    parts.push(`Overall score: ${Math.round(overallScore)}`);
    
    return parts.join(' | ');
  }

  private categorizeEmail(text: string, isQuoteRequest: boolean, productCount: number): string[] {
    const categories: string[] = [];
    
    if (isQuoteRequest) {
      categories.push('quote_request');
      
      if (productCount > 0) {
        categories.push('specific_product');
      } else {
        categories.push('general_inquiry');
      }
    } else {
      categories.push('general_email');
    }
    
    // Additional categorization
    if (text.includes('urgent') || text.includes('asap')) {
      categories.push('urgent');
    }
    
    if (text.includes('bulk') || text.includes('wholesale')) {
      categories.push('bulk_order');
    }
    
    return categories;
  }
}

// Helper function for easy integration
export const enhancedClassifyEmail = (email: EmailMessage, products: Product[]): EnhancedEmailClassification => {
  const classifier = new EnhancedEmailClassifier(products);
  return classifier.classify(email);
};

import { EmailMessage, Product } from "@/types";

export interface ParsedProductInfo {
  product: string;
  quantity: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface MultiProductParsedInfo {
  customerName: string;
  emailAddress: string;
  products: ParsedProductInfo[];
  originalText: string;
  overallConfidence: 'high' | 'medium' | 'low' | 'none';
}

/**
 * Enhanced parser that can detect multiple products in a single email
 */
export const parseEmailForMultipleProducts = (email: EmailMessage): MultiProductParsedInfo => {
  const emailBody = email.body.toLowerCase();
  
  // Extract customer info (reuse existing logic)
  const nameMatch = email.from.match(/^([^<]+)<([^>]+)>$/);
  const customerName = nameMatch && nameMatch[1] ? nameMatch[1].trim() : 
    email.from.match(/([^@<\s]+)@[^>]+/)?.[1]?.charAt(0).toUpperCase() + 
    email.from.match(/([^@<\s]+)@[^>]+/)?.[1]?.slice(1) || "Customer";
  
  const emailAddress = email.from.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[0] || "";

  // Product detection patterns with multiple product support
  const productPatterns = [
    {
      name: "A4 Paper - 80gsm",
      patterns: [
        /(\d+)\s*(sheets?|reams?|pages?)\s*(?:of\s*)?(?:a4\s*)?paper/i,
        /a4\s*paper[^\d]*(\d+)/i,
        /(\d+)\s*a4/i,
        /paper[^\d]*(\d+)/i
      ],
      keywords: ['a4', 'paper', '80gsm', 'sheets', 'reams', 'pages']
    },
    {
      name: "Ballpoint Pens - Blue", 
      patterns: [
        /(\d+)\s*(?:blue\s*)?(?:ballpoint\s*)?pens?/i,
        /pens?[^\d]*(\d+)/i,
        /ballpoint[^\d]*(\d+)/i
      ],
      keywords: ['pen', 'pens', 'ballpoint', 'blue', 'writing']
    },
    {
      name: "Stapler - Medium",
      patterns: [
        /(\d+)\s*staplers?/i,
        /stapler[^\d]*(\d+)/i
      ],
      keywords: ['stapler', 'staple', 'stapling']
    },
    {
      name: "Spiral Notebook - A5",
      patterns: [
        /(\d+)\s*notebooks?/i,
        /notebook[^\d]*(\d+)/i,
        /(\d+)\s*spiral/i
      ],
      keywords: ['notebook', 'spiral', 'notepad', 'pad']
    },
    {
      name: "Whiteboard Markers - Pack of 4",
      patterns: [
        /(\d+)\s*(?:whiteboard\s*)?markers?/i,
        /markers?[^\d]*(\d+)/i,
        /whiteboard[^\d]*(\d+)/i
      ],
      keywords: ['marker', 'markers', 'whiteboard', 'board']
    },
    {
      name: "File Folders - Pack of 10",
      patterns: [
        /(\d+)\s*(?:file\s*)?folders?/i,
        /folders?[^\d]*(\d+)/i,
        /files?[^\d]*(\d+)/i
      ],
      keywords: ['folder', 'folders', 'file', 'files']
    }
  ];

  const detectedProducts: ParsedProductInfo[] = [];

  // Check each product pattern
  for (const productPattern of productPatterns) {
    let productFound = false;
    let quantity = 0;
    let confidence: 'high' | 'medium' | 'low' = 'low';

    // Check keyword presence
    const keywordScore = productPattern.keywords.reduce((score, keyword) => {
      return score + (emailBody.includes(keyword) ? 1 : 0);
    }, 0);

    if (keywordScore > 0) {
      // Try to extract quantity using patterns
      for (const pattern of productPattern.patterns) {
        const match = emailBody.match(pattern);
        if (match && match[1]) {
          quantity = parseInt(match[1]);
          productFound = true;
          
          // Determine confidence based on keyword score and pattern match
          if (keywordScore >= 2) {
            confidence = 'high';
          } else if (keywordScore === 1) {
            confidence = 'medium';
          }
          break;
        }
      }

      // If no quantity found but keywords present, use default quantity
      if (!productFound && keywordScore >= 1) {
        const defaultQuantities: Record<string, number> = {
          "A4 Paper - 80gsm": 500,
          "Ballpoint Pens - Blue": 50,
          "Stapler - Medium": 10,
          "Spiral Notebook - A5": 25,
          "Whiteboard Markers - Pack of 4": 5,
          "File Folders - Pack of 10": 3
        };
        
        quantity = defaultQuantities[productPattern.name];
        productFound = true;
        confidence = 'low';
      }

      if (productFound) {
        detectedProducts.push({
          product: productPattern.name,
          quantity,
          confidence
        });
      }
    }
  }

  // Remove duplicates and merge similar products
  const uniqueProducts = detectedProducts.reduce((acc, current) => {
    const existing = acc.find(p => p.product === current.product);
    if (existing) {
      // Keep the one with higher confidence or higher quantity
      if (current.confidence === 'high' || current.quantity > existing.quantity) {
        const index = acc.indexOf(existing);
        acc[index] = current;
      }
    } else {
      acc.push(current);
    }
    return acc;
  }, [] as ParsedProductInfo[]);

  // Determine overall confidence
  let overallConfidence: 'high' | 'medium' | 'low' | 'none' = 'none';
  
  if (uniqueProducts.length > 0) {
    const highConfidenceCount = uniqueProducts.filter(p => p.confidence === 'high').length;
    const mediumConfidenceCount = uniqueProducts.filter(p => p.confidence === 'medium').length;
    
    if (highConfidenceCount > 0) {
      overallConfidence = 'high';
    } else if (mediumConfidenceCount > 0) {
      overallConfidence = 'medium';
    } else {
      overallConfidence = 'low';
    }
  }

  return {
    customerName,
    emailAddress,
    products: uniqueProducts,
    originalText: email.body,
    overallConfidence
  };
};

/**
 * Calculate total price for multiple products
 */
export const calculateMultiProductPrice = (
  products: ParsedProductInfo[], 
  productCatalog: Product[]
): { totalPrice: number; itemBreakdown: Array<{product: string; quantity: number; unitPrice: number; subtotal: number}> } => {
  const itemBreakdown = products.map(parsedProduct => {
    const catalogProduct = productCatalog.find(p => 
      p.name === parsedProduct.product && 
      parsedProduct.quantity >= p.minQuantity && 
      parsedProduct.quantity <= p.maxQuantity
    );
    
    const unitPrice = catalogProduct ? catalogProduct.pricePerUnit : 0;
    const subtotal = unitPrice * parsedProduct.quantity;
    
    return {
      product: parsedProduct.product,
      quantity: parsedProduct.quantity,
      unitPrice,
      subtotal
    };
  });

  const totalPrice = itemBreakdown.reduce((sum, item) => sum + item.subtotal, 0);
  
  return { totalPrice, itemBreakdown };
};

import { EmailMessage, Product } from "@/types";

export interface ParsedProductInfo {
  product: string;
  productCode?: string;
  brand?: string;
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
 * Now works with the new product format: Brand, Product Description, Product Code, Unit Price, GST Rate
 */
export const parseEmailForMultipleProducts = (
  email: EmailMessage, 
  productCatalog: Product[] = []
): MultiProductParsedInfo => {
  const emailBody = (email.body || '').toLowerCase();
  const emailSubject = (email.subject || '').toLowerCase();
  const fullText = `${emailSubject} ${emailBody}`;
  
  // Extract customer info
  const nameMatch = email.from.match(/^([^<]+)<([^>]+)>$/);
  const customerName = nameMatch && nameMatch[1] ? nameMatch[1].trim() : 
    email.from.match(/([^@<\s]+)@[^>]+/)?.[1]?.charAt(0).toUpperCase() + 
    email.from.match(/([^@<\s]+)@[^>]+/)?.[1]?.slice(1) || "Customer";
  
  const emailAddress = email.from.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[0] || "";

  const detectedProducts: ParsedProductInfo[] = [];

  // Enhanced product detection using actual product catalog
  for (const product of productCatalog) {
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let quantity = 1;
    let productFound = false;

    // Create search terms from product data
    const searchTerms = [
      product.name.toLowerCase(),
      product.product_code.toLowerCase(),
      ...(product.brand ? [product.brand.toLowerCase()] : []),
      // Break down product name into meaningful parts
      ...product.name.toLowerCase().split(/[-\s,]/),
      ...product.product_code.toLowerCase().split(/[-\s,]/)
    ].filter(term => term.length > 2); // Filter out very short terms

    // Check for product mentions
    let matchScore = 0;
    const foundTerms: string[] = [];

    for (const term of searchTerms) {
      if (fullText.includes(term)) {
        matchScore++;
        foundTerms.push(term);
        productFound = true;
      }
    }

    if (productFound) {
      // Determine confidence based on match quality
      if (fullText.includes(product.product_code.toLowerCase())) {
        confidence = 'high'; // Product code is most reliable
      } else if (matchScore >= 3 || fullText.includes(product.name.toLowerCase())) {
        confidence = 'high';
      } else if (matchScore >= 2) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      // Extract quantity using various patterns
      const quantityPatterns = [
        // Direct quantity patterns near product mentions
        new RegExp(`(\\d+)\\s*(?:units?|pieces?|pcs?\\.?|nos?\\.?)\\s*(?:of\\s*)?(?:${foundTerms.join('|')})`, 'i'),
        new RegExp(`(?:${foundTerms.join('|')})\\s*[^\\d]*?(\\d+)\\s*(?:units?|pieces?|pcs?\\.?|nos?\\.?)`, 'i'),
        
        // Quantity with product code
        new RegExp(`${product.product_code.toLowerCase()}\\s*[^\\d]*?(\\d+)`, 'i'),
        new RegExp(`(\\d+)\\s*[^a-z]*?${product.product_code.toLowerCase()}`, 'i'),
        
        // General quantity patterns
        /quantity[^\d]*?(\d+)/i,
        /qty[^\d]*?(\d+)/i,
        /need[^\d]*?(\d+)/i,
        /require[^\d]*?(\d+)/i,
        /order[^\d]*?(\d+)/i,
        /want[^\d]*?(\d+)/i,
        /looking\s+for[^\d]*?(\d+)/i
      ];

      for (const pattern of quantityPatterns) {
        const match = fullText.match(pattern);
        if (match && match[1]) {
          const extractedQty = parseInt(match[1]);
          if (extractedQty > 0 && extractedQty < 100000) { // Reasonable quantity range
            quantity = extractedQty;
            if (confidence === 'low') confidence = 'medium'; // Boost confidence
            break;
          }
        }
      }

      // Add to detected products if confidence is reasonable
      if (confidence !== 'low' || matchScore >= 2) {
        detectedProducts.push({
          product: product.name,
          productCode: product.product_code,
          brand: product.brand,
          quantity,
          confidence
        });
      }
    }
  }

  // Fallback: Generic product detection for products not in catalog
  if (detectedProducts.length === 0) {
    const genericPatterns = [
      {
        regex: /(\d+)\s*(?:units?|pieces?|pcs?\.?|nos?\.?)\s*(?:of\s*)?([a-zA-Z0-9\s\-]+)/gi,
        type: 'quantity_first'
      },
      {
        regex: /([a-zA-Z0-9\s\-]+?)\s*[^\d]*?(\d+)\s*(?:units?|pieces?|pcs?\.?|nos?\.?)/gi,
        type: 'product_first'
      },
      {
        regex: /(?:quote|quotation|price|pricing).*?for.*?([a-zA-Z0-9\s\-]+)/gi,
        type: 'quote_mention'
      }
    ];

    for (const pattern of genericPatterns) {
      let match;
      while ((match = pattern.regex.exec(fullText)) !== null) {
        let productName = '';
        let qty = 1;

        if (pattern.type === 'quantity_first') {
          qty = parseInt(match[1]);
          productName = match[2].trim();
        } else if (pattern.type === 'product_first') {
          productName = match[1].trim();
          qty = parseInt(match[2]);
        } else if (pattern.type === 'quote_mention') {
          productName = match[1].trim();
          qty = 1;
        }

        if (productName.length > 3 && productName.length < 100 && qty > 0 && qty < 100000) {
          detectedProducts.push({
            product: productName,
            quantity: qty,
            confidence: 'low'
          });
        }
      }
    }
  }

  // Remove duplicates and merge similar products
  const uniqueProducts = detectedProducts.reduce((acc, current) => {
    const existing = acc.find(p => 
      p.product.toLowerCase() === current.product.toLowerCase() ||
      (p.productCode && current.productCode && p.productCode === current.productCode)
    );
    
    if (existing) {
      // Keep the one with higher confidence or merge quantities
      if (current.confidence === 'high' && existing.confidence !== 'high') {
        const index = acc.indexOf(existing);
        acc[index] = current;
      } else if (existing.confidence === current.confidence) {
        // Same confidence, add quantities
        existing.quantity += current.quantity;
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
    originalText: email.body || '',
    overallConfidence
  };
};

/**
 * Calculate total price for multiple products with GST
 */
export const calculateMultiProductPrice = (
  products: ParsedProductInfo[], 
  productCatalog: Product[]
): { 
  totalPrice: number; 
  itemBreakdown: Array<{
    product: string; 
    quantity: number; 
    unitPrice: number; 
    basePrice: number;
    gstAmount: number;
    totalPrice: number;
    gstRate: number;
  }> 
} => {
  const itemBreakdown = products.map(parsedProduct => {
    const catalogProduct = productCatalog.find(p => 
      p.name === parsedProduct.product || 
      p.product_code === parsedProduct.productCode
    );
    
    const unitPrice = catalogProduct ? catalogProduct.unit_price : 0;
    const gstRate = catalogProduct ? catalogProduct.gst_rate : 18; // Default GST rate
    const basePrice = unitPrice * parsedProduct.quantity;
    const gstAmount = (basePrice * gstRate) / 100;
    const totalPrice = basePrice + gstAmount;
    
    return {
      product: parsedProduct.product,
      quantity: parsedProduct.quantity,
      unitPrice,
      basePrice: Math.round(basePrice * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100,
      gstRate
    };
  });

  const totalPrice = itemBreakdown.reduce((sum, item) => sum + item.totalPrice, 0);
  
  return { 
    totalPrice: Math.round(totalPrice * 100) / 100, 
    itemBreakdown 
  };
};

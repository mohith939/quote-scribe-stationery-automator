
import { EmailMessage, Product } from "@/types";

export interface ParsedEmailInfo {
  customerName: string;
  emailAddress: string;
  product?: string;
  quantity?: number;
  originalText: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
}

/**
 * Extracts a customer name from email address or "From" field
 */
export const extractCustomerName = (emailFrom: string): string => {
  // Try to extract name if it's in format "Name <email@example.com>"
  const nameMatch = emailFrom.match(/^([^<]+)<([^>]+)>$/);
  if (nameMatch && nameMatch[1]) {
    return nameMatch[1].trim();
  }
  
  // If no name found, use the part before @ in email
  const emailMatch = emailFrom.match(/([^@<\s]+)@[^>]+/);
  if (emailMatch && emailMatch[1]) {
    return emailMatch[1].charAt(0).toUpperCase() + emailMatch[1].slice(1);
  }
  
  return "Customer";
};

/**
 * Extracts email address from the "From" field
 */
export const extractEmailAddress = (emailFrom: string): string => {
  const emailMatch = emailFrom.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return emailMatch ? emailMatch[0] : "";
};

/**
 * Advanced NLP to parse email body with better accuracy
 */
export const parseEmailForQuotation = (email: EmailMessage): ParsedEmailInfo => {
  const emailBody = (email.body || '').toLowerCase();
  const customerName = extractCustomerName(email.from);
  const emailAddress = extractEmailAddress(email.from);
  
  // Initialize with no product/quantity found
  const parsedInfo: ParsedEmailInfo = {
    customerName,
    emailAddress,
    originalText: email.body || '',
    confidence: 'none'
  };
  
  // Structured NLP approach
  
  // 1. Product detection with weighted scoring
  const productScores: Record<string, number> = {
    "A4 Paper - 80gsm": 0,
    "Ballpoint Pens - Blue": 0,
    "Stapler - Medium": 0,
    "Spiral Notebook - A5": 0,
    "Whiteboard Markers - Pack of 4": 0,
    "File Folders - Pack of 10": 0
  };
  
  // Score each product based on keyword matches
  if (/\ba4\b|\bpaper\b|\b80\s*gsm\b|\bsheets?\b|\breams?\b/i.test(emailBody)) {
    productScores["A4 Paper - 80gsm"] += 10;
    if (/\ba4\s+paper\b/i.test(emailBody)) productScores["A4 Paper - 80gsm"] += 5;
    if (/\bsheets?\s+of\s+paper\b|\breams?\s+of\s+paper\b/i.test(emailBody)) productScores["A4 Paper - 80gsm"] += 3;
  }
  
  if (/\bpen\b|\bpens\b|\bballpoint\b|\bball\s+point\b|\bblue\s+pen\b/i.test(emailBody)) {
    productScores["Ballpoint Pens - Blue"] += 10;
    if (/\bblue\s+pen\b|\bballpoint\s+pen\b/i.test(emailBody)) productScores["Ballpoint Pens - Blue"] += 5;
    if (/\bbox\s+of\s+pen\b|\bpen\s+set\b/i.test(emailBody)) productScores["Ballpoint Pens - Blue"] += 3;
  }
  
  if (/\bstapler\b|\bstaple\b|\bstapling\b/i.test(emailBody)) {
    productScores["Stapler - Medium"] += 10;
    if (/\bmedium\s+stapler\b|\boffice\s+stapler\b/i.test(emailBody)) productScores["Stapler - Medium"] += 5;
  }
  
  if (/\bnotebook\b|\bnote\s+book\b|\bspiral\b|\bpad\b|\bnotepad\b/i.test(emailBody)) {
    productScores["Spiral Notebook - A5"] += 10;
    if (/\bspiral\s+notebook\b|\ba5\s+notebook\b/i.test(emailBody)) productScores["Spiral Notebook - A5"] += 5;
  }
  
  if (/\bmarker\b|\bmarkers\b|\bwhiteboard\b|\bdry\s+erase\b/i.test(emailBody)) {
    productScores["Whiteboard Markers - Pack of 4"] += 10;
    if (/\bwhiteboard\s+marker\b|\bboard\s+marker\b/i.test(emailBody)) productScores["Whiteboard Markers - Pack of 4"] += 5;
    if (/\bpack\s+of\s+marker\b|\bset\s+of\s+marker\b/i.test(emailBody)) productScores["Whiteboard Markers - Pack of 4"] += 3;
  }
  
  if (/\bfolder\b|\bfolders\b|\bfile\b|\bfiles\b/i.test(emailBody)) {
    productScores["File Folders - Pack of 10"] += 10;
    if (/\bfile\s+folder\b|\bdocument\s+folder\b/i.test(emailBody)) productScores["File Folders - Pack of 10"] += 5;
    if (/\bpack\s+of\s+folder\b|\bset\s+of\s+folder\b/i.test(emailBody)) productScores["File Folders - Pack of 10"] += 3;
  }
  
  // Find the product with highest score
  let maxScore = 0;
  let bestProduct: string | undefined;
  
  for (const [product, score] of Object.entries(productScores)) {
    if (score > maxScore) {
      maxScore = score;
      bestProduct = product;
    }
  }
  
  if (bestProduct && maxScore >= 10) {
    parsedInfo.product = bestProduct;
    parsedInfo.confidence = maxScore >= 15 ? 'high' : 'medium';
  }
  
  // 2. Enhanced quantity detection
  const quantityPatterns = [
    // Specific patterns for different products
    {regex: /(\d+)\s*(sheets?|reams?|papers?|copies)/i, productType: "paper"},
    {regex: /(\d+)\s*(pens?|ballpoints?|writing\s+instruments?)/i, productType: "pen"},
    {regex: /(\d+)\s*(staplers?|stapling\s+machines?)/i, productType: "stapler"},
    {regex: /(\d+)\s*(notebooks?|note\s+books?|pads?|notepads?)/i, productType: "notebook"},
    {regex: /(\d+)\s*(markers?|whiteboard\s+markers?|board\s+markers?)/i, productType: "marker"},
    {regex: /(\d+)\s*(folders?|files?|file\s+folders?)/i, productType: "folder"},
    
    // Generic quantity patterns (lower priority)
    {regex: /(\d+)\s*(units|pieces|pcs|items)/i, productType: "generic"},
    {regex: /quantity[^\d]*(\d+)/i, productType: "generic"},
    {regex: /qty[^\d]*(\d+)/i, productType: "generic"},
    {regex: /order[^\d]*(\d+)/i, productType: "generic"},
    {regex: /need[^\d]*(\d+)/i, productType: "generic"},
    {regex: /want[^\d]*(\d+)/i, productType: "generic"},
    {regex: /looking\s+for[^\d]*(\d+)/i, productType: "generic"},
    {regex: /(\d+)\s*$/i, productType: "generic"}, // Just a number at the end
  ];
  
  // Try to extract quantity with contextual understanding
  for (const pattern of quantityPatterns) {
    const match = emailBody.match(pattern.regex);
    
    if (match && match[1]) {
      const extractedQuantity = parseInt(match[1]);
      
      // For product-specific quantities, check if it matches our detected product
      if (pattern.productType !== "generic") {
        if ((pattern.productType === "paper" && parsedInfo.product?.toLowerCase().includes("paper")) ||
            (pattern.productType === "pen" && parsedInfo.product?.toLowerCase().includes("pen")) ||
            (pattern.productType === "stapler" && parsedInfo.product?.toLowerCase().includes("stapler")) ||
            (pattern.productType === "notebook" && parsedInfo.product?.toLowerCase().includes("notebook")) ||
            (pattern.productType === "marker" && parsedInfo.product?.toLowerCase().includes("marker")) ||
            (pattern.productType === "folder" && parsedInfo.product?.toLowerCase().includes("folder"))) {
          
          parsedInfo.quantity = extractedQuantity;
          // Increase confidence if we found product-specific quantity
          if (parsedInfo.confidence === 'medium') parsedInfo.confidence = 'high';
          break;
        }
      } else {
        // Generic quantity pattern
        parsedInfo.quantity = extractedQuantity;
        break;
      }
    }
  }
  
  // 3. Set default quantity based on product if not found
  if (parsedInfo.product && !parsedInfo.quantity) {
    const defaultQuantities: Record<string, number> = {
      "A4 Paper - 80gsm": 500,
      "Ballpoint Pens - Blue": 50,
      "Stapler - Medium": 10,
      "Spiral Notebook - A5": 25,
      "Whiteboard Markers - Pack of 4": 5,
      "File Folders - Pack of 10": 3
    };
    
    parsedInfo.quantity = defaultQuantities[parsedInfo.product];
    
    // Lower confidence as quantity was assumed
    if (parsedInfo.confidence === 'high') parsedInfo.confidence = 'medium';
    else if (parsedInfo.confidence === 'medium') parsedInfo.confidence = 'low';
  }
  
  // 4. Contextual analysis for improved accuracy
  // Check if quantity makes sense for the product
  if (parsedInfo.product && parsedInfo.quantity) {
    const qtyRanges: Record<string, {min: number, max: number, typical: number}> = {
      "A4 Paper - 80gsm": {min: 100, max: 5000, typical: 500},
      "Ballpoint Pens - Blue": {min: 10, max: 1000, typical: 50},
      "Stapler - Medium": {min: 1, max: 50, typical: 10},
      "Spiral Notebook - A5": {min: 5, max: 100, typical: 25},
      "Whiteboard Markers - Pack of 4": {min: 1, max: 50, typical: 5},
      "File Folders - Pack of 10": {min: 1, max: 20, typical: 3}
    };
    
    if (parsedInfo.product in qtyRanges) {
      const range = qtyRanges[parsedInfo.product];
      
      // If quantity is wildly out of reasonable range, adjust it
      if (parsedInfo.quantity < range.min / 10 || parsedInfo.quantity > range.max * 10) {
        // Extremely unusual quantity - might be an error
        parsedInfo.quantity = range.typical;
        parsedInfo.confidence = 'low';
      }
    }
  }
  
  // Final confidence adjustment
  if (parsedInfo.product && parsedInfo.quantity) {
    // Already set above
  } else if (parsedInfo.product) {
    // Only product found
    parsedInfo.confidence = 'low';
  } else {
    // Nothing found
    parsedInfo.confidence = 'none';
  }
  
  return parsedInfo;
};

/**
 * Determines if the product and quantity from parsed email are valid based on product catalog
 */
export const validateParsedInfo = (parsedInfo: ParsedEmailInfo, products: Product[]): boolean => {
  if (!parsedInfo.product || !parsedInfo.quantity) {
    return false;
  }
  
  const matchingProduct = products.find(p => 
    p.name === parsedInfo.product && 
    parsedInfo.quantity! >= (p.min_quantity || 1) && 
    parsedInfo.quantity! <= (p.max_quantity || 999999)
  );
  
  return !!matchingProduct;
};

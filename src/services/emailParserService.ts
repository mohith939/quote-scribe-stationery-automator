
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
 * Parses email body to extract product and quantity information
 */
export const parseEmailForQuotation = (email: EmailMessage): ParsedEmailInfo => {
  const emailBody = email.body.toLowerCase();
  const customerName = extractCustomerName(email.from);
  const emailAddress = extractEmailAddress(email.from);
  
  // Initialize with no product/quantity found
  const parsedInfo: ParsedEmailInfo = {
    customerName,
    emailAddress,
    originalText: email.body,
    confidence: 'none'
  };
  
  // Regular expressions for product detection
  const productPatterns = [
    { regex: /(\ba4\b|\ba4\s+paper\b|\bpaper\b)/, product: "A4 Paper - 80gsm" },
    { regex: /(\bpen\b|\bballpoint\b|\bball\s+point\b)/, product: "Ballpoint Pens - Blue" },
    { regex: /(\bstapler\b)/, product: "Stapler - Medium" },
    { regex: /(\bnotebook\b|\bnote\s+book\b)/, product: "Spiral Notebook - A5" },
    { regex: /(\bmarker\b|\bmarkers\b)/, product: "Whiteboard Markers - Pack of 4" },
    { regex: /(\bfolder\b|\bfile\s+folder\b)/, product: "File Folders - Pack of 10" }
  ];
  
  // Try to identify product
  for (const pattern of productPatterns) {
    if (pattern.regex.test(emailBody)) {
      parsedInfo.product = pattern.product;
      parsedInfo.confidence = 'medium';
      break;
    }
  }
  
  // Regular expressions for quantity detection
  // Look for patterns like "500 sheets", "50 pens", "10 staplers"
  const quantityPatterns = [
    /(\d+)\s*(sheets?|reams?|papers?)/i,   // For paper
    /(\d+)\s*(pens?|ballpoints?)/i,        // For pens
    /(\d+)\s*(staplers?)/i,                // For staplers
    /(\d+)\s*(notebooks?)/i,               // For notebooks
    /(\d+)\s*(markers?|packs?)/i,          // For markers
    /(\d+)\s*(folders?|files?)/i,          // For folders
    /(\d+)\s*(units|pieces|pcs)/i,         // Generic quantity
    /quantity\D*(\d+)/i,                   // "quantity: 100" format
    /qty\D*(\d+)/i,                        // "qty: 100" format
    /need\D*(\d+)/i,                       // "I need 100" format
    /(\d+)\s*$/                            // Just a number at the end
  ];
  
  // Try to extract quantity
  for (const pattern of quantityPatterns) {
    const match = emailBody.match(pattern);
    if (match && match[1]) {
      parsedInfo.quantity = parseInt(match[1]);
      // If we found both product and quantity, increase confidence
      if (parsedInfo.product) {
        parsedInfo.confidence = 'high';
      }
      break;
    }
  }
  
  // Set default quantity based on product if not found
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
    parsedInfo.confidence = 'low'; // Low confidence as quantity was not explicitly mentioned
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
    parsedInfo.quantity! >= p.minQuantity && 
    parsedInfo.quantity! <= p.maxQuantity
  );
  
  return !!matchingProduct;
};

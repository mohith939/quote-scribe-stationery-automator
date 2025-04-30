
import { QuoteTemplate } from "@/types";
import { ParsedEmailInfo } from "./emailParserService";

// Default quote template
export const defaultQuoteTemplate: QuoteTemplate = {
  id: "default",
  name: "Default Template",
  subject: "Your Quotation for {product}",
  greeting: "Dear {customer},",
  body: "Thank you for your inquiry. Please find our quotation below:\n\nProduct: {product}\nQuantity: {quantity}\nPrice per Unit: ₹{price_per_unit}\nTotal Amount: ₹{total_amount}\n\nThis quotation is valid for 14 days from the date of this email.",
  signoff: "Best regards,\nYour Stationery Shop"
};

/**
 * Generate email subject from template
 */
export const generateEmailSubject = (
  template: QuoteTemplate, 
  productName: string
): string => {
  return template.subject.replace(/{product}/g, productName);
};

/**
 * Generate formatted email body for quotation
 */
export const generateQuoteEmailBody = (
  template: QuoteTemplate,
  parsedInfo: ParsedEmailInfo,
  pricePerUnit: number,
  totalPrice: number
): string => {
  // Format the price values with 2 decimal places
  const formattedPricePerUnit = pricePerUnit.toFixed(2);
  const formattedTotalPrice = totalPrice.toFixed(2);
  
  // Replace placeholders in template
  let emailBody = template.greeting.replace(/{customer}/g, parsedInfo.customerName || "Customer");
  emailBody += "\n\n";
  
  emailBody += template.body
    .replace(/{product}/g, parsedInfo.product || "")
    .replace(/{quantity}/g, parsedInfo.quantity?.toString() || "")
    .replace(/{price_per_unit}/g, formattedPricePerUnit)
    .replace(/{total_amount}/g, formattedTotalPrice);
  
  emailBody += "\n\n";
  emailBody += template.signoff;
  
  return emailBody;
};

/**
 * Format a price number with the Indian Rupee symbol
 */
export const formatIndianRupee = (amount: number): string => {
  return `₹${amount.toFixed(2)}`;
};

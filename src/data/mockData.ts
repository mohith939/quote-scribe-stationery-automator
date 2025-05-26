import { Product, QuoteLog, EmailMessage } from "@/types";

// Mock product catalog data
export const mockProducts: Product[] = [
  {
    id: "1",
    name: "A4 Paper - 80gsm",
    minQuantity: 1,
    maxQuantity: 499,
    pricePerUnit: 0.45,
    category: "Paper Products",
  },
  {
    id: "2",
    name: "A4 Paper - 80gsm",
    minQuantity: 500,
    maxQuantity: 999,
    pricePerUnit: 0.40,
    category: "Paper Products",
  },
  {
    id: "3",
    name: "A4 Paper - 80gsm",
    minQuantity: 1000,
    maxQuantity: 4999,
    pricePerUnit: 0.35,
    category: "Paper Products",
  },
  {
    id: "4",
    name: "A4 Paper - 80gsm",
    minQuantity: 5000,
    maxQuantity: 10000,
    pricePerUnit: 0.30,
    category: "Paper Products",
  },
  {
    id: "5",
    name: "Ballpoint Pens - Blue",
    minQuantity: 1,
    maxQuantity: 99,
    pricePerUnit: 1.20,
    category: "Writing Instruments",
  },
  {
    id: "6",
    name: "Ballpoint Pens - Blue",
    minQuantity: 100,
    maxQuantity: 499,
    pricePerUnit: 1.00,
    category: "Writing Instruments",
  },
  {
    id: "7",
    name: "Ballpoint Pens - Blue",
    minQuantity: 500,
    maxQuantity: 1000,
    pricePerUnit: 0.85,
    category: "Writing Instruments",
  },
  {
    id: "8",
    name: "Stapler - Medium",
    minQuantity: 1,
    maxQuantity: 49,
    pricePerUnit: 8.50,
    category: "Office Supplies",
  },
  {
    id: "9",
    name: "Stapler - Medium",
    minQuantity: 50,
    maxQuantity: 200,
    pricePerUnit: 7.25,
    category: "Office Supplies",
  },
];

// Mock quote log data
export const mockQuoteLogs: QuoteLog[] = [
  {
    id: "1",
    timestamp: "2025-04-25T10:30:00Z",
    customerName: "John Doe",
    emailAddress: "john.doe@example.com",
    originalMessage: "I need a quote for 2000 sheets of A4 paper. Thanks!",
    extractedDetails: {
      product: "A4 Paper - 80gsm",
      quantity: 2000,
    },
    totalQuotedAmount: 700.00, // 2000 * 0.35
    status: "Sent",
  },
  {
    id: "2",
    timestamp: "2025-04-24T14:45:00Z",
    customerName: "Jane Smith",
    emailAddress: "jane.smith@example.com",
    originalMessage: "Hello, I'm interested in purchasing 75 staplers for our office. Could you please provide a quote?",
    extractedDetails: {
      product: "Stapler - Medium",
      quantity: 75,
    },
    totalQuotedAmount: 543.75, // 75 * 7.25
    status: "Sent",
  },
  {
    id: "3",
    timestamp: "2025-04-23T09:15:00Z",
    customerName: "Company Inc.",
    emailAddress: "orders@company.com",
    originalMessage: "We need 300 blue pens. What's your best price?",
    extractedDetails: {
      product: "Ballpoint Pens - Blue",
      quantity: 300,
    },
    totalQuotedAmount: 300.00, // 300 * 1.00
    status: "Sent",
  },
  {
    id: "4",
    timestamp: "2025-04-22T16:20:00Z",
    customerName: "Mary Johnson",
    emailAddress: "mary@johnson.net",
    originalMessage: "I want to order paper clips and highlighters. Please quote.",
    extractedDetails: {
      product: "",
      quantity: 0,
    },
    totalQuotedAmount: 0,
    status: "Failed",
  },
  {
    id: "5",
    timestamp: "2025-04-21T11:05:00Z",
    customerName: "Robert Brown",
    emailAddress: "robert@example.org",
    originalMessage: "Need quote for 600 A4 papers and 50 blue pens.",
    extractedDetails: {
      product: "Multiple",
      quantity: 0,
    },
    totalQuotedAmount: 290.00, // Manual calculation
    status: "Manual",
  },
];

// Mock unread email messages
export const mockEmails: EmailMessage[] = [
  {
    id: "e1",
    from: "new.customer@example.com",
    subject: "Quotation for Stationery",
    body: "Hello, I would like to get a quotation for 3000 sheets of A4 paper for our office. Looking forward to your response. Thanks, New Customer",
    date: "2025-04-29T08:45:00Z",
  },
  {
    id: "e2",
    from: "office.supplies@company.org",
    subject: "Bulk Order Inquiry",
    body: "We are looking to place a bulk order of 150 blue ballpoint pens for our company. Could you please provide us with your best price? Regards, Office Manager",
    date: "2025-04-29T10:15:00Z",
  },
  {
    id: "e3",
    from: "personal@gmail.com",
    subject: "Price Check",
    body: "Hi there, I'm wondering how much 25 staplers would cost? I need them for a small business. Thanks!",
    date: "2025-04-29T11:30:00Z",
  }
];

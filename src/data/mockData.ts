
import { Product, QuoteLog, EmailMessage } from "@/types";

// Mock product catalog data
export const mockProducts: Product[] = [
  {
    id: "1",
    user_id: "system",
    name: "A4 Paper - 80gsm",
    product_code: "A4-PAPER-80",
    brand: "Generic",
    unit_price: 0.45,
    gst_rate: 18,
    min_quantity: 1,
    max_quantity: 499,
    category: "Paper Products",
  },
  {
    id: "2",
    user_id: "system",
    name: "A4 Paper - 80gsm",
    product_code: "A4-PAPER-80",
    brand: "Generic",
    unit_price: 0.40,
    gst_rate: 18,
    min_quantity: 500,
    max_quantity: 999,
    category: "Paper Products",
  },
  {
    id: "3",
    user_id: "system",
    name: "A4 Paper - 80gsm",
    product_code: "A4-PAPER-80",
    brand: "Generic",
    unit_price: 0.35,
    gst_rate: 18,
    min_quantity: 1000,
    max_quantity: 4999,
    category: "Paper Products",
  },
  {
    id: "4",
    user_id: "system",
    name: "A4 Paper - 80gsm",
    product_code: "A4-PAPER-80",
    brand: "Generic",
    unit_price: 0.30,
    gst_rate: 18,
    min_quantity: 5000,
    max_quantity: 10000,
    category: "Paper Products",
  },
  {
    id: "5",
    user_id: "system",
    name: "Ballpoint Pens - Blue",
    product_code: "PEN-BLUE",
    brand: "Generic",
    unit_price: 1.20,
    gst_rate: 18,
    min_quantity: 1,
    max_quantity: 99,
    category: "Writing Instruments",
  },
  {
    id: "6",
    user_id: "system",
    name: "Ballpoint Pens - Blue",
    product_code: "PEN-BLUE",
    brand: "Generic",
    unit_price: 1.00,
    gst_rate: 18,
    min_quantity: 100,
    max_quantity: 499,
    category: "Writing Instruments",
  },
  {
    id: "7",
    user_id: "system",
    name: "Ballpoint Pens - Blue",
    product_code: "PEN-BLUE",
    brand: "Generic",
    unit_price: 0.85,
    gst_rate: 18,
    min_quantity: 500,
    max_quantity: 1000,
    category: "Writing Instruments",
  },
  {
    id: "8",
    user_id: "system",
    name: "Stapler - Medium",
    product_code: "STAPLER-MED",
    brand: "Generic",
    unit_price: 8.50,
    gst_rate: 18,
    min_quantity: 1,
    max_quantity: 49,
    category: "Office Supplies",
  },
  {
    id: "9",
    user_id: "system",
    name: "Stapler - Medium",
    product_code: "STAPLER-MED",
    brand: "Generic",
    unit_price: 7.25,
    gst_rate: 18,
    min_quantity: 50,
    max_quantity: 200,
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
    product: "A4 Paper - 80gsm",
    quantity: 2000,
    pricePerUnit: 0.35,
    totalAmount: 700.00,
    totalQuotedAmount: 700.00,
    status: "Sent",
    extractedDetails: {
      products: [
        {
          product: "A4 Paper - 80gsm",
          quantity: 2000,
        }
      ],
      product: "A4 Paper - 80gsm",
      quantity: 2000,
    },
  },
  {
    id: "2",
    timestamp: "2025-04-24T14:45:00Z",
    customerName: "Jane Smith",
    emailAddress: "jane.smith@example.com",
    product: "Stapler - Medium",
    quantity: 75,
    pricePerUnit: 7.25,
    totalAmount: 543.75,
    totalQuotedAmount: 543.75,
    status: "Sent",
    extractedDetails: {
      products: [
        {
          product: "Stapler - Medium",
          quantity: 75,
        }
      ],
      product: "Stapler - Medium",
      quantity: 75,
    },
  },
  {
    id: "3",
    timestamp: "2025-04-23T09:15:00Z",
    customerName: "Company Inc.",
    emailAddress: "orders@company.com",
    product: "Ballpoint Pens - Blue",
    quantity: 300,
    pricePerUnit: 1.00,
    totalAmount: 300.00,
    totalQuotedAmount: 300.00,
    status: "Sent",
    extractedDetails: {
      products: [
        {
          product: "Ballpoint Pens - Blue",
          quantity: 300,
        }
      ],
      product: "Ballpoint Pens - Blue",
      quantity: 300,
    },
  },
  {
    id: "4",
    timestamp: "2025-04-22T16:20:00Z",
    customerName: "Mary Johnson",
    emailAddress: "mary@johnson.net",
    product: "",
    quantity: 0,
    pricePerUnit: 0,
    totalAmount: 0,
    totalQuotedAmount: 0,
    status: "Failed",
    extractedDetails: {
      products: [],
      product: "",
      quantity: 0,
    },
  },
  {
    id: "5",
    timestamp: "2025-04-21T11:05:00Z",
    customerName: "Robert Brown",
    emailAddress: "robert@example.org",
    product: "Multiple",
    quantity: 0,
    pricePerUnit: 0,
    totalAmount: 290.00,
    totalQuotedAmount: 290.00,
    status: "Sent",
    extractedDetails: {
      products: [
        {
          product: "A4 Paper - 80gsm",
          quantity: 600,
        },
        {
          product: "Ballpoint Pens - Blue",
          quantity: 50,
        }
      ],
      product: "Multiple",
      quantity: 0,
    },
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


import { Product, QuoteLog, GoogleSheetsConfig, ImportResult } from "@/types";

// The URL of our deployed Google Apps Script web app for Sheets operations
// This would be replaced with the actual deployed script URL
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/your-script-id/exec";

// Local storage key for Google Sheets config
const SHEETS_CONFIG_KEY = 'googleSheetsConfig';

// Get stored Google Sheets config
export const getGoogleSheetsConfig = (): GoogleSheetsConfig => {
  const storedConfig = localStorage.getItem(SHEETS_CONFIG_KEY);
  if (storedConfig) {
    return JSON.parse(storedConfig);
  }
  
  // Return default config if not stored
  return {
    isConnected: false,
    spreadsheetId: null,
    quotesSheetName: "Quotes",
    productsSheetName: "Products"
  };
};

// Save Google Sheets config
export const saveGoogleSheetsConfig = (config: GoogleSheetsConfig): void => {
  localStorage.setItem(SHEETS_CONFIG_KEY, JSON.stringify(config));
};

// Fetch products from Google Sheets
export const fetchProductsFromSheets = async (): Promise<Product[]> => {
  try {
    const config = getGoogleSheetsConfig();
    
    if (!config.isConnected || !config.spreadsheetId) {
      throw new Error("Google Sheets is not connected");
    }
    
    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=fetchProducts&spreadsheetId=${config.spreadsheetId}&sheetName=${config.productsSheetName}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch products");
    }
    
    return data.products.map((product: any) => ({
      id: product.id || String(Math.random()),
      name: product.name,
      minQuantity: Number(product.minQuantity),
      maxQuantity: Number(product.maxQuantity),
      pricePerUnit: Number(product.pricePerUnit)
    }));
  } catch (error) {
    console.error("Error fetching products from Google Sheets:", error);
    
    // For demo/development, return empty array
    return [];
  }
};

// Save products to Google Sheets
export const saveProductsToSheets = async (products: Product[]): Promise<boolean> => {
  try {
    const config = getGoogleSheetsConfig();
    
    if (!config.isConnected || !config.spreadsheetId) {
      throw new Error("Google Sheets is not connected");
    }
    
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'saveProducts',
        spreadsheetId: config.spreadsheetId,
        sheetName: config.productsSheetName,
        products
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save products: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error saving products to Google Sheets:", error);
    return false;
  }
};

// Fetch quote logs from Google Sheets
export const fetchQuoteLogsFromSheets = async (): Promise<QuoteLog[]> => {
  try {
    const config = getGoogleSheetsConfig();
    
    if (!config.isConnected || !config.spreadsheetId) {
      throw new Error("Google Sheets is not connected");
    }
    
    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=fetchQuotes&spreadsheetId=${config.spreadsheetId}&sheetName=${config.quotesSheetName}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch quotes: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch quotes");
    }
    
    return data.quotes.map((quote: any) => ({
      id: quote.id || String(Math.random()),
      timestamp: quote.timestamp,
      customerName: quote.customerName,
      emailAddress: quote.emailAddress,
      originalMessage: quote.originalMessage,
      extractedDetails: {
        product: quote.product,
        quantity: Number(quote.quantity)
      },
      totalQuotedAmount: Number(quote.totalAmount),
      status: quote.status
    }));
  } catch (error) {
    console.error("Error fetching quotes from Google Sheets:", error);
    
    // For demo/development, return empty array
    return [];
  }
};

// Import products from a CSV or Excel file format
export const importProductsFromFile = async (file: File): Promise<ImportResult> => {
  try {
    // For simplicity, we'll parse CSV directly in the browser
    // In a real app, you might want to use a library like PapaParse or xlsx
    
    // Read the file
    const text = await file.text();
    
    // Simple CSV parsing (assumes comma-separated values)
    const rows = text.split('\n');
    const headers = rows[0].split(',');
    
    // Check if required headers exist
    const requiredHeaders = ['name', 'minQuantity', 'maxQuantity', 'pricePerUnit'];
    const missingHeaders = requiredHeaders.filter(h => !headers.map(h => h.trim().toLowerCase()).includes(h.toLowerCase()));
    
    if (missingHeaders.length > 0) {
      return {
        success: false,
        message: `Missing required headers: ${missingHeaders.join(', ')}`,
        productsAdded: 0
      };
    }
    
    // Map indices
    const nameIndex = headers.findIndex(h => h.trim().toLowerCase() === 'name');
    const minQtyIndex = headers.findIndex(h => h.trim().toLowerCase() === 'minquantity');
    const maxQtyIndex = headers.findIndex(h => h.trim().toLowerCase() === 'maxquantity');
    const priceIndex = headers.findIndex(h => h.trim().toLowerCase() === 'priceperunit');
    
    // Parse rows
    const products: Product[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row.trim()) continue; // Skip empty rows
      
      const values = row.split(',');
      
      // Create product object
      const product: Product = {
        id: String(Math.random()),
        name: values[nameIndex].trim(),
        minQuantity: Number(values[minQtyIndex]),
        maxQuantity: Number(values[maxQtyIndex]),
        pricePerUnit: Number(values[priceIndex])
      };
      
      // Validate product
      if (!product.name || isNaN(product.minQuantity) || isNaN(product.maxQuantity) || isNaN(product.pricePerUnit)) {
        continue;
      }
      
      products.push(product);
    }
    
    // Save products to Google Sheets
    if (products.length > 0) {
      const saved = await saveProductsToSheets(products);
      
      if (saved) {
        return {
          success: true,
          message: `Successfully imported ${products.length} products`,
          productsAdded: products.length
        };
      } else {
        return {
          success: false,
          message: "Failed to save products to Google Sheets",
          productsAdded: 0
        };
      }
    } else {
      return {
        success: false,
        message: "No valid products found in the file",
        productsAdded: 0
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error importing products: ${error instanceof Error ? error.message : 'Unknown error'}`,
      productsAdded: 0
    };
  }
};

// This function will be used to get a template of the expected CSV format
export const getProductImportTemplate = (): string => {
  return `name,minQuantity,maxQuantity,pricePerUnit
A4 Paper,1,99,120
A4 Paper,100,499,100
A4 Paper,500,999,90
A4 Paper,1000,9999,80`;
};

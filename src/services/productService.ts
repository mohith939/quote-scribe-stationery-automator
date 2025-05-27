
import { Product } from "@/types";

/**
 * Service for handling product catalog operations with Google Sheets integration
 */

// Mock products based on your format
const mockProductData: Product[] = [
  {
    id: "1",
    brand: "",
    name: "ZTA-500N- Digital Force Gauge",
    productCode: "ZTA-500N",
    unitPrice: 83200.00,
    gstRate: 18.00,
    minQuantity: 1,
    maxQuantity: 999,
    category: "Testing Equipment"
  },
  {
    id: "2", 
    brand: "Other",
    name: "zero plate Non-Ferrous",
    productCode: "zero plate Non-Ferrous",
    unitPrice: 1800.00,
    gstRate: 18.00,
    minQuantity: 1,
    maxQuantity: 999,
    category: "Calibration Tools"
  },
  {
    id: "3",
    brand: "Jafuji",
    name: "Zero plate Non furrous",
    productCode: "Zero plate Non furrous", 
    unitPrice: 650.00,
    gstRate: 18.00,
    minQuantity: 1,
    maxQuantity: 999,
    category: "Calibration Tools"
  },
  {
    id: "4",
    brand: "Jafuji",
    name: "Zero Plate furrous",
    productCode: "Zero Plate furrous",
    unitPrice: 650.00,
    gstRate: 18.00,
    minQuantity: 1,
    maxQuantity: 999,
    category: "Calibration Tools"
  }
];

/**
 * Fetch products from Google Sheets
 */
export const fetchProductsFromSheets = async (sheetId?: string): Promise<Product[]> => {
  try {
    // This would integrate with Google Sheets API
    // For now, return mock data
    console.log("Fetching products from Google Sheets...");
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockProductData;
  } catch (error) {
    console.error("Error fetching products from sheets:", error);
    throw error;
  }
};

/**
 * Search products with fuzzy matching for better accuracy
 */
export const searchProducts = (
  products: Product[], 
  searchTerm: string,
  limit = 10
): Product[] => {
  if (!searchTerm.trim()) return products.slice(0, limit);
  
  const term = searchTerm.toLowerCase();
  
  // Exact matches first
  const exactMatches = products.filter(p => 
    p.name.toLowerCase().includes(term) ||
    p.productCode.toLowerCase().includes(term) ||
    p.brand.toLowerCase().includes(term)
  );
  
  // Fuzzy matches for partial words
  const fuzzyMatches = products.filter(p => {
    const words = term.split(' ');
    return words.some(word => 
      p.name.toLowerCase().includes(word) ||
      p.productCode.toLowerCase().includes(word) ||
      p.brand.toLowerCase().includes(word)
    );
  }).filter(p => !exactMatches.includes(p));
  
  return [...exactMatches, ...fuzzyMatches].slice(0, limit);
};

/**
 * Calculate price with GST
 */
export const calculatePriceWithGST = (
  unitPrice: number, 
  quantity: number, 
  gstRate: number
): { basePrice: number; gstAmount: number; totalPrice: number } => {
  const basePrice = unitPrice * quantity;
  const gstAmount = (basePrice * gstRate) / 100;
  const totalPrice = basePrice + gstAmount;
  
  return {
    basePrice: Math.round(basePrice * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100
  };
};

/**
 * Add new product to catalog
 */
export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  try {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString()
    };
    
    // This would add to Google Sheets
    console.log("Adding product to Google Sheets:", newProduct);
    
    return newProduct;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

/**
 * Update existing product
 */
export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<Product> => {
  try {
    // This would update in Google Sheets
    console.log("Updating product in Google Sheets:", productId, updates);
    
    // Return updated product
    return { ...updates, id: productId } as Product;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

/**
 * Delete product from catalog
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    // This would delete from Google Sheets
    console.log("Deleting product from Google Sheets:", productId);
    
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    return false;
  }
};

/**
 * Import products from CSV/Excel
 */
export const importProductsFromFile = async (file: File): Promise<{
  success: boolean;
  importedCount: number;
  errors: string[];
}> => {
  try {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error("File must contain header and at least one data row");
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['Brand', 'Product Description', 'Product Code', 'Unit Price', 'GST Rate'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }
    
    const products: Product[] = [];
    const errors: string[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const product: Product = {
          id: Date.now().toString() + i,
          brand: values[headers.indexOf('Brand')] || '',
          name: values[headers.indexOf('Product Description')],
          productCode: values[headers.indexOf('Product Code')],
          unitPrice: parseFloat(values[headers.indexOf('Unit Price')]),
          gstRate: parseFloat(values[headers.indexOf('GST Rate')]),
          minQuantity: 1,
          maxQuantity: 999
        };
        
        if (!product.name || !product.productCode || isNaN(product.unitPrice)) {
          errors.push(`Row ${i + 1}: Missing required data`);
          continue;
        }
        
        products.push(product);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
      }
    }
    
    // This would batch upload to Google Sheets
    console.log(`Importing ${products.length} products to Google Sheets`);
    
    return {
      success: true,
      importedCount: products.length,
      errors
    };
  } catch (error) {
    console.error("Error importing products:", error);
    return {
      success: false,
      importedCount: 0,
      errors: [error instanceof Error ? error.message : 'Import failed']
    };
  }
};

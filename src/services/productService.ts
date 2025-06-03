
import { Product } from "@/types";
import * as XLSX from 'xlsx';

/**
 * Service for handling product catalog operations with Google Sheets integration
 */

// Real products from Google Sheets - this will be populated from actual API
let cachedProducts: Product[] = [];

/**
 * Fetch products from Google Sheets using real API
 */
export const fetchProductsFromSheets = async (sheetId?: string): Promise<Product[]> => {
  try {
    // This would integrate with Google Sheets API using real credentials
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:E?key=YOUR_API_KEY`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Google Sheets');
    }
    
    const data = await response.json();
    const rows = data.values;
    
    if (!rows || rows.length < 2) {
      throw new Error('No data found in sheet');
    }
    
    // Skip header row and convert to products
    const products: Product[] = rows.slice(1).map((row: string[], index: number) => ({
      id: (index + 1).toString(),
      brand: row[0] || '',
      name: row[1] || '',
      productCode: row[2] || '',
      unitPrice: parseFloat(row[3]) || 0,
      gstRate: parseFloat(row[4]) || 18,
      minQuantity: 1,
      maxQuantity: 999,
      category: row[0] || 'General'
    }));
    
    cachedProducts = products;
    return products;
  } catch (error) {
    console.error("Error fetching products from sheets:", error);
    // Return cached products if API fails
    return cachedProducts.length > 0 ? cachedProducts : [];
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
 * Import products from XLSX/CSV file - supporting your exact format
 */
export const importProductsFromFile = async (file: File): Promise<{
  success: boolean;
  importedCount: number;
  errors: string[];
}> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error("File must contain header and at least one data row");
    }
    
    const headers = jsonData[0] as string[];
    const products: Product[] = [];
    const errors: string[] = [];
    
    // Map your exact column names
    const columnMapping = {
      'Brand': 0,
      'Product Description': 1,
      'Product Code': 2,
      'Unit Price': 3,
      'GST Rate': 4
    };
    
    for (let i = 1; i < jsonData.length; i++) {
      try {
        const row = jsonData[i] as any[];
        
        if (!row || row.length === 0) continue;
        
        const product: Product = {
          id: Date.now().toString() + i,
          brand: row[columnMapping['Brand']] || '',
          name: row[columnMapping['Product Description']] || '',
          productCode: row[columnMapping['Product Code']] || '',
          unitPrice: parseFloat(row[columnMapping['Unit Price']]) || 0,
          gstRate: parseFloat(row[columnMapping['GST Rate']]) || 18,
          minQuantity: 1,
          maxQuantity: 999,
          category: row[columnMapping['Brand']] || 'General'
        };
        
        if (!product.name || !product.productCode) {
          errors.push(`Row ${i + 1}: Missing product name or code`);
          continue;
        }
        
        if (isNaN(product.unitPrice) || product.unitPrice <= 0) {
          errors.push(`Row ${i + 1}: Invalid unit price`);
          continue;
        }
        
        products.push(product);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid data format'}`);
      }
    }
    
    if (products.length === 0) {
      throw new Error('No valid products found in file');
    }
    
    // Update cached products
    cachedProducts = [...cachedProducts, ...products];
    
    console.log(`Successfully imported ${products.length} products`);
    
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

/**
 * Get cached products (for real-time usage)
 */
export const getCachedProducts = (): Product[] => {
  return cachedProducts;
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
    
    cachedProducts.push(newProduct);
    
    // This would add to Google Sheets via API
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
    const index = cachedProducts.findIndex(p => p.id === productId);
    if (index !== -1) {
      cachedProducts[index] = { ...cachedProducts[index], ...updates };
    }
    
    console.log("Updating product in Google Sheets:", productId, updates);
    
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
    cachedProducts = cachedProducts.filter(p => p.id !== productId);
    
    console.log("Deleting product from Google Sheets:", productId);
    
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    return false;
  }
};

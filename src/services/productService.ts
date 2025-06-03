
import { Product } from "@/types";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";

/**
 * Service for handling product catalog operations with Supabase integration
 */

// Cache for products
let cachedProducts: Product[] = [];

/**
 * Fetch products from Supabase database
 */
export const fetchProductsFromDatabase = async (): Promise<Product[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    const products: Product[] = (data || []).map(item => ({
      id: item.id,
      brand: item.brand || '',
      name: item.name,
      productCode: item.product_code,
      unitPrice: parseFloat(item.unit_price.toString()),
      gstRate: parseFloat(item.gst_rate.toString()),
      minQuantity: item.min_quantity || 1,
      maxQuantity: item.max_quantity || 999,
      category: item.category || 'General'
    }));

    cachedProducts = products;
    return products;
  } catch (error) {
    console.error("Error fetching products from database:", error);
    return cachedProducts;
  }
};

/**
 * Search products with fuzzy matching
 */
export const searchProducts = (
  products: Product[], 
  searchTerm: string,
  limit = 10
): Product[] => {
  if (!searchTerm.trim()) return products.slice(0, limit);
  
  const term = searchTerm.toLowerCase();
  
  const exactMatches = products.filter(p => 
    p.name.toLowerCase().includes(term) ||
    p.productCode.toLowerCase().includes(term) ||
    p.brand.toLowerCase().includes(term)
  );
  
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
 * Import products from XLSX/CSV file with batch processing for large datasets
 */
export const importProductsFromFile = async (file: File): Promise<{
  success: boolean;
  importedCount: number;
  errors: string[];
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error("File must contain header and at least one data row");
    }
    
    const headers = jsonData[0] as string[];
    const products: any[] = [];
    const errors: string[] = [];
    
    // Column mapping
    const columnMapping = {
      'Brand': 0,
      'Product Description': 1,
      'Product Code': 2,
      'Unit Price': 3,
      'GST Rate': 4
    };
    
    // Process all rows
    for (let i = 1; i < jsonData.length; i++) {
      try {
        const row = jsonData[i] as any[];
        
        if (!row || row.length === 0) continue;
        
        const product = {
          user_id: user.id,
          brand: row[columnMapping['Brand']] || '',
          name: row[columnMapping['Product Description']] || '',
          product_code: row[columnMapping['Product Code']] || '',
          unit_price: parseFloat(row[columnMapping['Unit Price']]) || 0,
          gst_rate: parseFloat(row[columnMapping['GST Rate']]) || 18,
          min_quantity: 1,
          max_quantity: 999,
          category: row[columnMapping['Brand']] || 'General'
        };
        
        if (!product.name || !product.product_code) {
          errors.push(`Row ${i + 1}: Missing product name or code`);
          continue;
        }
        
        if (isNaN(product.unit_price) || product.unit_price <= 0) {
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
    
    // Insert products in batches of 1000 to handle large datasets
    const batchSize = 1000;
    let totalInserted = 0;
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('user_products')
          .insert(batch)
          .select('id');
        
        if (error) {
          console.error(`Batch ${Math.floor(i/batchSize) + 1} error:`, error);
          errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
        } else {
          totalInserted += data?.length || 0;
          console.log(`Batch ${Math.floor(i/batchSize) + 1} inserted: ${data?.length || 0} products`);
        }
      } catch (batchError) {
        console.error(`Batch ${Math.floor(i/batchSize) + 1} failed:`, batchError);
        errors.push(`Batch ${Math.floor(i/batchSize) + 1}: Failed to insert`);
      }
    }
    
    console.log(`Total products processed: ${products.length}, Total inserted: ${totalInserted}`);
    
    // Refresh cached products
    await fetchProductsFromDatabase();
    
    return {
      success: totalInserted > 0,
      importedCount: totalInserted,
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
 * Get cached products
 */
export const getCachedProducts = (): Product[] => {
  return cachedProducts;
};

/**
 * Add new product to database
 */
export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_products')
      .insert([{
        user_id: user.id,
        brand: product.brand,
        name: product.name,
        product_code: product.productCode,
        unit_price: product.unitPrice,
        gst_rate: product.gstRate,
        min_quantity: product.minQuantity,
        max_quantity: product.maxQuantity,
        category: product.category
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const newProduct: Product = {
      id: data.id,
      brand: data.brand || '',
      name: data.name,
      productCode: data.product_code,
      unitPrice: parseFloat(data.unit_price.toString()),
      gstRate: parseFloat(data.gst_rate.toString()),
      minQuantity: data.min_quantity || 1,
      maxQuantity: data.max_quantity || 999,
      category: data.category || 'General'
    };
    
    cachedProducts.push(newProduct);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const updateData: any = {};
    if (updates.brand !== undefined) updateData.brand = updates.brand;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.productCode !== undefined) updateData.product_code = updates.productCode;
    if (updates.unitPrice !== undefined) updateData.unit_price = updates.unitPrice;
    if (updates.gstRate !== undefined) updateData.gst_rate = updates.gstRate;
    if (updates.minQuantity !== undefined) updateData.min_quantity = updates.minQuantity;
    if (updates.maxQuantity !== undefined) updateData.max_quantity = updates.maxQuantity;
    if (updates.category !== undefined) updateData.category = updates.category;

    const { data, error } = await supabase
      .from('user_products')
      .update(updateData)
      .eq('id', productId)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    const updatedProduct: Product = {
      id: data.id,
      brand: data.brand || '',
      name: data.name,
      productCode: data.product_code,
      unitPrice: parseFloat(data.unit_price.toString()),
      gstRate: parseFloat(data.gst_rate.toString()),
      minQuantity: data.min_quantity || 1,
      maxQuantity: data.max_quantity || 999,
      category: data.category || 'General'
    };
    
    // Update cached products
    const index = cachedProducts.findIndex(p => p.id === productId);
    if (index !== -1) {
      cachedProducts[index] = updatedProduct;
    }
    
    return updatedProduct;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

/**
 * Delete product from database
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('user_products')
      .delete()
      .eq('id', productId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    // Update cached products
    cachedProducts = cachedProducts.filter(p => p.id !== productId);
    
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    return false;
  }
};

/**
 * Delete all products for the current user
 */
export const deleteAllProducts = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('user_products')
      .delete()
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    // Clear cached products
    cachedProducts = [];
    
    return true;
  } catch (error) {
    console.error("Error deleting all products:", error);
    return false;
  }
};

// Legacy functions for backward compatibility
export const fetchProductsFromSheets = fetchProductsFromDatabase;


import { Product } from "@/types";
import { mockProducts } from "@/data/mockData";

/**
 * Find a product by name from the product catalog
 */
export const findProductByName = (productName: string, products = mockProducts): Product | undefined => {
  return products.find(p => p.name === productName);
};

/**
 * Calculate price based on product and quantity
 * Returns undefined if no valid price could be determined
 */
export const calculatePrice = (
  productName: string, 
  quantity: number,
  products = mockProducts
): { pricePerUnit: number, totalPrice: number } | undefined => {
  const product = products.find(p => 
    p.name === productName && 
    (!p.min_quantity || quantity >= p.min_quantity) && 
    (!p.max_quantity || quantity <= p.max_quantity)
  );
  
  if (!product) {
    return undefined;
  }
  
  const pricePerUnit = product.unit_price;
  
  return {
    pricePerUnit: pricePerUnit,
    totalPrice: pricePerUnit * quantity
  };
};

/**
 * Gets available quantity ranges for a specific product
 */
export const getProductQuantityRanges = (productName: string, products = mockProducts): { min: number, max: number }[] => {
  return products
    .filter(p => p.name === productName)
    .map(p => ({ min: p.min_quantity || 1, max: p.max_quantity || 999999 }))
    .sort((a, b) => a.min - b.min);
};

/**
 * Gets unique product names from product catalog
 */
export const getUniqueProductNames = (products = mockProducts): string[] => {
  return [...new Set(products.map(p => p.name))];
};

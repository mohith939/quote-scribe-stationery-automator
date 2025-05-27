
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
    (!p.minQuantity || quantity >= p.minQuantity) && 
    (!p.maxQuantity || quantity <= p.maxQuantity)
  );
  
  if (!product) {
    return undefined;
  }
  
  const pricePerUnit = product.pricePerUnit || product.unitPrice;
  
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
    .map(p => ({ min: p.minQuantity || 1, max: p.maxQuantity || 999999 }))
    .sort((a, b) => a.min - b.min);
};

/**
 * Gets unique product names from product catalog
 */
export const getUniqueProductNames = (products = mockProducts): string[] => {
  return [...new Set(products.map(p => p.name))];
};

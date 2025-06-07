
import { Product } from "@/types";

export interface ProductMatch {
  product: Product;
  confidence: number;
  matchType: 'exact_code' | 'exact_name' | 'fuzzy_name' | 'brand_match' | 'partial_match';
  matchedTerms: string[];
  score: number;
}

export class SmartProductMatcher {
  private products: Product[];
  private productIndex: Map<string, Product[]>;
  
  constructor(products: Product[]) {
    this.products = products;
    this.productIndex = this.buildProductIndex();
  }

  // Build an index for faster searching
  private buildProductIndex(): Map<string, Product[]> {
    const index = new Map<string, Product[]>();
    
    this.products.forEach(product => {
      // Index by product code
      const code = product.product_code.toLowerCase();
      if (!index.has(code)) index.set(code, []);
      index.get(code)!.push(product);
      
      // Index by name words
      const nameWords = product.name.toLowerCase().split(/[\s\-_,\.]/);
      nameWords.forEach(word => {
        if (word.length > 2) {
          if (!index.has(word)) index.set(word, []);
          index.get(word)!.push(product);
        }
      });
      
      // Index by brand
      if (product.brand) {
        const brand = product.brand.toLowerCase();
        if (!index.has(brand)) index.set(brand, []);
        index.get(brand)!.push(product);
      }
    });
    
    return index;
  }

  // Advanced product matching
  findMatches(searchText: string, maxResults: number = 10): ProductMatch[] {
    const lowerText = searchText.toLowerCase();
    const matches = new Map<string, ProductMatch>();
    
    // 1. Exact product code matches (highest priority)
    this.findExactCodeMatches(lowerText, matches);
    
    // 2. Exact name matches
    this.findExactNameMatches(lowerText, matches);
    
    // 3. Fuzzy name matches
    this.findFuzzyMatches(lowerText, matches);
    
    // 4. Brand and partial matches
    this.findBrandAndPartialMatches(lowerText, matches);
    
    // 5. Context-aware matching
    this.findContextualMatches(lowerText, matches);
    
    // Sort and return top matches
    return Array.from(matches.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  private findExactCodeMatches(text: string, matches: Map<string, ProductMatch>): void {
    this.products.forEach(product => {
      const code = product.product_code.toLowerCase();
      if (text.includes(code)) {
        const key = product.product_code;
        if (!matches.has(key) || matches.get(key)!.score < 100) {
          matches.set(key, {
            product,
            confidence: 0.95,
            matchType: 'exact_code',
            matchedTerms: [product.product_code],
            score: 100
          });
        }
      }
    });
  }

  private findExactNameMatches(text: string, matches: Map<string, ProductMatch>): void {
    this.products.forEach(product => {
      const name = product.name.toLowerCase();
      if (text.includes(name)) {
        const key = product.product_code;
        if (!matches.has(key) || matches.get(key)!.score < 90) {
          matches.set(key, {
            product,
            confidence: 0.9,
            matchType: 'exact_name',
            matchedTerms: [product.name],
            score: 90
          });
        }
      }
    });
  }

  private findFuzzyMatches(text: string, matches: Map<string, ProductMatch>): void {
    this.products.forEach(product => {
      const similarity = this.calculateTextSimilarity(text, product.name.toLowerCase());
      if (similarity > 0.7) {
        const key = product.product_code;
        const score = Math.round(similarity * 80);
        
        if (!matches.has(key) || matches.get(key)!.score < score) {
          matches.set(key, {
            product,
            confidence: similarity * 0.8,
            matchType: 'fuzzy_name',
            matchedTerms: ['fuzzy_match'],
            score
          });
        }
      }
    });
  }

  private findBrandAndPartialMatches(text: string, matches: Map<string, ProductMatch>): void {
    const words = text.split(/[\s\-_,\.]+/);
    
    words.forEach(word => {
      if (word.length > 2) {
        const candidates = this.productIndex.get(word.toLowerCase()) || [];
        
        candidates.forEach(product => {
          const key = product.product_code;
          
          // Calculate match score based on word importance
          let score = this.calculateWordImportance(word, product) * 20;
          
          // Boost for brand matches
          if (product.brand && product.brand.toLowerCase() === word.toLowerCase()) {
            score += 30;
          }
          
          if (!matches.has(key) || matches.get(key)!.score < score) {
            const matchType = product.brand && product.brand.toLowerCase() === word.toLowerCase() 
              ? 'brand_match' as const 
              : 'partial_match' as const;
              
            matches.set(key, {
              product,
              confidence: Math.min(0.8, score / 100),
              matchType,
              matchedTerms: [word],
              score: Math.round(score)
            });
          }
        });
      }
    });
  }

  private findContextualMatches(text: string, matches: Map<string, ProductMatch>): void {
    // Look for product categories and common terms
    const categoryKeywords = {
      'paper': ['a4', 'a3', 'sheet', 'ream', 'printing'],
      'stationery': ['pen', 'pencil', 'eraser', 'notebook'],
      'office': ['supplies', 'equipment', 'furniture']
    };
    
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      const hasKeywords = keywords.some(keyword => text.includes(keyword));
      
      if (hasKeywords) {
        const categoryProducts = this.products.filter(p => 
          p.category?.toLowerCase().includes(category) ||
          p.name.toLowerCase().includes(category)
        );
        
        categoryProducts.forEach(product => {
          const key = product.product_code;
          const score = 25; // Lower score for contextual matches
          
          if (!matches.has(key)) {
            matches.set(key, {
              product,
              confidence: 0.6,
              matchType: 'partial_match',
              matchedTerms: [category],
              score
            });
          }
        });
      }
    });
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private calculateWordImportance(word: string, product: Product): number {
    let importance = 1;
    
    // Longer words are more important
    importance += word.length * 0.1;
    
    // Words in product name are more important
    if (product.name.toLowerCase().includes(word)) {
      importance += 2;
    }
    
    // Brand words are very important
    if (product.brand && product.brand.toLowerCase().includes(word)) {
      importance += 3;
    }
    
    return importance;
  }

  // Batch matching for multiple search terms
  findBatchMatches(searchTerms: string[], maxResultsPerTerm: number = 5): Map<string, ProductMatch[]> {
    const results = new Map<string, ProductMatch[]>();
    
    searchTerms.forEach(term => {
      const matches = this.findMatches(term, maxResultsPerTerm);
      results.set(term, matches);
    });
    
    return results;
  }
}


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Search, 
  Plus, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Filter,
  MoreHorizontal,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { Product } from "@/types";
import { 
  fetchProductsFromDatabase, 
  searchProducts, 
  deleteProduct, 
  deleteAllProducts,
  importProductsFromFile 
} from "@/services/productService";
import { ProductImportDialog } from "./ProductImportDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function ProductCatalog() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products when search term or category changes
  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      console.log('Loading products from database...');
      const loadedProducts = await fetchProductsFromDatabase();
      console.log(`Loaded ${loadedProducts.length} products`);
      setProducts(loadedProducts);
      setCurrentPage(1); // Reset to first page when loading new data
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    
    // Apply category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = searchProducts(filtered, searchTerm, filtered.length); // No limit for filtering
    }
    
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleImport = async (file: File) => {
    setIsLoading(true);
    try {
      console.log(`Starting import of file: ${file.name} (${file.size} bytes)`);
      const result = await importProductsFromFile(file);
      
      if (result.success) {
        toast({
          title: "Import Successful",
          description: `${result.importedCount} products imported successfully${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}.`,
        });
        
        if (result.errors.length > 0) {
          console.log('Import errors:', result.errors);
        }
        
        // Reload products to show the imported data
        await loadProducts();
      } else {
        toast({
          title: "Import Failed",
          description: result.errors[0] || "Failed to import products.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Error",
        description: "An error occurred during import. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowImportDialog(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const success = await deleteProduct(productId);
      if (success) {
        toast({
          title: "Product Deleted",
          description: "Product has been deleted successfully.",
        });
        await loadProducts(); // Reload products
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete product. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the product.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllProducts = async () => {
    setIsLoading(true);
    try {
      const success = await deleteAllProducts();
      if (success) {
        toast({
          title: "All Products Deleted",
          description: "All products have been deleted successfully.",
        });
        setProducts([]);
        setFilteredProducts([]);
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete all products. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting all products:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting products.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteAllDialog(false);
    }
  };

  // Get unique categories for filter
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>
                  Manage your product inventory and pricing ({products.length} total products)
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
                disabled={isLoading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteAllDialog(true)}
                disabled={isLoading || products.length === 0}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadProducts}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search products by name, code, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-md bg-white text-sm"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''} Found
              </Badge>
              {searchTerm && (
                <span className="text-sm text-slate-600">
                  Search: "{searchTerm}"
                </span>
              )}
              {selectedCategory !== "All" && (
                <span className="text-sm text-slate-600">
                  Category: {selectedCategory}
                </span>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Products List */}
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
              <h3 className="text-lg font-medium mb-2">Loading Products</h3>
              <p className="text-sm text-slate-600">Please wait while we load your product catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium mb-2">
                {products.length === 0 ? "No Products Found" : "No Matching Products"}
              </h3>
              <p className="text-sm">
                {products.length === 0 
                  ? "Start by importing your product catalog."
                  : "Try adjusting your search terms or filters."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentProducts.map((product) => (
                <Card key={product.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {product.name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {product.productCode}
                          </Badge>
                          {product.brand && (
                            <Badge variant="secondary" className="text-xs">
                              {product.brand}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>₹{product.unitPrice.toFixed(2)}</span>
                          <span>GST: {product.gstRate}%</span>
                          <span>Min: {product.minQuantity}</span>
                          <span>Max: {product.maxQuantity}</span>
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <ProductImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImport}
      />

      {/* Delete All Products Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete All Products?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all {products.length} products from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllProducts}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete All Products
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProductCatalog;

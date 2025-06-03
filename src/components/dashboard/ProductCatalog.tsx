import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useMemo, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Product } from "@/types";
import { Search, Upload, Plus, Trash2, RefreshCw, Package, FileSpreadsheet, Edit, Save, X, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProductImportDialog } from "./ProductImportDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function ProductCatalog() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  const { toast } = useToast();

  // Load user's products from database with improved pagination
  useEffect(() => {
    if (user) {
      loadUserProducts();
    }
  }, [user]);

  const loadUserProducts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('Loading products for user:', user.id);
      
      // First get the total count
      const { count } = await supabase
        .from('user_products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setTotalCount(count || 0);
      console.log(`Total products in database: ${count}`);

      // Then load all products (removing limit to show all products)
      const { data, error } = await supabase
        .from('user_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading products:', error);
        toast({
          title: "Error Loading Products",
          description: "Failed to load your products. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const userProducts: Product[] = (data || []).map(item => ({
        id: item.id,
        brand: item.brand || '',
        name: item.name,
        productCode: item.product_code,
        unitPrice: Number(item.unit_price),
        gstRate: Number(item.gst_rate),
        minQuantity: item.min_quantity || 1,
        maxQuantity: item.max_quantity || 999,
        category: item.category || 'General'
      }));

      setProducts(userProducts);
      console.log(`Loaded ${userProducts.length} products for user (Total in DB: ${count})`);
      
      toast({
        title: "Products Loaded",
        description: `Successfully loaded ${userProducts.length} products from your catalog.`,
      });
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

  // Get unique brands for filtering
  const brands = useMemo(() => 
    Array.from(new Set(products.map(p => p.brand).filter(Boolean))), 
    [products]
  );

  // Filter and paginate products with better performance
  const { paginatedProducts, totalPages } = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesBrand = brandFilter === "all" || product.brand === brandFilter;
      
      return matchesSearch && matchesBrand;
    });

    setFilteredProducts(filtered);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    return { paginatedProducts: paginated, totalPages };
  }, [products, searchTerm, brandFilter, currentPage, itemsPerPage]);

  const handleSync = async () => {
    await loadUserProducts();
  };

  const handleDeleteAllProducts = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('user_products')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setProducts([]);
      setTotalCount(0);
      setCurrentPage(1);
      
      toast({
        title: "All Products Deleted",
        description: "Successfully deleted all products from your catalog.",
      });
    } catch (error) {
      console.error('Error deleting all products:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete all products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: `new-${Date.now()}`,
      brand: "",
      name: "New Product",
      productCode: "NEW-001",
      unitPrice: 0,
      gstRate: 18,
      category: "General"
    };
    setProducts([newProduct, ...products]);
    setEditingId(newProduct.id);
    setEditForm(newProduct);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm(product);
  };

  const handleSave = async () => {
    if (!editingId || !editForm.name || !editForm.productCode || !user) {
      toast({
        title: "Validation Error",
        description: "Product name and code are required.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingId.startsWith('new-')) {
        // Add new product to database
        const { data, error } = await supabase
          .from('user_products')
          .insert({
            user_id: user.id,
            brand: editForm.brand || '',
            name: editForm.name,
            product_code: editForm.productCode,
            unit_price: editForm.unitPrice || 0,
            gst_rate: editForm.gstRate || 18,
            min_quantity: editForm.minQuantity || 1,
            max_quantity: editForm.maxQuantity || 999,
            category: editForm.category || 'General'
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Update local state with the new product
        const newProduct: Product = {
          id: data.id,
          brand: data.brand || '',
          name: data.name,
          productCode: data.product_code,
          unitPrice: Number(data.unit_price),
          gstRate: Number(data.gst_rate),
          minQuantity: data.min_quantity || 1,
          maxQuantity: data.max_quantity || 999,
          category: data.category || 'General'
        };

        setProducts(products.map(p => p.id === editingId ? newProduct : p));
      } else {
        // Update existing product in database
        const { error } = await supabase
          .from('user_products')
          .update({
            brand: editForm.brand || '',
            name: editForm.name,
            product_code: editForm.productCode,
            unit_price: editForm.unitPrice || 0,
            gst_rate: editForm.gstRate || 18,
            min_quantity: editForm.minQuantity || 1,
            max_quantity: editForm.maxQuantity || 999,
            category: editForm.category || 'General',
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        setProducts(products.map(p => p.id === editingId ? { ...p, ...editForm } as Product : p));
      }

      toast({
        title: "Product Saved",
        description: "Product has been saved successfully."
      });
      
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save product. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    if (editingId?.startsWith('new-')) {
      setProducts(products.filter(p => p.id !== editingId));
    }
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_products')
        .delete()
        .eq('id', productId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setProducts(products.filter(p => p.id !== productId));
      toast({
        title: "Product Deleted",
        description: "Product has been removed from catalog."
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete product. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleImportComplete = () => {
    loadUserProducts();
    setShowImportDialog(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Please log in to view your product catalog.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Product Catalog</h2>
          <p className="text-slate-600 mt-1">
            Manage your products, pricing, and inventory information
            {totalCount > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({totalCount.toLocaleString()} total products)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isDeleting || products.length === 0}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Delete All Products
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all {totalCount.toLocaleString()} products from your catalog.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAllProducts}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete All Products'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSync}
            disabled={isLoading}
            className="border-slate-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowImportDialog(true)}
            className="border-slate-200"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button 
            size="sm"
            onClick={handleAddProduct}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search products, codes, or brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-200"
              />
            </div>
            
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-48 bg-white border-slate-200">
                <SelectValue placeholder="Filter by brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand || "No Brand"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-32 bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
                <SelectItem value="200">200 per page</SelectItem>
                <SelectItem value="500">500 per page</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {filteredProducts.length.toLocaleString()} Products
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Product Table */}
      <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Product Inventory</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-slate-200">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="font-semibold text-slate-700">Brand</TableHead>
                  <TableHead className="font-semibold text-slate-700">Product Description</TableHead>
                  <TableHead className="font-semibold text-slate-700">Product Code</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Unit Price (₹)</TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">GST Rate (%)</TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product, index) => (
                  <TableRow key={product.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                    <TableCell className="font-medium text-sm">
                      {editingId === product.id ? (
                        <Input
                          value={editForm.brand || ""}
                          onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                          className="h-8 text-xs bg-white border-slate-200"
                          placeholder="Brand"
                        />
                      ) : (
                        <span className="text-blue-600">{product.brand || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm max-w-md">
                      {editingId === product.id ? (
                        <Input
                          value={editForm.name || ""}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="h-8 text-xs bg-white border-slate-200"
                          placeholder="Product Description"
                        />
                      ) : (
                        <span className="font-medium">{product.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {editingId === product.id ? (
                        <Input
                          value={editForm.productCode || ""}
                          onChange={(e) => setEditForm({ ...editForm, productCode: e.target.value })}
                          className="h-8 text-xs bg-white border-slate-200"
                          placeholder="Product Code"
                        />
                      ) : (
                        <span className="text-slate-600">{product.productCode}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editForm.unitPrice || 0}
                          onChange={(e) => setEditForm({ ...editForm, unitPrice: parseFloat(e.target.value) })}
                          step="0.01"
                          className="w-32 h-8 text-right text-xs bg-white border-slate-200"
                        />
                      ) : (
                        <span className="font-semibold">
                          {product.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editForm.gstRate || 18}
                          onChange={(e) => setEditForm({ ...editForm, gstRate: parseFloat(e.target.value) })}
                          step="0.01"
                          className="w-20 h-8 text-center text-xs bg-white border-slate-200"
                        />
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {product.gstRate}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingId === product.id ? (
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={handleSave}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={handleCancel}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length.toLocaleString()} products
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          
          {filteredProducts.length === 0 && !isLoading && (
            <div className="text-center py-12 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-sm">
                {searchTerm || brandFilter !== "all" 
                  ? "Try adjusting your search or filters." 
                  : "Start by adding your first product to the catalog."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <ProductImportDialog 
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}

export default ProductCatalog;

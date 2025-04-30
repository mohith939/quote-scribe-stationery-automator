import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Download, FileText, Pencil, Plus, RefreshCw, Trash, Upload } from "lucide-react";
import { mockProducts } from "@/data/mockData";
import { 
  fetchProductsFromSheets, 
  saveProductsToSheets, 
  getGoogleSheetsConfig,
  importProductsFromFile,
  getProductImportTemplate
} from "@/services/googleSheetsService";
import { Product, ImportResult } from "@/types";

export function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    minQuantity: 1,
    maxQuantity: 100,
    pricePerUnit: 0
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  const sheetsConfig = getGoogleSheetsConfig();
  
  // Load products from Google Sheets when connected
  useEffect(() => {
    const loadProducts = async () => {
      if (sheetsConfig.isConnected && sheetsConfig.spreadsheetId) {
        setIsLoading(true);
        try {
          const fetchedProducts = await fetchProductsFromSheets();
          if (fetchedProducts && fetchedProducts.length > 0) {
            setProducts(fetchedProducts);
          }
        } catch (error) {
          console.error("Error fetching products:", error);
          // Keep using mock data if fetch fails
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadProducts();
  }, [sheetsConfig.isConnected, sheetsConfig.spreadsheetId]);
  
  const handleDeleteProduct = (id: string) => {
    const updatedProducts = products.filter(product => product.id !== id);
    setProducts(updatedProducts);
    
    if (sheetsConfig.isConnected && sheetsConfig.spreadsheetId) {
      saveProductsToSheets(updatedProducts).then(success => {
        if (success) {
          toast({
            title: "Product Deleted",
            description: "Product successfully deleted and saved to Google Sheets."
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to save changes to Google Sheets.",
            variant: "destructive"
          });
        }
      });
    } else {
      toast({
        title: "Product Deleted",
        description: "Product successfully deleted (local only)."
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingProduct) return;
    
    const updatedProducts = products.map(p => 
      p.id === editingProduct.id ? editingProduct : p
    );
    
    setProducts(updatedProducts);
    setIsEditDialogOpen(false);
    
    if (sheetsConfig.isConnected && sheetsConfig.spreadsheetId) {
      saveProductsToSheets(updatedProducts).then(success => {
        if (success) {
          toast({
            title: "Product Updated",
            description: "Product successfully updated and saved to Google Sheets."
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to save changes to Google Sheets.",
            variant: "destructive"
          });
        }
      });
    } else {
      toast({
        title: "Product Updated",
        description: "Product successfully updated (local only)."
      });
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.name) {
      toast({
        title: "Invalid Product",
        description: "Product name is required.",
        variant: "destructive"
      });
      return;
    }

    const productToAdd: Product = {
      id: Math.random().toString(36).substring(2, 15),
      name: newProduct.name || "",
      minQuantity: newProduct.minQuantity || 1,
      maxQuantity: newProduct.maxQuantity || 100,
      pricePerUnit: newProduct.pricePerUnit || 0
    };

    const updatedProducts = [...products, productToAdd];
    setProducts(updatedProducts);
    setIsAddDialogOpen(false);
    
    // Reset new product form
    setNewProduct({
      name: "",
      minQuantity: 1,
      maxQuantity: 100,
      pricePerUnit: 0
    });
    
    if (sheetsConfig.isConnected && sheetsConfig.spreadsheetId) {
      saveProductsToSheets(updatedProducts).then(success => {
        if (success) {
          toast({
            title: "Product Added",
            description: "Product successfully added and saved to Google Sheets."
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to save changes to Google Sheets.",
            variant: "destructive"
          });
        }
      });
    } else {
      toast({
        title: "Product Added",
        description: "Product successfully added (local only)."
      });
    }
  };
  
  const handleExportCSV = () => {
    // Create CSV content
    const headers = "name,minQuantity,maxQuantity,pricePerUnit";
    const rows = products.map(product => {
      return [
        product.name,
        product.minQuantity,
        product.maxQuantity,
        product.pricePerUnit
      ].join(',');
    });
    
    const csvContent = [headers, ...rows].join('\n');
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-catalog-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `${products.length} products exported to CSV`,
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setImportFile(files[0]);
    }
  };
  
  const handleImportProducts = async () => {
    if (!importFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result: ImportResult = await importProductsFromFile(importFile);
      
      if (result.success) {
        // Refresh product list
        if (sheetsConfig.isConnected && sheetsConfig.spreadsheetId) {
          const fetchedProducts = await fetchProductsFromSheets();
          if (fetchedProducts && fetchedProducts.length > 0) {
            setProducts(fetchedProducts);
          }
        }
        
        toast({
          title: "Import Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: "An unexpected error occurred during import.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsImportDialogOpen(false);
      setImportFile(null);
    }
  };
  
  const handleShowImportFormat = () => {
    setIsFormatDialogOpen(true);
  };
  
  const handleDownloadTemplate = () => {
    const templateContent = getProductImportTemplate();
    
    // Create a download link
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "Product import template downloaded successfully.",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            Manage product pricing tiers by quantity
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleShowImportFormat}>
            <FileText className="h-4 w-4 mr-1" />
            Import Format
          </Button>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Products</DialogTitle>
                <DialogDescription>
                  Upload a CSV or Excel file with product data
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input 
                    id="file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    File must have columns: name, minQuantity, maxQuantity, pricePerUnit
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleImportProducts} disabled={!importFile || isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : 'Import Products'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isFormatDialogOpen} onOpenChange={setIsFormatDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Format</DialogTitle>
                <DialogDescription>
                  Follow this format for importing products
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="rounded-md bg-secondary p-4">
                  <p className="font-mono text-xs">
                    name,minQuantity,maxQuantity,pricePerUnit<br />
                    A4 Paper,1,99,120<br />
                    A4 Paper,100,499,100<br />
                    A4 Paper,500,999,90<br />
                    A4 Paper,1000,9999,80
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>First row must contain column headers</li>
                    <li>For price tiers of the same product, create multiple rows with the same name</li>
                    <li>Price is in Indian Rupees (₹)</li>
                    <li>Save as .CSV format</li>
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFormatDialogOpen(false)}>Close</Button>
                <Button onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Create a new product with pricing based on quantity
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="minQuantity">Min Quantity</Label>
                    <Input
                      id="minQuantity"
                      type="number"
                      min="1"
                      value={newProduct.minQuantity}
                      onChange={e => setNewProduct({...newProduct, minQuantity: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxQuantity">Max Quantity</Label>
                    <Input
                      id="maxQuantity"
                      type="number"
                      min="1"
                      value={newProduct.maxQuantity}
                      onChange={e => setNewProduct({...newProduct, maxQuantity: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price Per Unit (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProduct.pricePerUnit}
                    onChange={e => setNewProduct({...newProduct, pricePerUnit: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddProduct}>Add Product</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading products...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Min Quantity</TableHead>
                <TableHead className="text-right">Max Quantity</TableHead>
                <TableHead className="text-right">Price Per Unit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">{product.minQuantity}</TableCell>
                  <TableCell className="text-right">{product.maxQuantity}</TableCell>
                  <TableCell className="text-right">₹{product.pricePerUnit.toFixed(2)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No products found. Add a product to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {products.length} products total
        </div>
        {sheetsConfig.isConnected ? (
          <div className="text-sm text-green-600">
            Connected to Google Sheets
          </div>
        ) : (
          <div className="text-sm text-amber-600">
            Not connected to Google Sheets
          </div>
        )}
      </CardFooter>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details and pricing
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-minQuantity">Min Quantity</Label>
                  <Input
                    id="edit-minQuantity"
                    type="number"
                    min="1"
                    value={editingProduct.minQuantity}
                    onChange={e => setEditingProduct({...editingProduct, minQuantity: parseInt(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-maxQuantity">Max Quantity</Label>
                  <Input
                    id="edit-maxQuantity"
                    type="number"
                    min="1"
                    value={editingProduct.maxQuantity}
                    onChange={e => setEditingProduct({...editingProduct, maxQuantity: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Price Per Unit (₹)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingProduct.pricePerUnit}
                  onChange={e => setEditingProduct({...editingProduct, pricePerUnit: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleSaveEdit}>Update Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ProductCatalog;

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/data/mockData";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ImportResult, Product } from "@/types";
import { File, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ProductCatalog() {
  const [isEditing, setIsEditing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState("");
  const [products, setProducts] = useState(mockProducts);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Group products by name for better display
  const groupProductsByName = (productList: Product[]) => {
    const grouped: Record<string, Product[]> = {};
    productList.forEach((product) => {
      if (!grouped[product.name]) {
        grouped[product.name] = [];
      }
      grouped[product.name].push(product);
    });
    return grouped;
  };
  
  const groupedProducts = groupProductsByName(products);

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    
    // Check if the file is an Excel file
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Format",
        description: "Please upload an Excel (.xlsx, .xls) or CSV file.",
        variant: "destructive"
      });
      setIsImporting(false);
      return;
    }

    // In a real application, we would process the Excel file here
    // For demo purposes, we'll read it as text for CSV files
    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setImportData(text);
        setShowImportDialog(true);
        setIsImporting(false);
      };
      reader.readAsText(file);
    } else {
      // For Excel files, in a real app we'd use a library like xlsx
      // For now, just simulate a successful import
      setTimeout(() => {
        const result: ImportResult = {
          success: true, 
          message: "Successfully imported products",
          productsAdded: 5
        };
        
        if (result.success) {
          toast({
            title: "Import Successful",
            description: `Added ${result.productsAdded} products to catalog.`
          });
          
          // Simulate adding new products
          const newProducts: Product[] = [
            {
              id: "new1",
              name: "Premium A4 Paper - 100gsm",
              minQuantity: 1,
              maxQuantity: 100,
              pricePerUnit: 0.60,
            },
            {
              id: "new2",
              name: "Premium A4 Paper - 100gsm",
              minQuantity: 101,
              maxQuantity: 500,
              pricePerUnit: 0.55,
            }
          ];
          
          setProducts([...products, ...newProducts]);
        } else {
          toast({
            title: "Import Failed",
            description: result.message,
            variant: "destructive"
          });
        }
        setIsImporting(false);
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1500);
    }
  };
  
  const handleManualImport = () => {
    try {
      // Basic CSV parsing
      const lines = importData.trim().split('\n');
      const headers = lines[0].split(',');
      
      const nameIndex = headers.findIndex(h => h.toLowerCase().includes('name'));
      const minQtyIndex = headers.findIndex(h => h.toLowerCase().includes('min'));
      const maxQtyIndex = headers.findIndex(h => h.toLowerCase().includes('max'));
      const priceIndex = headers.findIndex(h => h.toLowerCase().includes('price'));
      
      if (nameIndex === -1 || minQtyIndex === -1 || maxQtyIndex === -1 || priceIndex === -1) {
        throw new Error("CSV headers must include name, min quantity, max quantity, and price");
      }
      
      const newProducts: Product[] = [];
      
      // Start from 1 to skip headers
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 4) continue;
        
        const newProduct: Product = {
          id: `import-${Date.now()}-${i}`,
          name: values[nameIndex].trim(),
          minQuantity: parseInt(values[minQtyIndex]),
          maxQuantity: parseInt(values[maxQtyIndex]),
          pricePerUnit: parseFloat(values[priceIndex]),
        };
        
        if (isNaN(newProduct.minQuantity) || isNaN(newProduct.maxQuantity) || isNaN(newProduct.pricePerUnit)) {
          throw new Error(`Invalid number format in line ${i+1}`);
        }
        
        newProducts.push(newProduct);
      }
      
      setProducts([...products, ...newProducts]);
      setShowImportDialog(false);
      
      toast({
        title: "Import Successful",
        description: `Added ${newProducts.length} products to catalog.`
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error processing CSV data",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product Catalog</CardTitle>
            <CardDescription>
              Manage products and pricing slabs
            </CardDescription>
          </div>
          <div className="space-x-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx,.xls,.csv" 
              onChange={handleFileChange}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleFileUploadClick}
              disabled={isImporting}
            >
              {isImporting ? (
                <span className="flex items-center">
                  <File className="mr-2 h-4 w-4 animate-pulse" />
                  Importing...
                </span>
              ) : (
                <span className="flex items-center">
                  <File className="mr-2 h-4 w-4" />
                  Import from Excel
                </span>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "View Mode" : "Edit Mode"}
            </Button>
            <Button size="sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 mr-2"
              >
                <line x1="12" x2="12" y1="5" y2="19" />
                <line x1="5" x2="19" y1="12" y2="12" />
              </svg>
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {Object.entries(groupedProducts).map(([productName, products]) => (
            <div key={productName} className="mb-6">
              <h3 className="text-lg font-medium mb-2">{productName}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Min Qty</TableHead>
                    <TableHead>Max Qty</TableHead>
                    <TableHead className="text-right">Price/Unit</TableHead>
                    {isEditing && <TableHead className="w-[100px] text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {isEditing ? (
                          <input
                            type="number"
                            defaultValue={product.minQuantity}
                            className="w-20 p-1 border rounded"
                          />
                        ) : (
                          product.minQuantity
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <input
                            type="number"
                            defaultValue={product.maxQuantity}
                            className="w-20 p-1 border rounded"
                          />
                        ) : (
                          product.maxQuantity
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end">
                            <span className="mr-1">$</span>
                            <input
                              type="number"
                              defaultValue={product.pricePerUnit}
                              step="0.01"
                              className="w-16 p-1 border rounded text-right"
                            />
                          </div>
                        ) : (
                          `$${product.pricePerUnit.toFixed(2)}`
                        )}
                      </TableCell>
                      {isEditing && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
          {isEditing && (
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save Changes</Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import CSV Data</DialogTitle>
            <DialogDescription>
              Review and confirm the data import. The CSV should have columns for product name, min quantity, max quantity, and price.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              value={importData} 
              onChange={(e) => setImportData(e.target.value)}
              rows={10}
              placeholder="CSV data preview..."
              className="font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualImport}>
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ProductCatalog;

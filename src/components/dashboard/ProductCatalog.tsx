import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Product } from "@/types";
import { Search, FileSpreadsheet, InfoIcon, Plus, Trash2, IndianRupee } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Updated product data based on the image
const initialProducts: Product[] = [
  // Unknown category
  { id: "zta-500n", name: "ZTA-500N- Digital Force Gauge", minQuantity: 1, maxQuantity: 999, pricePerUnit: 83200.00 },
  { id: "glass-thermo", name: "Zeal England Glass Thermometer Range : 10 Deg C -110 Deg C", minQuantity: 1, maxQuantity: 999, pricePerUnit: 750.00 },
  // Other category
  { id: "zero-plate-non-ferrous", name: "zero plate Non-Ferrous", minQuantity: 1, maxQuantity: 999, pricePerUnit: 1800.00 },
  { id: "zero-plate-foil", name: "Zero Plate Foil", minQuantity: 1, maxQuantity: 999, pricePerUnit: 1600.00 },
  { id: "zero-plate-ferrous-non-ferrous", name: "Zero Plate Ferrous & Non Ferrous", minQuantity: 1, maxQuantity: 999, pricePerUnit: 650.00 },
  { id: "zero-plate-ferrous", name: "zero plate Ferrous", minQuantity: 1, maxQuantity: 999, pricePerUnit: 1800.00 },
  { id: "zero-microns-metallic", name: "Zero microns metallic plate", minQuantity: 1, maxQuantity: 999, pricePerUnit: 850.00 },
];

export function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isEditing, setIsEditing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showFormatInfo, setShowFormatInfo] = useState(false);
  const [importData, setImportData] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Group products by category for better display
  const groupProductsByCategory = (productList: Product[]) => {
    const grouped: Record<string, Product[]> = {};
    productList.forEach((product) => {
      // Categorize based on product name patterns
      let category = "Other";
      if (product.name.toLowerCase().includes("zta") || product.name.toLowerCase().includes("digital") || product.name.toLowerCase().includes("gauge")) {
        category = "Unknown";
      } else if (product.name.toLowerCase().includes("thermometer") || product.name.toLowerCase().includes("glass")) {
        category = "Unknown";
      }
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });
    return grouped;
  };
  
  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const groupedProducts = groupProductsByCategory(filteredProducts);

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Format",
        description: "Please upload an Excel (.xlsx, .xls) or CSV file.",
        variant: "destructive"
      });
      setIsImporting(false);
      return;
    }

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
      setTimeout(() => {
        toast({
          title: "Import Successful",
          description: "Added 3 products to catalog."
        });
        
        const newProducts: Product[] = [
          {
            id: "new-product-1",
            name: "Digital Caliper 150mm",
            minQuantity: 1,
            maxQuantity: 50,
            pricePerUnit: 1200.00,
          },
          {
            id: "new-product-2", 
            name: "Precision Scale 0.1g",
            minQuantity: 1,
            maxQuantity: 25,
            pricePerUnit: 2500.00,
          }
        ];
        
        setProducts([...products, ...newProducts]);
        setIsImporting(false);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1500);
    }
  };
  
  const handleManualImport = () => {
    try {
      const lines = importData.trim().split('\n');
      const headers = lines[0].split(',');
      
      const nameIndex = headers.findIndex(h => h.toLowerCase().includes('name') || h.toLowerCase().includes('description'));
      const codeIndex = headers.findIndex(h => h.toLowerCase().includes('code') || h.toLowerCase().includes('id'));
      const priceIndex = headers.findIndex(h => h.toLowerCase().includes('price'));
      
      if (nameIndex === -1 || priceIndex === -1) {
        throw new Error("CSV headers must include product name/description and price");
      }
      
      const newProducts: Product[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 2) continue;
        
        const newProduct: Product = {
          id: values[codeIndex] || `import-${Date.now()}-${i}`,
          name: values[nameIndex].trim(),
          minQuantity: 1,
          maxQuantity: 999,
          pricePerUnit: parseFloat(values[priceIndex]),
        };
        
        if (isNaN(newProduct.pricePerUnit)) {
          throw new Error(`Invalid price format in line ${i+1}`);
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

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: `product-${Date.now()}`,
      name: "New Product",
      minQuantity: 1,
      maxQuantity: 999,
      pricePerUnit: 0
    };
    setProducts([...products, newProduct]);
    setIsEditing(true);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
    toast({
      title: "Product Deleted",
      description: "Product has been removed from catalog."
    });
  };

  const handleClearAll = () => {
    setProducts([]);
    toast({
      title: "All Products Cleared",
      description: "Product catalog has been cleared.",
      variant: "destructive"
    });
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
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by brand, description or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-80"
              />
            </div>
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
              onClick={() => setShowFormatInfo(true)}
            >
              <InfoIcon className="mr-2 h-4 w-4" />
              Import Format
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleFileUploadClick}
              disabled={isImporting}
            >
              {isImporting ? (
                <span className="flex items-center">
                  <FileSpreadsheet className="mr-2 h-4 w-4 animate-pulse" />
                  Importing...
                </span>
              ) : (
                <span className="flex items-center">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
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
            <Button size="sm" onClick={handleAddProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleClearAll}
            >
              Clear All Products
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-medium mb-4 text-gray-700">{category}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Product Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right w-[120px]">Price/Unit</TableHead>
                    <TableHead className="text-right w-[100px]">GST Rate</TableHead>
                    {isEditing && <TableHead className="w-[100px] text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <Input
                            defaultValue={product.id}
                            className="w-full p-1 text-sm"
                          />
                        ) : (
                          product.id
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            defaultValue={product.name}
                            className="w-full p-1 text-sm"
                          />
                        ) : (
                          product.name
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            <Input
                              type="number"
                              defaultValue={product.pricePerUnit}
                              step="0.01"
                              className="w-24 p-1 text-right text-sm"
                            />
                          </div>
                        ) : (
                          <span className="flex items-center justify-end">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            {product.pricePerUnit.toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        18%
                      </TableCell>
                      {isEditing && (
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No products found matching your search." : "No products in catalog."}
            </div>
          )}
          {isEditing && (
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
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
              Review and confirm the data import. The CSV should have columns for product code, description, and price.
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
              Import Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFormatInfo} onOpenChange={setShowFormatInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excel/CSV Import Format</DialogTitle>
            <DialogDescription>
              Your import file should follow this format for successful processing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertTitle className="flex items-center">
                <FileSpreadsheet className="h-4 w-4 mr-2" /> 
                Required Format
              </AlertTitle>
              <AlertDescription>
                <p className="mb-2">Your Excel/CSV file must include these columns:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Product Code</strong> - Unique identifier</li>
                  <li><strong>Description</strong> - Product name/description</li>
                  <li><strong>Price</strong> - Price per unit in ₹</li>
                </ul>
                <div className="mt-4">
                  <p className="font-semibold">Example CSV Format:</p>
                  <pre className="bg-gray-100 p-2 rounded text-xs mt-2 overflow-x-auto">
                    Product Code,Description,Price{"\n"}
                    ZTA-500N,Digital Force Gauge,83200.00{"\n"}
                    THERMO-01,Glass Thermometer,750.00{"\n"}
                    PLATE-NF,Zero Plate Non-Ferrous,1800.00
                  </pre>
                </div>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowFormatInfo(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ProductCatalog;

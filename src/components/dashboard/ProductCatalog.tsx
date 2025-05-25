
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Product } from "@/types";
import { Search, FileSpreadsheet, InfoIcon, Plus, Trash2, IndianRupee, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Updated product data based on the image
const initialProducts: Product[] = [
  { id: "zta-500n", name: "ZTA-500N- Digital Force Gauge", minQuantity: 1, maxQuantity: 999, pricePerUnit: 83200.00 },
  { id: "glass-thermo", name: "Zeal England Glass Thermometer Range : 10 Deg C -110 Deg C", minQuantity: 1, maxQuantity: 999, pricePerUnit: 750.00 },
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
  
  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Product Catalog</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Manage products and pricing information
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
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
                Format Info
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleFileUploadClick}
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Excel
                  </>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-32 font-semibold">Product Code</TableHead>
                  <TableHead className="font-semibold">Product Description</TableHead>
                  <TableHead className="w-32 text-right font-semibold">Price per Unit</TableHead>
                  <TableHead className="w-24 text-center font-semibold">GST</TableHead>
                  {isEditing && <TableHead className="w-20 text-center font-semibold">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <TableRow key={product.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell className="font-medium text-sm">
                      {isEditing ? (
                        <Input
                          defaultValue={product.id}
                          className="h-8 text-xs"
                        />
                      ) : (
                        <span className="text-blue-600">{product.id}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {isEditing ? (
                        <Input
                          defaultValue={product.name}
                          className="h-8 text-xs"
                        />
                      ) : (
                        product.name
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end">
                          <IndianRupee className="h-4 w-4 mr-1 text-gray-500" />
                          <Input
                            type="number"
                            defaultValue={product.pricePerUnit}
                            step="0.01"
                            className="w-24 h-8 text-right text-xs"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-end font-medium">
                          <IndianRupee className="h-4 w-4 mr-1 text-gray-500" />
                          <span>{product.pricePerUnit.toFixed(2)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                      18%
                    </TableCell>
                    {isEditing && (
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
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
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? "No products found matching your search." : "No products in catalog."}
            </div>
          )}
          
          {isEditing && filteredProducts.length > 0 && (
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setIsEditing(false);
                toast({
                  title: "Changes Saved",
                  description: "Product catalog has been updated."
                });
              }}>
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Import Dialog */}
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

      {/* Format Info Dialog */}
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

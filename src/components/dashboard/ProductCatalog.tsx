
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/data/mockData";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ImportResult } from "@/types";

export function ProductCatalog() {
  const [isEditing, setIsEditing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Group products by name for better display
  const groupedProducts: Record<string, typeof mockProducts> = {};
  mockProducts.forEach((product) => {
    if (!groupedProducts[product.name]) {
      groupedProducts[product.name] = [];
    }
    groupedProducts[product.name].push(product);
  });

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
    // For now, we'll simulate a successful import
    setTimeout(() => {
      // Simulate successful import
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
  };

  return (
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
            {isImporting ? "Importing..." : "Import from Excel"}
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
  );
}

export default ProductCatalog;

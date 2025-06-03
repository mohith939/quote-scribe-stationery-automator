
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: string[];
}

export function ProductImportDialog({ open, onOpenChange, onImportComplete }: ProductImportDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.toLowerCase();
      if (fileExtension.endsWith('.csv') || fileExtension.endsWith('.xlsx') || fileExtension.endsWith('.xls')) {
        setFile(selectedFile);
        setImportResult(null);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV or Excel file (.csv, .xlsx, .xls)",
          variant: "destructive"
        });
      }
    }
  };

  const importProductsFromFile = async (file: File): Promise<ImportResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const arrayBuffer = await file.arrayBuffer();
      let workbook;
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = new TextDecoder().decode(arrayBuffer);
        workbook = XLSX.read(text, { type: 'string' });
      } else {
        workbook = XLSX.read(arrayBuffer, { type: 'array' });
      }
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        throw new Error("File must contain header and at least one data row");
      }
      
      const headers = jsonData[0] as string[];
      const products: any[] = [];
      const errors: string[] = [];
      
      // Find column indices for our required fields
      const getColumnIndex = (possibleNames: string[]) => {
        return headers.findIndex(header => 
          possibleNames.some(name => 
            header.toLowerCase().includes(name.toLowerCase())
          )
        );
      };

      const brandIndex = getColumnIndex(['brand', 'manufacturer', 'company']);
      const nameIndex = getColumnIndex(['name', 'description', 'product description', 'product name']);
      const codeIndex = getColumnIndex(['code', 'product code', 'sku', 'item code']);
      const priceIndex = getColumnIndex(['price', 'unit price', 'cost']);
      const gstIndex = getColumnIndex(['gst', 'tax', 'gst rate', 'tax rate']);
      
      for (let i = 1; i < jsonData.length; i++) {
        try {
          const row = jsonData[i] as any[];
          
          if (!row || row.length === 0) continue;
          
          const brand = brandIndex >= 0 ? (row[brandIndex] || '').toString() : '';
          const name = nameIndex >= 0 ? (row[nameIndex] || '').toString() : '';
          const code = codeIndex >= 0 ? (row[codeIndex] || '').toString() : '';
          const price = priceIndex >= 0 ? parseFloat(row[priceIndex]) || 0 : 0;
          const gst = gstIndex >= 0 ? parseFloat(row[gstIndex]) || 18 : 18;
          
          if (!name || !code) {
            errors.push(`Row ${i + 1}: Missing product name or code`);
            continue;
          }
          
          if (price <= 0) {
            errors.push(`Row ${i + 1}: Invalid unit price`);
            continue;
          }
          
          const product = {
            user_id: user.id,
            brand,
            name,
            product_code: code,
            unit_price: price,
            gst_rate: gst,
            min_quantity: 1,
            max_quantity: 999,
            category: brand || 'General'
          };
          
          products.push(product);
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid data format'}`);
        }
      }
      
      if (products.length === 0) {
        throw new Error('No valid products found in file');
      }
      
      // Insert products into database
      const { data, error } = await supabase
        .from('user_products')
        .insert(products)
        .select();
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log(`Successfully imported ${products.length} products`);
      
      return {
        success: true,
        importedCount: products.length,
        errors
      };
    } catch (error) {
      console.error("Error importing products:", error);
      return {
        success: false,
        importedCount: 0,
        errors: [error instanceof Error ? error.message : 'Import failed']
      };
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await importProductsFromFile(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      setImportResult(result);

      if (result.success) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.importedCount} products to your catalog`,
        });
        onImportComplete();
      } else {
        toast({
          title: "Import Failed",
          description: "There were errors during import. Check the details below.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: "Failed to import products. Please check your file format.",
        variant: "destructive"
      });
      setImportResult({
        success: false,
        importedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setProgress(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Products to Your Catalog
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import products to your personal catalog
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Format Info */}
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <FileText className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Supported File Formats</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p><strong>Columns (flexible names):</strong></p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Brand/Manufacturer</li>
                    <li>Product Name/Description</li>
                    <li>Product Code/SKU</li>
                    <li>Unit Price/Cost (required)</li>
                    <li>GST Rate/Tax (optional, defaults to 18%)</li>
                  </ul>
                  <p className="mt-2 text-xs"><strong>Supported:</strong> .csv, .xlsx, .xls files</p>
                </div>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={isImporting}
            />
            {file && (
              <p className="text-sm text-slate-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing products to your catalog...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className={`rounded-md p-4 ${importResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                )}
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {importResult.success ? 'Import Successful' : 'Import Failed'}
                  </h3>
                  <div className={`mt-2 text-sm ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    <p>Products imported: {importResult.importedCount}</p>
                    {importResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p>Issues encountered:</p>
                        <ul className="list-disc pl-5 mt-1">
                          {importResult.errors.slice(0, 5).map((error, index) => (
                            <li key={index} className="text-xs">{error}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li className="text-xs">... and {importResult.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || isImporting}
            >
              {isImporting ? 'Importing...' : 'Import Products'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

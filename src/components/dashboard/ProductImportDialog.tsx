
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
  skippedCount: number;
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

  const sanitizeNumeric = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    
    const parsed = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    
    if (isNaN(parsed)) return 0;
    
    if (parsed > 1000000000) return 1000000000;
    if (parsed < 0) return 0;
    
    return Math.round(parsed * 100) / 100;
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
      
      // First, get existing products to check for duplicates
      const { data: existingProducts } = await supabase
        .from('user_products')
        .select('product_code')
        .eq('user_id', user.id);

      const existingCodes = new Set(existingProducts?.map(p => p.product_code) || []);
      
      for (let i = 1; i < jsonData.length; i++) {
        try {
          const row = jsonData[i] as any[];
          
          if (!row || row.length === 0) continue;
          
          const brand = brandIndex >= 0 ? (row[brandIndex] || '').toString().trim() : '';
          const name = nameIndex >= 0 ? (row[nameIndex] || '').toString().trim() : '';
          const code = codeIndex >= 0 ? (row[codeIndex] || '').toString().trim() : '';
          const price = priceIndex >= 0 ? sanitizeNumeric(row[priceIndex]) : 0;
          const gst = gstIndex >= 0 ? sanitizeNumeric(row[gstIndex]) : 18;
          
          if (!name || !code) {
            errors.push(`Row ${i + 1}: Missing product name or code`);
            continue;
          }
          
          if (price <= 0) {
            errors.push(`Row ${i + 1}: Invalid or missing unit price`);
            continue;
          }

          // Check for duplicates
          if (existingCodes.has(code)) {
            errors.push(`Row ${i + 1}: Product code '${code}' already exists, skipping`);
            continue;
          }

          const validGst = Math.min(Math.max(gst, 0), 100);
          
          const product = {
            user_id: user.id,
            brand: brand.substring(0, 255),
            name: name.substring(0, 255),
            product_code: code.substring(0, 100),
            unit_price: price,
            gst_rate: validGst,
            min_quantity: 1,
            max_quantity: 999,
            category: (brand || 'General').substring(0, 100)
          };
          
          products.push(product);
          existingCodes.add(code); // Add to set to avoid duplicates within the same import
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid data format'}`);
        }
      }
      
      if (products.length === 0) {
        throw new Error('No valid products found in file');
      }
      
      // Insert products in smaller batches with better error handling
      const batchSize = 25; // Reduced batch size
      let successfulInserts = 0;
      let skippedCount = 0;
      
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        try {
          const { data, error } = await supabase
            .from('user_products')
            .insert(batch)
            .select('id');
          
          if (error) {
            // Handle constraint violation errors specifically
            if (error.code === '23505') {
              skippedCount += batch.length;
              errors.push(`Batch ${Math.floor(i / batchSize) + 1}: Some products already exist, skipped duplicates`);
            } else {
              console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error);
              errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
            }
          } else {
            successfulInserts += data?.length || 0;
          }
        } catch (batchError) {
          console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, batchError);
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: Unexpected error occurred`);
        }
        
        // Update progress
        setProgress(Math.round(((i + batchSize) / products.length) * 90));
      }
      
      console.log(`Successfully imported ${successfulInserts} products, skipped ${skippedCount}`);
      
      return {
        success: successfulInserts > 0,
        importedCount: successfulInserts,
        skippedCount,
        errors
      };
    } catch (error) {
      console.error("Error importing products:", error);
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        errors: [error instanceof Error ? error.message : 'Import failed']
      };
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setProgress(0);

    try {
      const result = await importProductsFromFile(file);
      
      setProgress(100);
      setImportResult(result);

      if (result.success) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${result.importedCount} products${result.skippedCount > 0 ? `, skipped ${result.skippedCount} duplicates` : ''}`,
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
        skippedCount: 0,
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
                    <li>Product Code/SKU (must be unique)</li>
                    <li>Unit Price/Cost (required)</li>
                    <li>GST Rate/Tax (optional, defaults to 18%)</li>
                  </ul>
                  <p className="mt-2 text-xs"><strong>Supported:</strong> .csv, .xlsx, .xls files</p>
                  <p className="mt-1 text-xs"><strong>Note:</strong> Duplicate product codes will be skipped automatically</p>
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
                    {importResult.success ? 'Import Completed' : 'Import Failed'}
                  </h3>
                  <div className={`mt-2 text-sm ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    <p>Products imported: {importResult.importedCount}</p>
                    {importResult.skippedCount > 0 && (
                      <p>Products skipped (duplicates): {importResult.skippedCount}</p>
                    )}
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

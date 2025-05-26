
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Product } from "@/types";
import { Search, Upload, Plus, Trash2, IndianRupee, Filter, Package, FileSpreadsheet, Sync } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Updated product data with categories based on business context
const initialProducts: Product[] = [
  { id: "zta-500n", name: "ZTA-500N Digital Force Gauge", minQuantity: 1, maxQuantity: 999, pricePerUnit: 83200.00, category: "Testing Equipment" },
  { id: "glass-thermo", name: "Zeal England Glass Thermometer Range: 10°C - 110°C", minQuantity: 1, maxQuantity: 999, pricePerUnit: 750.00, category: "Measuring Instruments" },
  { id: "zero-plate-non-ferrous", name: "Zero Plate Non-Ferrous", minQuantity: 1, maxQuantity: 999, pricePerUnit: 1800.00, category: "Calibration Tools" },
  { id: "zero-plate-foil", name: "Zero Plate Foil", minQuantity: 1, maxQuantity: 999, pricePerUnit: 1600.00, category: "Calibration Tools" },
  { id: "zero-plate-ferrous-non-ferrous", name: "Zero Plate Ferrous & Non Ferrous", minQuantity: 1, maxQuantity: 999, pricePerUnit: 650.00, category: "Calibration Tools" },
  { id: "zero-plate-ferrous", name: "Zero Plate Ferrous", minQuantity: 1, maxQuantity: 999, pricePerUnit: 1800.00, category: "Calibration Tools" },
  { id: "zero-microns-metallic", name: "Zero Microns Metallic Plate", minQuantity: 1, maxQuantity: 999, pricePerUnit: 850.00, category: "Calibration Tools" },
];

interface ExtendedProduct extends Product {
  category: string;
}

export function ProductCatalog() {
  const [products, setProducts] = useState<ExtendedProduct[]>(initialProducts);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category)));
  
  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    
    // Simulate import process
    setTimeout(() => {
      toast({
        title: "Import Successful",
        description: `Imported ${file.name} with 3 new products.`
      });
      
      const newProducts: ExtendedProduct[] = [
        {
          id: "new-product-1",
          name: "Digital Caliper 150mm Precision",
          minQuantity: 1,
          maxQuantity: 50,
          pricePerUnit: 1200.00,
          category: "Measuring Instruments"
        },
        {
          id: "new-product-2", 
          name: "Precision Scale 0.1g Laboratory Grade",
          minQuantity: 1,
          maxQuantity: 25,
          pricePerUnit: 2500.00,
          category: "Testing Equipment"
        }
      ];
      
      setProducts([...products, ...newProducts]);
      setIsImporting(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 1500);
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: "Sync Complete",
        description: "Product catalog synchronized successfully."
      });
    }, 2000);
  };

  const handleAddProduct = () => {
    const newProduct: ExtendedProduct = {
      id: `product-${Date.now()}`,
      name: "New Product",
      minQuantity: 1,
      maxQuantity: 999,
      pricePerUnit: 0,
      category: "General"
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

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Testing Equipment": "bg-blue-100 text-blue-800",
      "Measuring Instruments": "bg-green-100 text-green-800",
      "Calibration Tools": "bg-purple-100 text-purple-800",
      "General": "bg-gray-100 text-gray-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Product Catalog</h2>
          <p className="text-slate-600 mt-1">Manage your products, pricing, and inventory information</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="border-slate-200"
          >
            <Sync className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleFileUploadClick}
            disabled={isImporting}
            className="border-slate-200"
          >
            {isImporting ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </>
            )}
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
                placeholder="Search products, codes, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-200"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-64 bg-white border-slate-200">
                <Filter className="h-4 w-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {filteredProducts.length} Products
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(!isEditing)}
                className="border-slate-200"
              >
                {isEditing ? "View Mode" : "Edit Mode"}
              </Button>
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
                  <TableHead className="font-semibold text-slate-700">Product Code</TableHead>
                  <TableHead className="font-semibold text-slate-700">Description</TableHead>
                  <TableHead className="font-semibold text-slate-700">Category</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Price per Unit</TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">GST</TableHead>
                  {isEditing && <TableHead className="text-center font-semibold text-slate-700">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <TableRow key={product.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                    <TableCell className="font-medium text-sm">
                      {isEditing ? (
                        <Input
                          defaultValue={product.id}
                          className="h-8 text-xs bg-white border-slate-200"
                        />
                      ) : (
                        <span className="text-blue-600 font-mono">{product.id}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm max-w-md">
                      {isEditing ? (
                        <Input
                          defaultValue={product.name}
                          className="h-8 text-xs bg-white border-slate-200"
                        />
                      ) : (
                        <span className="font-medium">{product.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(product.category)}>
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end">
                          <IndianRupee className="h-4 w-4 mr-1 text-slate-500" />
                          <Input
                            type="number"
                            defaultValue={product.pricePerUnit}
                            step="0.01"
                            className="w-32 h-8 text-right text-xs bg-white border-slate-200"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-end font-semibold">
                          <IndianRupee className="h-4 w-4 mr-1 text-slate-500" />
                          <span>{product.pricePerUnit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        18%
                      </Badge>
                    </TableCell>
                    {isEditing && (
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
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
            <div className="text-center py-12 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-sm">
                {searchTerm || categoryFilter !== "all" 
                  ? "Try adjusting your search or filters." 
                  : "Start by adding your first product to the catalog."}
              </p>
            </div>
          )}
          
          {isEditing && filteredProducts.length > 0 && (
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="border-slate-200">
                Cancel Changes
              </Button>
              <Button 
                onClick={() => {
                  setIsEditing(false);
                  toast({
                    title: "Changes Saved",
                    description: "Product catalog has been updated successfully."
                  });
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".xlsx,.xls,.csv" 
        onChange={handleFileChange}
      />
    </div>
  );
}

export default ProductCatalog;

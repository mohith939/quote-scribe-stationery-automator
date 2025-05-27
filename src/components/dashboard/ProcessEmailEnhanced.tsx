
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, AlertCircle, CheckCircle, Package, User, Hash } from "lucide-react";

interface DetectedProduct {
  name: string;
  confidence: number;
  quantity: number;
}

interface ProcessEmailEnhancedProps {
  email: any;
  onClose: () => void;
  onQuoteSent: () => void;
}

export function ProcessEmailEnhanced({ email, onClose, onQuoteSent }: ProcessEmailEnhancedProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedProducts, setDetectedProducts] = useState<DetectedProduct[]>([
    { name: "ZTA-500N Digital Force Gauge", confidence: 95, quantity: 1 },
    { name: "Zero Plate Non-Ferrous", confidence: 87, quantity: 2 }
  ]);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: "John Smith",
    email: email?.from || "customer@example.com",
    company: "ABC Manufacturing"
  });

  const [selectedProduct, setSelectedProduct] = useState<DetectedProduct | null>(detectedProducts[0]);
  const [customQuantity, setCustomQuantity] = useState(selectedProduct?.quantity || 1);

  const handleProductSelect = (product: DetectedProduct) => {
    setSelectedProduct(product);
    setCustomQuantity(product.quantity);
  };

  const handleSendQuote = async () => {
    if (!selectedProduct) {
      toast({
        title: "No Product Selected",
        description: "Please select a product to quote",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate quote generation and sending
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Quote Sent Successfully",
        description: `Quote for ${selectedProduct.name} sent to ${customerInfo.email}`,
      });

      onQuoteSent();
      onClose();
    } catch (error) {
      toast({
        title: "Failed to Send Quote",
        description: "There was an error sending the quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold">Process Quote Request</h2>
                <p className="text-sm text-slate-600">AI-detected products and customer information</p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Analysis */}
          <div className="space-y-6">
            {/* Detected Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Detected Products ({detectedProducts.length})
                </CardTitle>
                <CardDescription>
                  AI has analyzed the email and found these potential products
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {detectedProducts.map((product, index) => (
                  <div 
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProduct?.name === product.name 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Qty: {product.quantity}
                          </Badge>
                          <Badge 
                            variant={product.confidence > 90 ? "default" : "secondary"} 
                            className="text-xs"
                          >
                            {product.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                      {selectedProduct?.name === product.name && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
                <CardDescription>
                  Extracted from email headers and content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email Address</Label>
                  <Input
                    id="customerEmail"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerCompany">Company</Label>
                  <Input
                    id="customerCompany"
                    value={customerInfo.company}
                    onChange={(e) => setCustomerInfo({...customerInfo, company: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quote Generation */}
          <div className="space-y-6">
            {/* Selected Product Details */}
            {selectedProduct && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Quote Details
                  </CardTitle>
                  <CardDescription>
                    Configure the quotation for the selected product
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium">{selectedProduct.name}</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Detected quantity: {selectedProduct.quantity} unit(s)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={customQuantity}
                      onChange={(e) => setCustomQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Estimated Pricing</Label>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>Unit Price:</span>
                        <span>₹83,200.00</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span>Quantity:</span>
                        <span>{customQuantity}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span>Subtotal:</span>
                        <span>₹{(83200 * customQuantity).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span>GST (18%):</span>
                        <span>₹{(83200 * customQuantity * 0.18).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-green-300">
                        <span>Total:</span>
                        <span>₹{(83200 * customQuantity * 1.18).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Email Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Quote Email Preview</CardTitle>
                <CardDescription>This is how your quote email will look</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 p-4 rounded-lg text-sm">
                  <p><strong>To:</strong> {customerInfo.email}</p>
                  <p><strong>Subject:</strong> Your Quotation for {selectedProduct?.name}</p>
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p>Dear {customerInfo.name},</p>
                    <p className="mt-2">Thank you for your inquiry. Please find our quotation below:</p>
                    <div className="mt-3 p-2 bg-gray-50 rounded">
                      <p><strong>Product:</strong> {selectedProduct?.name}</p>
                      <p><strong>Quantity:</strong> {customQuantity}</p>
                      <p><strong>Total Amount:</strong> ₹{selectedProduct ? (83200 * customQuantity * 1.18).toLocaleString() : '0'}</p>
                    </div>
                    <p className="mt-2">This quotation is valid for 14 days from the date of this email.</p>
                    <p className="mt-2">Best regards,<br/>Your Stationery Shop</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSendQuote} 
                disabled={!selectedProduct || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Quote
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

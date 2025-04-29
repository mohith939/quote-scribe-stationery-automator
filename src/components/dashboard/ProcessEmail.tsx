
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";
import { Send, Printer, Download } from "lucide-react";

export function ProcessEmail() {
  const { toast } = useToast();
  const [emailData, setEmailData] = useState({
    from: "customer@example.com",
    subject: "Product Inquiry",
    body: "Hello, I would like to purchase 500 sheets of A4 paper. Could you please send me a quote? Thank you.",
    productName: "A4 Paper - 80gsm",
    quantity: 500,
    calculatedPrice: 200.00 // 500 * 0.40
  });

  const [quoteGenerated, setQuoteGenerated] = useState(false);

  const handleQuantityChange = (newQuantity: number) => {
    // Find the appropriate price based on quantity
    const product = mockProducts.find(p => 
      p.name === emailData.productName && 
      newQuantity >= p.minQuantity && 
      newQuantity <= p.maxQuantity
    );
    
    const pricePerUnit = product ? product.pricePerUnit : 0;
    const calculatedPrice = pricePerUnit * newQuantity;
    
    setEmailData({
      ...emailData,
      quantity: newQuantity,
      calculatedPrice
    });
  };

  const handleProductChange = (newProduct: string) => {
    // Find the appropriate price based on selected product and current quantity
    const product = mockProducts.find(p => 
      p.name === newProduct && 
      emailData.quantity >= p.minQuantity && 
      emailData.quantity <= p.maxQuantity
    );
    
    const pricePerUnit = product ? product.pricePerUnit : 0;
    const calculatedPrice = pricePerUnit * emailData.quantity;
    
    setEmailData({
      ...emailData,
      productName: newProduct,
      calculatedPrice
    });
  };

  const handleGenerate = () => {
    setQuoteGenerated(true);
    toast({
      title: "Quote Generated",
      description: "A quote has been generated and saved",
    });
  };

  const handleSend = () => {
    toast({
      title: "Quote Sent",
      description: "The quote has been sent to the customer",
    });
    setQuoteGenerated(false);
  };

  const handlePrint = () => {
    toast({
      title: "Printing Quote",
      description: "The quote has been sent to the printer",
    });
    // In a real app, we would use window.print() or a library like react-to-print
  };

  const handleExport = () => {
    // Create CSV content
    const csvContent = `
Product Name,${emailData.productName}
Quantity,${emailData.quantity}
Price Per Unit,$${(emailData.calculatedPrice / emailData.quantity).toFixed(2)}
Total Price,$${emailData.calculatedPrice.toFixed(2)}
Customer,${emailData.from}
Date,${new Date().toLocaleDateString()}
    `.trim();
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quote-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Quote Exported",
      description: "The quote has been exported as CSV",
    });
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Process Email Request</CardTitle>
        <CardDescription>
          Generate a quote from an email inquiry
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                value={emailData.from}
                onChange={(e) => setEmailData({...emailData, from: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              rows={4}
              value={emailData.body}
              onChange={(e) => setEmailData({...emailData, body: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select 
                value={emailData.productName}
                onValueChange={handleProductChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(mockProducts.map(p => p.name))).map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={emailData.quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between">
              <div>
                <h4 className="font-medium">Quote Details</h4>
                <p className="text-sm text-muted-foreground">
                  Based on the quantity range
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  ${emailData.calculatedPrice.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Unit Price: ${(emailData.calculatedPrice / emailData.quantity).toFixed(2)} × {emailData.quantity} units
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={handleGenerate}>
                Preview Quote
              </Button>
              <Button onClick={handleSend} disabled={!quoteGenerated}>
                <Send className="mr-2 h-4 w-4" />
                Send Quote
              </Button>
              {quoteGenerated && (
                <>
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ProcessEmail;

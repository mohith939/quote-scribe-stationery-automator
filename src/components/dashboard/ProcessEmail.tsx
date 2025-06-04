import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { mockProducts, mockQuoteLogs } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";
import { Send, Printer, Download, Wand2 } from "lucide-react";
import { parseEmailForQuotation } from "@/services/emailParserService";
import { sendQuoteEmail } from "@/services/gmailService";
import { defaultQuoteTemplate, generateEmailSubject, generateQuoteEmailBody } from "@/services/quoteService";
import { logQuoteToSheet } from "@/services/gmailService";
import { calculatePrice } from "@/services/pricingService";
import { EmailMessage, QuoteLog } from "@/types";

interface ProcessEmailProps {
  selectedEmail?: EmailMessage | null;
  onEmailProcessed?: () => void;
}

export function ProcessEmail({ selectedEmail, onEmailProcessed }: ProcessEmailProps) {
  const { toast } = useToast();
  
  const [emailData, setEmailData] = useState({
    from: "customer@example.com",
    subject: "Product Inquiry",
    body: "Hello, I would like to purchase 500 sheets of A4 paper. Could you please send me a quote? Thank you.",
    productName: "A4 Paper - 80gsm",
    quantity: 500,
    calculatedPrice: 200.00
  });

  const [quoteGenerated, setQuoteGenerated] = useState(false);
  const [autoAnalysisActive, setAutoAnalysisActive] = useState(false);

  // Auto-populate when email is selected
  useEffect(() => {
    if (selectedEmail) {
      // Extract sender email from "Name <email>" format
      const emailMatch = selectedEmail.from.match(/<(.+)>/);
      const extractedEmail = emailMatch ? emailMatch[1] : selectedEmail.from;
      
      // Auto-detect product and quantity if available
      let productName = "A4 Paper - 80gsm";
      let quantity = 1;
      let calculatedPrice = 0.45;

      if (selectedEmail.detectedProducts && selectedEmail.detectedProducts.length > 0) {
        const firstProduct = selectedEmail.detectedProducts[0];
        productName = firstProduct.product;
        quantity = firstProduct.quantity;
        
        // Calculate price based on detected product
        const pricing = calculatePrice(productName, quantity, mockProducts);
        if (pricing) {
          calculatedPrice = pricing.totalPrice;
        }
      }

      setEmailData({
        from: extractedEmail,
        subject: selectedEmail.subject,
        body: selectedEmail.body,
        productName,
        quantity,
        calculatedPrice
      });

      // Auto-generate quote if we have good detection
      if (selectedEmail.confidence === 'high' || selectedEmail.confidence === 'medium') {
        setQuoteGenerated(true);
      }

      toast({
        title: "Email Loaded",
        description: `Processing email from ${extractedEmail}`,
      });
    }
  }, [selectedEmail, toast]);

  const handleQuantityChange = (newQuantity: number) => {
    const product = mockProducts.find(p => 
      p.name === emailData.productName && 
      newQuantity >= (p.min_quantity || 1) && 
      newQuantity <= (p.max_quantity || 999999)
    );
    
    const pricePerUnit = product ? product.unit_price : 0;
    const calculatedPrice = pricePerUnit * newQuantity;
    
    setEmailData({
      ...emailData,
      quantity: newQuantity,
      calculatedPrice
    });
  };

  const handleProductChange = (newProduct: string) => {
    const product = mockProducts.find(p => 
      p.name === newProduct && 
      emailData.quantity >= (p.min_quantity || 1) && 
      emailData.quantity <= (p.max_quantity || 999999)
    );
    
    const pricePerUnit = product ? product.unit_price : 0;
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

  const handleSend = async () => {
    try {
      const parsedInfo = parseEmailForQuotation({
        id: selectedEmail?.id || "manual",
        from: emailData.from,
        subject: emailData.subject,
        body: emailData.body,
        date: new Date().toISOString()
      });
      
      const emailSubject = generateEmailSubject(defaultQuoteTemplate, emailData.productName);
      const product = mockProducts.find(p => 
        p.name === emailData.productName && 
        emailData.quantity >= (p.min_quantity || 1) && 
        emailData.quantity <= (p.max_quantity || 999999)
      );
      const pricePerUnit = product ? product.unit_price : 0;
      
      const emailBody = generateQuoteEmailBody(
        defaultQuoteTemplate,
        parsedInfo,
        pricePerUnit,
        emailData.calculatedPrice
      );
      
      const emailSent = await sendQuoteEmail(
        parsedInfo.emailAddress,
        emailSubject,
        emailBody
      ).catch(() => false);
      
      // Create new quote log entry
      const newQuoteLog: QuoteLog = {
        timestamp: new Date().toISOString(),
        customerName: parsedInfo.customerName,
        emailAddress: parsedInfo.emailAddress,
        product: emailData.productName,
        quantity: emailData.quantity,
        pricePerUnit: pricePerUnit,
        totalAmount: emailData.calculatedPrice,
        status: emailSent ? 'Sent' : 'Failed',
        extractedDetails: {
          product: emailData.productName,
          quantity: emailData.quantity,
          products: [{
            product: emailData.productName,
            quantity: emailData.quantity
          }]
        }
      };

      // Add to mock data (in real app, this would save to database)
      mockQuoteLogs.unshift(newQuoteLog);
      
      await logQuoteToSheet({
        timestamp: new Date().toISOString(),
        customerName: parsedInfo.customerName,
        emailAddress: parsedInfo.emailAddress,
        product: emailData.productName,
        quantity: emailData.quantity,
        pricePerUnit: pricePerUnit,
        totalAmount: emailData.calculatedPrice,
        status: emailSent ? 'Sent' as const : 'Failed' as const
      }).catch(console.error);
      
      toast({
        title: emailSent ? "Quote Sent" : "Failed to Send Quote",
        description: emailSent 
          ? "The quote has been sent to the customer" 
          : "There was an error sending the quote. Check your Gmail connection.",
        variant: emailSent ? "default" : "destructive"
      });
      
      if (emailSent) {
        setQuoteGenerated(false);
        if (onEmailProcessed) {
          onEmailProcessed();
        }
      }
    } catch (error) {
      console.error("Error sending quote:", error);
      toast({
        title: "Error Sending Quote",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    toast({
      title: "Printing Quote",
      description: "The quote has been sent to the printer",
    });
  };

  const handleExport = () => {
    const csvContent = `
Product Name,${emailData.productName}
Quantity,${emailData.quantity}
Price Per Unit,₹${(emailData.calculatedPrice / emailData.quantity).toFixed(2)}
Total Price,₹${emailData.calculatedPrice.toFixed(2)}
Customer,${emailData.from}
Date,${new Date().toLocaleDateString()}
    `.trim();
    
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

  const handleAutoAnalyzeEmail = () => {
    setAutoAnalysisActive(true);
    
    setTimeout(() => {
      try {
        const mockEmail = {
          id: "manual-analysis",
          from: emailData.from,
          subject: emailData.subject,
          body: emailData.body,
          date: new Date().toISOString()
        };
        
        const parsedInfo = parseEmailForQuotation(mockEmail);
        
        if (parsedInfo.confidence === 'none' || !parsedInfo.product || !parsedInfo.quantity) {
          toast({
            title: "Analysis Failed",
            description: "Could not automatically detect product and quantity. Please fill in manually.",
            variant: "destructive"
          });
          setAutoAnalysisActive(false);
          return;
        }
        
        const pricing = calculatePrice(parsedInfo.product, parsedInfo.quantity, mockProducts);
        
        if (!pricing) {
          toast({
            title: "Pricing Failed",
            description: `Detected ${parsedInfo.product} × ${parsedInfo.quantity} but couldn't determine pricing.`,
            variant: "destructive"
          });
          setAutoAnalysisActive(false);
          return;
        }
        
        setEmailData({
          ...emailData,
          productName: parsedInfo.product,
          quantity: parsedInfo.quantity,
          calculatedPrice: pricing.totalPrice
        });
        
        toast({
          title: "Auto-Analysis Complete",
          description: `Detected ${parsedInfo.product} × ${parsedInfo.quantity} with ${parsedInfo.confidence} confidence.`,
        });
        
        setQuoteGenerated(true);
      } catch (error) {
        console.error("Error in auto analysis:", error);
        toast({
          title: "Analysis Error",
          description: "An unexpected error occurred during email analysis.",
          variant: "destructive"
        });
      } finally {
        setAutoAnalysisActive(false);
      }
    }, 1500);
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Process Email Request</CardTitle>
        <CardDescription>
          {selectedEmail ? `Processing email: ${selectedEmail.subject}` : "Generate a quote from an email inquiry"}
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
            <div className="flex justify-between items-center">
              <Label htmlFor="body">Email Body</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1"
                onClick={handleAutoAnalyzeEmail}
                disabled={autoAnalysisActive}
              >
                <Wand2 className="h-3 w-3" /> 
                {autoAnalysisActive ? "Analyzing..." : "Auto-Analyze"}
              </Button>
            </div>
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
                  ₹{emailData.calculatedPrice.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Unit Price: ₹{(emailData.calculatedPrice / emailData.quantity).toFixed(2)} × {emailData.quantity} units
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

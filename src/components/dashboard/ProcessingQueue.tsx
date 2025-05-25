
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Send, Eye, X, RefreshCw, Zap, Edit, Check, AlertTriangle } from "lucide-react";
import { EmailMessage } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock emails that require manual processing
const mockPendingEmails: EmailMessage[] = [
  {
    id: "email-1",
    from: "john.doe@techcorp.com",
    subject: "Urgent: Need Digital Force Gauge Quote",
    body: "Hi, we need a quote for the ZTA-500N Digital Force Gauge. We're looking at ordering 2 units. Can you send pricing ASAP? This is for our quality control lab. Thanks!",
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "email-2", 
    from: "procurement@labsolutions.in",
    subject: "Request for Quotation - Glass Thermometers",
    body: "Dear Sir/Madam, We require quotation for Zeal England Glass Thermometer (Range: 10°C to 110°C). Quantity needed: 10 pieces. Please include your best pricing and delivery terms.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "email-3",
    from: "admin@metalworks.co.in", 
    subject: "Zero Plate Requirements",
    body: "Hello, we are interested in purchasing zero plates for our NDT testing. Specifically need: - Zero Plate Non-Ferrous (3 units) - Zero Plate Ferrous (2 units). Please provide detailed quotation.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "email-4",
    from: "quality@precisioneng.com",
    subject: "Metallic Plate Inquiry",
    body: "We need pricing for Zero microns metallic plate. Quantity: 5 pieces. Also, do you have any bulk discounts available? Please send your catalog as well.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  }
];

export function ProcessingQueue() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>(mockPendingEmails);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [quoteData, setQuoteData] = useState({
    product: "",
    quantity: 1,
    pricePerUnit: 0,
    totalAmount: 0,
    emailBody: ""
  });

  const detectQuoteInfo = (email: EmailMessage) => {
    const body = email.body.toLowerCase();
    const subject = email.subject.toLowerCase();
    const fullText = `${subject} ${body}`;
    
    if (fullText.includes("zta-500n") || fullText.includes("digital force gauge")) {
      return {
        product: "ZTA-500N- Digital Force Gauge",
        isQuoteRequest: true,
        confidence: "high"
      };
    }
    if (fullText.includes("glass thermometer") || fullText.includes("zeal england")) {
      return {
        product: "Zeal England Glass Thermometer Range : 10 Deg C -110 Deg C",
        isQuoteRequest: true,
        confidence: "high"
      };
    }
    if (fullText.includes("zero plate non-ferrous")) {
      return {
        product: "zero plate Non-Ferrous",
        isQuoteRequest: true,
        confidence: "medium"
      };
    }
    if (fullText.includes("zero plate ferrous")) {
      return {
        product: "zero plate Ferrous", 
        isQuoteRequest: true,
        confidence: "medium"
      };
    }
    if (fullText.includes("metallic plate") || fullText.includes("zero microns")) {
      return {
        product: "Zero microns metallic plate",
        isQuoteRequest: true,
        confidence: "medium"
      };
    }
    
    if (fullText.includes("quote") || fullText.includes("quotation") || fullText.includes("pricing")) {
      return {
        product: "Unknown",
        isQuoteRequest: true,
        confidence: "low"
      };
    }
    
    return {
      product: "Unknown",
      isQuoteRequest: false,
      confidence: "none"
    };
  };

  const handleAutoGenerateAll = async () => {
    setIsAutoGenerating(true);
    let successCount = 0;
    
    for (const email of emails) {
      const detection = detectQuoteInfo(email);
      if (detection.isQuoteRequest && detection.confidence !== "none") {
        // Simulate auto-generation
        await new Promise(resolve => setTimeout(resolve, 500));
        successCount++;
      }
    }
    
    setIsAutoGenerating(false);
    toast({
      title: "Auto-Generation Complete",
      description: `Generated quotes for ${successCount} emails automatically.`,
    });
  };

  const handleAutoSendAll = async () => {
    setIsAutoSending(true);
    let sentCount = 0;
    
    for (const email of emails) {
      const detection = detectQuoteInfo(email);
      if (detection.isQuoteRequest && detection.confidence === "high") {
        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 300));
        sentCount++;
      }
    }
    
    // Remove auto-sent emails
    const remainingEmails = emails.filter(email => {
      const detection = detectQuoteInfo(email);
      return !(detection.isQuoteRequest && detection.confidence === "high");
    });
    
    setEmails(remainingEmails);
    setIsAutoSending(false);
    
    toast({
      title: "Auto-Send Complete",
      description: `Sent ${sentCount} high-confidence quotes automatically.`,
    });
  };

  const handleEditEmail = (email: EmailMessage) => {
    const detection = detectQuoteInfo(email);
    
    const productPrices: Record<string, number> = {
      "ZTA-500N- Digital Force Gauge": 83200.00,
      "Zeal England Glass Thermometer Range : 10 Deg C -110 Deg C": 750.00,
      "zero plate Non-Ferrous": 1800.00,
      "zero plate Ferrous": 1800.00,
      "Zero microns metallic plate": 850.00
    };
    
    const price = productPrices[detection.product] || 1000;
    const defaultBody = `Dear Customer,

Thank you for your inquiry regarding ${detection.product || 'our products'}.

We are pleased to provide you with the following quotation:

Product: ${detection.product || 'Product Name'}
Quantity: 1 units
Unit Price: ₹${price.toFixed(2)}
Total Amount: ₹${price.toFixed(2)}

This quotation is valid for 30 days from the date of this email.

Please feel free to contact us if you have any questions.

Best regards,
Your Company Name`;

    setQuoteData({
      product: detection.product || "",
      quantity: 1,
      pricePerUnit: price,
      totalAmount: price,
      emailBody: defaultBody
    });
    
    setSelectedEmail(email);
    setShowEditDialog(true);
  };

  const handleSendQuote = (email: EmailMessage) => {
    handleEditEmail(email);
    setShowQuoteDialog(true);
    setShowEditDialog(false);
  };

  const handleConfirmQuote = () => {
    if (!selectedEmail) return;
    
    toast({
      title: "Quote Sent Successfully",
      description: `Quote sent to ${selectedEmail.from}`,
    });
    
    setEmails(emails.filter(e => e.id !== selectedEmail.id));
    setShowQuoteDialog(false);
    setSelectedEmail(null);
  };

  const handleRejectEmail = (emailId: string) => {
    setEmails(emails.filter(e => e.id !== emailId));
    toast({
      title: "Email Rejected",
      description: "Email has been removed from processing queue.",
    });
  };

  const handleRefresh = () => {
    toast({
      title: "Refreshing Queue",
      description: "Checking for new emails requiring manual processing...",
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Processing Queue</CardTitle>
              <CardDescription>
                Emails requiring manual review and quote generation
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAutoGenerateAll}
                disabled={isAutoGenerating}
              >
                <Zap className="h-4 w-4 mr-2" />
                {isAutoGenerating ? "Generating..." : "Auto Generate"}
              </Button>
              <Button 
                size="sm" 
                onClick={handleAutoSendAll}
                disabled={isAutoSending}
              >
                <Send className="h-4 w-4 mr-2" />
                {isAutoSending ? "Sending..." : "Auto Send All"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emails.length > 0 ? (
              emails.map((email) => {
                const detection = detectQuoteInfo(email);
                return (
                  <div
                    key={email.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{email.from}</span>
                          {detection.isQuoteRequest ? (
                            <Badge variant="default" className="bg-blue-500">
                              Quote Request
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Non-Quote
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className={
                              detection.confidence === "high" ? "border-green-500 text-green-700" :
                              detection.confidence === "medium" ? "border-yellow-500 text-yellow-700" :
                              "border-gray-500 text-gray-700"
                            }
                          >
                            {detection.confidence} confidence
                          </Badge>
                        </div>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {email.subject}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {new Date(email.date).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-700 line-clamp-2">
                          {email.body}
                        </div>
                        {detection.product !== "Unknown" && (
                          <div className="mt-2 text-sm text-blue-600">
                            Detected Product: {detection.product}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedEmail(email)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditEmail(email)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Quote
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRejectEmail(email.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleSendQuote(email)}
                        disabled={!detection.isQuoteRequest}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send Quote
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="mb-2">📭</div>
                <div>No emails in processing queue</div>
                <div className="text-sm">All caught up!</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Quote Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Quote Response</DialogTitle>
            <DialogDescription>
              Customize the quote before sending to: {selectedEmail?.from}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium">Original Email:</div>
                <div className="text-sm text-gray-600 mt-1">{selectedEmail.subject}</div>
                <div className="text-xs text-gray-500 mt-1 max-h-20 overflow-y-auto">
                  {selectedEmail.body}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Input
                    id="product"
                    value={quoteData.product}
                    onChange={(e) => setQuoteData({...quoteData, product: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quoteData.quantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value);
                      setQuoteData({
                        ...quoteData, 
                        quantity: qty,
                        totalAmount: qty * quoteData.pricePerUnit
                      });
                    }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pricePerUnit">Price per Unit (₹)</Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    step="0.01"
                    value={quoteData.pricePerUnit}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value);
                      setQuoteData({
                        ...quoteData,
                        pricePerUnit: price,
                        totalAmount: price * quoteData.quantity
                      });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="totalAmount">Total Amount (₹)</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={quoteData.totalAmount.toFixed(2)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="emailBody">Email Response</Label>
                <Textarea
                  id="emailBody"
                  rows={8}
                  value={quoteData.emailBody}
                  onChange={(e) => setQuoteData({...quoteData, emailBody: e.target.value})}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowEditDialog(false);
              setShowQuoteDialog(true);
            }}>
              <Check className="h-4 w-4 mr-2" />
              Preview & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Quote Confirmation Dialog */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Send Quote</DialogTitle>
            <DialogDescription>
              Review and confirm sending quote to {selectedEmail?.from}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium">Quote Summary:</div>
              <div className="text-sm mt-1">
                Product: {quoteData.product}<br/>
                Quantity: {quoteData.quantity} units<br/>
                Total: ₹{quoteData.totalAmount.toFixed(2)}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmQuote}>
              <Send className="h-4 w-4 mr-2" />
              Send Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ProcessingQueue;

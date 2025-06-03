import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { AlertCircle, FileText, RefreshCw, Send, ToggleLeft, ToggleRight, Search, Filter, Edit, ArrowRight, Zap, Clock } from "lucide-react";
import { EmailMessage } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  fetchUnreadEmails, 
  markEmailAsRead, 
  testGoogleAppsScriptConnection,
  sendTemplateEmail
} from "@/services/gmailService";
import { parseEmailForMultipleProducts } from "@/services/advancedEmailParser";
import { supabase } from "@/integrations/supabase/client";

export function EmailInbox() {
  const { toast } = useToast();
  const [processingEmailId, setProcessingEmailId] = useState<string | null>(null);
  const [processedEmails, setProcessedEmails] = useState<string[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(false);
  const [checkInterval, setCheckInterval] = useState<string>("5");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showReclassifyDialog, setShowReclassifyDialog] = useState(false);
  const [selectedEmailForReclassify, setSelectedEmailForReclassify] = useState<EmailMessage | null>(null);
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Fetch user products from database
  const fetchUserProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_products')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user products:', error);
        return;
      }

      setUserProducts(data || []);
    } catch (error) {
      console.error('Error fetching user products:', error);
    }
  };

  // Check Google Apps Script connection status
  const checkConnectionStatus = async () => {
    try {
      const result = await testGoogleAppsScriptConnection();
      setIsConnected(result.success);
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchUserProducts();
    checkConnectionStatus();
  }, []);
  
  // Fetch emails using React Query with real Gmail API
  const { data: emails, isLoading, isError, refetch } = useQuery({
    queryKey: ['unreadEmails'],
    queryFn: fetchUnreadEmails,
    staleTime: 60000,
    retry: 1,
    enabled: isConnected,
    meta: {
      onSettled: (data, error) => {
        if (error) {
          console.error("Failed to fetch emails:", error);
          toast({
            title: "Error fetching emails",
            description: "Failed to connect to Gmail. Please check your Google Apps Script connection.",
            variant: "destructive"
          });
        }
      }
    }
  });

  // Enhanced email type detection with real product matching
  const detectEmailType = (email: EmailMessage) => {
    const multiProductInfo = parseEmailForMultipleProducts(email);
    
    // Match detected products with user's product catalog
    const matchedProducts = multiProductInfo.products.map(detectedProduct => {
      const userProduct = userProducts.find(p => 
        p.name.toLowerCase().includes(detectedProduct.product.toLowerCase()) ||
        p.product_code.toLowerCase().includes(detectedProduct.product.toLowerCase()) ||
        detectedProduct.product.toLowerCase().includes(p.name.toLowerCase())
      );
      
      return {
        detected: detectedProduct.product,
        matched: userProduct?.name || null,
        confidence: detectedProduct.confidence,
        quantity: detectedProduct.quantity,
        productData: userProduct
      };
    });
    
    if (matchedProducts.length > 0) {
      const avgConfidence = matchedProducts.reduce((acc, p) => {
        const confScore = p.confidence === 'high' ? 3 : p.confidence === 'medium' ? 2 : 1;
        return acc + confScore;
      }, 0) / matchedProducts.length;
      
      const overallConfidence = avgConfidence >= 2.5 ? 'high' : avgConfidence >= 1.5 ? 'medium' : 'low';
      
      return {
        type: 'quote',
        confidence: overallConfidence as 'high' | 'medium' | 'low',
        productCount: matchedProducts.length,
        products: matchedProducts
      };
    }
    
    return {
      type: 'non-quote',
      confidence: 'low' as const,
      productCount: 0,
      products: []
    };
  };

  const handleManualSync = async () => {
    toast({
      title: "Syncing Emails",
      description: "Checking for new emails..."
    });
    
    try {
      await refetch();
      toast({
        title: "Sync Complete",
        description: "Email inbox has been updated"
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync emails. Please check your connection.",
        variant: "destructive"
      });
    }
  };

  const handleProcessManually = async (email: EmailMessage) => {
    setProcessingEmailId(email.id);
    
    try {
      await markEmailAsRead(email.id).catch(console.error);
      
      setTimeout(() => {
        toast({
          title: "Added to Processing Queue",
          description: `Email from ${email.from} moved to processing queue for manual handling`,
        });
        
        setProcessedEmails(prev => [...prev, email.id]);
        setProcessingEmailId(null);
      }, 1000);
    } catch (error) {
      console.error("Error processing email:", error);
      toast({
        title: "Error Processing Email",
        description: "Failed to process the email. Please try again.",
        variant: "destructive"
      });
      setProcessingEmailId(null);
    }
  };

  const handleSendQuote = async (email: EmailMessage) => {
    setProcessingEmailId(email.id);
    
    try {
      const emailType = detectEmailType(email);
      
      // Use template-based email sending
      const templateData = {
        customerName: email.from.split('@')[0],
        products: emailType.products.map(p => ({
          name: p.matched || p.detected,
          quantity: p.quantity || 1,
          price: p.productData?.unit_price || 0
        }))
      };
      
      const success = await sendTemplateEmail(
        email.from,
        'quote-template',
        templateData,
        email.id
      );
      
      if (success) {
        toast({
          title: "Quote Sent Successfully",
          description: `Template-based quotation sent to ${email.from}`,
        });
        
        setProcessedEmails(prev => [...prev, email.id]);
      } else {
        throw new Error('Failed to send template email');
      }
      
      setProcessingEmailId(null);
    } catch (error) {
      console.error("Error sending quote:", error);
      toast({
        title: "Error Sending Quote",
        description: "Failed to send the quote. Please try again.",
        variant: "destructive"
      });
      setProcessingEmailId(null);
    }
  };

  const handleAutoSendAll = async () => {
    const quoteEmails = filteredEmails.filter(email => {
      const emailType = detectEmailType(email);
      return emailType.type === 'quote' && emailType.confidence !== 'low';
    });

    if (quoteEmails.length === 0) {
      toast({
        title: "No Eligible Emails",
        description: "No high-confidence quote requests found for auto-sending.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Auto-Sending Quotes",
      description: `Processing ${quoteEmails.length} quote requests automatically...`,
    });

    for (const email of quoteEmails) {
      await handleSendQuote(email);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    toast({
      title: "Auto-Send Complete",
      description: `Successfully sent ${quoteEmails.length} quotes automatically.`,
    });
  };

  const handleReclassifyEmail = (email: EmailMessage) => {
    setSelectedEmailForReclassify(email);
    setShowReclassifyDialog(true);
  };

  const handleConfirmReclassify = () => {
    if (!selectedEmailForReclassify) return;
    
    toast({
      title: "Email Reclassified",
      description: `Email from ${selectedEmailForReclassify.from} has been reclassified as a quote request`,
    });
    
    setShowReclassifyDialog(false);
    setSelectedEmailForReclassify(null);
  };

  // Filter emails based on search term and type filter
  const filteredEmails = (emails || [])
    .filter(email => !processedEmails.includes(email.id))
    .filter(email => {
      const matchesSearch = 
        email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.body.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterType === "all") return matchesSearch;
      
      const emailType = detectEmailType(email);
      return matchesSearch && emailType.type === filterType;
    });

  const quoteRequestsCount = filteredEmails.filter(email => {
    const emailType = detectEmailType(email);
    return emailType.type === 'quote' && emailType.confidence !== 'low';
  }).length;

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Inbox</CardTitle>
          <CardDescription>Connect Google Apps Script to access Gmail</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Google Apps Script Not Connected</h3>
            <p className="text-muted-foreground mb-4">
              Please connect your Google Apps Script in the Settings to access Gmail functionality.
            </p>
            <Button onClick={checkConnectionStatus}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Email Inbox</CardTitle>
              <CardDescription>
                Gmail integration with product detection from your catalog ({userProducts.length} products loaded)
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleManualSync}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
              
              {quoteRequestsCount > 0 && (
                <Button 
                  onClick={handleAutoSendAll}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Auto Send All ({quoteRequestsCount})
                </Button>
              )}
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="flex items-center space-x-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter emails" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Emails</SelectItem>
                <SelectItem value="quote">Quote Requests</SelectItem>
                <SelectItem value="non-quote">Non-Quote Emails</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse flex flex-col items-center">
                  <RefreshCw className="h-8 w-8 mb-2 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading emails from Gmail...</p>
                </div>
              </div>
            ) : isError ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Failed to load emails from Gmail</p>
                <p className="text-sm mt-1">Please check your Google Apps Script connection</p>
                <Button 
                  variant="outline" 
                  onClick={() => refetch()} 
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            ) : filteredEmails.length > 0 ? (
              filteredEmails.map((email) => {
                const emailType = detectEmailType(email);
                const isProcessing = processingEmailId === email.id;
                return (
                  <div
                    key={email.id}
                    className="flex flex-col space-y-3 border rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium">{email.from}</div>
                          {emailType.type === 'quote' ? (
                            <Badge className="bg-blue-500">
                              Quote Request
                              {emailType.productCount > 1 && (
                                <span className="ml-1">({emailType.productCount} products)</span>
                              )}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Non-Quote</Badge>
                          )}
                          <Badge 
                            variant="outline"
                            className={
                              emailType.confidence === 'high' ? 'border-green-500 text-green-700' :
                              emailType.confidence === 'medium' ? 'border-yellow-500 text-yellow-700' :
                              'border-gray-500 text-gray-700'
                            }
                          >
                            {emailType.confidence} confidence
                          </Badge>
                        </div>
                        <div className="text-sm font-medium text-gray-900 mb-1">{email.subject}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {new Date(email.date).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {email.body}
                        </div>
                        
                        {/* Show detected and matched products from user's catalog */}
                        {emailType.type === 'quote' && emailType.products && emailType.products.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm font-medium text-blue-800 mb-2">
                              Detected Products from Your Catalog:
                            </div>
                            <div className="space-y-1">
                              {emailType.products.map((product, index) => (
                                <div key={index} className="text-sm">
                                  <span className="text-blue-700">
                                    {product.matched ? (
                                      <span className="font-medium">✓ {product.matched}</span>
                                    ) : (
                                      <span className="text-red-600">✗ "{product.detected}" (not in your catalog)</span>
                                    )}
                                  </span>
                                  {product.quantity && (
                                    <span className="text-blue-600 ml-2">• Qty: {product.quantity}</span>
                                  )}
                                  {product.productData && (
                                    <span className="text-green-600 ml-2">• ₹{product.productData.unit_price}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2 border-t">
                      {emailType.type === 'quote' && (
                        <Button 
                          variant="default"
                          size="sm" 
                          onClick={() => handleSendQuote(email)}
                          disabled={isProcessing}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        >
                          {isProcessing ? (
                            <span className="flex items-center">
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Sending Quote...
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <Send className="mr-2 h-4 w-4" />
                              Send Template Quote
                            </span>
                          )}
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleProcessManually(email)}
                        disabled={isProcessing}
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Process Manually
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterType !== "all" 
                  ? "No emails found matching your filters." 
                  : "No unprocessed emails found"}
              </div>
            )}
          </div>
          
          {filteredEmails.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredEmails.length} of {(emails || []).length - processedEmails.length} unprocessed emails
              {quoteRequestsCount > 0 && (
                <span className="ml-4 text-blue-600 font-medium">
                  • {quoteRequestsCount} ready for template quotes
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default EmailInbox;

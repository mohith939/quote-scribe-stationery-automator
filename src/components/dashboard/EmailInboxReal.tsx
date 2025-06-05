
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, User, Clock, Send, CheckCircle, RefreshCw, Eye } from "lucide-react";
import { EmailMessage } from "@/types";
import { fetchUnreadEmails } from "@/services/gmailService";
import { EmailViewDialog } from "./EmailViewDialog";
import { mockProducts } from "@/data/mockData";

export function EmailInboxReal() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [scriptUrl, setScriptUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load saved script URL on component mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('google_apps_script_url');
    if (savedUrl) {
      setScriptUrl(savedUrl);
    }
  }, []);

  // Save script URL to localStorage whenever it changes
  useEffect(() => {
    if (scriptUrl.trim()) {
      localStorage.setItem('google_apps_script_url', scriptUrl);
    }
  }, [scriptUrl]);

  // Enhanced product detection function
  const enhanceProductDetection = (email: EmailMessage): EmailMessage => {
    const emailText = (email.body + ' ' + email.subject).toLowerCase();
    const detectedProducts = [];

    // Check each product in the catalog
    for (const product of mockProducts) {
      const productName = product.name.toLowerCase();
      const productCode = product.product_code.toLowerCase();
      const brand = product.brand?.toLowerCase() || '';
      
      // Check for exact matches or close matches
      if (emailText.includes(productName) || 
          emailText.includes(productCode) ||
          (brand && emailText.includes(brand))) {
        
        // Try to extract quantity
        const quantityRegex = /(\d+)\s*(?:pieces?|pcs?|units?|nos?|\s|$)/gi;
        const matches = emailText.match(quantityRegex);
        let quantity = 1;
        
        if (matches && matches.length > 0) {
          const nums = matches.map(m => parseInt(m.match(/\d+/)?.[0] || '1'));
          quantity = Math.max(...nums);
        }

        detectedProducts.push({
          product: product.name, // Use full product name instead of ID
          quantity: quantity,
          confidence: 'medium' as const,
          productCode: product.product_code,
          brand: product.brand
        });
      }
    }

    return {
      ...email,
      detectedProducts,
      isQuoteRequest: detectQuoteRequest(email.body + ' ' + email.subject) || detectedProducts.length > 0,
      confidence: detectedProducts.length > 0 ? 'medium' as const : 'low' as const,
      processingStatus: 'pending' as const,
      category: 'general' as const
    };
  };

  const handleSubmit = async () => {
    if (!scriptUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter your Google Apps Script URL",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Store the script URL for the gmailService to use
      localStorage.setItem('google_apps_script_url', scriptUrl);
      
      console.log('Fetching emails from Gmail...');
      const fetchedEmails = await fetchUnreadEmails(20, true); // Force refresh, get up to 20 emails
      
      // Process emails with enhanced product detection
      const processedEmails = fetchedEmails.map((email: EmailMessage) => 
        enhanceProductDetection(email)
      );
      
      setEmails(processedEmails);
      
      toast({
        title: "Emails Fetched Successfully",
        description: `Found ${processedEmails.length} unread emails`,
      });

      console.log(`Successfully fetched ${processedEmails.length} emails`);

    } catch (error) {
      console.error('Error fetching emails:', error);
      
      let errorMessage = "Failed to fetch emails";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Fetch Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const detectQuoteRequest = (text: string): boolean => {
    const keywords = [
      'quote', 'quotation', 'pricing', 'price', 'cost', 'estimate',
      'how much', 'inquiry', 'enquiry', 'interested in', 'purchase',
      'buy', 'order', 'supply', 'provide', 'need', 'require'
    ];
    
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const extractSenderName = (fromField: string) => {
    const match = fromField.match(/^(.+?)\s*<.+>$/);
    return match ? match[1].trim().replace(/['"]/g, '') : fromField;
  };

  const handleProcessQuote = (email: EmailMessage) => {
    toast({
      title: "Email Added to Processing Queue",
      description: `Email from ${extractSenderName(email.from)} moved to processing queue`,
    });
    
    const remainingEmails = emails.filter(e => e.id !== email.id);
    setEmails(remainingEmails);
  };

  const handleRefresh = () => {
    if (scriptUrl.trim()) {
      handleSubmit();
    } else {
      toast({
        title: "URL Required",
        description: "Please enter your Google Apps Script URL first",
        variant: "destructive"
      });
    }
  };

  const handleViewFullEmail = (email: EmailMessage) => {
    setSelectedEmail(email);
    setIsDialogOpen(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <div>
            <CardTitle>Email Inbox</CardTitle>
            <CardDescription>Connect to Gmail via Google Apps Script</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="scriptUrl">Google Apps Script URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="scriptUrl"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                className="flex-1"
              />
              <Button 
                onClick={handleSubmit}
                disabled={isLoading || !scriptUrl.trim()}
              >
                {isLoading ? 'Fetching...' : 'Fetch Emails'}
              </Button>
              {emails.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {emails.length === 0 && !isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No emails loaded</h3>
            <p className="text-sm">Enter your Apps Script URL and click "Fetch Emails" to load your unread Gmail messages</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300 animate-pulse" />
            <h3 className="text-lg font-medium mb-2">Fetching emails...</h3>
            <p className="text-sm">Loading your unread messages from Gmail</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {emails.length} Email{emails.length !== 1 ? 's' : ''} Found
              </Badge>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {emails.map((email) => (
                <div key={email.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-900 truncate">
                          {extractSenderName(email.from)}
                        </span>
                        {email.isQuoteRequest ? (
                          <Badge className="bg-green-100 text-green-800">Quote Request</Badge>
                        ) : (
                          <Badge variant="outline">General Email</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {email.subject}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-500 ml-4">
                      <Clock className="h-4 w-4" />
                      {formatDate(email.date)}
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded mb-2">
                    <p>{email.body?.substring(0, 150)}...</p>
                  </div>

                  {/* Show detected products */}
                  {email.detectedProducts && email.detectedProducts.length > 0 && (
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1">
                        {email.detectedProducts.map((product, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                            {product.product} (Qty: {product.quantity})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      ID: {email.id.substring(0, 8)}...
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewFullEmail(email)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Full Email
                      </Button>
                      {email.isQuoteRequest ? (
                        <Button
                          size="sm"
                          onClick={() => handleProcessQuote(email)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Process Quote
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <EmailViewDialog 
          email={selectedEmail}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      </CardContent>
    </Card>
  );
}

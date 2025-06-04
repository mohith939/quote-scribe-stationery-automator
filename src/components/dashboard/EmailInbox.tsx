
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Mail, RefreshCw, Inbox, User, Clock, AlertCircle, Reply, CheckCircle } from "lucide-react";
import { EmailMessage } from "@/types";
import { createIMAPService } from "@/services/imapEmailService";

export function EmailInbox() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);

  // Check for stored credentials on component mount
  useEffect(() => {
    const storedCredentials = localStorage.getItem('imap_credentials');
    if (storedCredentials) {
      setIsConnected(true);
    }
  }, []);

  const fetchEmails = async () => {
    const storedCredentials = localStorage.getItem('imap_credentials');
    if (!storedCredentials) {
      toast({
        title: "Not Connected",
        description: "Please configure your email connection in Settings first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const credentials = JSON.parse(storedCredentials);
      const imapService = createIMAPService(credentials.email, credentials.password);
      
      const fetchedEmails = await imapService.fetchUnreadEmails(20);
      setEmails(fetchedEmails);
      
      toast({
        title: "Emails Fetched",
        description: `Found ${fetchedEmails.length} unread emails`,
      });
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: "Fetch Failed",
        description: "Unable to fetch emails. Check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessQuote = async (email: EmailMessage) => {
    setSelectedEmail(email);
    
    // Generate a quote response
    const quoteResponse = generateQuoteResponse(email);
    
    try {
      const storedCredentials = localStorage.getItem('imap_credentials');
      if (storedCredentials) {
        const credentials = JSON.parse(storedCredentials);
        const imapService = createIMAPService(credentials.email, credentials.password);
        
        const sent = await imapService.sendReply(
          email.from,
          `Re: ${email.subject}`,
          quoteResponse,
          email.id
        );
        
        if (sent) {
          // Mark as read
          await imapService.markAsRead(email.id);
          
          toast({
            title: "Quote Sent",
            description: `Quote response sent to ${extractSenderName(email.from)}`,
          });
          
          // Remove from unread list
          setEmails(prev => prev.filter(e => e.id !== email.id));
        }
      }
    } catch (error) {
      console.error('Error processing quote:', error);
      toast({
        title: "Error",
        description: "Failed to send quote response",
        variant: "destructive",
      });
    }
  };

  const generateQuoteResponse = (email: EmailMessage): string => {
    const senderName = extractSenderName(email.from);
    
    return `Dear ${senderName},

Thank you for your interest in our products. Based on your inquiry, here's our quote:

${email.products?.map((product, index) => {
      const quantity = email.quantities?.[index]?.quantity || 1;
      const unitPrice = getProductPrice(product);
      const total = quantity * unitPrice;
      
      return `• ${product}: ${quantity} units × $${unitPrice.toFixed(2)} = $${total.toFixed(2)}`;
    }).join('\n') || 'Please contact us for detailed pricing.'}

Subtotal: $${calculateTotal(email)}
Tax (18%): $${(calculateTotal(email) * 0.18).toFixed(2)}
Total: $${(calculateTotal(email) * 1.18).toFixed(2)}

This quote is valid for 30 days. We offer bulk discounts for larger quantities.

Best regards,
Sales Team
Your Business Name

P.S. This is an automated quote response. For custom requirements, please reply to this email.`;
  };

  const getProductPrice = (product: string): number => {
    const prices: { [key: string]: number } = {
      'A4 Paper': 0.35,
      'Ballpoint Pens': 1.00,
      'Blue Pens': 1.00,
      'Staplers': 7.25,
      'Office Supplies': 5.00
    };
    
    // Find matching product or return default
    const matchedProduct = Object.keys(prices).find(p => 
      product.toLowerCase().includes(p.toLowerCase())
    );
    
    return matchedProduct ? prices[matchedProduct] : 2.50;
  };

  const calculateTotal = (email: EmailMessage): number => {
    if (!email.products || !email.quantities) return 0;
    
    return email.products.reduce((total, product, index) => {
      const quantity = email.quantities?.[index]?.quantity || 1;
      const unitPrice = getProductPrice(product);
      return total + (quantity * unitPrice);
    }, 0);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const extractSenderName = (fromField: string) => {
    const match = fromField.match(/^(.+?)\s*<.+>$/);
    return match ? match[1].trim().replace(/['"]/g, '') : fromField.split('@')[0];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Email Inbox</CardTitle>
              <CardDescription>Process unread emails and send quote responses</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {isConnected && (
              <Button 
                onClick={fetchEmails}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Fetching...' : 'Fetch Emails'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {!isConnected ? (
          <div className="text-center py-12 text-slate-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">Email Not Connected</h3>
            <p className="text-sm mb-4">Configure your email connection in Settings to start fetching emails</p>
          </div>
        ) : emails.length === 0 && !isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <Inbox className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No unread emails</h3>
            <p className="text-sm mb-4">Click "Fetch Emails" to check for new messages</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 text-slate-300 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Fetching emails...</h3>
            <p className="text-sm">Please wait while we retrieve your messages</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {emails.length} Unread Email{emails.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {emails.map((email) => (
                <div key={email.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-900 truncate">
                          {extractSenderName(email.from)}
                        </span>
                        {email.isQuoteRequest && (
                          <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">
                            Quote Request
                          </Badge>
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
                  
                  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded mb-3">
                    <p className="line-clamp-3">{email.snippet || email.body?.substring(0, 200) + '...'}</p>
                  </div>

                  {email.products && email.products.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-slate-600 mb-1">Detected Products:</p>
                      <div className="flex flex-wrap gap-1">
                        {email.products.map((product, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {product} ({email.quantities?.[index]?.quantity || 1})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {email.hasAttachments && (
                    <Badge variant="outline" className="text-xs mb-3">
                      📎 Attachments
                    </Badge>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Confidence: {email.confidence || 'medium'}
                      </Badge>
                      {email.confidence === 'high' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProcessQuote(email)}
                      disabled={!email.isQuoteRequest}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Send Quote
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EmailInbox;

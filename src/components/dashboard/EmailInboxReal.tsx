
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, User, Clock, Send, CheckCircle, RefreshCw, Eye, Settings, Play, Pause } from "lucide-react";
import { EmailMessage } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchUnreadEmails } from "@/services/gmailService";
import { EmailViewDialog } from "./EmailViewDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function EmailInboxReal() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [scriptUrl, setScriptUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAutoSync, setIsAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState<number>(30000); // 30 seconds default
  const [showUrlConfig, setShowUrlConfig] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create user-specific storage keys
  const getUserStorageKey = (key: string) => {
    return user ? `${key}_${user.id}` : key;
  };

  // Load persisted data on component mount
  useEffect(() => {
    if (user) {
      const savedScriptUrl = localStorage.getItem(getUserStorageKey('gmail_script_url'));
      if (savedScriptUrl) {
        setScriptUrl(savedScriptUrl);
      }

      const savedEmails = localStorage.getItem(getUserStorageKey('gmail_emails'));
      if (savedEmails) {
        try {
          const parsedEmails = JSON.parse(savedEmails);
          setEmails(parsedEmails);
        } catch (error) {
          console.error('Error parsing saved emails:', error);
        }
      }
    }
  }, [user]);

  // Save script URL whenever it changes
  useEffect(() => {
    if (user && scriptUrl) {
      localStorage.setItem(getUserStorageKey('gmail_script_url'), scriptUrl);
    }
  }, [scriptUrl, user]);

  // Save emails whenever they change
  useEffect(() => {
    if (user && emails.length > 0) {
      localStorage.setItem(getUserStorageKey('gmail_emails'), JSON.stringify(emails));
    }
  }, [emails, user]);

  // Auto-sync functionality
  useEffect(() => {
    if (isAutoSync && scriptUrl) {
      intervalRef.current = setInterval(() => {
        handleFetchEmails(true);
      }, syncInterval);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoSync, syncInterval, scriptUrl]);

  const handleFetchEmails = async (isAutoFetch = false) => {
    if (!scriptUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please configure your Google Apps Script URL",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const fetchedEmails = await fetchUnreadEmails(20, true);
      
      // Process emails with enhanced product detection
      const processedEmails = fetchedEmails.map((email: EmailMessage) => ({
        ...email,
        isQuoteRequest: detectQuoteRequest(email.body + ' ' + email.subject),
        confidence: 'medium' as const,
        processingStatus: 'pending' as const,
        category: 'general' as const,
        detectedProducts: detectProducts(email.body + ' ' + email.subject)
      }));
      
      setEmails(processedEmails);
      
      if (!isAutoFetch) {
        toast({
          title: "Emails Refreshed",
          description: `Successfully fetched ${processedEmails.length} unread emails`,
        });
      }

    } catch (error) {
      console.error('Error fetching emails:', error);
      
      if (!isAutoFetch) {
        toast({
          title: "Fetch Failed",
          description: error instanceof Error ? error.message : "Failed to fetch emails",
          variant: "destructive"
        });
      }
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

  const detectProducts = (text: string) => {
    // This would integrate with Product Catalog data
    // For now, using basic product detection
    const productKeywords = [
      { name: 'Laptop', confidence: 'high' as const },
      { name: 'Phone', confidence: 'high' as const },
      { name: 'Tablet', confidence: 'medium' as const }
    ];
    
    const lowerText = text.toLowerCase();
    return productKeywords.filter(product => 
      lowerText.includes(product.name.toLowerCase())
    ).map(product => ({
      product: product.name,
      quantity: 1,
      confidence: product.confidence,
      productCode: `${product.name.toUpperCase()}-001`,
      brand: 'Generic'
    }));
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
    return match ? match[1].trim().replace(/['"]/g, '') : fromField;
  };

  const handleViewFullEmail = (email: EmailMessage) => {
    setSelectedEmail(email);
    setIsViewDialogOpen(true);
  };

  const handleProcessQuote = (email: EmailMessage) => {
    toast({
      title: "Email Added to Processing Queue",
      description: `Email from ${extractSenderName(email.from)} moved to processing queue`,
    });
    
    const remainingEmails = emails.filter(e => e.id !== email.id);
    setEmails(remainingEmails);
  };

  const clearAllData = () => {
    if (user) {
      localStorage.removeItem(getUserStorageKey('gmail_script_url'));
      localStorage.removeItem(getUserStorageKey('gmail_emails'));
      setScriptUrl('');
      setEmails([]);
      setIsAutoSync(false);
      toast({
        title: "Data Cleared",
        description: "All email data and settings have been cleared",
      });
    }
  };

  const toggleAutoSync = () => {
    setIsAutoSync(!isAutoSync);
    toast({
      title: isAutoSync ? "Auto-sync Disabled" : "Auto-sync Enabled",
      description: isAutoSync 
        ? "Automatic email syncing has been stopped"
        : `Auto-syncing every ${syncInterval / 1000} seconds`,
    });
  };

  const getSyncIntervalLabel = (interval: number) => {
    if (interval < 60000) return `${interval / 1000}s`;
    return `${interval / 60000}m`;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with URL Configuration */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Email Inbox</h1>
            <p className="text-slate-600">Manage and process incoming emails</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowUrlConfig(!showUrlConfig)}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Configure
        </Button>
      </div>

      {/* URL Configuration Panel */}
      {showUrlConfig && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Google Apps Script Configuration</CardTitle>
            <CardDescription>Enter your Google Apps Script URL to connect with Gmail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="scriptUrl">Apps Script URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="scriptUrl"
                  value={scriptUrl}
                  onChange={(e) => setScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleFetchEmails()}
                  disabled={isLoading || !scriptUrl.trim()}
                  className="px-6"
                >
                  {isLoading ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </div>
            
            {scriptUrl && (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  ✓ Apps Script URL Configured
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllData}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Email Management Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              onClick={() => handleFetchEmails()}
              disabled={isLoading || !scriptUrl.trim()}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Fetching...' : 'Fetch Emails'}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant={isAutoSync ? "default" : "outline"}
                onClick={toggleAutoSync}
                disabled={!scriptUrl.trim()}
                className="gap-2"
              >
                {isAutoSync ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                Auto-sync
              </Button>
              
              {isAutoSync && (
                <Select value={syncInterval.toString()} onValueChange={(value) => setSyncInterval(parseInt(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30000">30s</SelectItem>
                    <SelectItem value="60000">1m</SelectItem>
                    <SelectItem value="300000">5m</SelectItem>
                    <SelectItem value="900000">15m</SelectItem>
                    <SelectItem value="1800000">30m</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {emails.length > 0 && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {emails.length} Email{emails.length !== 1 ? 's' : ''} • 
                {emails.filter(e => e.isQuoteRequest).length} Quote Request{emails.filter(e => e.isQuoteRequest).length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email List */}
      {emails.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2 text-slate-700">No emails loaded</h3>
            <p className="text-sm text-slate-500 mb-4">
              Configure your Apps Script URL and fetch emails to get started
            </p>
            <Button onClick={() => setShowUrlConfig(true)} variant="outline">
              Configure Now
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-spin" />
            <h3 className="text-lg font-medium mb-2 text-slate-700">Fetching emails...</h3>
            <p className="text-sm text-slate-500">Loading your unread messages</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {emails.map((email) => (
            <Card key={email.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-900">
                        {extractSenderName(email.from)}
                      </span>
                      {email.isQuoteRequest ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Quote Request
                        </Badge>
                      ) : (
                        <Badge variant="outline">General Email</Badge>
                      )}
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formatDate(email.date)}
                      </div>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2 leading-tight">
                      {email.subject}
                    </h3>
                  </div>
                </div>
                
                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg mb-4 border">
                  <p className="line-clamp-2">{email.body?.substring(0, 200)}...</p>
                </div>

                {email.detectedProducts && email.detectedProducts.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Detected Products:</p>
                    <div className="flex flex-wrap gap-2">
                      {email.detectedProducts.map((product, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {product.product} (Qty: {product.quantity})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono">
                    ID: {email.id.substring(0, 12)}...
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewFullEmail(email)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Full
                    </Button>
                    {email.isQuoteRequest ? (
                      <Button
                        size="sm"
                        onClick={() => handleProcessQuote(email)}
                        className="bg-green-600 hover:bg-green-700 gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Process Quote
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Email View Dialog */}
      <EmailViewDialog
        email={selectedEmail}
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
      />
    </div>
  );
}

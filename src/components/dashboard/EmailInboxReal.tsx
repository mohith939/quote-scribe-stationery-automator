import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, User, Clock, Send, CheckCircle, Loader2 } from "lucide-react";
import { EmailMessage } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";

export function EmailInboxReal() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [scriptUrl, setScriptUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');

  // Create user-specific storage keys
  const getUserStorageKey = (key: string) => {
    return user ? `${key}_${user.id}` : key;
  };

  // Load persisted data on component mount
  useEffect(() => {
    if (user) {
      // Load script URL for this user
      const savedScriptUrl = localStorage.getItem(getUserStorageKey('gmail_script_url'));
      if (savedScriptUrl) {
        setScriptUrl(savedScriptUrl);
      }

      // Load emails for this user
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
    setLoadingProgress('Connecting to Google Apps Script...');
    
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      setLoadingProgress('Fetching unread emails...');
      
      const response = await fetch(`${scriptUrl}?action=fetchUnreadEmails&_=${Date.now()}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      setLoadingProgress('Processing email data...');
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const fetchedEmails = data.emails || [];
      
      setLoadingProgress('Analyzing emails for quote requests...');
      
      // Process emails with quote detection
      const processedEmails = fetchedEmails.map((email: any) => ({
        ...email,
        isQuoteRequest: detectQuoteRequest(email.body + ' ' + email.subject),
        confidence: 'medium' as const,
        processingStatus: 'pending' as const,
        category: 'general' as const
      }));
      
      setEmails(processedEmails);
      
      toast({
        title: "Success!",
        description: `Fetched ${processedEmails.length} unread emails in ${Math.round(performance.now() / 1000)}s`,
      });

    } catch (error) {
      console.error('Error fetching emails:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        toast({
          title: "Request Timeout",
          description: "Email fetch took too long. Try again or check your Apps Script URL.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Fetch Failed",
          description: error instanceof Error ? error.message : "Failed to fetch emails",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
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

  const clearAllData = () => {
    if (user) {
      localStorage.removeItem(getUserStorageKey('gmail_script_url'));
      localStorage.removeItem(getUserStorageKey('gmail_emails'));
      setScriptUrl('');
      setEmails([]);
      toast({
        title: "Data Cleared",
        description: "Script URL and emails have been cleared",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <div>
            <CardTitle>Email Inbox</CardTitle>
            <CardDescription>Enter your Google Apps Script URL to fetch emails</CardDescription>
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
                disabled={isLoading}
              />
              <Button 
                onClick={handleSubmit}
                disabled={isLoading || !scriptUrl.trim()}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Fetch Emails'
                )}
              </Button>
            </div>
            {isLoading && loadingProgress && (
              <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                {loadingProgress}
              </div>
            )}
          </div>
          
          {scriptUrl && !isLoading && (
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                Apps Script URL Configured
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllData}
                className="text-red-600 hover:text-red-700"
              >
                Clear Data
              </Button>
            </div>
          )}
        </div>

        {emails.length === 0 && !isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No emails loaded</h3>
            <p className="text-sm">Enter your Apps Script URL and click "Fetch Emails" to load your unread Gmail messages</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              <div>
                <h3 className="text-lg font-medium mb-2">Fetching emails...</h3>
                <p className="text-sm">{loadingProgress || 'Loading your unread messages'}</p>
              </div>
            </div>
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
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      ID: {email.id.substring(0, 8)}...
                    </Badge>
                    <div className="flex gap-2">
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
      </CardContent>
    </Card>
  );
}

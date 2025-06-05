import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, User, Clock, Send, CheckCircle, RefreshCw } from "lucide-react";
import { EmailMessage } from "@/types";
import { fetchUnreadEmails } from "@/services/gmailService";

export function EmailInboxReal() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [scriptUrl, setScriptUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      
      // Process emails with quote detection
      const processedEmails = fetchedEmails.map((email: EmailMessage) => ({
        ...email,
        isQuoteRequest: detectQuoteRequest(email.body + ' ' + email.subject),
        confidence: 'medium' as const,
        processingStatus: 'pending' as const,
        category: 'general' as const
      }));
      
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

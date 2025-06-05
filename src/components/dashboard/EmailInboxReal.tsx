
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, User, Clock, Send, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { EmailMessage } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";

export function EmailInboxReal() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [scriptUrl, setScriptUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<string>('');

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

      // Load last fetch time
      const savedLastFetch = localStorage.getItem(getUserStorageKey('last_fetch_time'));
      if (savedLastFetch) {
        setLastFetchTime(savedLastFetch);
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

  const testConnection = async () => {
    if (!scriptUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter your Google Apps Script URL first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Testing connection to:', scriptUrl);
      const response = await fetch(`${scriptUrl}?action=testConnection&_=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Test connection response:', data);
      
      if (data.success) {
        toast({
          title: "Connection Successful",
          description: `Found ${data.emailCount || 0} unread emails. Gmail integration is working!`,
        });
      } else {
        throw new Error(data.error || 'Connection test failed');
      }

    } catch (error) {
      console.error('Connection test failed:', error);
      
      let errorMessage = 'Connection test failed';
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = 'CORS error - Make sure your Apps Script is deployed with "Anyone" access';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error - Check your Apps Script URL and deployment';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchEmails = async () => {
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
      console.log('Fetching emails from:', scriptUrl);
      
      // Use the correct action parameter that matches our Apps Script
      const response = await fetch(`${scriptUrl}?action=getAllUnreadEmails&maxResults=50&_=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log('Response received, length:', text.length);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw response:', text.substring(0, 1000));
        throw new Error('Invalid response from Apps Script. Check the script logs.');
      }
      
      console.log('Parsed response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch emails');
      }
      
      const fetchedEmails = data.emails || [];
      
      // Process emails with enhanced quote detection
      const processedEmails = fetchedEmails.map((email: any) => ({
        ...email,
        isQuoteRequest: email.isQuoteRequest || detectQuoteRequest(email.body + ' ' + email.subject),
        confidence: email.confidence || 'medium',
        processingStatus: email.processingStatus || 'pending',
        category: email.category || 'general'
      }));
      
      setEmails(processedEmails);
      
      // Save last fetch time
      const currentTime = new Date().toLocaleString();
      setLastFetchTime(currentTime);
      localStorage.setItem(getUserStorageKey('last_fetch_time'), currentTime);
      
      toast({
        title: "Emails Fetched Successfully",
        description: `Found ${processedEmails.length} unread emails`,
      });

    } catch (error) {
      console.error('Error fetching emails:', error);
      
      let errorMessage = 'Failed to fetch emails';
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = 'CORS error - Check Apps Script deployment settings';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error - Verify Apps Script URL and permissions';
        } else {
          errorMessage = error.message;
        }
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

  const clearAllData = () => {
    if (user) {
      localStorage.removeItem(getUserStorageKey('gmail_script_url'));
      localStorage.removeItem(getUserStorageKey('gmail_emails'));
      localStorage.removeItem(getUserStorageKey('last_fetch_time'));
      setScriptUrl('');
      setEmails([]);
      setLastFetchTime('');
      toast({
        title: "Data Cleared",
        description: "All saved data has been cleared",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <div>
            <CardTitle>Gmail Email Inbox</CardTitle>
            <CardDescription>Connect to your Google Apps Script to fetch emails</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="scriptUrl">Google Apps Script Web App URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="scriptUrl"
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                className="flex-1"
              />
              <Button 
                onClick={testConnection}
                variant="outline"
                disabled={isLoading || !scriptUrl.trim()}
              >
                {isLoading ? 'Testing...' : 'Test'}
              </Button>
              <Button 
                onClick={handleFetchEmails}
                disabled={isLoading || !scriptUrl.trim()}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Fetch Emails'
                )}
              </Button>
            </div>
          </div>
          
          {scriptUrl && (
            <div className="flex gap-2 items-center flex-wrap">
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                Apps Script URL Configured
              </Badge>
              {lastFetchTime && (
                <Badge variant="outline" className="text-xs">
                  Last fetch: {lastFetchTime}
                </Badge>
              )}
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

        {/* Setup Instructions */}
        {!scriptUrl && (
          <div className="rounded-md bg-blue-50 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Setup Instructions</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Copy the complete Apps Script code from src/reference/FinalCompleteGoogleAppsScript.js</li>
                    <li>Go to script.google.com and create a new project</li>
                    <li>Replace all code with the copied script</li>
                    <li>Deploy as Web app with "Execute as: Me" and "Who has access: Anyone"</li>
                    <li>Copy the web app URL and paste it above</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {emails.length === 0 && !isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No emails loaded</h3>
            <p className="text-sm">Configure your Apps Script URL and click "Fetch Emails" to load your unread Gmail messages</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 text-slate-300 animate-spin" />
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
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        ID: {email.id.substring(0, 8)}...
                      </Badge>
                      {email.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {email.confidence} confidence
                        </Badge>
                      )}
                    </div>
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

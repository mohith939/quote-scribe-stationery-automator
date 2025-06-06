
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, User, Clock, Send } from "lucide-react";
import { EmailMessage } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { EmailRefreshButton } from "./EmailRefreshButton";
import { EmailClassificationBadge } from "./EmailClassificationBadge";
import { classifyEmail, getDisplayText, EmailClassification } from "@/services/emailClassificationService";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EnhancedEmailMessage extends EmailMessage {
  classification: EmailClassification;
}

export function EmailInboxReal() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [emails, setEmails] = useState<EnhancedEmailMessage[]>([]);
  const [scriptUrl, setScriptUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Fetch products for classification
  const { data: products = [] } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_products')
        .select('*')
        .eq('user_id', user.id)
        .limit(1000);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

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
          // Re-classify emails with current products
          const enhancedEmails = parsedEmails.map((email: EmailMessage) => ({
            ...email,
            classification: classifyEmail(email, products)
          }));
          setEmails(enhancedEmails);
        } catch (error) {
          console.error('Error parsing saved emails:', error);
        }
      }

      const savedLastFetch = localStorage.getItem(getUserStorageKey('last_fetch_time'));
      if (savedLastFetch) {
        setLastFetchTime(new Date(savedLastFetch));
      }
    }
  }, [user, products]);

  // Save data whenever it changes
  useEffect(() => {
    if (user && scriptUrl) {
      localStorage.setItem(getUserStorageKey('gmail_script_url'), scriptUrl);
    }
  }, [scriptUrl, user]);

  useEffect(() => {
    if (user && emails.length > 0) {
      localStorage.setItem(getUserStorageKey('gmail_emails'), JSON.stringify(emails));
    }
  }, [emails, user]);

  const fetchEmails = async (incremental = false) => {
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
      let url = `${scriptUrl}?action=getAllUnreadEmails&_=${Date.now()}`;
      
      // For incremental fetch, add timestamp parameter
      if (incremental && lastFetchTime) {
        const timestamp = lastFetchTime.toISOString();
        url += `&since=${encodeURIComponent(timestamp)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const fetchedEmails = data.emails || [];
      
      // Classify and enhance emails
      const enhancedEmails: EnhancedEmailMessage[] = fetchedEmails.map((email: EmailMessage) => ({
        ...email,
        classification: classifyEmail(email, products)
      }));
      
      if (incremental) {
        // For incremental updates, merge with existing emails
        setEmails(prevEmails => {
          const existingIds = new Set(prevEmails.map(e => e.id));
          const newEmails = enhancedEmails.filter(e => !existingIds.has(e.id));
          return [...newEmails, ...prevEmails];
        });
        
        toast({
          title: "Latest Emails Fetched",
          description: `Found ${enhancedEmails.length} new emails`,
        });
      } else {
        // Full refresh
        setEmails(enhancedEmails);
        
        toast({
          title: "Emails Fetched",
          description: `Successfully fetched ${enhancedEmails.length} emails`,
        });
      }

      setLastFetchTime(new Date());
      localStorage.setItem(getUserStorageKey('last_fetch_time'), new Date().toISOString());

    } catch (error) {
      console.error('Error fetching emails:', error);
      
      toast({
        title: "Fetch Failed",
        description: error instanceof Error ? error.message : "Failed to fetch emails",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReclassify = (emailId: string, isQuoteRequest: boolean) => {
    setEmails(prevEmails => 
      prevEmails.map(email => {
        if (email.id === emailId) {
          const updatedClassification = {
            ...email.classification,
            isQuoteRequest,
            confidence: 'high' as const,
            reasoning: 'Manually classified by user'
          };
          return {
            ...email,
            classification: updatedClassification
          };
        }
        return email;
      })
    );

    toast({
      title: "Email Reclassified",
      description: `Email marked as ${isQuoteRequest ? 'quote request' : 'general email'}`,
    });
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

  const handleProcessQuote = (email: EnhancedEmailMessage) => {
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
      setLastFetchTime(null);
      toast({
        title: "Data Cleared",
        description: "All data has been cleared",
      });
    }
  };

  // Separate emails by classification
  const quoteEmails = emails.filter(email => email.classification.isQuoteRequest);
  const generalEmails = emails.filter(email => !email.classification.isQuoteRequest);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Email Inbox</CardTitle>
              <CardDescription>Manage your emails with automatic classification</CardDescription>
            </div>
          </div>
          <EmailRefreshButton 
            onRefresh={fetchEmails}
            isLoading={isLoading}
            disabled={!scriptUrl.trim()}
          />
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
                onClick={() => fetchEmails(false)}
                disabled={isLoading || !scriptUrl.trim()}
              >
                {isLoading ? 'Fetching...' : 'Fetch All'}
              </Button>
            </div>
          </div>
          
          {scriptUrl && (
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
            <p className="text-sm">Enter your Apps Script URL and click "Fetch All" to load your emails</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300 animate-pulse" />
            <h3 className="text-lg font-medium mb-2">Fetching emails...</h3>
            <p className="text-sm">Loading your messages</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                Total: {emails.length}
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                Quote Requests: {quoteEmails.length}
              </Badge>
              <Badge variant="outline">
                General: {generalEmails.length}
              </Badge>
            </div>

            {/* Quote Requests Section */}
            {quoteEmails.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-700">Quote Requests</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {quoteEmails.map((email) => (
                    <div key={email.id} className="border rounded-lg p-4 bg-green-50 hover:bg-green-100 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-900 truncate">
                              {extractSenderName(email.from)}
                            </span>
                            <EmailClassificationBadge
                              classification={email.classification}
                              onReclassify={(isQuote) => handleReclassify(email.id, isQuote)}
                              emailId={email.id}
                            />
                          </div>
                          <h3 className="font-semibold text-slate-900 mb-1">
                            {email.subject}
                          </h3>
                          <div className="text-sm font-medium text-green-700">
                            {getDisplayText(email, email.classification)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500 ml-4">
                          <Clock className="h-4 w-4" />
                          {formatDate(email.date)}
                        </div>
                      </div>
                      
                      <div className="text-sm text-slate-600 bg-white p-2 rounded mb-2">
                        <p>{email.body?.substring(0, 150)}...</p>
                      </div>
                      
                      <div className="flex items-center justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleProcessQuote(email)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Process Quote
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Emails Section */}
            {generalEmails.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-slate-700">General Emails</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {generalEmails.map((email) => (
                    <div key={email.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-900 truncate">
                              {extractSenderName(email.from)}
                            </span>
                            <EmailClassificationBadge
                              classification={email.classification}
                              onReclassify={(isQuote) => handleReclassify(email.id, isQuote)}
                              emailId={email.id}
                            />
                          </div>
                          <h3 className="font-semibold text-slate-900 mb-1">
                            {email.subject}
                          </h3>
                          <div className="text-sm text-slate-600">
                            {getDisplayText(email, email.classification)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500 ml-4">
                          <Clock className="h-4 w-4" />
                          {formatDate(email.date)}
                        </div>
                      </div>
                      
                      <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded mb-2">
                        <p>{email.body?.substring(0, 150)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

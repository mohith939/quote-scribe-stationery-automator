
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Mail, RefreshCw, Inbox, User, Clock, AlertCircle, Settings } from "lucide-react";
import { EmailMessage } from "@/types";
import { fetchUnreadEmails } from "@/services/gmailService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function EmailInbox() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [emailLimit, setEmailLimit] = useState<string>("10");

  const handleFetchEmails = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log(`Starting email fetch with limit: ${emailLimit}...`);
      const startTime = Date.now();
      
      const unreadEmails = await fetchUnreadEmails(parseInt(emailLimit));
      const endTime = Date.now();
      const fetchTime = (endTime - startTime) / 1000;
      
      console.log(`Fetched ${unreadEmails.length} emails in ${fetchTime}s`);
      
      setEmails(unreadEmails);
      setLastSyncTime(new Date().toISOString());
      
      toast({
        title: "Success",
        description: `Found ${unreadEmails.length} emails (${fetchTime.toFixed(1)}s)`,
      });
    } catch (error) {
      console.error('Email fetch failed:', error);
      
      let errorMessage = "Unable to fetch emails. Check your Google Apps Script connection.";
      
      if (error instanceof Error) {
        if (error.message.includes('quota exceeded') || error.message.includes('Service invoked too many times')) {
          errorMessage = "Gmail quota exceeded for today. Try again tomorrow or contact Google Apps Script support.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Fetch Failed", 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Email Inbox</CardTitle>
              <CardDescription>Quota-aware email fetching</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-500" />
              <Select value={emailLimit} onValueChange={setEmailLimit}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleFetchEmails}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Fetch Emails'}
            </Button>
          </div>
        </div>
        {lastSyncTime && (
          <p className="text-xs text-slate-500">
            Last updated: {new Date(lastSyncTime).toLocaleString()} | Limit: {emailLimit} emails
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Quota Management</span>
          </div>
          <div className="text-xs text-amber-700 mt-1">
            <p>With 4,780+ unread emails, fetching is limited to prevent quota exceeded errors.</p>
            <p>• Start with 5-10 emails to test • Increase limit gradually • Reset daily at midnight GMT</p>
          </div>
        </div>

        {emails.length === 0 && !isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <Inbox className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No emails loaded</h3>
            <p className="text-sm mb-4">Click "Fetch Emails" to load your unread emails</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 text-slate-300 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Fetching emails...</h3>
            <p className="text-sm">Please wait while we load {emailLimit} emails</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {emails.length} Email{emails.length !== 1 ? 's' : ''} Found
              </Badge>
              <Badge variant="outline" className="text-xs">
                Limit: {emailLimit}
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
                    <p>{email.snippet || email.body?.substring(0, 150) + '...'}</p>
                  </div>

                  {email.hasAttachments && (
                    <Badge variant="outline" className="text-xs mb-2">
                      📎 Attachments
                    </Badge>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      ID: {email.id.substring(0, 8)}...
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Email Selected",
                          description: `Email from ${extractSenderName(email.from)} selected`,
                        });
                      }}
                    >
                      View
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

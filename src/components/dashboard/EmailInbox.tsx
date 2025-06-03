
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Mail, RefreshCw, Clock, User, AlertCircle, CheckCircle, Inbox } from "lucide-react";
import { EmailMessage } from "@/types";
import { fetchUnreadEmails, testGoogleAppsScriptConnection } from "@/services/gmailService";

export function EmailInbox() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const result = await testGoogleAppsScriptConnection();
      setIsConnected(result.success);
      
      if (result.success) {
        console.log('Connection successful, auto-fetching emails...');
        handleSync();
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching emails...');
      const unreadEmails = await fetchUnreadEmails();
      console.log('Fetched emails:', unreadEmails.length);
      
      setEmails(unreadEmails);
      setLastSyncTime(new Date().toISOString());
      setIsConnected(true);
      
      toast({
        title: "Success",
        description: `Found ${unreadEmails.length} unread emails`,
      });
    } catch (error) {
      console.error('Sync failed:', error);
      setIsConnected(false);
      toast({
        title: "Sync Failed", 
        description: "Please check your Google Apps Script connection",
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

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Connection error state
  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle>Email Inbox</CardTitle>
          </div>
          <CardDescription>
            Google Apps Script connection required
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Inbox className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Not Connected</h3>
            <p className="text-slate-600 mb-4">
              Please configure Google Apps Script in Settings to access your emails.
            </p>
            <Button onClick={checkConnection} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Email Inbox</CardTitle>
              <CardDescription>
                Unread emails from Gmail
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Connected</span>
            </div>
            <Button 
              onClick={handleSync}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>
        {lastSyncTime && (
          <p className="text-xs text-slate-500">
            Last updated: {new Date(lastSyncTime).toLocaleString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {emails.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Inbox className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No unread emails</h3>
            <p className="text-sm">
              {isLoading ? 'Loading emails...' : 'Your inbox is clean!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {emails.length} Unread Email{emails.length !== 1 ? 's' : ''}
            </Badge>
            
            <div className="space-y-3">
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
                      <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">
                        {email.subject}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-500 ml-4">
                      <Clock className="h-4 w-4" />
                      {formatDate(email.date)}
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                    <p>{truncateText(email.snippet || email.body)}</p>
                  </div>

                  {email.hasAttachments && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        📎 {email.attachments?.length || 0} attachment(s)
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className="text-xs">
                      ID: {email.id.substring(0, 8)}...
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Email Processing",
                          description: "Processing feature coming soon",
                        });
                      }}
                    >
                      Process
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

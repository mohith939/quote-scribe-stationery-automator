
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Mail, RefreshCw, Clock, User, AlertCircle, CheckCircle, ExternalLink, Settings, Info } from "lucide-react";
import { EmailMessage } from "@/types";
import { fetchUnreadEmails, testGoogleAppsScriptConnection } from "@/services/gmailService";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function EmailInbox() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Check Google Apps Script connection on component mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const result = await testGoogleAppsScriptConnection();
      setIsConnected(result.success);
      
      if (!result.success) {
        setConnectionError(result.message);
      } else {
        setConnectionError(null);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
      setConnectionError(error instanceof Error ? error.message : 'Unknown connection error');
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      console.log('Starting email sync...');
      const unreadEmails = await fetchUnreadEmails();
      console.log('Fetched emails count:', unreadEmails.length);
      
      setEmails(unreadEmails);
      setLastSyncTime(new Date().toISOString());
      setIsConnected(true);
      
      toast({
        title: "Sync Complete",
        description: `Successfully fetched ${unreadEmails.length} unread emails`,
      });
    } catch (error) {
      console.error('Error syncing emails:', error);
      setIsConnected(false);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch emails";
      setConnectionError(errorMessage);
      
      toast({
        title: "Sync Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
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

  if (!isConnected && !isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle>Gmail Integration Setup Required</CardTitle>
          </div>
          <CardDescription>
            Connect your Google Apps Script to access Gmail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Error:</strong> {connectionError}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Quick Setup Steps:</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Go to Settings → Google Apps Script Integration</li>
              <li>Download the updated script code</li>
              <li>Create a new Google Apps Script project</li>
              <li>Deploy as a web app with proper permissions</li>
              <li>Copy the web app URL back to settings</li>
            </ol>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={checkConnection} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Connection
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '#settings'}>
              <Settings className="h-4 w-4 mr-2" />
              Go to Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
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
              {isConnected && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              )}
              <Button 
                onClick={handleSync}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Syncing...' : 'Sync'}
              </Button>
            </div>
          </div>
          {lastSyncTime && (
            <p className="text-xs text-slate-500">
              Last synced: {new Date(lastSyncTime).toLocaleString()}
            </p>
          )}
        </CardHeader>
        
        <CardContent>
          {connectionError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Connection Error:</strong> {connectionError}
                <br />
                <span className="text-xs mt-1 block">
                  Please check your Google Apps Script deployment settings.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
              <h3 className="text-lg font-medium mb-2">Loading emails...</h3>
              <p className="text-sm text-slate-600">This may take a moment</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium mb-2">No unread emails</h3>
              <p className="text-sm">
                Your inbox is empty or all emails have been read.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  {emails.length} Unread Email{emails.length !== 1 ? 's' : ''}
                </Badge>
                {emails.length >= 500 && (
                  <Badge variant="outline" className="text-amber-700 border-amber-300">
                    <Info className="h-3 w-3 mr-1" />
                    Showing first 500
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                {emails.map((email) => (
                  <Card key={email.id} className="border-l-4 border-l-blue-500 hover:shadow-sm transition-shadow">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span className="font-medium text-sm text-slate-900 truncate">
                              {extractSenderName(email.from)}
                            </span>
                          </div>
                          <h3 className="font-medium text-slate-900 mb-1 text-sm line-clamp-1">
                            {email.subject}
                          </h3>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {truncateText(email.snippet || email.body)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {formatDate(email.date)}
                          </div>
                          {email.hasAttachments && (
                            <Badge variant="outline" className="text-xs">
                              📎 {email.attachments?.length || 0}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EmailInbox;

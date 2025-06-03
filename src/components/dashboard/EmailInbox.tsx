
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Mail, RefreshCw, Clock, User, AlertCircle, CheckCircle } from "lucide-react";
import { EmailMessage } from "@/types";
import { fetchUnreadEmails, testGoogleAppsScriptConnection } from "@/services/gmailService";

export function EmailInbox() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Check Google Apps Script connection on component mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const result = await testGoogleAppsScriptConnection();
      setIsConnected(result.success);
      
      if (result.success) {
        // If connected, automatically fetch emails
        handleSync();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      console.log('Syncing emails...');
      const unreadEmails = await fetchUnreadEmails();
      console.log('Fetched emails:', unreadEmails);
      
      setEmails(unreadEmails);
      setLastSyncTime(new Date().toISOString());
      setIsConnected(true);
      
      toast({
        title: "Sync Complete",
        description: `Found ${unreadEmails.length} unread emails`,
      });
    } catch (error) {
      console.error('Error syncing emails:', error);
      setIsConnected(false);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to fetch emails. Please check your Google Apps Script connection.",
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

  const extractSenderEmail = (fromField: string) => {
    const match = fromField.match(/<(.+)>/);
    return match ? match[1] : fromField;
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle>Gmail Integration</CardTitle>
          </div>
          <CardDescription>
            Google Apps Script Not Connected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-600" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Google Apps Script Not Connected</h3>
            <p className="text-slate-600 mb-4">
              Please connect your Google Apps Script in the Settings to access Gmail functionality.
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
    <div className="space-y-6">
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
          {emails.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium mb-2">No unread emails</h3>
              <p className="text-sm">
                {isLoading ? 'Loading emails...' : 'Your inbox is empty or all emails have been read.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  {emails.length} Unread Email{emails.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {emails.map((email) => (
                  <Card key={email.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-slate-400" />
                              <span className="font-medium text-slate-900">
                                {extractSenderName(email.from)}
                              </span>
                              <span className="text-sm text-slate-500">
                                &lt;{extractSenderEmail(email.from)}&gt;
                              </span>
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                              {email.subject}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 ml-4">
                            <Clock className="h-4 w-4" />
                            {formatDate(email.date)}
                          </div>
                        </div>
                        
                        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                          <p className="whitespace-pre-wrap">
                            {truncateText(email.body)}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              ID: {email.id.substring(0, 8)}...
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Handle process email action
                                toast({
                                  title: "Processing Email",
                                  description: "Email processing feature will be implemented.",
                                });
                              }}
                            >
                              Process
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Handle view details action
                                toast({
                                  title: "View Details",
                                  description: "Email details view will be implemented.",
                                });
                              }}
                            >
                              View Details
                            </Button>
                          </div>
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

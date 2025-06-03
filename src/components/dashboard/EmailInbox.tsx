
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Mail, RefreshCw, Inbox, User, Clock } from "lucide-react";
import { EmailMessage } from "@/types";
import { fetchUnreadEmails } from "@/services/gmailService";

export function EmailInbox() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const handleFetchEmails = async () => {
    if (isLoading) return; // Prevent multiple calls
    
    setIsLoading(true);
    try {
      console.log('Manually fetching emails...');
      const unreadEmails = await fetchUnreadEmails();
      console.log('Fetched emails:', unreadEmails.length);
      
      setEmails(unreadEmails);
      setLastSyncTime(new Date().toISOString());
      
      toast({
        title: "Success",
        description: `Found ${unreadEmails.length} unread emails`,
      });
    } catch (error) {
      console.error('Email fetch failed:', error);
      toast({
        title: "Fetch Failed", 
        description: "Unable to fetch emails. Please check your connection.",
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Email Inbox</CardTitle>
              <CardDescription>Click "Fetch Emails" to load unread emails</CardDescription>
            </div>
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
        {lastSyncTime && (
          <p className="text-xs text-slate-500">
            Last updated: {new Date(lastSyncTime).toLocaleString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {emails.length === 0 && !isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <Inbox className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No emails loaded</h3>
            <p className="text-sm mb-4">Click "Fetch Emails" to load your unread messages</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 text-slate-300 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Loading emails...</h3>
            <p className="text-sm">Please wait while we fetch your emails</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {emails.length} Unread Email{emails.length !== 1 ? 's' : ''}
            </Badge>
            
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
                    <p>{truncateText(email.snippet || email.body)}</p>
                  </div>

                  {email.hasAttachments && (
                    <Badge variant="outline" className="text-xs mb-2">
                      📎 {email.attachments?.length || 0} attachment(s)
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

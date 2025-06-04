
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Mail, RefreshCw, Inbox, User, Clock, AlertCircle, Settings, ExternalLink } from "lucide-react";
import { EmailMessage } from "@/types";

export function EmailInbox() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration - replace with actual email fetching
  const mockEmails: EmailMessage[] = [
    {
      id: "mock-1",
      from: "John Smith <john@example.com>",
      subject: "Quote Request for Office Supplies",
      body: "Hi, I need a quote for 100 units of office chairs and 50 desks. Please send pricing details.",
      date: new Date().toISOString(),
      snippet: "Hi, I need a quote for 100 units of office chairs and 50 desks...",
      hasAttachments: false
    },
    {
      id: "mock-2", 
      from: "Sarah Wilson <sarah@company.com>",
      subject: "Bulk Order Inquiry",
      body: "We're looking for pricing on promotional items for our upcoming event. Need 500 branded mugs.",
      date: new Date(Date.now() - 86400000).toISOString(),
      snippet: "We're looking for pricing on promotional items for our upcoming event...",
      hasAttachments: true
    }
  ];

  const handleLoadMockEmails = () => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setEmails(mockEmails);
      setIsLoading(false);
      toast({
        title: "Mock Emails Loaded",
        description: `Loaded ${mockEmails.length} sample emails for demonstration`,
      });
    }, 1000);
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
              <CardDescription>Fetch and process your unread emails</CardDescription>
            </div>
          </div>
          <Button 
            onClick={handleLoadMockEmails}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Load Sample Emails'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Email Integration Options</span>
          </div>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>Better alternatives to Google Apps Script:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Gmail API with OAuth:</strong> Direct integration with proper authentication</li>
              <li><strong>IMAP/POP3:</strong> Universal email protocol support for any email provider</li>
              <li><strong>Email webhooks:</strong> Real-time email notifications via services like SendGrid</li>
              <li><strong>Zapier/Make.com:</strong> No-code automation to forward emails to your app</li>
            </ul>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open('https://developers.google.com/gmail/api', '_blank')}>
                <ExternalLink className="h-3 w-3 mr-1" />
                Gmail API Docs
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('https://zapier.com', '_blank')}>
                <ExternalLink className="h-3 w-3 mr-1" />
                Zapier
              </Button>
            </div>
          </div>
        </div>

        {emails.length === 0 && !isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <Inbox className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No emails loaded</h3>
            <p className="text-sm mb-4">Choose an integration method above to start fetching emails</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 text-slate-300 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Loading emails...</h3>
            <p className="text-sm">Please wait while we fetch your emails</p>
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
                      ID: {email.id}
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
                      Process Quote
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

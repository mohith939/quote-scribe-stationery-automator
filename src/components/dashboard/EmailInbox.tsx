
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Mail, RefreshCw, Inbox, User, Clock, CheckCircle, AlertCircle, Package } from "lucide-react";
import { EmailMessage } from "@/types";
import { fetchUnreadEmails, processEmailById } from "@/services/gmailService";

export function EmailInbox() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const handleFetchEmails = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching emails using enhanced script...');
      const unreadEmails = await fetchUnreadEmails();
      console.log('Fetched enhanced emails:', unreadEmails.length);
      
      setEmails(unreadEmails);
      setLastSyncTime(new Date().toISOString());
      
      toast({
        title: "Success",
        description: `Found ${unreadEmails.length} emails with enhanced processing data`,
      });
    } catch (error) {
      console.error('Email fetch failed:', error);
      toast({
        title: "Fetch Failed", 
        description: "Unable to fetch emails. Please check your Google Apps Script connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessEmail = async (emailId: string) => {
    try {
      console.log('Processing email:', emailId);
      const result = await processEmailById(emailId);
      
      if (result.success) {
        toast({
          title: "Email Processed",
          description: result.message || "Email processed successfully",
        });
        
        // Refresh emails to get updated status
        handleFetchEmails();
      } else {
        toast({
          title: "Processing Failed",
          description: result.error || "Failed to process email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Email processing failed:', error);
      toast({
        title: "Processing Error",
        description: "An error occurred while processing the email",
        variant: "destructive",
      });
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

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge variant="default" className="bg-green-100 text-green-800">High Confidence</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Low Confidence</Badge>;
      default:
        return <Badge variant="outline">No Analysis</Badge>;
    }
  };

  const getProcessingStatusBadge = (status: string) => {
    switch (status) {
      case 'processed_automatically':
        return <Badge variant="default" className="bg-green-100 text-green-800">Auto-Processed</Badge>;
      case 'needs_manual_processing':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Manual Review</Badge>;
      case 'non_quote_message':
        return <Badge variant="outline">Non-Quote</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Enhanced Email Inbox</CardTitle>
              <CardDescription>Enhanced email processing with quote detection and auto-processing</CardDescription>
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
            <p className="text-sm mb-4">Click "Fetch Emails" to load your enhanced email processing</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 text-slate-300 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Loading enhanced emails...</h3>
            <p className="text-sm">Processing emails with AI analysis...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {emails.length} Email{emails.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {emails.filter(e => e.isQuoteRequest).length} Quote Request{emails.filter(e => e.isQuoteRequest).length !== 1 ? 's' : ''}
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
                        {email.isQuoteRequest && <CheckCircle className="h-4 w-4 text-green-600" />}
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
                  
                  {/* Enhanced Processing Information */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {getProcessingStatusBadge(email.processingStatus || 'pending')}
                    {email.isQuoteRequest && getConfidenceBadge(email.confidence || 'none')}
                  </div>

                  {/* Products and Quantities */}
                  {email.products && email.products.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        Products: {email.products.join(', ')}
                      </span>
                    </div>
                  )}

                  {email.quantities && email.quantities.length > 0 && (
                    <div className="text-sm text-slate-600 mb-2">
                      Quantities: {email.quantities.map((q: any) => `${q.quantity} ${q.unit}`).join(', ')}
                    </div>
                  )}
                  
                  <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded mb-2">
                    <p>{email.body ? email.body.substring(0, 200) + '...' : email.snippet}</p>
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
                    <div className="flex gap-2">
                      {email.isQuoteRequest && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleProcessEmail(email.id)}
                          disabled={email.processingStatus === 'processed_automatically'}
                        >
                          {email.processingStatus === 'processed_automatically' ? 'Processed' : 'Process Quote'}
                        </Button>
                      )}
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
                        View Details
                      </Button>
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

export default EmailInbox;

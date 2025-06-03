
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Mail, RefreshCw, Clock, User, AlertCircle, CheckCircle, Paperclip, Eye, FileText, Image, FileIcon } from "lucide-react";
import { EmailMessage } from "@/types";
import { fetchUnreadEmails, testGoogleAppsScriptConnection } from "@/services/gmailService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EmailInbox() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

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

  const getAttachmentIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const viewEmailDetails = (email: EmailMessage) => {
    setSelectedEmail(email);
    setShowEmailDialog(true);
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
                  Unread emails from Gmail with full content support
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
                            {truncateText(email.snippet || email.body)}
                          </p>
                        </div>

                        {email.hasAttachments && email.attachments && (
                          <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                            <Paperclip className="h-4 w-4 text-amber-600" />
                            <span className="text-sm text-amber-800 font-medium">
                              {email.attachments.length} Attachment{email.attachments.length !== 1 ? 's' : ''}
                            </span>
                            <div className="flex gap-1">
                              {email.attachments.slice(0, 3).map((attachment, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {getAttachmentIcon(attachment.type)}
                                  <span className="ml-1">{attachment.name}</span>
                                </Badge>
                              ))}
                              {email.attachments.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{email.attachments.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              ID: {email.id.substring(0, 8)}...
                            </Badge>
                            {email.htmlBody && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                HTML Content
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewEmailDetails(email)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Full Email
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Processing Email",
                                  description: "Email processing feature will be implemented.",
                                });
                              }}
                            >
                              Process
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

      {/* Email Details Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
            <DialogDescription>
              Full email content with HTML rendering and attachment information
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmail && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {/* Email Header */}
                <div className="border-b pb-4">
                  <div className="grid grid-cols-1 gap-2">
                    <div><strong>From:</strong> {selectedEmail.from}</div>
                    {selectedEmail.to && <div><strong>To:</strong> {selectedEmail.to}</div>}
                    <div><strong>Subject:</strong> {selectedEmail.subject}</div>
                    <div><strong>Date:</strong> {formatDate(selectedEmail.date)}</div>
                  </div>
                </div>

                {/* Attachments */}
                {selectedEmail.hasAttachments && selectedEmail.attachments && (
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Attachments ({selectedEmail.attachments.length})
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedEmail.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-white rounded border">
                          {getAttachmentIcon(attachment.type)}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{attachment.name}</div>
                            <div className="text-xs text-slate-500">
                              {attachment.type} • {formatFileSize(attachment.size)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Content */}
                <Tabs defaultValue={selectedEmail.htmlBody ? "html" : "plain"} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="plain">Plain Text</TabsTrigger>
                    <TabsTrigger value="html" disabled={!selectedEmail.htmlBody}>
                      HTML Content {!selectedEmail.htmlBody && "(Not Available)"}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="plain" className="mt-4">
                    <div className="border rounded-lg p-4 bg-slate-50 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {selectedEmail.body}
                      </pre>
                    </div>
                  </TabsContent>
                  
                  {selectedEmail.htmlBody && (
                    <TabsContent value="html" className="mt-4">
                      <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                        />
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EmailInbox;

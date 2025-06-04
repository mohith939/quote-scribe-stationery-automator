
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, RefreshCw, Inbox, User, Clock, Filter, Edit, Send, CheckCircle, AlertTriangle } from "lucide-react";
import { EmailMessage } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { realGmailService } from "@/services/realGmailService";
import { GmailAuth } from "./GmailAuth";

export function EmailInboxReal() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'quote' | 'non-quote'>('all');
  const [editingEmail, setEditingEmail] = useState<EmailMessage | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(realGmailService.isAuthenticated());

  useEffect(() => {
    // Check authentication status on component mount
    setIsAuthenticated(realGmailService.isAuthenticated());
  }, []);

  const handleFetchEmails = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Gmail account first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching emails from Gmail...');
      const fetchedEmails = await realGmailService.fetchUnreadEmails(50);
      
      setEmails(fetchedEmails);
      setFilteredEmails(fetchedEmails);
      
      toast({
        title: "Emails Fetched",
        description: `Successfully fetched ${fetchedEmails.length} unread emails`,
      });

      console.log(`Fetched ${fetchedEmails.length} emails:`, fetchedEmails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: "Fetch Failed",
        description: error instanceof Error ? error.message : "Failed to fetch emails",
        variant: "destructive"
      });

      // If authentication expired, update state
      if (error instanceof Error && error.message.includes('authentication')) {
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterEmails = (type: 'all' | 'quote' | 'non-quote') => {
    setFilterType(type);
    if (type === 'all') {
      setFilteredEmails(emails);
    } else if (type === 'quote') {
      setFilteredEmails(emails.filter(email => email.isQuoteRequest));
    } else {
      setFilteredEmails(emails.filter(email => !email.isQuoteRequest));
    }
  };

  const handleEditClassification = (email: EmailMessage) => {
    setEditingEmail(email);
    setShowEditDialog(true);
  };

  const handleSaveClassification = (newClassification: boolean) => {
    if (!editingEmail) return;

    const updatedEmails = emails.map(email => 
      email.id === editingEmail.id 
        ? { ...email, isQuoteRequest: newClassification }
        : email
    );
    
    setEmails(updatedEmails);
    filterEmails(filterType);
    setShowEditDialog(false);
    setEditingEmail(null);
    
    toast({
      title: "Email Classification Updated",
      description: `Email marked as ${newClassification ? 'quote request' : 'non-quote'}`,
    });
  };

  const handleProcessQuote = (email: EmailMessage) => {
    toast({
      title: "Email Added to Processing Queue",
      description: `Email from ${extractSenderName(email.from)} moved to processing queue`,
    });
    
    const remainingEmails = emails.filter(e => e.id !== email.id);
    setEmails(remainingEmails);
    filterEmails(filterType);
  };

  const handleMarkAsRead = async (email: EmailMessage) => {
    try {
      const success = await realGmailService.markAsRead(email.id);
      if (success) {
        toast({
          title: "Email Marked as Read",
          description: `Email from ${extractSenderName(email.from)} marked as read`,
        });
        
        // Remove from local list
        const remainingEmails = emails.filter(e => e.id !== email.id);
        setEmails(remainingEmails);
        filterEmails(filterType);
      } else {
        toast({
          title: "Failed to Mark as Read",
          description: "Could not mark email as read in Gmail",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark email as read",
        variant: "destructive"
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
        return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>;
      case 'low':
        return <Badge className="bg-orange-100 text-orange-800">Low Confidence</Badge>;
      default:
        return null;
    }
  };

  // Show Gmail authentication if not connected
  if (!isAuthenticated) {
    return <GmailAuth />;
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Gmail Inbox</CardTitle>
                <CardDescription>Fetch and process your unread emails from Gmail</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleFetchEmails}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Fetching...' : 'Fetch Emails'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Connection Status */}
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">Connected to Gmail - Ready to fetch emails</span>
            </div>
          </div>

          {/* Filter Controls */}
          {emails.length > 0 && (
            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-600" />
                <Label className="text-sm font-medium">Filter by type:</Label>
              </div>
              <Select value={filterType} onValueChange={filterEmails}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Emails ({emails.length})</SelectItem>
                  <SelectItem value="quote">Quote Requests ({emails.filter(e => e.isQuoteRequest).length})</SelectItem>
                  <SelectItem value="non-quote">Non-Quote Emails ({emails.filter(e => !e.isQuoteRequest).length})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {filteredEmails.length === 0 && !isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <Inbox className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium mb-2">
                {emails.length === 0 ? 'No emails loaded' : `No ${filterType} emails found`}
              </h3>
              <p className="text-sm mb-4">
                {emails.length === 0 
                  ? 'Click "Fetch Emails" to load your unread Gmail messages' 
                  : 'Try changing the filter or fetch more emails'
                }
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 text-slate-300 animate-spin" />
              <h3 className="text-lg font-medium mb-2">Fetching emails from Gmail...</h3>
              <p className="text-sm">This may take a moment depending on your inbox size</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {filteredEmails.length} Email{filteredEmails.length !== 1 ? 's' : ''} Found
                </Badge>
                {filterType !== 'all' && (
                  <Badge variant="outline">
                    Filtered by: {filterType === 'quote' ? 'Quote Requests' : 'Non-Quote Emails'}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredEmails.map((email) => (
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
                            <Badge variant="outline">Non-Quote</Badge>
                          )}
                          {email.confidence && getConfidenceBadge(email.confidence)}
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
                        Gmail ID: {email.id.substring(0, 8)}...
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClassification(email)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
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
                            onClick={() => handleMarkAsRead(email)}
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

      {/* Edit Classification Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Email Classification</DialogTitle>
            <DialogDescription>
              Change how this email is classified in the system
            </DialogDescription>
          </DialogHeader>
          
          {editingEmail && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium">Email Subject:</div>
                <div className="text-sm text-gray-600">{editingEmail.subject}</div>
                <div className="text-sm font-medium mt-2">From:</div>
                <div className="text-sm text-gray-600">{extractSenderName(editingEmail.from)}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Classification</Label>
                <RadioGroup
                  defaultValue={editingEmail.isQuoteRequest ? "quote" : "non-quote"}
                  onValueChange={(value) => {
                    setEditingEmail({
                      ...editingEmail,
                      isQuoteRequest: value === "quote"
                    });
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quote" id="quote" />
                    <Label htmlFor="quote">Quote Request - Customer wants pricing information</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non-quote" id="non-quote" />
                    <Label htmlFor="non-quote">Non-Quote - General inquiry or information</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSaveClassification(editingEmail?.isQuoteRequest || false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

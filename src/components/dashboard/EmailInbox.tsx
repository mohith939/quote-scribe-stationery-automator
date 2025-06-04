
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Mail, RefreshCw, Inbox, User, Clock, Filter, Edit, Send, CheckCircle } from "lucide-react";
import { EmailMessage, Product } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseEmailForMultipleProducts } from "@/services/advancedEmailParser";

export function EmailInbox() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'quote' | 'non-quote'>('all');
  const [editingEmail, setEditingEmail] = useState<EmailMessage | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Fetch products for detection
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return [];

      const { data, error } = await supabase
        .from('user_products')
        .select('*')
        .eq('user_id', session.session.user.id)
        .limit(1000);

      if (error) throw error;
      return data || [];
    },
  });

  // Mock data with enhanced detection
  const mockEmails: EmailMessage[] = [
    {
      id: "mock-1",
      from: "John Smith <john@example.com>",
      subject: "Quote Request for Digital Force Gauge",
      body: "Hi, I need a quote for 2 units of ZTA-500N Digital Force Gauge and 5 pieces of glass thermometers. Please send pricing details for bulk order.",
      date: new Date().toISOString(),
      snippet: "Hi, I need a quote for 2 units of ZTA-500N Digital Force Gauge...",
      hasAttachments: false
    },
    {
      id: "mock-2", 
      from: "Sarah Wilson <sarah@company.com>",
      subject: "Product Information Needed",
      body: "Hello, can you provide specifications for your metallic plates? We're researching suppliers for our upcoming project.",
      date: new Date(Date.now() - 86400000).toISOString(),
      snippet: "Hello, can you provide specifications for your metallic plates...",
      hasAttachments: false
    },
    {
      id: "mock-3",
      from: "Mike Johnson <mike@procurement.com>",
      subject: "Re: General Inquiry",
      body: "Thanks for your previous email. Looking forward to our meeting next week.",
      date: new Date(Date.now() - 172800000).toISOString(),
      snippet: "Thanks for your previous email. Looking forward to our meeting...",
      hasAttachments: false
    }
  ];

  const handleLoadMockEmails = () => {
    setIsLoading(true);
    setTimeout(() => {
      const emailsWithDetection = mockEmails.map(email => {
        const detection = parseEmailForMultipleProducts(email, products);
        return {
          ...email,
          isQuoteRequest: detection.overallConfidence !== 'none',
          detectedProducts: detection.products,
          confidence: detection.overallConfidence
        };
      });
      
      setEmails(emailsWithDetection);
      setFilteredEmails(emailsWithDetection);
      setIsLoading(false);
      toast({
        title: "Mock Emails Loaded",
        description: `Loaded ${emailsWithDetection.length} sample emails with product detection`,
      });
    }, 1000);
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
    filterEmails(filterType); // Reapply current filter
    setShowEditDialog(false);
    setEditingEmail(null);
    
    toast({
      title: "Email Classification Updated",
      description: `Email marked as ${newClassification ? 'quote request' : 'non-quote'}`,
    });
  };

  const handleProcessQuote = (email: EmailMessage) => {
    // Add to processing queue (this would typically update a state management store)
    toast({
      title: "Email Added to Processing Queue",
      description: `Email from ${extractSenderName(email.from)} moved to processing queue`,
    });
    
    // Remove from current list
    const remainingEmails = emails.filter(e => e.id !== email.id);
    setEmails(remainingEmails);
    filterEmails(filterType);
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

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Email Inbox</CardTitle>
                <CardDescription>Fetch and process your unread emails with smart product detection</CardDescription>
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
          {/* Filter Controls */}
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

          {filteredEmails.length === 0 && !isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <Inbox className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium mb-2">
                {filterType === 'all' ? 'No emails loaded' : `No ${filterType} emails found`}
              </h3>
              <p className="text-sm mb-4">
                {filterType === 'all' 
                  ? 'Click the button above to load sample emails' 
                  : 'Try changing the filter or load more emails'
                }
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 text-slate-300 animate-spin" />
              <h3 className="text-lg font-medium mb-2">Processing emails...</h3>
              <p className="text-sm">Analyzing content and detecting products</p>
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

                    {/* Detected Products */}
                    {email.detectedProducts && email.detectedProducts.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-slate-600 mb-1">Detected Products:</div>
                        <div className="flex flex-wrap gap-1">
                          {email.detectedProducts.map((product, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {product.product} (Qty: {product.quantity})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {email.hasAttachments && (
                      <Badge variant="outline" className="text-xs mb-2">
                        📎 Attachments
                      </Badge>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        ID: {email.id}
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
                            onClick={() => {
                              toast({
                                title: "Email Viewed",
                                description: `Email from ${extractSenderName(email.from)} marked as viewed`,
                              });
                            }}
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

export default EmailInbox;

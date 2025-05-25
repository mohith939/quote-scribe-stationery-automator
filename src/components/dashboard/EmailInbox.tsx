
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockEmails } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { AlertCircle, FileText, RefreshCw, Send, ToggleLeft, ToggleRight, Search, Filter, Edit, ArrowRight } from "lucide-react";
import { EmailMessage } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  fetchUnreadEmails, 
  markEmailAsRead, 
  setupAutoEmailProcessing,
  autoProcessEmails
} from "@/services/gmailService";

export function EmailInbox() {
  const { toast } = useToast();
  const [processingEmailId, setProcessingEmailId] = useState<string | null>(null);
  const [processedEmails, setProcessedEmails] = useState<string[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showReclassifyDialog, setShowReclassifyDialog] = useState(false);
  const [selectedEmailForReclassify, setSelectedEmailForReclassify] = useState<EmailMessage | null>(null);
  
  // Fetch emails using React Query
  const { data: emails, isLoading, isError, refetch } = useQuery({
    queryKey: ['unreadEmails'],
    queryFn: fetchUnreadEmails,
    placeholderData: mockEmails,
    staleTime: 60000,
    retry: 1,
    meta: {
      onSettled: (data, error) => {
        if (error) {
          console.error("Failed to fetch emails:", error);
          toast({
            title: "Error fetching emails",
            description: "Using mock data instead. Check your connection to Gmail.",
            variant: "destructive"
          });
        }
      }
    }
  });

  // Enhanced email type detection
  const detectEmailType = (email: EmailMessage) => {
    const body = email.body.toLowerCase();
    const subject = email.subject.toLowerCase();
    const fullText = `${subject} ${body}`;
    
    // Specific product detection
    const productKeywords = [
      'a4 paper', 'ballpoint pen', 'stapler', 'notebook', 'whiteboard marker', 'file folder',
      'zta-500n', 'digital force gauge', 'glass thermometer', 'zero plate', 'metallic plate'
    ];
    
    const quoteKeywords = ['quote', 'quotation', 'pricing', 'price', 'cost', 'estimate', 'inquiry', 'purchase', 'buy', 'order'];
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'rush', 'priority'];
    
    const hasProductKeywords = productKeywords.some(keyword => fullText.includes(keyword));
    const hasQuoteKeywords = quoteKeywords.some(keyword => fullText.includes(keyword));
    const hasUrgentKeywords = urgentKeywords.some(keyword => fullText.includes(keyword));
    
    if (hasProductKeywords && hasQuoteKeywords) {
      return {
        type: 'quote',
        confidence: hasUrgentKeywords ? 'high' : 'medium'
      };
    } else if (hasQuoteKeywords) {
      return {
        type: 'quote',
        confidence: 'low'
      };
    }
    
    return {
      type: 'non-quote',
      confidence: 'low'
    };
  };

  // Setup email auto-sync
  useEffect(() => {
    const emailProcessor = setupAutoEmailProcessing(async (newEmails) => {
      if (autoSyncEnabled && newEmails.length > 0) {
        toast({
          title: "Auto-Sync Active",
          description: `Found ${newEmails.length} new emails. Processing automatically.`
        });
        
        await autoProcessEmails(newEmails, (email, success, autoProcessed) => {
          setProcessedEmails(prev => [...prev, email.id]);
          
          if (success) {
            toast({
              title: "Quote Auto-Generated",
              description: `Automatically processed email from ${email.from}`
            });
          }
        });
        
        refetch();
      }
    }, 60000);
    
    if (autoSyncEnabled) {
      emailProcessor.start();
    }
    
    return () => {
      emailProcessor.stop();
    };
  }, [autoSyncEnabled, refetch, toast]);

  const handleProcessManually = async (email: EmailMessage) => {
    setProcessingEmailId(email.id);
    
    try {
      await markEmailAsRead(email.id).catch(console.error);
      
      // Add to processing queue
      setTimeout(() => {
        toast({
          title: "Added to Processing Queue",
          description: `Email from ${email.from} moved to processing queue for manual handling`,
        });
        
        setProcessedEmails(prev => [...prev, email.id]);
        setProcessingEmailId(null);
      }, 1000);
    } catch (error) {
      console.error("Error processing email:", error);
      toast({
        title: "Error Processing Email",
        description: "Failed to process the email. Please try again.",
        variant: "destructive"
      });
      setProcessingEmailId(null);
    }
  };

  const handleReclassifyEmail = (email: EmailMessage) => {
    setSelectedEmailForReclassify(email);
    setShowReclassifyDialog(true);
  };

  const handleConfirmReclassify = () => {
    if (!selectedEmailForReclassify) return;
    
    toast({
      title: "Email Reclassified",
      description: `Email from ${selectedEmailForReclassify.from} has been reclassified as a quote request`,
    });
    
    setShowReclassifyDialog(false);
    setSelectedEmailForReclassify(null);
  };

  // Filter emails based on search term and type filter
  const filteredEmails = (emails || [])
    .filter(email => !processedEmails.includes(email.id))
    .filter(email => {
      const matchesSearch = 
        email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.body.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterType === "all") return matchesSearch;
      
      const emailType = detectEmailType(email);
      return matchesSearch && emailType.type === filterType;
    });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Email Inbox</CardTitle>
              <CardDescription>
                All received emails requiring response
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-sync"
                  checked={autoSyncEnabled}
                  onCheckedChange={setAutoSyncEnabled}
                />
                <Label htmlFor="auto-sync" className="text-sm">
                  {autoSyncEnabled ? (
                    <span className="flex items-center text-green-600">
                      <ToggleRight className="h-4 w-4 mr-1" />
                      Auto-sync ON
                    </span>
                  ) : (
                    <span className="flex items-center text-muted-foreground">
                      <ToggleLeft className="h-4 w-4 mr-1" />
                      Auto-sync OFF
                    </span>
                  )}
                </Label>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => refetch()} 
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="flex items-center space-x-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter emails" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Emails</SelectItem>
                <SelectItem value="quote">Quote Requests</SelectItem>
                <SelectItem value="non-quote">Non-Quote Emails</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse flex flex-col items-center">
                  <RefreshCw className="h-8 w-8 mb-2" />
                  <p className="text-sm text-muted-foreground">Loading emails...</p>
                </div>
              </div>
            ) : isError ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Failed to load emails</p>
                <Button 
                  variant="outline" 
                  onClick={() => refetch()} 
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            ) : filteredEmails.length > 0 ? (
              filteredEmails.map((email) => {
                const emailType = detectEmailType(email);
                return (
                  <div
                    key={email.id}
                    className="flex flex-col space-y-3 border rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium">{email.from}</div>
                          {emailType.type === 'quote' ? (
                            <Badge className="bg-blue-500">Quote Request</Badge>
                          ) : (
                            <Badge variant="outline">Non-Quote</Badge>
                          )}
                          <Badge 
                            variant="outline"
                            className={
                              emailType.confidence === 'high' ? 'border-green-500 text-green-700' :
                              emailType.confidence === 'medium' ? 'border-yellow-500 text-yellow-700' :
                              'border-gray-500 text-gray-700'
                            }
                          >
                            {emailType.confidence} confidence
                          </Badge>
                        </div>
                        <div className="text-sm font-medium text-gray-900 mb-1">{email.subject}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {new Date(email.date).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {email.body}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2 border-t">
                      {emailType.type === 'non-quote' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleReclassifyEmail(email)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Mark as Quote
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleProcessManually(email)}
                        disabled={processingEmailId === email.id}
                      >
                        {processingEmailId === email.id ? (
                          <span className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 animate-pulse" />
                            Processing...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Process Manually
                          </span>
                        )}
                      </Button>
                    </div>
                    
                    {processingEmailId !== email.id && emailType.type === 'quote' && (
                      <div className="pt-2 text-xs">
                        <div className="flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1 text-blue-500" />
                          <span className="text-muted-foreground">
                            AI detected this as a quote request with {emailType.confidence} confidence
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterType !== "all" 
                  ? "No emails found matching your filters." 
                  : "No unprocessed emails found"}
              </div>
            )}
          </div>
          
          {filteredEmails.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredEmails.length} of {(emails || []).length - processedEmails.length} unprocessed emails
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reclassify Email Dialog */}
      <Dialog open={showReclassifyDialog} onOpenChange={setShowReclassifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reclassify Email as Quote Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this email as a quote request?
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmailForReclassify && (
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium">Email from: {selectedEmailForReclassify.from}</div>
              <div className="text-sm text-gray-600 mt-1">{selectedEmailForReclassify.subject}</div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReclassifyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReclassify}>
              Yes, Mark as Quote Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default EmailInbox;

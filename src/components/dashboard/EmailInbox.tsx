
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockEmails } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { AlertCircle, FileText, RefreshCw, Send, ToggleLeft, ToggleRight, Filter } from "lucide-react";
import { EmailMessage } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { fetchUnreadEmails, markEmailAsRead, sendQuoteEmail, setupAutoEmailProcessing, autoProcessEmails } from "@/services/gmailService";
import { parseEmailForQuotation } from "@/services/emailParserService";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function EmailInbox() {
  const { toast } = useToast();
  const [processingEmailId, setProcessingEmailId] = useState<string | null>(null);
  const [processedEmails, setProcessedEmails] = useState<string[]>([]);
  const [autoProcessEnabled, setAutoProcessEnabled] = useState<boolean>(false);
  const [emailFilter, setEmailFilter] = useState<'all' | 'quotations' | 'other'>('all');
  
  // Fetch emails using React Query
  const { data: emails, isLoading, isError, refetch } = useQuery({
    queryKey: ['unreadEmails'],
    queryFn: fetchUnreadEmails,
    placeholderData: mockEmails,
    staleTime: 60000, // 1 minute
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

  // Setup email auto-processing
  useEffect(() => {
    const emailProcessor = setupAutoEmailProcessing(async (newEmails) => {
      if (autoProcessEnabled && newEmails.length > 0) {
        toast({
          title: "Auto-Processing Emails",
          description: `Processing ${newEmails.length} new emails automatically.`
        });
        
        await autoProcessEmails(newEmails, (email, success, autoProcessed) => {
          // Add to processed list regardless of success
          setProcessedEmails(prev => [...prev, email.id]);
          
          // Show notification only for successful auto-processing
          if (success) {
            const parsedInfo = parseEmailForQuotation(email);
            toast({
              title: "Quote Auto-Generated",
              description: `Automatically sent quote to ${parsedInfo.customerName} for ${parsedInfo.product}`
            });
          }
        });
        
        // Refresh the email list
        refetch();
      }
    }, 60000); // Check every minute
    
    // Start auto-processing if enabled
    if (autoProcessEnabled) {
      emailProcessor.start();
    }
    
    return () => {
      emailProcessor.stop();
    };
  }, [autoProcessEnabled, refetch, toast]);

  const handleProcessEmail = async (email: EmailMessage, isAutomatic: boolean = false) => {
    setProcessingEmailId(email.id);
    
    try {
      // Mark as read in Gmail (if we're connected)
      await markEmailAsRead(email.id).catch(console.error);
      
      // Process the email
      setTimeout(async () => {
        try {
          if (isAutomatic) {
            // Automatically generate quote
            toast({
              title: "Auto-generating Quote",
              description: "Processing email and generating quote..."
            });
            
            // In a real implementation, this would send the email
            // For demo, just mark as processed
            setProcessedEmails(prev => [...prev, email.id]);
            
            toast({
              title: "Quote Generated",
              description: `Quote for ${parseEmailForQuotation(email).customerName} has been sent.`,
            });
          } else {
            // Mark for manual processing
            toast({
              title: "Added to Processing Queue",
              description: "Email has been added to the manual processing queue"
            });
            
            // In a real app, this would add the email to a queue for manual processing
            setProcessedEmails(prev => [...prev, email.id]);
          }
        } catch (error) {
          console.error("Error in email processing:", error);
          toast({
            title: "Processing Error",
            description: "There was an error processing this email. Please try again.",
            variant: "destructive"
          });
        } finally {
          setProcessingEmailId(null);
        }
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

  // Filter out processed emails
  const filteredEmails = (emails || [])
    .filter(email => !processedEmails.includes(email.id))
    .filter(email => {
      if (emailFilter === 'all') return true;
      const isQuotation = email.subject.toLowerCase().includes('quote') || 
                          email.subject.toLowerCase().includes('quotation') || 
                          email.body.toLowerCase().includes('quote') ||
                          email.body.toLowerCase().includes('price');
      return emailFilter === 'quotations' ? isQuotation : !isQuotation;
    });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl">Unprocessed Emails</CardTitle>
          <CardDescription>
            Recent unprocessed emails requiring quotation
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-process"
              checked={autoProcessEnabled}
              onCheckedChange={setAutoProcessEnabled}
            />
            <Label htmlFor="auto-process" className="text-sm">
              {autoProcessEnabled ? (
                <span className="flex items-center text-green-600">
                  <ToggleRight className="h-4 w-4 mr-1" />
                  Auto-processing ON
                </span>
              ) : (
                <span className="flex items-center text-muted-foreground">
                  <ToggleLeft className="h-4 w-4 mr-1" />
                  Auto-processing OFF
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
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={emailFilter} onValueChange={(v) => setEmailFilter(v as any)}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="w-auto">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="quotations" className="text-xs">Quotations</TabsTrigger>
              <TabsTrigger value="other" className="text-xs">Other</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" className="text-xs">
              <Filter className="h-3.5 w-3.5 mr-1" />
              Filter
            </Button>
          </div>
          
          <TabsContent value="all" className="m-0">
            <EmailList 
              emails={filteredEmails} 
              isLoading={isLoading} 
              isError={isError} 
              processingEmailId={processingEmailId} 
              handleProcessEmail={handleProcessEmail} 
              refetch={refetch} 
            />
          </TabsContent>
          
          <TabsContent value="quotations" className="m-0">
            <EmailList 
              emails={filteredEmails} 
              isLoading={isLoading} 
              isError={isError} 
              processingEmailId={processingEmailId} 
              handleProcessEmail={handleProcessEmail} 
              refetch={refetch} 
            />
          </TabsContent>
          
          <TabsContent value="other" className="m-0">
            <EmailList 
              emails={filteredEmails} 
              isLoading={isLoading} 
              isError={isError} 
              processingEmailId={processingEmailId} 
              handleProcessEmail={handleProcessEmail} 
              refetch={refetch} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface EmailListProps {
  emails: EmailMessage[];
  isLoading: boolean;
  isError: boolean;
  processingEmailId: string | null;
  handleProcessEmail: (email: EmailMessage, isAutomatic?: boolean) => void;
  refetch: () => void;
}

function EmailList({ emails, isLoading, isError, processingEmailId, handleProcessEmail, refetch }: EmailListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse flex flex-col items-center">
          <RefreshCw className="h-8 w-8 mb-2" />
          <p className="text-sm text-muted-foreground">Loading emails...</p>
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
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
    );
  }
  
  if (emails.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed rounded-md">
        <p>No unprocessed emails found</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <EmailCard 
          key={email.id}
          email={email}
          isProcessing={processingEmailId === email.id}
          onManualProcess={() => handleProcessEmail(email, false)}
          onAutoProcess={() => handleProcessEmail(email, true)}
        />
      ))}
    </div>
  );
}

interface EmailCardProps {
  email: EmailMessage;
  isProcessing: boolean;
  onManualProcess: () => void;
  onAutoProcess: () => void;
}

function EmailCard({ email, isProcessing, onManualProcess, onAutoProcess }: EmailCardProps) {
  const parsedInfo = parseEmailForQuotation(email);
  const confidenceColor = 
    parsedInfo.confidence === 'high' ? 'bg-green-100 text-green-800' :
    parsedInfo.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
    parsedInfo.confidence === 'low' ? 'bg-orange-100 text-orange-800' :
    'bg-red-100 text-red-800';
  
  return (
    <div className={cn(
      "flex flex-col space-y-2 border rounded-lg p-4",
      parsedInfo.confidence === 'high' ? 'border-l-4 border-l-green-500' : 
      parsedInfo.confidence === 'medium' ? 'border-l-4 border-l-yellow-500' : 
      'border'
    )}>
      <div className="flex justify-between items-center">
        <div className="font-medium">{email.from}</div>
        <div className="text-sm text-muted-foreground">
          {new Date(email.date).toLocaleString()}
        </div>
      </div>
      <div className="text-sm font-medium">{email.subject}</div>
      <div className="text-sm text-muted-foreground line-clamp-2">
        {email.body}
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs font-normal", confidenceColor)}>
            {parsedInfo.confidence !== 'none' ? 
              `Confidence: ${parsedInfo.confidence}` : 
              "No product detected"}
          </Badge>
          
          {parsedInfo.confidence !== 'none' && parsedInfo.product && (
            <Badge variant="outline" className="text-xs font-normal">
              AI Detection: {parsedInfo.product} × {parsedInfo.quantity}
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Link to="/processing-queue">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onManualProcess}
              disabled={isProcessing}
              className="text-xs h-8"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <FileText className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Process Manually
                </span>
              )}
            </Button>
          </Link>
          
          <Button 
            size="sm" 
            onClick={onAutoProcess}
            disabled={isProcessing || parsedInfo.confidence === 'none'}
            className="text-xs h-8"
          >
            {isProcessing ? (
              <span className="flex items-center">
                <Send className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center">
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Auto-Generate Quote
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EmailInbox;

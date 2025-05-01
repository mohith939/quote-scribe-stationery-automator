import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { AlertCircle, FileText, Mail, RefreshCw, Send, ToggleLeft, ToggleRight } from "lucide-react";
import { EmailMessage } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchUnreadEmails, 
  logQuoteToSheet, 
  markEmailAsRead, 
  sendQuoteEmail, 
  setupAutoEmailProcessing,
  autoProcessEmails
} from "@/services/gmailService";
import { parseEmailForQuotation } from "@/services/emailParserService";
import { calculatePrice } from "@/services/pricingService";
import { defaultQuoteTemplate, generateEmailSubject, generateQuoteEmailBody } from "@/services/quoteService";
import { mockProducts } from "@/data/mockData";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function EmailInbox() {
  const { toast } = useToast();
  const [processingEmailId, setProcessingEmailId] = useState<string | null>(null);
  const [processedEmails, setProcessedEmails] = useState<string[]>([]);
  const [autoProcessEnabled, setAutoProcessEnabled] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'quotation' | 'other'>('all');
  
  // Fetch emails using React Query
  const { data: emails, isLoading, isError, refetch } = useQuery({
    queryKey: ['unreadEmails'],
    queryFn: fetchUnreadEmails,
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
          const result = isAutomatic 
            ? await processEmailAutomatically(email) 
            : await processEmailManually(email);
          
          toast({
            title: result.title,
            description: result.description,
          });
          
          setProcessedEmails(prev => [...prev, email.id]);
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
      }, 1500);
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

  const processEmailAutomatically = async (email: EmailMessage) => {
    // Parse the email using our new parser service
    const parsedInfo = parseEmailForQuotation(email);
    
    if (parsedInfo.confidence === 'none' || !parsedInfo.product || !parsedInfo.quantity) {
      // If we couldn't extract info with confidence, route to manual processing
      return {
        title: "Manual Processing Required",
        description: "Could not automatically extract product and quantity information."
      };
    }
    
    // Calculate price based on parsed product and quantity
    const pricing = calculatePrice(parsedInfo.product, parsedInfo.quantity, mockProducts);
    
    if (!pricing) {
      // If no valid price found, route to manual processing
      return {
        title: "Manual Pricing Required",
        description: `Found ${parsedInfo.product} × ${parsedInfo.quantity} but couldn't determine pricing.`
      };
    }
    
    // Generate email subject and body from template
    const emailSubject = generateEmailSubject(defaultQuoteTemplate, parsedInfo.product);
    const emailBody = generateQuoteEmailBody(
      defaultQuoteTemplate,
      parsedInfo,
      pricing.pricePerUnit,
      pricing.totalPrice
    );
    
    // Send the quote email
    const emailSent = await sendQuoteEmail(
      parsedInfo.emailAddress,
      emailSubject,
      emailBody,
      email.id
    ).catch(() => false);
    
    // Log quote to sheet
    const quoteData = {
      timestamp: new Date().toISOString(),
      customerName: parsedInfo.customerName,
      emailAddress: parsedInfo.emailAddress,
      product: parsedInfo.product,
      quantity: parsedInfo.quantity,
      pricePerUnit: pricing.pricePerUnit,
      totalAmount: pricing.totalPrice,
      // Fix: Explicitly cast the status as one of the allowed literal types
      status: emailSent ? 'Sent' as const : 'Failed' as const
    };
    
    await logQuoteToSheet(quoteData).catch(console.error);
    
    if (emailSent) {
      return {
        title: "Quote Generated and Sent",
        description: `Automatically quoted ${parsedInfo.quantity} units of ${parsedInfo.product} to ${parsedInfo.customerName}`
      };
    } else {
      return {
        title: "Quote Generated But Not Sent",
        description: "Email could not be sent. Check your Gmail connection."
      };
    }
  };
  
  const processEmailManually = async (email: EmailMessage) => {
    // Parse the email to pre-populate the manual form
    const parsedInfo = parseEmailForQuotation(email);
    
    // In a real implementation, this would save the email to a queue for manual processing
    // or redirect to a manual processing page
    
    return {
      title: "Email Queued for Manual Processing",
      description: `Email from ${email.from} has been added to the manual processing queue.`
    };
  };

  // Filter emails based on category and processed status
  const displayEmails = (emails || [])
    .filter(email => !processedEmails.includes(email.id))
    .filter(email => categoryFilter === 'all' || email.category === categoryFilter);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Unprocessed Emails</CardTitle>
          <CardDescription>
            Recent unprocessed emails requiring quotation
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 mr-2">
            <Button 
              variant={categoryFilter === 'all' ? "default" : "outline"} 
              size="sm"
              onClick={() => setCategoryFilter('all')}
              className="text-xs"
            >
              All
            </Button>
            <Button 
              variant={categoryFilter === 'quotation' ? "default" : "outline"} 
              size="sm"
              onClick={() => setCategoryFilter('quotation')}
              className="text-xs"
            >
              Quotations
            </Button>
            <Button 
              variant={categoryFilter === 'other' ? "default" : "outline"} 
              size="sm"
              onClick={() => setCategoryFilter('other')}
              className="text-xs"
            >
              Other
            </Button>
          </div>
          <div className="flex items-center">
            <Switch
              id="auto-process"
              checked={autoProcessEnabled}
              onCheckedChange={setAutoProcessEnabled}
            />
            <Label htmlFor="auto-process" className="ml-2 text-sm">
              {autoProcessEnabled ? 
                <span className="flex items-center text-green-600">Auto ON</span> : 
                <span className="flex items-center text-muted-foreground">Auto OFF</span>
              }
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
          ) : displayEmails.length > 0 ? (
            displayEmails.map((email) => (
              <div
                key={email.id}
                className="flex flex-col space-y-2 border rounded-md p-4"
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium">{email.from}</div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={email.category === 'quotation' ? 'default' : 'secondary'}>
                      {email.category === 'quotation' ? 'Quotation' : 'Other'}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {new Date(email.date).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium">{email.subject}</div>
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {email.body}
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleProcessEmail(email)}
                    disabled={processingEmailId === email.id}
                  >
                    {processingEmailId === email.id ? (
                      <span className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 animate-pulse" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Process Manually
                      </span>
                    )}
                  </Button>
                  {email.category === 'quotation' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleProcessEmail(email, true)}
                      disabled={processingEmailId === email.id}
                    >
                      {processingEmailId === email.id ? (
                        <span className="flex items-center">
                          <Send className="mr-2 h-4 w-4 animate-pulse" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Send className="mr-2 h-4 w-4" />
                          Auto-Generate Quote
                        </span>
                      )}
                    </Button>
                  )}
                </div>
                
                {/* Show confidence indicator for parsed data */}
                {processingEmailId !== email.id && email.category === 'quotation' && (
                  <div className="pt-2 text-xs">
                    <div className="flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
                      <span className="text-muted-foreground">
                        AI Detection: {parseEmailForQuotation(email).confidence !== 'none' ? 
                          `${parseEmailForQuotation(email).product} × ${parseEmailForQuotation(email).quantity}` : 
                          "No product detected"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {categoryFilter !== 'all' 
                ? `No ${categoryFilter} emails found`
                : "No unprocessed emails found"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default EmailInbox;

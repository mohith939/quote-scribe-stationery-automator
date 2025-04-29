import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockEmails } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { FileText, RefreshCw, Send } from "lucide-react";
import { EmailMessage } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { fetchUnreadEmails, markEmailAsRead } from "@/services/gmailService";

export function EmailInbox() {
  const { toast } = useToast();
  const [processingEmailId, setProcessingEmailId] = useState<string | null>(null);
  const [processedEmails, setProcessedEmails] = useState<string[]>([]);
  
  // Fetch emails using React Query
  const { data: emails, isLoading, isError, refetch } = useQuery({
    queryKey: ['unreadEmails'],
    queryFn: fetchUnreadEmails,
    // Fall back to mock data if fetching fails (for development purposes)
    placeholderData: mockEmails,
    // Don't refetch automatically too often
    staleTime: 60000, // 1 minute
    retry: 1,
    onError: (error) => {
      console.error("Failed to fetch emails:", error);
      toast({
        title: "Error fetching emails",
        description: "Using mock data instead. Check your connection to Gmail.",
        variant: "destructive"
      });
    }
  });
  
  const handleProcessEmail = async (email: EmailMessage, isAutomatic: boolean = false) => {
    setProcessingEmailId(email.id);
    
    try {
      // Mark as read in Gmail (if we're connected)
      await markEmailAsRead(email.id).catch(console.error);
      
      // Process the email
      setTimeout(() => {
        const result = isAutomatic ? processEmailAutomatically(email) : processEmailManually(email);
        
        toast({
          title: result.title,
          description: result.description,
        });
        
        setProcessingEmailId(null);
        setProcessedEmails(prev => [...prev, email.id]);
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

  const processEmailAutomatically = (email: EmailMessage) => {
    // Logic to extract product and quantity from email body
    const emailBody = email.body.toLowerCase();
    let product = "";
    let quantity = 0;
    
    // Simple pattern matching for demo purposes
    if (emailBody.includes("a4") || emailBody.includes("paper")) {
      product = "A4 Paper - 80gsm";
      
      // Try to extract quantity
      const quantityMatch = emailBody.match(/(\d+)\s*(sheets?|pcs?|pieces?)/i);
      quantity = quantityMatch ? parseInt(quantityMatch[1]) : 500; // Default to 500 if not found
    } else if (emailBody.includes("pen") || emailBody.includes("ballpoint")) {
      product = "Ballpoint Pens - Blue";
      
      // Try to extract quantity
      const quantityMatch = emailBody.match(/(\d+)\s*(pens?|pcs?|pieces?)/i);
      quantity = quantityMatch ? parseInt(quantityMatch[1]) : 50; // Default to 50 if not found
    } else if (emailBody.includes("stapler")) {
      product = "Stapler - Medium";
      
      // Try to extract quantity
      const quantityMatch = emailBody.match(/(\d+)\s*(staplers?|pcs?|pieces?)/i);
      quantity = quantityMatch ? parseInt(quantityMatch[1]) : 10; // Default to 10 if not found
    }
    
    if (product && quantity > 0) {
      return {
        title: "Quote Generated and Sent",
        description: `Automatically quoted ${quantity} units of ${product} to ${email.from}`
      };
    } else {
      return {
        title: "Manual Processing Required",
        description: "Could not automatically extract product and quantity information."
      };
    }
  };
  
  const processEmailManually = (email: EmailMessage) => {
    return {
      title: "Email Queued for Manual Processing",
      description: `Email from ${email.from} has been added to the manual processing queue.`
    };
  };

  // Filter out processed emails
  const displayEmails = (emails || []).filter(email => !processedEmails.includes(email.id));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Unprocessed Emails</CardTitle>
          <CardDescription>
            Recent unprocessed emails requiring quotation
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => refetch()} 
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
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
                  <div className="text-sm text-muted-foreground">
                    {new Date(email.date).toLocaleString()}
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
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No unprocessed emails found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default EmailInbox;

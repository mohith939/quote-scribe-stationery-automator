
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockEmails } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { FileText, Send } from "lucide-react";
import { EmailMessage } from "@/types";

export function EmailInbox() {
  const { toast } = useToast();
  const [processingEmailId, setProcessingEmailId] = useState<string | null>(null);
  const [processedEmails, setProcessedEmails] = useState<string[]>([]);
  
  const handleProcessEmail = (email: EmailMessage, isAutomatic: boolean = false) => {
    setProcessingEmailId(email.id);
    
    // Simulate processing time
    setTimeout(() => {
      const result = isAutomatic ? processEmailAutomatically(email) : processEmailManually(email);
      
      toast({
        title: result.title,
        description: result.description,
      });
      
      setProcessingEmailId(null);
      setProcessedEmails(prev => [...prev, email.id]);
    }, 1500);
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

  const displayEmails = mockEmails.filter(email => !processedEmails.includes(email.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unprocessed Emails</CardTitle>
        <CardDescription>
          Recent unprocessed emails requiring quotation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayEmails.length > 0 ? (
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
            <div className="text-center py-4 text-muted-foreground">
              No unprocessed emails found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default EmailInbox;

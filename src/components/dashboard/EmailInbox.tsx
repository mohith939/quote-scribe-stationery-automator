
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockEmails } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

export function EmailInbox() {
  const { toast } = useToast();
  const [processingEmailId, setProcessingEmailId] = useState<string | null>(null);
  
  const handleProcessEmail = (emailId: string, isAutomatic: boolean = false) => {
    setProcessingEmailId(emailId);
    
    // Simulate processing time
    setTimeout(() => {
      toast({
        title: isAutomatic ? "Auto-Generated Quote" : "Processing Email",
        description: isAutomatic 
          ? "Quote has been automatically generated and sent" 
          : "Email has been added to manual processing queue",
      });
      setProcessingEmailId(null);
    }, 1500);
  };

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
          {mockEmails.length > 0 ? (
            mockEmails.map((email) => (
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
                    onClick={() => handleProcessEmail(email.id)}
                    disabled={processingEmailId === email.id}
                  >
                    {processingEmailId === email.id ? "Processing..." : "Process Manually"}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleProcessEmail(email.id, true)}
                    disabled={processingEmailId === email.id}
                  >
                    {processingEmailId === email.id ? "Processing..." : "Auto-Generate Quote"}
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

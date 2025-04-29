
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockEmails } from "@/data/mockData";
import { useToast } from "@/components/ui/use-toast";

export function EmailInbox() {
  const { toast } = useToast();
  
  const handleProcessEmail = (emailId: string) => {
    toast({
      title: "Processing Email",
      description: "Email is being analyzed for quotation",
    });
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
                  >
                    Process Manually
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleProcessEmail(email.id)}
                  >
                    Auto-Generate Quote
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

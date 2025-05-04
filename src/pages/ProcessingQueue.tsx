
import Navbar from "@/components/dashboard/Navbar";
import ProcessEmail from "@/components/dashboard/ProcessEmail";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, File, Inbox, Mail, Check, Clock } from "lucide-react";
import { ProcessingQueueItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

// Demo queue items with more realistic data
const demoQueueItems: ProcessingQueueItem[] = [
  {
    id: "email-1",
    emailId: "em-123",
    from: "office.supplies@company.org",
    subject: "Urgent: Need Ballpoint Pens",
    date: new Date().toISOString(),
    status: "pending",
    confidence: "high",
    product: "Ballpoint Pens - Blue",
    quantity: 150
  },
  {
    id: "email-2",
    emailId: "em-124",
    from: "school@education.com",
    subject: "Quote for A4 Paper",
    date: new Date(Date.now() - 3600000).toISOString(),
    status: "processed",
    confidence: "high",
    product: "A4 Paper - 80gsm",
    quantity: 2000
  },
  {
    id: "email-3",
    emailId: "em-125",
    from: "unknown@example.com",
    subject: "Inquiry about products",
    date: new Date(Date.now() - 7200000).toISOString(),
    status: "failed",
    confidence: "low"
  }
];

const ProcessingQueue = () => {
  const { toast } = useToast();
  const [queueItems, setQueueItems] = useState<ProcessingQueueItem[]>(demoQueueItems);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedEmail, setSelectedEmail] = useState<ProcessingQueueItem | null>(null);
  const [processingEmail, setProcessingEmail] = useState(false);
  
  const clearProcessed = () => {
    setQueueItems(queueItems.filter(item => item.status !== 'processed'));
    toast({
      title: "Cleared Processed Items",
      description: "All processed emails have been removed from the queue"
    });
  };
  
  const handleRefreshQueue = () => {
    setProcessingEmail(true);
    toast({
      title: "Refreshing Queue",
      description: "Checking for new emails to process..."
    });
    
    // Simulate API call delay
    setTimeout(() => {
      setProcessingEmail(false);
      toast({
        title: "Queue Updated",
        description: "No new emails found"
      });
    }, 1500);
  };
  
  const handleProcessEmail = (item: ProcessingQueueItem) => {
    setSelectedEmail(item);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 p-8 pt-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Processing Queue</h2>
          <p className="text-muted-foreground">
            Process email inquiries and generate quotes
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ProcessEmail />
          </div>
          
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    Queue
                  </CardTitle>
                  <CardDescription>
                    Emails that require processing
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRefreshQueue}
                    disabled={processingEmail}
                    className="h-8 px-2"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${processingEmail ? 'animate-spin' : ''}`} />
                    {processingEmail ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearProcessed} 
                    disabled={queueItems.filter(item => item.status === 'processed').length === 0}
                    className="h-8 px-2"
                  >
                    Clear Processed
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex items-center justify-between mb-4">
                    <TabsList>
                      <TabsTrigger value="all" className="text-xs">
                        All <Badge variant="secondary" className="ml-1 h-5 text-xs">{queueItems.length || 0}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="pending" className="text-xs">
                        Pending <Badge variant="secondary" className="ml-1 h-5 text-xs">{queueItems.filter(i => i.status === 'pending').length || 0}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="processed" className="text-xs">
                        Processed <Badge variant="secondary" className="ml-1 h-5 text-xs">{queueItems.filter(i => i.status === 'processed').length || 0}</Badge>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="all" className="m-0">
                    {queueItems.length > 0 ? (
                      <div className="space-y-2">
                        {queueItems.map(item => (
                          <QueueItemCard 
                            key={item.id} 
                            item={item} 
                            onProcess={handleProcessEmail}
                            isSelected={selectedEmail?.id === item.id} 
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyQueueState />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="pending" className="m-0">
                    {queueItems.filter(i => i.status === 'pending').length > 0 ? (
                      <div className="space-y-2">
                        {queueItems
                          .filter(i => i.status === 'pending')
                          .map(item => (
                            <QueueItemCard 
                              key={item.id} 
                              item={item} 
                              onProcess={handleProcessEmail}
                              isSelected={selectedEmail?.id === item.id} 
                            />
                          ))}
                      </div>
                    ) : (
                      <EmptyQueueState />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="processed" className="m-0">
                    {queueItems.filter(i => i.status === 'processed').length > 0 ? (
                      <div className="space-y-2">
                        {queueItems
                          .filter(i => i.status === 'processed')
                          .map(item => (
                            <QueueItemCard 
                              key={item.id} 
                              item={item} 
                              onProcess={handleProcessEmail}
                              isSelected={selectedEmail?.id === item.id} 
                            />
                          ))}
                      </div>
                    ) : (
                      <EmptyQueueState />
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <File className="mr-2 h-4 w-4" />
                    Quote Template
                  </CardTitle>
                  <CardDescription>
                    Preview the quote before sending
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border border-border rounded-md p-4 bg-gray-50">
                    <div className="mb-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">To: customer@example.com</p>
                        <p className="font-medium">Subject: Your Quotation for A4 Paper</p>
                      </div>
                      <Badge className="bg-green-100 border-green-200 text-green-800">Ready to Send</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>Dear Customer,</p>
                      <p>Thank you for your inquiry. Please find our quotation below:</p>
                      <div className="my-4 border-y py-4">
                        <p><strong>Product:</strong> A4 Paper - 80gsm</p>
                        <p><strong>Quantity:</strong> 500 sheets</p>
                        <p><strong>Price per Unit:</strong> ₹0.40</p>
                        <p className="font-bold mt-2">Total Amount: ₹200.00</p>
                      </div>
                      <p>This quotation is valid for 14 days from the date of this email.</p>
                      <p>Please let us know if you would like to proceed with this order.</p>
                      <p className="mt-4">Best regards,</p>
                      <p>Your Stationery Shop</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Link to="/templates">
                      <Button variant="outline" size="sm" className="w-full">
                        Edit Template
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function QueueItemCard({ item, onProcess, isSelected }: { 
  item: ProcessingQueueItem; 
  onProcess: (item: ProcessingQueueItem) => void;
  isSelected?: boolean;
}) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    processed: "bg-green-100 text-green-800 border-green-200",
    failed: "bg-red-100 text-red-800 border-red-200",
  };
  
  const confidenceColors = {
    high: "bg-green-50 text-green-700 border-green-100",
    medium: "bg-blue-50 text-blue-700 border-blue-100",
    low: "bg-yellow-50 text-yellow-700 border-yellow-100",
    none: "bg-gray-50 text-gray-700 border-gray-100",
  };
  
  return (
    <div className={`border rounded-md p-3 text-sm ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
      <div className="flex justify-between items-center">
        <span className="font-medium">{item.from}</span>
        <Badge 
          variant="outline" 
          className={`text-xs ${statusColors[item.status]}`}
        >
          {item.status === 'pending' ? (
            <><Clock className="mr-1 h-3 w-3" /> Pending</>
          ) : item.status === 'processed' ? (
            <><Check className="mr-1 h-3 w-3" /> Processed</>
          ) : (
            <>Failed</>
          )}
        </Badge>
      </div>
      <p className="line-clamp-1 text-muted-foreground mt-1">{item.subject}</p>
      
      {item.product && item.quantity && (
        <div className="mt-2 flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`text-xs ${confidenceColors[item.confidence]}`}
          >
            {item.confidence} confidence
          </Badge>
          <span className="text-xs font-medium">{item.product} × {item.quantity}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</span>
        <Button 
          size="sm" 
          variant={isSelected ? "default" : "ghost"} 
          className="h-7 px-2 text-xs"
          onClick={() => onProcess(item)}
        >
          <File className="h-3.5 w-3.5 mr-1" />
          {isSelected ? 'Selected' : 'Process'}
        </Button>
      </div>
    </div>
  );
}

function EmptyQueueState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 border border-dashed rounded-md">
      <Inbox className="h-10 w-10 text-muted-foreground mb-2" />
      <h3 className="text-sm font-medium">No emails in queue</h3>
      <p className="text-xs text-muted-foreground mt-1">
        When you click "Process Manually" on an email, it will appear here.
      </p>
      <Link to="/" className="mt-4">
        <Button variant="outline" size="sm" className="flex items-center">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Check for new emails
        </Button>
      </Link>
    </div>
  );
}

export default ProcessingQueue;

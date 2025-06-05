
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Edit, Trash2, User, Package, CheckCircle, Send, RefreshCw, Mail } from "lucide-react";
import { ProcessingQueueItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

interface ProcessingQueueProps {
  onSwitchToTemplates?: (quoteData: any) => void;
}

export function ProcessingQueue({ onSwitchToTemplates }: ProcessingQueueProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [queueItems, setQueueItems] = useState<ProcessingQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);

  // Create user-specific storage keys
  const getUserStorageKey = (key: string) => {
    return user ? `${key}_${user.id}` : key;
  };

  // Load persisted data on component mount
  useEffect(() => {
    if (user) {
      const savedQueueItems = localStorage.getItem(getUserStorageKey('processing_queue'));
      if (savedQueueItems) {
        try {
          const parsedItems = JSON.parse(savedQueueItems);
          setQueueItems(parsedItems);
        } catch (error) {
          console.error('Error parsing saved queue items:', error);
        }
      }
    }
  }, [user]);

  // Save queue items whenever they change
  useEffect(() => {
    if (user && queueItems.length >= 0) {
      localStorage.setItem(getUserStorageKey('processing_queue'), JSON.stringify(queueItems));
    }
  }, [queueItems, user]);

  // Auto-refresh queue items every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshQueue();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const refreshQueue = async () => {
    setIsLoading(true);
    try {
      // Simulate real-time data fetching
      // In a real implementation, this would fetch from your backend or Gmail API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll just refresh the timestamp
      setQueueItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          lastUpdated: new Date().toISOString()
        }))
      );
    } catch (error) {
      console.error('Error refreshing queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditQuote = (item: ProcessingQueueItem) => {
    // Prepare quote data for template
    const quoteData = {
      customerName: item.customerInfo.name,
      customerEmail: item.customerInfo.email,
      emailSubject: item.email.subject,
      detectedProducts: item.detectedProducts,
      originalEmail: item.email.body
    };

    // Switch to quote templates with prefilled data
    if (onSwitchToTemplates) {
      onSwitchToTemplates(quoteData);
    }

    toast({
      title: "Redirecting to Quote Templates",
      description: `Opening quote template for ${item.customerInfo.name}`,
    });
  };

  const handleCompleteQuote = (itemId: string) => {
    setQueueItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, status: 'completed' as const, completedAt: new Date().toISOString() }
          : item
      )
    );

    toast({
      title: "Quote Completed",
      description: "Quote has been marked as completed",
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setQueueItems(items => items.filter(item => item.id !== itemId));
    
    toast({
      title: "Item Removed",
      description: "Item has been removed from processing queue",
    });
  };

  const handleSendAllQuotes = async () => {
    const pendingItems = queueItems.filter(item => item.status === 'pending');
    
    if (pendingItems.length === 0) {
      toast({
        title: "No Pending Quotes",
        description: "There are no pending quotes to send",
        variant: "destructive"
      });
      return;
    }

    setIsSendingAll(true);
    
    try {
      // Simulate sending all quotes
      for (const item of pendingItems) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        
        // Update item status to completed
        setQueueItems(prevItems => 
          prevItems.map(prevItem => 
            prevItem.id === item.id 
              ? { ...prevItem, status: 'completed' as const, completedAt: new Date().toISOString() }
              : prevItem
          )
        );
      }

      toast({
        title: "All Quotes Sent",
        description: `Successfully sent ${pendingItems.length} quote${pendingItems.length !== 1 ? 's' : ''}`,
      });
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send some quotes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSendingAll(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
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

  const pendingCount = queueItems.filter(item => item.status === 'pending').length;
  const completedCount = queueItems.filter(item => item.status === 'completed').length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Processing Queue</h1>
            <p className="text-slate-600">Manage quotes and email processing</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={refreshQueue}
                disabled={isLoading}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Queue
              </Button>

              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {queueItems.length} Total Items
                </Badge>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {pendingCount} Pending
                </Badge>
                <Badge className="bg-green-100 text-green-800">
                  {completedCount} Completed
                </Badge>
              </div>
            </div>

            {pendingCount > 0 && (
              <Button
                onClick={handleSendAllQuotes}
                disabled={isSendingAll}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Mail className="h-4 w-4" />
                {isSendingAll ? `Sending ${pendingCount} Quotes...` : `Send All Quotes (${pendingCount})`}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Queue Items */}
      {queueItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2 text-slate-700">No items in queue</h3>
            <p className="text-sm text-slate-500">
              Process quote request emails from your inbox to see them here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {queueItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-900">
                        {item.customerInfo.name}
                      </span>
                      <span className="text-slate-500 text-sm">({item.customerInfo.email})</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1 leading-tight">
                      {item.email.subject}
                    </h3>
                  </div>
                  <div className="text-sm text-slate-500 ml-4">
                    {formatDate(item.dateAdded)}
                  </div>
                </div>
                
                {/* Detected Products */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Detected Products:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {item.detectedProducts.map((product, index) => (
                      <div key={index} className="bg-slate-50 p-3 rounded-lg border flex items-center justify-between">
                        <div>
                          <span className="font-medium text-slate-900">{product.product}</span>
                          {product.productCode && (
                            <span className="text-slate-500 ml-2">({product.productCode})</span>
                          )}
                          {product.brand && (
                            <span className="text-slate-600 ml-2">- {product.brand}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Qty: {product.quantity}</Badge>
                          {getConfidenceBadge(product.confidence)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email Preview */}
                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg mb-4 border">
                  <p className="line-clamp-2">{item.email.snippet || item.email.body?.substring(0, 150) + '...'}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono">
                    ID: {item.id}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                    {item.status !== 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompleteQuote(item.id)}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark Complete
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditQuote(item)}
                          className="bg-blue-600 hover:bg-blue-700 gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Quote
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProcessingQueue;


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Edit, User, Package, CheckCircle, Eye } from "lucide-react";
import { ProcessingQueueItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useProcessingQueue } from "@/hooks/useProcessingQueue";

interface ProcessingQueueProps {
  onSwitchToTemplates?: (quoteData: any) => void;
}

export function ProcessingQueue({ onSwitchToTemplates }: ProcessingQueueProps) {
  const { toast } = useToast();
  const { queueItems, removeFromQueue, updateQueueItem } = useProcessingQueue();

  const handleEditQuote = (item: ProcessingQueueItem) => {
    const quoteData = {
      customerName: item.customerInfo.name,
      customerEmail: item.customerInfo.email,
      emailSubject: item.email.subject,
      detectedProducts: item.detectedProducts,
      originalEmail: item.email.body
    };

    if (onSwitchToTemplates) {
      onSwitchToTemplates(quoteData);
    }

    toast({
      title: "Redirecting to Quote Templates",
      description: `Opening quote template for ${item.customerInfo.name}`,
    });
  };

  const handleSendQuote = (item: ProcessingQueueItem) => {
    toast({
      title: "Quote Sent",
      description: `Quote sent to ${item.customerInfo.name}`,
    });
    
    updateQueueItem(item.id, { status: 'completed' });
  };

  const handleReject = (item: ProcessingQueueItem) => {
    removeFromQueue(item.id);
    
    toast({
      title: "Item Rejected",
      description: "Item has been removed from processing queue",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Quote Request</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800 text-xs">high confidence</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">medium confidence</Badge>;
      case 'low':
        return <Badge className="bg-orange-100 text-orange-800 text-xs">low confidence</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold">Processing Queue</CardTitle>
            <CardDescription className="text-slate-500">
              Emails requiring manual review and quote generation
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-slate-100">
              <span className="mr-2">⚡</span>
              Auto Generate
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
              <span className="mr-2">📤</span>
              Auto Send All
            </Button>
            <Button variant="outline" size="sm">
              🔄 Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {queueItems.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No items in queue</h3>
            <p className="text-sm">
              Process quote request emails from your inbox to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {queueItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-6 bg-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-lg">{item.customerInfo.email}</span>
                      {getStatusBadge(item.status)}
                      {item.detectedProducts[0] && getConfidenceBadge(item.detectedProducts[0].confidence)}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">
                      {item.email.subject}
                    </h3>
                    <div className="text-sm text-slate-500">
                      {formatDate(item.dateAdded)}
                    </div>
                  </div>
                </div>
                
                {/* Full Email Content */}
                <div className="mb-4">
                  <div className="bg-slate-50 p-4 rounded-lg border">
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">
                      {item.email.body}
                    </div>
                  </div>
                </div>

                {/* Detected Products */}
                {item.detectedProducts.length > 0 && (
                  <div className="mb-4">
                    <div className="text-blue-600 font-medium mb-2">
                      Detected Product: {item.detectedProducts[0].product}
                    </div>
                  </div>
                )}

                {/* AI Detection Notice */}
                <div className="flex items-center gap-2 mb-4 text-sm text-blue-600">
                  <span className="text-blue-500">ℹ️</span>
                  AI detected this as a quote request with {item.detectedProducts[0]?.confidence || 'medium'} confidence
                </div>
                
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(item)}
                    className="text-slate-600 hover:text-slate-700"
                  >
                    <span className="mr-1">✕</span>
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-slate-600 hover:text-slate-700"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditQuote(item)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Quote
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSendQuote(item)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <span className="mr-1">📤</span>
                    Send Quote
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProcessingQueue;

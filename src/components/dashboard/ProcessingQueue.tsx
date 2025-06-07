
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Edit, Trash2, User, Package, CheckCircle, Send, Mail } from "lucide-react";
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

  // Create user-specific storage key
  const getUserStorageKey = (key: string) => {
    return user ? `${key}_${user.id}` : key;
  };

  // Optimized storage management
  const MAX_QUEUE_ITEMS = 20; // Limit queue size

  const safeStorageSet = (key: string, data: any) => {
    try {
      // Limit the queue size to prevent storage overflow
      const limitedData = Array.isArray(data) ? data.slice(0, MAX_QUEUE_ITEMS) : data;
      const jsonString = JSON.stringify(limitedData);
      
      // Check if data is too large (over 1MB for this specific data)
      if (new Blob([jsonString]).size > 1024 * 1024) {
        console.warn('Queue data too large, truncating...');
        const truncatedData = Array.isArray(limitedData) ? limitedData.slice(0, 10) : limitedData;
        localStorage.setItem(key, JSON.stringify(truncatedData));
      } else {
        localStorage.setItem(key, jsonString);
      }
    } catch (error) {
      console.error('Failed to save queue data:', error);
      // Clear old queue data and try again with limited items
      localStorage.removeItem(key);
      try {
        const limitedData = Array.isArray(data) ? data.slice(0, 5) : data;
        localStorage.setItem(key, JSON.stringify(limitedData));
      } catch (retryError) {
        console.error('Failed to save even limited queue data:', retryError);
      }
    }
  };

  // Load queue items from localStorage
  useEffect(() => {
    if (user) {
      const queueKey = getUserStorageKey('processing_queue');
      const savedQueue = localStorage.getItem(queueKey);
      if (savedQueue) {
        try {
          const parsedQueue = JSON.parse(savedQueue);
          // Ensure we don't load too many items
          const limitedQueue = Array.isArray(parsedQueue) ? parsedQueue.slice(0, MAX_QUEUE_ITEMS) : [];
          setQueueItems(limitedQueue);
        } catch (error) {
          console.error('Error parsing processing queue:', error);
          localStorage.removeItem(queueKey);
        }
      }
    }
  }, [user]);

  // Save queue items to localStorage whenever they change
  useEffect(() => {
    if (user && queueItems.length >= 0) {
      const queueKey = getUserStorageKey('processing_queue');
      safeStorageSet(queueKey, queueItems);
    }
  }, [queueItems, user]);

  const handleEditQuote = (item: ProcessingQueueItem) => {
    const quoteData = {
      customerName: item.customerInfo.name,
      customerEmail: item.customerInfo.email,
      emailSubject: item.email.subject,
      detectedProducts: item.detectedProducts,
      originalEmail: item.email.body,
      emailId: item.id
    };

    console.log('Passing quote data to templates:', quoteData);

    if (onSwitchToTemplates) {
      onSwitchToTemplates(quoteData);
    }

    toast({
      title: "Redirecting to Quote Templates",
      description: `Opening quote template for ${item.customerInfo.name}`,
    });
  };

  const handleSendResponse = async (item: ProcessingQueueItem) => {
    try {
      console.log('Starting email send process for:', item.customerInfo.name);
      
      // Get selected template from localStorage with fallback
      const templateKey = getUserStorageKey('selected_template');
      const selectedTemplate = localStorage.getItem(templateKey) || 'formal-business';
      
      console.log('Using template:', selectedTemplate);
      
      // Get template content based on selected template
      const templates = {
        'formal-business': {
          subject: 'Re: {original_subject} - Quotation',
          body: `Dear {customer_name},

Thank you for your inquiry regarding {product_list}.

We are pleased to provide you with the following quotation:

{product_details}

This quotation is valid for 30 days from the date of this email.

Please feel free to contact us if you have any questions or require additional information.

Best regards,
Your Company Name`
        },
        'casual-friendly': {
          subject: 'Re: {original_subject} - Your Quote',
          body: `Hi {customer_name}!

Thanks for reaching out about {product_list}. Here's your quote:

{product_details}

This quote is good for 30 days. Let me know if you have any questions!

Cheers,
Your Team`
        },
        'detailed-comprehensive': {
          subject: 'Re: {original_subject} - Comprehensive Quotation',
          body: `=== COMPREHENSIVE QUOTATION ===

Customer: {customer_name}
Date: {date}

Product Details:
{product_details}

Terms & Conditions:
- Payment: 50% advance, 50% on delivery
- Delivery: 7-10 business days
- Warranty: 1 year manufacturer warranty
- Validity: 30 days

Best regards,
Your Company Name`
        },
        'simple-quick': {
          subject: 'Re: {original_subject} - Quick Quote',
          body: `Quote for {product_list}:
{product_details}

Valid for 7 days. Ready to ship!
Call to confirm order.`
        }
      };

      const template = templates[selectedTemplate as keyof typeof templates] || templates['formal-business'];
      
      // Replace placeholders with actual data
      const productList = item.detectedProducts.map(p => p.product).join(', ');
      const productDetails = item.detectedProducts.map(p => {
        const price = 100; // Default price
        const quantity = p.quantity || 1;
        const total = quantity * price;
        return `- ${p.product}: ${quantity} units × ₹${price} = ₹${total}`;
      }).join('\n');
      
      const emailSubject = template.subject
        .replace('{original_subject}', item.email.subject)
        .replace('{customer_name}', item.customerInfo.name);
        
      const emailBody = template.body
        .replace('{customer_name}', item.customerInfo.name)
        .replace('{product_list}', productList)
        .replace('{product_details}', productDetails)
        .replace('{date}', new Date().toLocaleDateString());

      // Get Google Apps Script URL
      const scriptUrl = localStorage.getItem(getUserStorageKey('gmail_script_url')) || 
                       localStorage.getItem('google_apps_script_url');
      
      if (!scriptUrl) {
        throw new Error('Google Apps Script URL not configured. Please check your settings.');
      }

      console.log('Sending email with data:', {
        to: item.customerInfo.email,
        subject: emailSubject,
        body: emailBody
      });

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendEmail',
          to: item.customerInfo.email,
          subject: emailSubject,
          body: emailBody,
          emailId: item.email.id
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Response result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }

      // Mark as completed
      handleCompleteQuote(item.id);
      
      toast({
        title: "Response Sent Successfully",
        description: `Email response sent to ${item.customerInfo.name}`,
      });

    } catch (error) {
      console.error('Error sending response:', error);
      
      let errorMessage = "Failed to send response. Please check your configuration.";
      
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = "CORS error: Please update your Google Apps Script with proper CORS headers.";
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network error: Check your Google Apps Script URL and ensure the script is deployed correctly.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Send Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleCompleteQuote = (itemId: string) => {
    setQueueItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, status: 'completed' as const }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <div>
            <CardTitle>Processing Queue</CardTitle>
            <CardDescription>
              Emails ready for quote generation and processing (optimized storage)
            </CardDescription>
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
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {queueItems.length} Item{queueItems.length !== 1 ? 's' : ''} in Queue
              </Badge>
              {queueItems.length >= MAX_QUEUE_ITEMS && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  Queue limit reached (max {MAX_QUEUE_ITEMS})
                </Badge>
              )}
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {queueItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-900">
                          {item.customerInfo.name}
                        </span>
                        <span className="text-slate-500 text-sm">({item.customerInfo.email})</span>
                        {getStatusBadge(item.status)}
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {item.email.subject}
                      </h3>
                    </div>
                    <div className="text-sm text-slate-500 ml-4">
                      {formatDate(item.dateAdded)}
                    </div>
                  </div>
                  
                  {/* Detected Products */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">Detected Products:</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {item.detectedProducts.map((product, index) => (
                        <div key={index} className="bg-slate-50 p-2 rounded flex items-center justify-between">
                          <div>
                            <span className="font-medium">{product.product}</span>
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
                  <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded mb-3">
                    <p>{item.email.snippet || item.email.body?.substring(0, 150) + '...'}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      ID: {item.id}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                      {item.status !== 'completed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendResponse(item)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Send Response
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteQuote(item.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Complete
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEditQuote(item)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Quote
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProcessingQueue;


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Edit, Send, X, Package } from "lucide-react";
import { ProcessingQueueItem } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";

interface QuotePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queueItem: ProcessingQueueItem | null;
  onSend: (item: ProcessingQueueItem) => void;
  onNavigateToTemplates: (quoteData: any) => void;
}

export function QuotePreviewModal({ 
  open, 
  onOpenChange, 
  queueItem, 
  onSend, 
  onNavigateToTemplates 
}: QuotePreviewModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editedProducts, setEditedProducts] = useState(queueItem?.detectedProducts || []);
  const [previewContent, setPreviewContent] = useState("");

  const getUserStorageKey = (key: string) => {
    return user ? `${key}_${user.id}` : key;
  };

  useEffect(() => {
    if (queueItem) {
      setEditedProducts(queueItem.detectedProducts);
      generatePreview();
    }
  }, [queueItem]);

  const generatePreview = () => {
    if (!queueItem) return;

    const templateKey = getUserStorageKey('selected_template');
    const selectedTemplate = localStorage.getItem(templateKey) || 'formal-business';
    const outputFormat = localStorage.getItem(getUserStorageKey('output_format')) || 'pdf';

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
    
    const productList = editedProducts.map(p => p.product).join(', ');
    const productDetails = editedProducts.map(p => {
      const price = 100; // Default price
      const quantity = p.quantity || 1;
      const total = quantity * price;
      return `- ${p.product}: ${quantity} units × ₹${price} = ₹${total}`;
    }).join('\n');
    
    const emailSubject = template.subject
      .replace('{original_subject}', queueItem.email.subject)
      .replace('{customer_name}', queueItem.customerInfo.name);
      
    const emailBody = template.body
      .replace('{customer_name}', queueItem.customerInfo.name)
      .replace('{product_list}', productList)
      .replace('{product_details}', productDetails)
      .replace('{date}', new Date().toLocaleDateString());

    setPreviewContent(`Subject: ${emailSubject}\n\n${emailBody}`);
  };

  const handleProductEdit = (index: number, field: string, value: string | number) => {
    const updated = [...editedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setEditedProducts(updated);
    generatePreview();
  };

  const handleSendQuote = () => {
    if (!queueItem) return;
    
    const updatedItem = {
      ...queueItem,
      detectedProducts: editedProducts
    };
    
    onSend(updatedItem);
    onOpenChange(false);
  };

  const handleEditInTemplates = () => {
    if (!queueItem) return;
    
    const quoteData = {
      customerName: queueItem.customerInfo.name,
      customerEmail: queueItem.customerInfo.email,
      emailSubject: queueItem.email.subject,
      detectedProducts: editedProducts,
      originalEmail: queueItem.email.body,
      emailId: queueItem.id
    };

    onNavigateToTemplates(quoteData);
    onOpenChange(false);
  };

  if (!open || !queueItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Quote Preview</h2>
            <p className="text-sm text-slate-600">Customer: {queueItem.customerInfo.name}</p>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Details Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Detected Products
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {editMode ? 'Done' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {editedProducts.map((product, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    {editMode ? (
                      <div className="space-y-3">
                        <div>
                          <Label>Product Name</Label>
                          <Input
                            value={product.product}
                            onChange={(e) => handleProductEdit(index, 'product', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={product.quantity}
                              onChange={(e) => handleProductEdit(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div>
                            <Label>Product Code</Label>
                            <Input
                              value={product.productCode || ''}
                              onChange={(e) => handleProductEdit(index, 'productCode', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Brand</Label>
                          <Input
                            value={product.brand || ''}
                            onChange={(e) => handleProductEdit(index, 'brand', e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-medium">{product.product}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">Qty: {product.quantity}</Badge>
                          {product.productCode && (
                            <Badge variant="outline">{product.productCode}</Badge>
                          )}
                          {product.brand && (
                            <Badge variant="outline">{product.brand}</Badge>
                          )}
                          <Badge className={
                            product.confidence === 'high' ? 'bg-green-100 text-green-800' :
                            product.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-orange-100 text-orange-800'
                          }>
                            {product.confidence} confidence
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={handleSendQuote} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Send Quote
              </Button>
              <Button variant="outline" onClick={handleEditInTemplates} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Edit in Templates
              </Button>
            </div>
          </div>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>This is what will be sent to the customer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 rounded-lg p-4 min-h-[400px]">
                <pre className="whitespace-pre-wrap text-sm font-mono">{previewContent}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

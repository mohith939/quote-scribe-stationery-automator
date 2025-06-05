
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, User, Clock, X } from "lucide-react";
import { EmailMessage } from "@/types";

interface EmailViewDialogProps {
  email: EmailMessage | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EmailViewDialog({ email, isOpen, onClose }: EmailViewDialogProps) {
  if (!email) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const extractSenderName = (fromField: string) => {
    const match = fromField.match(/^(.+?)\s*<.+>$/);
    return match ? match[1].trim().replace(/['"]/g, '') : fromField;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Full Email View
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Email Header */}
          <div className="border-b pb-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-900">
                {extractSenderName(email.from)}
              </span>
              <span className="text-slate-500 text-sm">({email.from})</span>
            </div>
            
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              {email.subject}
            </h2>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                {formatDate(email.date)}
              </div>
              
              <div className="flex gap-2">
                {email.isQuoteRequest ? (
                  <Badge className="bg-green-100 text-green-800">Quote Request</Badge>
                ) : (
                  <Badge variant="outline">General Email</Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  ID: {email.id.substring(0, 8)}...
                </Badge>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-900 mb-2">Email Content:</h3>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="whitespace-pre-wrap text-slate-700">
                  {email.body}
                </div>
              </div>
            </div>

            {/* HTML Body if available */}
            {email.htmlBody && email.htmlBody !== email.body && (
              <div>
                <h3 className="font-medium text-slate-900 mb-2">HTML Content:</h3>
                <div 
                  className="bg-white border p-4 rounded-lg max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: email.htmlBody }}
                />
              </div>
            )}

            {/* Snippet if available */}
            {email.snippet && (
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Snippet:</h3>
                <div className="bg-blue-50 p-3 rounded-lg text-blue-800 text-sm">
                  {email.snippet}
                </div>
              </div>
            )}

            {/* Detected Products */}
            {email.detectedProducts && email.detectedProducts.length > 0 && (
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Detected Products:</h3>
                <div className="space-y-2">
                  {email.detectedProducts.map((product, index) => (
                    <div key={index} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-yellow-800">
                          {product.product}
                        </span>
                        <Badge variant="outline" className="text-yellow-700">
                          Qty: {product.quantity}
                        </Badge>
                      </div>
                      <div className="text-sm text-yellow-600 mt-1">
                        Confidence: {product.confidence}
                        {product.productCode && ` | Code: ${product.productCode}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {email.hasAttachments && email.attachments && email.attachments.length > 0 && (
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Attachments:</h3>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-600 text-sm">
                    {email.attachments.length} attachment(s) found
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

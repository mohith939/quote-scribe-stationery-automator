
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Mail, User, Clock, Copy, ExternalLink } from "lucide-react";
import { EmailMessage } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface EmailViewDialogProps {
  email: EmailMessage | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EmailViewDialog({ email, isOpen, onClose }: EmailViewDialogProps) {
  const { toast } = useToast();

  if (!email) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const extractSenderName = (fromField: string) => {
    const match = fromField.match(/^(.+?)\s*<.+>$/);
    return match ? match[1].trim().replace(/['"]/g, '') : fromField;
  };

  const extractSenderEmail = (fromField: string) => {
    const match = fromField.match(/<(.+)>/);
    return match ? match[1] : fromField;
  };

  const copyEmailToClipboard = () => {
    const emailText = `
From: ${email.from}
Subject: ${email.subject}
Date: ${formatDate(email.date)}

${email.body}
    `.trim();

    navigator.clipboard.writeText(emailText).then(() => {
      toast({
        title: "Email Copied",
        description: "Email content has been copied to clipboard",
      });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <DialogTitle className="text-xl">Email Details</DialogTitle>
          </div>
          <DialogDescription>
            Full email content and metadata
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-6 pr-4">
              {/* Email Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <h2 className="text-lg font-semibold text-slate-900 leading-tight">
                      {email.subject}
                    </h2>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{extractSenderName(email.from)}</span>
                        <span className="text-slate-500">({extractSenderEmail(email.from)})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(email.date)}</span>
                    </div>

                    <div className="flex gap-2">
                      {email.isQuoteRequest ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Quote Request
                        </Badge>
                      ) : (
                        <Badge variant="outline">General Email</Badge>
                      )}
                      <Badge variant="outline" className="font-mono text-xs">
                        ID: {email.id}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyEmailToClipboard}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`mailto:${extractSenderEmail(email.from)}`, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Reply
                    </Button>
                  </div>
                </div>

                {/* Detected Products */}
                {email.detectedProducts && email.detectedProducts.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-3">Detected Products</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {email.detectedProducts.map((product, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">{product.product}</p>
                              {product.productCode && (
                                <p className="text-sm text-slate-600">Code: {product.productCode}</p>
                              )}
                              {product.brand && (
                                <p className="text-sm text-slate-600">Brand: {product.brand}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">Qty: {product.quantity}</Badge>
                              <p className="text-xs text-slate-500 mt-1">{product.confidence} confidence</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />
              </div>

              {/* Email Body */}
              <div className="space-y-4">
                <h3 className="font-medium text-slate-900">Message Content</h3>
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                    {email.htmlBody ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: email.htmlBody }}
                        className="prose prose-sm max-w-none"
                      />
                    ) : (
                      email.body
                    )}
                  </div>
                </div>
              </div>

              {/* Email Metadata */}
              <div className="space-y-3">
                <h3 className="font-medium text-slate-900">Technical Details</h3>
                <div className="bg-slate-50 p-4 rounded-lg border text-sm font-mono space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-600">Message ID:</span>
                      <p className="text-slate-900 break-all">{email.id}</p>
                    </div>
                    {email.threadId && (
                      <div>
                        <span className="text-slate-600">Thread ID:</span>
                        <p className="text-slate-900 break-all">{email.threadId}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-600">From:</span>
                      <p className="text-slate-900 break-all">{email.from}</p>
                    </div>
                    {email.to && (
                      <div>
                        <span className="text-slate-600">To:</span>
                        <p className="text-slate-900 break-all">{email.to}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

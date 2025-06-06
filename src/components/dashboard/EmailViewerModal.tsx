
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmailMessage } from "@/types";
import { Download, Mail, Calendar, User } from "lucide-react";

interface EmailViewerModalProps {
  email: EmailMessage | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EmailViewerModal({ email, isOpen, onClose }: EmailViewerModalProps) {
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

  const extractEmailAddress = (fromField: string) => {
    const emailMatch = fromField.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return emailMatch ? emailMatch[0] : fromField;
  };

  const handleDownloadAttachment = (attachment: any) => {
    // This would typically download the attachment
    // For now, we'll just show a toast or log
    console.log('Downloading attachment:', attachment);
    // Implementation would depend on how attachments are stored/accessed
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Full Email View
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-1">
              {/* Email Header Info */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{email.subject}</h2>
                  <Badge variant="outline" className="text-xs">
                    ID: {email.id}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <div>
                      <div className="font-medium">{extractSenderName(email.from)}</div>
                      <div className="text-slate-600">{extractEmailAddress(email.from)}</div>
                    </div>
                  </div>
                  
                  {email.to && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <div>
                        <div className="text-slate-600">To: {email.to}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <div className="text-slate-600">{formatDate(email.date)}</div>
                  </div>
                  
                  {email.threadId && (
                    <div className="text-slate-600">
                      Thread ID: {email.threadId}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Attachments Section */}
              {email.hasAttachments && email.attachments && email.attachments.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Attachments ({email.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {email.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {attachment.filename || `Attachment ${index + 1}`}
                          </div>
                          {attachment.mimeType && (
                            <div className="text-xs text-slate-600">
                              Type: {attachment.mimeType}
                            </div>
                          )}
                          {attachment.size && (
                            <div className="text-xs text-slate-600">
                              Size: {(attachment.size / 1024).toFixed(1)} KB
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadAttachment(attachment)}
                          className="ml-2"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Email Body */}
              <div className="space-y-4">
                <h3 className="font-semibold">Message Content</h3>
                
                {/* HTML Body if available */}
                {email.htmlBody ? (
                  <div className="bg-white border rounded-lg p-4">
                    <div className="text-sm text-slate-600 mb-2">HTML Content:</div>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: email.htmlBody }}
                    />
                  </div>
                ) : null}
                
                {/* Plain Text Body */}
                <div className="bg-slate-50 border rounded-lg p-4">
                  <div className="text-sm text-slate-600 mb-2">Plain Text Content:</div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {email.body}
                  </div>
                </div>
              </div>

              {/* Email Snippet if different from body */}
              {email.snippet && email.snippet !== email.body && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Email Snippet</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                      {email.snippet}
                    </div>
                  </div>
                </>
              )}
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

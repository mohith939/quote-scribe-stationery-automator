
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, CheckCircle, Mail } from "lucide-react";
import { EmailClassification } from "@/services/emailClassificationService";

interface EmailClassificationBadgeProps {
  classification: EmailClassification;
  onReclassify: (isQuoteRequest: boolean) => void;
  emailId: string;
}

export function EmailClassificationBadge({ 
  classification, 
  onReclassify, 
  emailId 
}: EmailClassificationBadgeProps) {
  const getVariant = () => {
    if (classification.isQuoteRequest) {
      return classification.confidence === 'high' ? 'default' : 'secondary';
    }
    return 'outline';
  };

  const getColor = () => {
    if (classification.isQuoteRequest) {
      return classification.confidence === 'high' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 px-2 text-xs ${getColor()} hover:opacity-80`}
        >
          {classification.isQuoteRequest ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Quote Request
            </>
          ) : (
            <>
              <Mail className="h-3 w-3 mr-1" />
              General
            </>
          )}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem 
          onClick={() => onReclassify(true)}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4 text-green-600" />
          Mark as Quote Request
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onReclassify(false)}
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4 text-gray-600" />
          Mark as General Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

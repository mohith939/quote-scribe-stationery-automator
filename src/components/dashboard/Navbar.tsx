
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function Navbar() {
  const { toast } = useToast();
  
  const handleRefreshEmails = () => {
    toast({
      title: "Checking for new emails",
      description: "This would connect to Gmail in the full version",
    });
  };

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-business-700"
          >
            <rect width="16" height="20" x="4" y="2" rx="2" />
            <line x1="8" x2="16" y1="6" y2="6" />
            <line x1="8" x2="16" y1="10" y2="10" />
            <line x1="8" x2="12" y1="14" y2="14" />
          </svg>
          <span className="text-xl font-bold">QuoteScribe</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshEmails}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 mr-2"
            >
              <path d="M21 8v5a4 4 0 0 1-8 0V8a4 4 0 0 1 8 0Z" />
              <path d="M11 2v10a4 4 0 0 1-8 0V2" />
              <path d="M3 8h18" />
            </svg>
            Check Emails
          </Button>
          <Button size="sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 mr-2"
            >
              <line x1="12" x2="12" y1="5" y2="19" />
              <line x1="5" x2="19" y1="12" y2="12" />
            </svg>
            New Quote
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Navbar;

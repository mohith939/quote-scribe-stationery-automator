
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { Mail, Plus } from "lucide-react";

export function Navbar() {
  const { toast } = useToast();
  
  const handleRefreshEmails = () => {
    toast({
      title: "Checking for new emails",
      description: "Connecting to Gmail to fetch new emails...",
    });
  };

  return (
    <div className="border-b bg-white">
      <div className="flex h-16 items-center px-4 md:px-6 gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <rect width="16" height="20" x="4" y="2" rx="2" />
              <line x1="8" x2="16" y1="6" y2="6" />
              <line x1="8" x2="16" y1="10" y2="10" />
              <line x1="8" x2="12" y1="14" y2="14" />
            </svg>
          </div>
          <span className="text-xl font-bold">QuoteScribe</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshEmails} className="hidden md:flex">
            <Mail className="h-4 w-4 mr-2" />
            Check Emails
          </Button>
          
          <Link to="/processing-queue">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Navbar;

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockQuoteLogs } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { fetchQuoteLogsFromSheets } from "@/services/googleSheetsService";
import { QuoteLog } from "@/types";
import { getGoogleSheetsConfig } from "@/services/googleSheetsService";
import { useToast } from "@/components/ui/use-toast";

export function QuoteHistory() {
  const [quotes, setQuotes] = useState<QuoteLog[]>(mockQuoteLogs);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const sheetsConfig = getGoogleSheetsConfig();
  
  // Load quotes from Google Sheets when connected
  useEffect(() => {
    const loadQuotes = async () => {
      if (sheetsConfig.isConnected && sheetsConfig.spreadsheetId) {
        setLoading(true);
        try {
          const fetchedQuotes = await fetchQuoteLogsFromSheets();
          if (fetchedQuotes && fetchedQuotes.length > 0) {
            setQuotes(fetchedQuotes);
          }
        } catch (error) {
          console.error("Error fetching quotes:", error);
          // Keep using mock data if fetch fails
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadQuotes();
  }, [sheetsConfig.isConnected, sheetsConfig.spreadsheetId]);
  
  // Function to render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Sent":
        return <Badge className="bg-green-500">Sent</Badge>;
      case "Failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "Pending":
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
      case "Manual":
        return <Badge variant="secondary">Manual</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleExportCSV = () => {
    // Create CSV content from quotes
    const headers = "Date,Customer,Email,Product,Quantity,Amount,Status";
    const rows = quotes.map(quote => {
      return [
        new Date(quote.timestamp).toLocaleDateString(),
        quote.customerName,
        quote.emailAddress || "",
        quote.extractedDetails.product || "N/A",
        quote.extractedDetails.quantity || "-",
        `₹${quote.totalQuotedAmount.toFixed(2)}`,
        quote.status
      ].join(",");
    });
    
    const csvContent = [headers, ...rows].join("\n");
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quote-history-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `${quotes.length} quotes exported to CSV`,
    });
  };

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Quote History</CardTitle>
          <CardDescription>
            {sheetsConfig.isConnected 
              ? "Quotes synced with Google Sheets" 
              : "Recent quotations sent to customers"}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading quotes from Google Sheets...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">
                    {new Date(quote.timestamp).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{quote.customerName}</TableCell>
                  <TableCell>{quote.extractedDetails.product || "N/A"}</TableCell>
                  <TableCell className="text-right">{quote.extractedDetails.quantity || "-"}</TableCell>
                  <TableCell className="text-right">
                    ₹{quote.totalQuotedAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>{renderStatusBadge(quote.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
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
                        className="h-4 w-4"
                      >
                        <rect width="16" height="13" x="4" y="8" rx="2" />
                        <path d="m9 15 3 3 3-3" />
                        <path d="M12 3v9" />
                      </svg>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default QuoteHistory;

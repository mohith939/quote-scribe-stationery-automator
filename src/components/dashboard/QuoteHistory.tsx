
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockQuoteLogs } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function QuoteHistory() {
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

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Quote History</CardTitle>
          <CardDescription>
            Recent quotations sent to customers
          </CardDescription>
        </div>
        <Button variant="outline" size="sm">
          Export to CSV
        </Button>
      </CardHeader>
      <CardContent>
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
            {mockQuoteLogs.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-medium">
                  {new Date(quote.timestamp).toLocaleDateString()}
                </TableCell>
                <TableCell>{quote.customerName}</TableCell>
                <TableCell>{quote.extractedDetails.product || "N/A"}</TableCell>
                <TableCell className="text-right">{quote.extractedDetails.quantity || "-"}</TableCell>
                <TableCell className="text-right">
                  ${quote.totalQuotedAmount.toFixed(2)}
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
      </CardContent>
    </Card>
  );
}

export default QuoteHistory;

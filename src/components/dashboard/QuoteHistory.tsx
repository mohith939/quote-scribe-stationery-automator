
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockQuoteLogs } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Filter, Calendar } from "lucide-react";
import { useState } from "react";

export function QuoteHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Filter quotes based on search term and filters
  const filteredQuotes = mockQuoteLogs.filter(quote => {
    const matchesSearch = 
      quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.extractedDetails.product?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    
    const matchesDate = dateFilter === "all" || (() => {
      const quoteDate = new Date(quote.timestamp);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - quoteDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case "today": return daysDiff === 0;
        case "week": return daysDiff <= 7;
        case "month": return daysDiff <= 30;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

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
    const headers = "Date,Customer,Email,Product,Quantity,Amount,Status";
    const rows = filteredQuotes.map(quote => {
      return [
        new Date(quote.timestamp).toLocaleDateString(),
        quote.customerName,
        quote.emailAddress,
        quote.extractedDetails.product || "N/A",
        quote.extractedDetails.quantity || "-",
        `₹${quote.totalQuotedAmount.toFixed(2)}`,
        quote.status
      ].join(",");
    });
    
    const csvContent = [headers, ...rows].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quote-history-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Quote History</CardTitle>
            <CardDescription>
              Recent quotations sent to customers
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customer, email, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-medium">
                  {new Date(quote.timestamp).toLocaleDateString()}
                </TableCell>
                <TableCell>{quote.customerName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {quote.emailAddress}
                </TableCell>
                <TableCell>{quote.extractedDetails.product || "N/A"}</TableCell>
                <TableCell className="text-right">{quote.extractedDetails.quantity || "-"}</TableCell>
                <TableCell className="text-right">
                  ₹{quote.totalQuotedAmount.toFixed(2)}
                </TableCell>
                <TableCell>{renderStatusBadge(quote.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredQuotes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter !== "all" || dateFilter !== "all" 
              ? "No quotes found matching your filters." 
              : "No quote history available."}
          </div>
        )}
        
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredQuotes.length} of {mockQuoteLogs.length} quotes
        </div>
      </CardContent>
    </Card>
  );
}

export default QuoteHistory;

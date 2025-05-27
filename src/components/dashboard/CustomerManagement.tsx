
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Archive
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

// Mock customer data
const mockCustomers = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@company.com",
    phone: "+1 (555) 123-4567",
    company: "Smith Industries",
    status: "active",
    totalQuotes: 12,
    totalRevenue: 15750,
    lastContact: "2024-01-15",
    tags: ["VIP", "Bulk Orders"]
  },
  {
    id: "2", 
    name: "Sarah Johnson",
    email: "sarah.j@techcorp.com",
    phone: "+1 (555) 987-6543",
    company: "TechCorp",
    status: "active",
    totalQuotes: 8,
    totalRevenue: 9200,
    lastContact: "2024-01-14",
    tags: ["Regular"]
  },
  {
    id: "3",
    name: "Mike Wilson",
    email: "mike.wilson@startup.io",
    phone: "+1 (555) 456-7890",
    company: "StartupIO",
    status: "prospect",
    totalQuotes: 2,
    totalRevenue: 1800,
    lastContact: "2024-01-10",
    tags: ["New"]
  }
];

const mockQuoteHistory = [
  {
    id: "Q001",
    customer: "John Smith",
    product: "A4 Paper - 80gsm",
    quantity: 1000,
    amount: 2500,
    status: "accepted",
    date: "2024-01-15"
  },
  {
    id: "Q002",
    customer: "Sarah Johnson", 
    product: "Ballpoint Pens - Blue",
    quantity: 200,
    amount: 1800,
    status: "pending",
    date: "2024-01-14"
  }
];

export function CustomerManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewCustomer = (customerId: string) => {
    setSelectedCustomer(customerId);
    toast({
      title: "Customer Details",
      description: "Opening customer profile..."
    });
  };

  const handleEditCustomer = (customerId: string) => {
    toast({
      title: "Edit Customer",
      description: "Opening customer edit form..."
    });
  };

  const handleArchiveCustomer = (customerId: string) => {
    toast({
      title: "Customer Archived",
      description: "Customer has been archived successfully."
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="customers" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="customers">Customer Database</TabsTrigger>
            <TabsTrigger value="interactions">Interaction History</TabsTrigger>
            <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
          </TabsList>
          
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        <TabsContent value="customers" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Customer List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <CardDescription>{customer.company}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleViewCustomer(customer.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditCustomer(customer.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchiveCustomer(customer.id)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge 
                      variant={customer.status === 'active' ? 'default' : 'secondary'}
                    >
                      {customer.status}
                    </Badge>
                    {customer.tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {customer.email}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {customer.phone}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Last contact: {customer.lastContact}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <div className="text-sm font-medium">{customer.totalQuotes}</div>
                      <div className="text-xs text-muted-foreground">Total Quotes</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">₹{customer.totalRevenue.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Revenue</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Interactions</CardTitle>
              <CardDescription>Track all customer communications and quote history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockQuoteHistory.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{quote.customer}</div>
                      <div className="text-sm text-muted-foreground">
                        {quote.product} × {quote.quantity} - ₹{quote.amount}
                      </div>
                      <div className="text-xs text-muted-foreground">{quote.date}</div>
                    </div>
                    <Badge 
                      variant={
                        quote.status === 'accepted' ? 'default' :
                        quote.status === 'pending' ? 'secondary' : 'destructive'
                      }
                    >
                      {quote.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="follow-ups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Follow-ups</CardTitle>
              <CardDescription>Customers requiring follow-up communication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending follow-ups</p>
                  <p className="text-sm">All customers are up to date!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

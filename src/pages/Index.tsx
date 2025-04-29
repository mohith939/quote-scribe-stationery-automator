
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/dashboard/Navbar";
import QuickStats from "@/components/dashboard/QuickStats";
import EmailInbox from "@/components/dashboard/EmailInbox";
import QuoteHistory from "@/components/dashboard/QuoteHistory";
import ProductCatalog from "@/components/dashboard/ProductCatalog";
import ProcessEmail from "@/components/dashboard/ProcessEmail";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 p-8 pt-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Manage quotations and product pricing for your stationery business
          </p>
        </div>
        
        <QuickStats />
        
        <Tabs defaultValue="inbox" className="mt-6">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="inbox">Email Inbox</TabsTrigger>
            <TabsTrigger value="process">Process Email</TabsTrigger>
            <TabsTrigger value="history">Quote History</TabsTrigger>
            <TabsTrigger value="products">Product Catalog</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inbox" className="space-y-4">
            <EmailInbox />
          </TabsContent>
          
          <TabsContent value="process">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ProcessEmail />
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Quote Template</CardTitle>
                  <CardDescription>
                    Preview the quotation that will be sent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border p-4 rounded-md">
                    <div className="mb-4">
                      <p className="font-medium">To: customer@example.com</p>
                      <p className="font-medium">Subject: Your Quotation for A4 Paper</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>Dear Customer,</p>
                      <p>Thank you for your inquiry. Please find our quotation below:</p>
                      <div className="my-4 border-y py-4">
                        <p><strong>Product:</strong> A4 Paper - 80gsm</p>
                        <p><strong>Quantity:</strong> 500 sheets</p>
                        <p><strong>Price per Unit:</strong> $0.40</p>
                        <p className="font-bold mt-2">Total Amount: $200.00</p>
                      </div>
                      <p>This quotation is valid for 14 days from the date of this email.</p>
                      <p>Please let us know if you would like to proceed with this order.</p>
                      <p className="mt-4">Best regards,</p>
                      <p>Your Stationery Shop</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <QuoteHistory />
          </TabsContent>
          
          <TabsContent value="products">
            <ProductCatalog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default Index;

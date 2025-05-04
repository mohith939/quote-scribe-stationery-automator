
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/dashboard/Navbar";
import QuickStats from "@/components/dashboard/QuickStats";
import EmailInbox from "@/components/dashboard/EmailInbox";
import QuoteHistory from "@/components/dashboard/QuoteHistory";
import ProductCatalog from "@/components/dashboard/ProductCatalog";
import { Link } from "react-router-dom";

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
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="inbox">Email Inbox</TabsTrigger>
            <Link to="/processing-queue" className="w-full">
              <TabsTrigger value="process" className="w-full">Processing Queue</TabsTrigger>
            </Link>
            <Link to="/templates" className="w-full">
              <TabsTrigger value="templates" className="w-full">Quote Templates</TabsTrigger>
            </Link>
            <TabsTrigger value="history">Quote History</TabsTrigger>
            <TabsTrigger value="products">Product Catalog</TabsTrigger>
            <Link to="/settings" className="w-full">
              <TabsTrigger value="settings" className="w-full">Settings</TabsTrigger>
            </Link>
          </TabsList>
          
          <TabsContent value="inbox" className="space-y-4">
            <EmailInbox />
          </TabsContent>
          
          <TabsContent value="process">
            <div className="flex justify-center py-12 border rounded-md border-dashed">
              <Link to="/processing-queue" className="text-center">
                <p className="text-muted-foreground mb-2">Visit the Processing Queue page</p>
                <button className="text-primary underline">Go to Processing Queue</button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="flex justify-center py-12 border rounded-md border-dashed">
              <Link to="/templates" className="text-center">
                <p className="text-muted-foreground mb-2">Visit the Quote Templates page</p>
                <button className="text-primary underline">Go to Quote Templates</button>
              </Link>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <QuoteHistory />
          </TabsContent>
          
          <TabsContent value="products">
            <ProductCatalog />
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="flex justify-center py-12 border rounded-md border-dashed">
              <Link to="/settings" className="text-center">
                <p className="text-muted-foreground mb-2">Visit the Settings page</p>
                <button className="text-primary underline">Go to Settings</button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

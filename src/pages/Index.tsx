
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailInbox } from "@/components/dashboard/EmailInbox";
import { ProcessingQueue } from "@/components/dashboard/ProcessingQueue";
import { QuoteTemplates } from "@/components/dashboard/QuoteTemplates";
import { QuoteHistory } from "@/components/dashboard/QuoteHistory";
import { ProductCatalog } from "@/components/dashboard/ProductCatalog";
import { Navbar } from "@/components/dashboard/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="email-inbox" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="email-inbox">Email Inbox</TabsTrigger>
            <TabsTrigger value="processing-queue">Processing Queue</TabsTrigger>
            <TabsTrigger value="quote-templates">Quote Templates</TabsTrigger>
            <TabsTrigger value="quote-history">Quote History</TabsTrigger>
            <TabsTrigger value="product-catalog">Product Catalog</TabsTrigger>
          </TabsList>
          <TabsContent value="email-inbox" className="mt-6">
            <EmailInbox />
          </TabsContent>
          <TabsContent value="processing-queue" className="mt-6">
            <ProcessingQueue />
          </TabsContent>
          <TabsContent value="quote-templates" className="mt-6">
            <QuoteTemplates />
          </TabsContent>
          <TabsContent value="quote-history" className="mt-6">
            <QuoteHistory />
          </TabsContent>
          <TabsContent value="product-catalog" className="mt-6">
            <ProductCatalog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

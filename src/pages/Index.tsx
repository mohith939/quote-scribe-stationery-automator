
import { TabsContent } from "@/components/ui/tabs";
import { EmailInbox } from "@/components/dashboard/EmailInbox";
import { ProcessingQueue } from "@/components/dashboard/ProcessingQueue";
import { QuoteTemplates } from "@/components/dashboard/QuoteTemplates";
import { QuoteHistory } from "@/components/dashboard/QuoteHistory";
import { ProductCatalog } from "@/components/dashboard/ProductCatalog";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { CustomerManagement } from "@/components/dashboard/CustomerManagement";
import { MainLayout } from "@/components/layout/MainLayout";
import { useState } from "react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("email-inbox");

  return (
    <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <TabsContent value="email-inbox" className="mt-0">
        <EmailInbox />
      </TabsContent>
      <TabsContent value="processing-queue" className="mt-0">
        <ProcessingQueue />
      </TabsContent>
      <TabsContent value="quote-templates" className="mt-0">
        <QuoteTemplates />
      </TabsContent>
      <TabsContent value="quote-history" className="mt-0">
        <QuoteHistory />
      </TabsContent>
      <TabsContent value="product-catalog" className="mt-0">
        <ProductCatalog />
      </TabsContent>
      <TabsContent value="analytics" className="mt-0">
        <AnalyticsDashboard />
      </TabsContent>
      <TabsContent value="customers" className="mt-0">
        <CustomerManagement />
      </TabsContent>
    </MainLayout>
  );
};

export default Index;

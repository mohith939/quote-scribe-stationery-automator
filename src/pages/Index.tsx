
import { TabsContent } from "@/components/ui/tabs";
import { EmailInboxReal } from "@/components/dashboard/EmailInboxReal";
import { ProcessingQueue } from "@/components/dashboard/ProcessingQueue";
import { QuoteTemplates } from "@/components/dashboard/QuoteTemplates";
import { QuoteHistory } from "@/components/dashboard/QuoteHistory";
import { ProductCatalog } from "@/components/dashboard/ProductCatalog";
import { MainLayout } from "@/components/layout/MainLayout";
import { useState } from "react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("email-inbox");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <MainLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <TabsContent value="email-inbox" className="mt-0">
        <EmailInboxReal />
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
    </MainLayout>
  );
};

export default Index;


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
  const [quoteData, setQuoteData] = useState(null);

  const handleSwitchToTemplates = (data: any) => {
    console.log('Switching to templates with data:', data);
    setQuoteData(data);
    setActiveTab("quote-templates");
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Clear quote data when switching away from templates
    if (tab !== "quote-templates") {
      setQuoteData(null);
    }
  };

  return (
    <MainLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <TabsContent value="email-inbox" className="mt-0">
        <EmailInboxReal />
      </TabsContent>
      <TabsContent value="processing-queue" className="mt-0">
        <ProcessingQueue onSwitchToTemplates={handleSwitchToTemplates} />
      </TabsContent>
      <TabsContent value="quote-templates" className="mt-0">
        <QuoteTemplates quoteData={quoteData} />
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

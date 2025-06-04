
import { TabsContent } from "@/components/ui/tabs";
import { EmailInbox } from "@/components/dashboard/EmailInbox";
import { ProcessingQueue } from "@/components/dashboard/ProcessingQueue";
import { QuoteTemplates } from "@/components/dashboard/QuoteTemplates";
import { QuoteHistory } from "@/components/dashboard/QuoteHistory";
import { ProductCatalog } from "@/components/dashboard/ProductCatalog";
import { MainLayout } from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("email-inbox");
  const [prefilledQuoteData, setPrefilledQuoteData] = useState(null);

  useEffect(() => {
    // Listen for quote template switching event
    const handleSwitchToQuoteTemplates = (event: any) => {
      setActiveTab('quote-templates');
      setPrefilledQuoteData(event.detail);
    };

    window.addEventListener('switchToQuoteTemplates', handleSwitchToQuoteTemplates);
    return () => window.removeEventListener('switchToQuoteTemplates', handleSwitchToQuoteTemplates);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Clear prefilled data when manually switching tabs
    if (tab !== 'quote-templates') {
      setPrefilledQuoteData(null);
    }
  };

  const handleSwitchToTemplates = (quoteData: any) => {
    setPrefilledQuoteData(quoteData);
    setActiveTab('quote-templates');
  };

  return (
    <MainLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <TabsContent value="email-inbox" className="mt-0">
        <EmailInbox />
      </TabsContent>
      <TabsContent value="processing-queue" className="mt-0">
        <ProcessingQueue onSwitchToTemplates={handleSwitchToTemplates} />
      </TabsContent>
      <TabsContent value="quote-templates" className="mt-0">
        <QuoteTemplates prefilledData={prefilledQuoteData} />
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

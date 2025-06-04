
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/MainLayout";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { EmailInbox } from "@/components/dashboard/EmailInbox";
import { ProcessEmail } from "@/components/dashboard/ProcessEmail";
import { QuoteHistory } from "@/components/dashboard/QuoteHistory";
import { ProductCatalog } from "@/components/dashboard/ProductCatalog";
import { ProcessingQueue } from "@/components/dashboard/ProcessingQueue";
import { Settings } from "@/components/dashboard/Settings";
import { useState } from "react";
import { EmailMessage } from "@/types";

const Index = () => {
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [activeTab, setActiveTab] = useState("inbox");

  const handleProcessEmail = (email: EmailMessage) => {
    setSelectedEmail(email);
    setActiveTab("process");
  };

  const handleEmailProcessed = () => {
    setSelectedEmail(null);
    setActiveTab("history");
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <QuickStats />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="inbox">Email Inbox</TabsTrigger>
            <TabsTrigger value="process">Process Email</TabsTrigger>
            <TabsTrigger value="queue">Processing Queue</TabsTrigger>
            <TabsTrigger value="history">Quote History</TabsTrigger>
            <TabsTrigger value="catalog">Product Catalog</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="inbox" className="space-y-4">
            <EmailInbox onProcessEmail={handleProcessEmail} />
          </TabsContent>
          <TabsContent value="process" className="space-y-4">
            <ProcessEmail selectedEmail={selectedEmail} onEmailProcessed={handleEmailProcessed} />
          </TabsContent>
          <TabsContent value="queue" className="space-y-4">
            <ProcessingQueue />
          </TabsContent>
          <TabsContent value="history" className="space-y-4">
            <QuoteHistory />
          </TabsContent>
          <TabsContent value="catalog" className="space-y-4">
            <ProductCatalog />
          </TabsContent>
          <TabsContent value="settings" className="space-y-4">
            <Settings />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Index;

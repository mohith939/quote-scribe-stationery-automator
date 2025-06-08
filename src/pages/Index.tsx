
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { EmailInboxReal } from "@/components/dashboard/EmailInboxReal";
import { ProcessingQueue } from "@/components/dashboard/ProcessingQueue";
import { QuoteTemplates } from "@/components/dashboard/QuoteTemplates";
import { Settings } from "@/components/dashboard/Settings";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [quoteData, setQuoteData] = useState(null);

  const handleSwitchToTemplates = (data: any) => {
    setQuoteData(data);
    setActiveTab("templates");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            AI Quote Generator Dashboard
          </h1>
          <p className="text-slate-600">
            Streamline your quotation process with intelligent email processing
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-slate-100/80 p-1 rounded-lg">
              <TabsTrigger value="dashboard" className="rounded-md">Dashboard</TabsTrigger>
              <TabsTrigger value="inbox" className="rounded-md">Email Inbox</TabsTrigger>
              <TabsTrigger value="queue" className="rounded-md">Processing Queue</TabsTrigger>
              <TabsTrigger value="templates" className="rounded-md">Templates</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-md">Analytics</TabsTrigger>
              <TabsTrigger value="settings" className="rounded-md">Settings</TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="dashboard" className="space-y-6">
                <QuickStats />
              </TabsContent>
              
              <TabsContent value="inbox" className="space-y-6">
                <EmailInboxReal />
              </TabsContent>
              
              <TabsContent value="queue" className="space-y-6">
                <ProcessingQueue onSwitchToTemplates={handleSwitchToTemplates} />
              </TabsContent>
              
              <TabsContent value="templates" className="space-y-6">
                <QuoteTemplates />
                {quoteData && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Quote data loaded for customer: {quoteData.customerName}
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-6">
                <AnalyticsDashboard />
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-6">
                <Settings />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Index;


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Clock, FileText, History, Package, Settings as SettingsIcon } from "lucide-react";
import { Navbar } from "./Navbar";
import { useEffect } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MainLayout({ children, activeTab, onTabChange }: MainLayoutProps) {
  useEffect(() => {
    // Listen for settings navigation from navbar
    const handleSwitchToSettings = () => {
      onTabChange('settings');
    };

    window.addEventListener('switchToSettings', handleSwitchToSettings);
    return () => window.removeEventListener('switchToSettings', handleSwitchToSettings);
  }, [onTabChange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navbar />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Quote Automation System
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Automate your quotation process with AI-powered email parsing and dynamic pricing
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="email-inbox" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Inbox
            </TabsTrigger>
            <TabsTrigger value="processing-queue" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Processing Queue
            </TabsTrigger>
            <TabsTrigger value="quote-templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="quote-history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Quote History
            </TabsTrigger>
            <TabsTrigger value="product-catalog" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product Catalog
            </TabsTrigger>
          </TabsList>

          {children}
        </Tabs>
      </div>
    </div>
  );
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Clock, FileText, History, Package, Link as LinkIcon } from "lucide-react";
import { Navbar } from "./Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MainLayout({ children, activeTab, onTabChange }: MainLayoutProps) {
  const { toast } = useToast();
  const [scriptStatus, setScriptStatus] = useState<{
    isConnected: boolean;
    scriptUrl?: string;
    lastSync?: string;
  }>({ isConnected: false });

  useEffect(() => {
    checkScriptConnection();
  }, []);

  const checkScriptConnection = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { data, error } = await supabase
        .from('google_apps_script_config')
        .select('*')
        .eq('user_id', session.session.user.id)
        .single();

      if (data) {
        setScriptStatus({
          isConnected: data.is_connected || false,
          scriptUrl: data.script_url || '',
          lastSync: data.last_sync_time || ''
        });
      }
    } catch (error) {
      console.log('No script configuration found');
    }
  };

  const handleConnectScript = () => {
    toast({
      title: "Google Apps Script Connection",
      description: "This will open the setup wizard for Google Apps Script integration",
    });
    // This would open a setup dialog or redirect to configuration page
  };

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

        {/* Google Apps Script Connection Status */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Google Apps Script:</span>
              {scriptStatus.isConnected ? (
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              ) : (
                <Badge variant="outline" className="border-orange-300 text-orange-700">Not Connected</Badge>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleConnectScript}
              className="bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              {scriptStatus.isConnected ? 'Manage Connection' : 'Connect Google App Script'}
            </Button>
            {scriptStatus.lastSync && (
              <span className="text-xs text-slate-500">
                Last sync: {new Date(scriptStatus.lastSync).toLocaleDateString()}
              </span>
            )}
          </div>
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


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Shield, Bell, RefreshCw, Key } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { GoogleSheetsSettings } from "./GoogleSheetsSettings";
import { GoogleAppsScriptIntegration } from "./GoogleAppsScriptIntegration";
import { GmailSettings } from "./GmailSettings";

export function Settings() {
  const { toast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleSync = () => {
    toast({
      title: "Syncing Data",
      description: "Synchronizing product catalog and quote history...",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-600 mt-1">Manage your system configuration and integrations</p>
      </div>

      {/* Google Apps Script Integration */}
      <GoogleAppsScriptIntegration />

      {/* Gmail Settings */}
      <GmailSettings />

      {/* Google Sheets Integration */}
      <GoogleSheetsSettings />

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-600" />
            <CardTitle>AI Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure AI settings for email parsing and classification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gemini-api-key">Gemini AI API Key</Label>
            <Input 
              id="gemini-api-key" 
              type="password" 
              placeholder="Enter your Gemini AI API key"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="auto-classification" defaultChecked />
            <Label htmlFor="auto-classification">Enable automatic email classification</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="confidence-threshold" defaultChecked />
            <Label htmlFor="confidence-threshold">High confidence auto-processing</Label>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            <CardTitle>System Settings</CardTitle>
          </div>
          <CardDescription>
            General system configuration and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto Refresh Data</Label>
              <p className="text-sm text-slate-600">
                Automatically sync data every 15 minutes
              </p>
            </div>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Email Notifications</Label>
              <p className="text-sm text-slate-600">
                Receive notifications for failed quotes
              </p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Manual Data Sync</Label>
              <p className="text-sm text-slate-600">
                Force synchronization with Google Sheets
              </p>
            </div>
            <Button onClick={handleSync} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings;


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Mail, Database, Shield, Bell, Sync, Key } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Settings() {
  const { toast } = useToast();
  const [gmailConnected, setGmailConnected] = useState(false);
  const [sheetsConnected, setSheetsConnected] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleGmailConnect = () => {
    // Simulate OAuth flow
    setGmailConnected(true);
    toast({
      title: "Gmail Connected",
      description: "Successfully connected to Gmail API",
    });
  };

  const handleSheetsConnect = () => {
    // Simulate Google Sheets connection
    setSheetsConnected(true);
    toast({
      title: "Google Sheets Connected",
      description: "Successfully connected to Google Sheets",
    });
  };

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

      {/* Gmail Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <CardTitle>Gmail Integration</CardTitle>
          </div>
          <CardDescription>
            Connect your Gmail account to automatically fetch and send emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Gmail Connection Status</Label>
              <p className="text-sm text-slate-600">
                {gmailConnected ? "Connected" : "Not connected"}
              </p>
            </div>
            <Button
              onClick={handleGmailConnect}
              variant={gmailConnected ? "outline" : "default"}
            >
              {gmailConnected ? "Reconnect" : "Connect Gmail"}
            </Button>
          </div>
          
          {gmailConnected && (
            <div className="space-y-3 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email-check-interval">Check Interval (minutes)</Label>
                  <Input id="email-check-interval" type="number" defaultValue="5" />
                </div>
                <div>
                  <Label htmlFor="max-emails">Max Emails per Check</Label>
                  <Input id="max-emails" type="number" defaultValue="50" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Sheets Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" />
            <CardTitle>Google Sheets Integration</CardTitle>
          </div>
          <CardDescription>
            Connect to Google Sheets for product catalog and quote logging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Sheets Connection Status</Label>
              <p className="text-sm text-slate-600">
                {sheetsConnected ? "Connected" : "Not connected"}
              </p>
            </div>
            <Button
              onClick={handleSheetsConnect}
              variant={sheetsConnected ? "outline" : "default"}
            >
              {sheetsConnected ? "Reconnect" : "Connect Sheets"}
            </Button>
          </div>

          {sheetsConnected && (
            <div className="space-y-3 pt-4 border-t">
              <div>
                <Label htmlFor="product-sheet-id">Product Catalog Sheet ID</Label>
                <Input 
                  id="product-sheet-id" 
                  placeholder="Enter Google Sheets ID for product catalog"
                />
              </div>
              <div>
                <Label htmlFor="quotes-sheet-id">Quotes Log Sheet ID</Label>
                <Input 
                  id="quotes-sheet-id" 
                  placeholder="Enter Google Sheets ID for quotes logging"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
              <Sync className="h-4 w-4 mr-2" />
              Sync Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings;

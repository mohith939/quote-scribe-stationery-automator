
import Navbar from "@/components/dashboard/Navbar";
import GmailSettings from "@/components/dashboard/GmailSettings";
import GoogleSheetsSettings from "@/components/dashboard/GoogleSheetsSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Settings as SettingsIcon, Download, Upload } from "lucide-react";
import { Link } from "react-router-dom";

const Settings = () => {
  const { toast } = useToast();
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState("medium");

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your application settings have been updated"
    });
  };

  const handleImportData = () => {
    toast({
      title: "Import Data",
      description: "Please select a file to import"
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Data",
      description: "Exporting application data"
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 p-8 pt-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Configure the application settings and integrations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Application Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SettingsIcon className="mr-2 h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Configure general application settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-detect">Auto-detect products and quantities</Label>
                    <Switch
                      id="auto-detect"
                      checked={autoDetectEnabled}
                      onCheckedChange={setAutoDetectEnabled}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automatically detect products and quantities from incoming emails
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency-symbol">Currency Symbol</Label>
                  <Input
                    id="currency-symbol"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    placeholder="₹"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <select
                    id="date-format"
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-confidence">AI Confidence Threshold</Label>
                  <select
                    id="ai-confidence"
                    value={aiConfidenceThreshold}
                    onChange={(e) => setAiConfidenceThreshold(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="high">High (More accurate, fewer auto-quotes)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="low">Low (Less accurate, more auto-quotes)</option>
                  </select>
                  <p className="text-sm text-muted-foreground">
                    Minimum confidence level required for automatic quote generation
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={handleImportData}
                      className="flex items-center"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Import Data
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleExportData}
                      className="flex items-center"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                  </div>
                  <Button className="w-full" onClick={handleSaveSettings}>Save Settings</Button>
                </div>
              </CardContent>
            </Card>

            <GoogleSheetsSettings />
          </div>

          <div className="space-y-6">
            <GmailSettings />
            
            <Card>
              <CardHeader>
                <CardTitle>AI Training and Custom Rules</CardTitle>
                <CardDescription>
                  Improve AI product detection through training and custom rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-yellow-50 p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    This feature will be implemented in the next phase. 
                    Currently, the AI model uses predefined patterns and rules to detect products and quantities.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Detection Methods:</p>
                  <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                    <li>Pattern matching for product names and related terms</li>
                    <li>Quantity extraction from numerical patterns</li>
                    <li>Contextual analysis of email content</li>
                    <li>Confidence scoring based on multiple signals</li>
                  </ul>
                </div>
                
                <div className="pt-2">
                  <Link to="/">
                    <Button variant="outline" className="w-full">
                      Return to Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

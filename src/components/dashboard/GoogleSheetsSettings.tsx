
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Database, RefreshCw, AlertCircle } from "lucide-react";
import { GoogleSheetsConfig } from "@/types";

const initialConfig: GoogleSheetsConfig = {
  isConnected: false,
  spreadsheetId: null,
  quotesSheetName: 'Quotes',
  productsSheetName: 'Products'
};

export function GoogleSheetsSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<GoogleSheetsConfig>(initialConfig);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleConnect = async () => {
    if (!spreadsheetId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Google Sheets ID",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      // Simulate validation of the sheet ID
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would validate the sheet exists and has correct permissions
      if (spreadsheetId.length < 20) {
        throw new Error("Invalid spreadsheet ID format");
      }
      
      setConfig({
        isConnected: true,
        spreadsheetId: spreadsheetId,
        quotesSheetName: 'Quotes',
        productsSheetName: 'Products'
      });
      
      toast({
        title: "Google Sheets Connected",
        description: "Successfully connected to your Google Sheets.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect to Google Sheets. Please check the ID and permissions.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleDisconnect = () => {
    setConfig(initialConfig);
    setSpreadsheetId('');
    
    toast({
      title: "Disconnected",
      description: "Google Sheets connection has been removed.",
    });
  };
  
  const handleSync = () => {
    toast({
      title: "Syncing Data",
      description: "Synchronizing with Google Sheets...",
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Google Sheets Integration
        </CardTitle>
        <CardDescription>
          Connect to Google Sheets for quote logging and product catalog
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!config.isConnected ? (
          <>
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Setup Instructions</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Create a new Google Sheet or use an existing one</li>
                      <li>Copy the sheet ID from the URL</li>
                      <li>Make sure the sheet is accessible (shared with your account)</li>
                      <li>Paste the sheet ID below</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sheetId">Google Sheets ID</Label>
              <Input
                id="sheetId"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Find this in your Google Sheets URL: docs.google.com/spreadsheets/d/[SHEET_ID]/edit
              </p>
            </div>
            
            <Button 
              onClick={handleConnect} 
              disabled={!spreadsheetId.trim() || isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect to Google Sheets'
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-md bg-green-50 p-4">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Successfully Connected</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Sheet ID: <code className="bg-green-100 px-1 rounded">{config.spreadsheetId}</code></p>
                  <p className="mt-1">Quotes will be logged to: <strong>{config.quotesSheetName}</strong></p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quotesSheet">Quotes Sheet Name</Label>
                  <Input
                    id="quotesSheet"
                    value={config.quotesSheetName}
                    onChange={(e) => setConfig({...config, quotesSheetName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productsSheet">Products Sheet Name</Label>
                  <Input
                    id="productsSheet"
                    value={config.productsSheetName}
                    onChange={(e) => setConfig({...config, productsSheetName: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      {config.isConnected && (
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={handleSync}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Now
          </Button>
          <Button variant="destructive" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default GoogleSheetsSettings;

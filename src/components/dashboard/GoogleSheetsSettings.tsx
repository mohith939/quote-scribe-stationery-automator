
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Info, Table, RefreshCw } from "lucide-react";
import { GoogleSheetsConfig } from "@/types";

// Initial demo state
const initialConfig: GoogleSheetsConfig = {
  isConnected: false,
  spreadsheetId: null,
  quotesSheetName: "Quotes",
  productsSheetName: "Products"
};

export function GoogleSheetsSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<GoogleSheetsConfig>(initialConfig);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleConnect = () => {
    setIsConnecting(true);
    
    // Extract spreadsheet ID from URL
    let spreadsheetId: string | null = null;
    
    try {
      // Extract ID from URLs like https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
      const match = spreadsheetUrl.match(/\/d\/(.*?)\/|$|\/edit/);
      if (match && match[1]) {
        spreadsheetId = match[1];
      } else {
        // If not a URL, assume it's the ID directly
        spreadsheetId = spreadsheetUrl;
      }
      
      // Simulate connection process
      setTimeout(() => {
        setConfig({
          isConnected: true,
          spreadsheetId,
          quotesSheetName: config.quotesSheetName,
          productsSheetName: config.productsSheetName
        });
        
        setIsConnecting(false);
        
        toast({
          title: "Google Sheets Connected",
          description: "Successfully connected to Google Sheets.",
        });
      }, 1500);
    } catch (error) {
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Sheets. Check the URL and try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDisconnect = () => {
    setConfig({
      ...config,
      isConnected: false,
      spreadsheetId: null
    });
    
    toast({
      title: "Google Sheets Disconnected",
      description: "Google Sheets connection has been removed.",
    });
  };
  
  const handleSheetNameChange = (type: 'quotes' | 'products', value: string) => {
    if (type === 'quotes') {
      setConfig({
        ...config,
        quotesSheetName: value
      });
    } else {
      setConfig({
        ...config,
        productsSheetName: value
      });
    }
    
    toast({
      title: "Sheet Name Updated",
      description: `${type === 'quotes' ? 'Quotes' : 'Products'} sheet name set to ${value}.`,
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Table className="mr-2 h-5 w-5" />
          Google Sheets Connection
        </CardTitle>
        <CardDescription>
          Connect to Google Sheets to store product data and quotes
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!config.isConnected ? (
          <>
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Setup Instructions</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Create a new Google Sheet or use an existing one</li>
                      <li>Share the Sheet with edit access to the same Google account used for Gmail</li>
                      <li>Copy the spreadsheet URL or ID and paste it below</li>
                      <li>Two sheets will be created or used: "Products" and "Quotes"</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="spreadsheetUrl">Google Sheets URL or ID</Label>
              <Input
                id="spreadsheetUrl"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleConnect} 
              disabled={!spreadsheetUrl || isConnecting}
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
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Successfully Connected</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Spreadsheet ID: <strong>{config.spreadsheetId}</strong></p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quotesSheetName">Quotes Sheet Name</Label>
              <Input
                id="quotesSheetName"
                placeholder="Quotes"
                value={config.quotesSheetName}
                onChange={(e) => handleSheetNameChange('quotes', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="productsSheetName">Products Sheet Name</Label>
              <Input
                id="productsSheetName"
                placeholder="Products"
                value={config.productsSheetName}
                onChange={(e) => handleSheetNameChange('products', e.target.value)}
              />
            </div>
          </>
        )}
      </CardContent>
      
      {config.isConnected && (
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={() => toast({ title: "Syncing...", description: "Syncing data with Google Sheets." })}>
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

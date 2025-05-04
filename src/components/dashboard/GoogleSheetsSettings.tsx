
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Info, RefreshCw, Table } from "lucide-react";
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
      if (spreadsheetUrl.includes('/spreadsheets/d/')) {
        const matches = spreadsheetUrl.match(/\/spreadsheets\/d\/([^/]+)/);
        spreadsheetId = matches ? matches[1] : null;
      } else if (spreadsheetUrl.match(/^[a-zA-Z0-9_-]+$/)) {
        // If it's just the ID
        spreadsheetId = spreadsheetUrl;
      }
      
      if (!spreadsheetId) {
        throw new Error('Invalid spreadsheet URL or ID');
      }
    } catch (error) {
      toast({
        title: "Invalid URL or ID",
        description: "Please enter a valid Google Sheets URL or ID.",
        variant: "destructive"
      });
      setIsConnecting(false);
      return;
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
  };
  
  const handleDisconnect = () => {
    setConfig({
      ...config,
      isConnected: false,
      spreadsheetId: null
    });
    setSpreadsheetUrl('');
    
    toast({
      title: "Google Sheets Disconnected",
      description: "Google Sheets connection has been removed.",
    });
  };
  
  const handleSheetNameChange = (type: 'quotes' | 'products', value: string) => {
    setConfig({
      ...config,
      quotesSheetName: type === 'quotes' ? value : config.quotesSheetName,
      productsSheetName: type === 'products' ? value : config.productsSheetName
    });
  };
  
  const handleSyncProducts = () => {
    toast({
      title: "Syncing Products",
      description: "Importing products from Google Sheets...",
    });
  };
  
  const handleExportQuotes = () => {
    toast({
      title: "Exporting Quotes",
      description: "Exporting quote history to Google Sheets...",
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
                    <p>Connected to spreadsheet: <strong>{config.spreadsheetId}</strong></p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quotesSheet">Quotes Sheet Name</Label>
                <Input
                  id="quotesSheet"
                  value={config.quotesSheetName}
                  onChange={(e) => handleSheetNameChange('quotes', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="productsSheet">Products Sheet Name</Label>
                <Input
                  id="productsSheet"
                  value={config.productsSheetName}
                  onChange={(e) => handleSheetNameChange('products', e.target.value)}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      {config.isConnected && (
        <CardFooter className="flex-col space-y-2">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={handleSyncProducts}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Products
            </Button>
            <Button variant="outline" onClick={handleExportQuotes}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Export Quotes
            </Button>
          </div>
          <Button variant="destructive" onClick={handleDisconnect} className="w-full">
            Disconnect
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default GoogleSheetsSettings;

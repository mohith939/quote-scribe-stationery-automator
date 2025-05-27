
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Info, Mail, RefreshCw, AlertCircle } from "lucide-react";
import { GmailConnectionConfig } from "@/types";

const initialConfig: GmailConnectionConfig = {
  isConnected: false,
  lastSyncTime: null,
  autoRefreshInterval: 5,
  userName: null
};

export function GmailSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<GmailConnectionConfig>(initialConfig);
  const [scriptUrl, setScriptUrl] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleConnect = async () => {
    if (!scriptUrl.trim() || !scriptUrl.includes('script.google.com')) {
      toast({
        title: "Error",
        description: "Please enter a valid Google Apps Script URL",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      // Test the connection to the script
      const response = await fetch(`${scriptUrl}?action=test`);
      
      if (!response.ok) {
        throw new Error('Failed to connect to script');
      }
      
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error('Script connection test failed');
      }
      
      setConfig({
        isConnected: true,
        lastSyncTime: new Date().toISOString(),
        autoRefreshInterval: config.autoRefreshInterval,
        userName: data.userEmail || 'Connected User'
      });
      
      setIsConnecting(false);
      
      toast({
        title: "Gmail Connected",
        description: "Successfully connected to Gmail account.",
      });
    } catch (error) {
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Gmail. Please check your script URL and permissions.",
        variant: "destructive"
      });
    }
  };
  
  const handleDisconnect = () => {
    setConfig({
      ...config,
      isConnected: false,
      lastSyncTime: null,
      userName: null
    });
    
    toast({
      title: "Gmail Disconnected",
      description: "Gmail connection has been removed.",
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Gmail Connection
        </CardTitle>
        <CardDescription>
          Connect to Gmail to automatically fetch quote requests
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
                      <li>Go to <a href="https://script.google.com/" className="underline" target="_blank" rel="noopener noreferrer">Google Apps Script</a> and create a new project</li>
                      <li>Copy the Google Apps Script code from the reference file</li>
                      <li>Deploy as a web app and set permissions to "Anyone"</li>
                      <li>Copy the web app URL and paste it below</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scriptUrl">Google Apps Script Web App URL</Label>
              <Input
                id="scriptUrl"
                placeholder="https://script.google.com/macros/s/..."
                value={scriptUrl}
                onChange={(e) => setScriptUrl(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                This URL is obtained after deploying your Apps Script as a web app
              </p>
            </div>
            
            <Button 
              onClick={handleConnect} 
              disabled={!scriptUrl || isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Connect to Gmail'
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
                    <p>Connected to: <strong>{config.userName}</strong></p>
                    <p className="mt-1">
                      Last synced: {config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-md bg-amber-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    Email checking intervals can be configured in the Email Inbox tab
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      {config.isConnected && (
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={() => toast({ title: "Syncing...", description: "Manually syncing emails from Gmail." })}>
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

export default GmailSettings;

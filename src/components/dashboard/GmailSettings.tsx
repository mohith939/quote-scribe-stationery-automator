
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Info, Mail, RefreshCw } from "lucide-react";
import { GmailConnectionConfig } from "@/types";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

// Initial demo state
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
  
  const handleConnect = () => {
    setIsConnecting(true);
    
    // Simulate connection process
    setTimeout(() => {
      setConfig({
        isConnected: true,
        lastSyncTime: new Date().toISOString(),
        autoRefreshInterval: config.autoRefreshInterval,
        userName: 'example@gmail.com'
      });
      
      setIsConnecting(false);
      
      toast({
        title: "Gmail Connected",
        description: "Successfully connected to Gmail account.",
      });
    }, 1500);
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
  
  const handleIntervalChange = (value: string) => {
    setConfig({
      ...config,
      autoRefreshInterval: parseInt(value)
    });
    
    toast({
      title: "Settings Updated",
      description: `Auto-refresh interval set to ${value} minutes.`,
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
                      <li>Deploy as a web app and set permissions</li>
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
            </div>
            
            <Button 
              onClick={handleConnect} 
              disabled={!scriptUrl || isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
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
            
            <div className="space-y-2">
              <Label htmlFor="refreshInterval">Auto-refresh interval</Label>
              <Select
                value={config.autoRefreshInterval.toString()}
                onValueChange={handleIntervalChange}
              >
                <SelectTrigger id="refreshInterval">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every 1 minute</SelectItem>
                  <SelectItem value="5">Every 5 minutes</SelectItem>
                  <SelectItem value="10">Every 10 minutes</SelectItem>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                  <SelectItem value="60">Every 60 minutes</SelectItem>
                </SelectContent>
              </Select>
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

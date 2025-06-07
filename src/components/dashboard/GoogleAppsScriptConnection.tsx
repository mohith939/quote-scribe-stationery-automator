
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Link, CheckCircle, AlertCircle, Zap, Settings } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function GoogleAppsScriptConnection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [scriptUrl, setScriptUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const getUserStorageKey = (key: string) => {
    return user ? `${key}_${user.id}` : key;
  };

  useEffect(() => {
    if (user) {
      const savedUrl = localStorage.getItem(getUserStorageKey('gmail_script_url'));
      const savedAutoSync = localStorage.getItem(getUserStorageKey('auto_sync_enabled'));
      const savedLastSync = localStorage.getItem(getUserStorageKey('last_sync_time'));
      
      if (savedUrl) {
        setScriptUrl(savedUrl);
        testConnection(savedUrl, false);
      }
      if (savedAutoSync === 'true') {
        setAutoSync(true);
      }
      if (savedLastSync) {
        setLastSync(new Date(savedLastSync));
      }
    }
  }, [user]);

  const testConnection = async (url: string = scriptUrl, showToast: boolean = true) => {
    if (!url.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${url}?action=testConnection&_=${Date.now()}`);
      const data = await response.json();
      
      if (data.success) {
        setIsConnected(true);
        localStorage.setItem(getUserStorageKey('gmail_script_url'), url);
        if (showToast) {
          toast({
            title: "Connection Successful",
            description: "Google Apps Script is connected and working",
          });
        }
      } else {
        setIsConnected(false);
        if (showToast) {
          toast({
            title: "Connection Failed",
            description: data.error || "Unable to connect to Google Apps Script",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      setIsConnected(false);
      if (showToast) {
        toast({
          title: "Connection Error",
          description: "Failed to test connection. Check your URL and try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    if (scriptUrl.trim()) {
      testConnection();
    } else {
      toast({
        title: "URL Required",
        description: "Please enter your Google Apps Script URL",
        variant: "destructive"
      });
    }
  };

  const handleAutoSyncToggle = (enabled: boolean) => {
    setAutoSync(enabled);
    localStorage.setItem(getUserStorageKey('auto_sync_enabled'), enabled.toString());
    
    toast({
      title: enabled ? "Auto Sync Enabled" : "Auto Sync Disabled",
      description: enabled ? "Emails will be synced automatically" : "Auto sync has been turned off",
    });
  };

  const handleRefresh = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to Google Apps Script first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Trigger refresh in parent components
      window.dispatchEvent(new CustomEvent('refreshEmails'));
      setLastSync(new Date());
      localStorage.setItem(getUserStorageKey('last_sync_time'), new Date().toISOString());
      
      toast({
        title: "Refreshing Emails",
        description: "Fetching latest emails from Gmail",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh emails",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Link className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-blue-900">Google Apps Script Integration</CardTitle>
              <CardDescription className="text-blue-700">
                Connect your Gmail account via Google Apps Script
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection Setup */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="scriptUrl" className="text-sm font-medium text-blue-900">
              Apps Script URL
            </Label>
            <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  <Settings className="h-4 w-4 mr-1" />
                  Setup Instructions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Google Apps Script Setup Instructions</DialogTitle>
                  <DialogDescription>
                    Follow these steps to create and deploy your Google Apps Script
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Step 1: Create New Script</h4>
                    <p>Go to <a href="https://script.google.com" target="_blank" className="text-blue-600 underline">script.google.com</a> and create a new project</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Step 2: Copy Code</h4>
                    <p>Copy the complete code from the reference file in your project</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Step 3: Deploy</h4>
                    <p>Click Deploy → New deployment → Web app</p>
                    <p>Set "Execute as: Me" and "Who has access: Anyone"</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Step 4: Copy URL</h4>
                    <p>Copy the web app URL and paste it below</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex gap-2">
            <Input
              id="scriptUrl"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
              className="flex-1 border-blue-200 focus:border-blue-400"
            />
            <Button 
              onClick={handleConnect}
              disabled={isLoading || !scriptUrl.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Link className="h-4 w-4 mr-1" />
                  Connect
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Connection Status & Controls */}
        {isConnected && (
          <div className="space-y-4 border-t border-blue-200 pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-blue-900">Auto Sync</Label>
                <p className="text-xs text-blue-700">Automatically fetch new emails</p>
              </div>
              <Switch
                checked={autoSync}
                onCheckedChange={handleAutoSyncToggle}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Now
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Zap className="h-4 w-4 mr-1" />
                Quick Sync
              </Button>
              
              {lastSync && (
                <span className="text-xs text-blue-600">
                  Last sync: {lastSync.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

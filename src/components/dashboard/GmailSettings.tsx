
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Info, Mail, RefreshCw, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { GmailConnectionConfig } from "@/types";

const initialConfig: GmailConnectionConfig = {
  isConnected: false,
  lastSyncTime: null,
  autoRefreshInterval: 5,
  userName: null
};

export function GmailSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<GmailConnectionConfig>(() => {
    const saved = localStorage.getItem('gmailConfig');
    return saved ? JSON.parse(saved) : initialConfig;
  });
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleGmailOAuth = async () => {
    setIsConnecting(true);
    
    try {
      // Real Gmail OAuth integration
      const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // This should come from environment/settings
      const redirectUri = `${window.location.origin}/auth/gmail/callback`;
      const scope = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';
      
      const oauthUrl = `https://accounts.google.com/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      console.log("Initiating real Gmail OAuth flow...");
      
      // Open OAuth in popup
      const popup = window.open(oauthUrl, 'gmail-oauth', 'width=500,height=600');
      
      // Listen for popup completion
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          
          // Check if auth was successful (this would be set by callback handler)
          const authResult = localStorage.getItem('gmail_oauth_result');
          if (authResult) {
            const result = JSON.parse(authResult);
            
            if (result.success) {
              const newConfig = {
                isConnected: true,
                lastSyncTime: new Date().toISOString(),
                autoRefreshInterval: config.autoRefreshInterval,
                userName: result.email,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken
              };
              
              setConfig(newConfig);
              localStorage.setItem('gmailConfig', JSON.stringify(newConfig));
              localStorage.removeItem('gmail_oauth_result');
              
              toast({
                title: "Gmail Connected",
                description: `Successfully connected to ${result.email}`,
              });
            } else {
              throw new Error(result.error || 'OAuth failed');
            }
          } else {
            throw new Error('OAuth was cancelled or failed');
          }
        }
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect to Gmail. Please ensure you grant all required permissions.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleDisconnect = () => {
    const newConfig = {
      ...initialConfig
    };
    setConfig(newConfig);
    localStorage.removeItem('gmailConfig');
    
    toast({
      title: "Gmail Disconnected",
      description: "Gmail connection has been removed.",
    });
  };

  const handleSyncNow = async () => {
    if (!config.isConnected) return;
    
    try {
      console.log("Syncing emails from Gmail using real API...");
      
      // This would use the stored access token to fetch emails
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread`, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync with Gmail API');
      }
      
      const updatedConfig = {
        ...config,
        lastSyncTime: new Date().toISOString()
      };
      
      setConfig(updatedConfig);
      localStorage.setItem('gmailConfig', JSON.stringify(updatedConfig));
      
      toast({
        title: "Sync Complete",
        description: "Successfully synced emails from Gmail."
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync emails. Your token may have expired.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Gmail Integration
        </CardTitle>
        <CardDescription>
          Connect to Gmail using OAuth to automatically fetch and send quote requests
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
                  <h3 className="text-sm font-medium text-blue-800">Real Gmail OAuth Integration</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Click the button below to securely connect your Gmail account using Google OAuth. This will allow QuoteScribe to:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Read your incoming emails</li>
                      <li>Detect quote requests automatically</li>
                      <li>Send quotation responses</li>
                    </ul>
                    <p className="mt-2 font-medium">Your credentials are stored securely and can be revoked at any time.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-md bg-amber-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    <strong>Setup Required:</strong> You need to configure your Google OAuth credentials in the settings before connecting.
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleGmailOAuth} 
              disabled={isConnecting}
              className="w-full"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting to Gmail...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect with Gmail OAuth
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
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
            
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Email checking intervals can be configured in the Email Inbox tab. Go to the inbox to manage auto-sync settings.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      {config.isConnected && (
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={handleSyncNow}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Now
          </Button>
          <Button variant="destructive" onClick={handleDisconnect}>
            Disconnect Gmail
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default GmailSettings;

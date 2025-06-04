
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Key, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { realGmailService } from "@/services/realGmailService";

export function GmailAuth() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(realGmailService.isAuthenticated());
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const success = await realGmailService.initializeAuth();
      if (success) {
        setIsConnected(true);
        setConnectionStatus('Connected to Gmail successfully');
        toast({
          title: "Gmail Connected",
          description: "Successfully connected to Gmail API",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to Gmail. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: `Error connecting to Gmail: ${error}`,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTest = async () => {
    try {
      const result = await realGmailService.testConnection();
      setConnectionStatus(result.message);
      
      toast({
        title: result.success ? "Connection Test Successful" : "Connection Test Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: `Error testing connection: ${error}`,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Integration
        </CardTitle>
        <CardDescription>
          Connect your Gmail account to automatically fetch and process emails
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
          {isConnected ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Gmail Connected</div>
                <div className="text-sm text-green-600">Ready to fetch emails</div>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <div className="font-medium text-amber-800">Gmail Not Connected</div>
                <div className="text-sm text-amber-600">Connect your Gmail account to get started</div>
              </div>
            </>
          )}
        </div>

        {/* Setup Instructions */}
        <div className="space-y-4">
          <h4 className="font-medium">Setup Steps:</h4>
          <ol className="text-sm space-y-2 list-decimal list-inside text-slate-600">
            <li>Go to the Google Cloud Console and create a new project</li>
            <li>Enable the Gmail API for your project</li>
            <li>Create OAuth 2.0 credentials (Web application)</li>
            <li>Add your domain to authorized JavaScript origins</li>
            <li>Add the OAuth redirect URI to authorized redirect URIs</li>
            <li>Click the connect button below to authenticate</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleConnect}
            disabled={isConnecting || isConnected}
            className="flex-1"
          >
            <Key className="h-4 w-4 mr-2" />
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect Gmail'}
          </Button>
          
          {isConnected && (
            <Button variant="outline" onClick={handleTest}>
              Test Connection
            </Button>
          )}
        </div>

        {/* Connection Status Message */}
        {connectionStatus && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">{connectionStatus}</div>
          </div>
        )}

        {/* Documentation Links */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Helpful Links:</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Google Cloud Console
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://developers.google.com/gmail/api" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Gmail API Docs
              </a>
            </Button>
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-amber-800">Security Note</div>
              <div className="text-amber-700">
                Your Gmail access tokens are stored locally and never sent to our servers. 
                You can revoke access anytime from your Google Account settings.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

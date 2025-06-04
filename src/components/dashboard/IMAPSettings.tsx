
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Lock, User, CheckCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { createIMAPService } from "@/services/imapEmailService";

export function IMAPSettings() {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const testConnection = async () => {
    if (!credentials.email || !credentials.password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const imapService = createIMAPService(credentials.email, credentials.password);
      const connected = await imapService.connect();
      
      if (connected) {
        setIsConnected(true);
        // Store credentials in localStorage for demo
        localStorage.setItem('imap_credentials', JSON.stringify(credentials));
        
        toast({
          title: "Connection Successful",
          description: "IMAP connection established successfully",
        });
      } else {
        throw new Error("Connection failed");
      }
    } catch (error) {
      console.error('IMAP connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to connect to email server. Check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    localStorage.removeItem('imap_credentials');
    setCredentials({ email: '', password: '' });
    
    toast({
      title: "Disconnected",
      description: "Email connection has been removed",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          IMAP Email Configuration
        </CardTitle>
        <CardDescription>
          Connect to your email account using IMAP (works with Gmail, Outlook, etc.)
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isConnected ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Connected Successfully</span>
            </div>
            <p className="text-sm text-green-700 mb-3">
              Email: {credentials.email}
            </p>
            <Button onClick={disconnect} variant="outline" size="sm">
              Disconnect
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Gmail Users</span>
              </div>
              <p className="text-sm text-blue-700">
                For Gmail, you'll need to use an "App Password" instead of your regular password. 
                Enable 2-factor authentication first, then generate an app password in your Google Account settings.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your-email@gmail.com"
                  value={credentials.email}
                  onChange={(e) => handleCredentialChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password (App Password for Gmail)
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password or app password"
                    value={credentials.password}
                    onChange={(e) => handleCredentialChange('password', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={testConnection}
                disabled={isConnecting || !credentials.email || !credentials.password}
                className="w-full"
              >
                {isConnecting ? "Connecting..." : "Test Connection"}
              </Button>
            </div>
          </>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 mb-2">Setup Instructions:</h4>
          <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
            <li>For Gmail: Enable 2-factor authentication in your Google Account</li>
            <li>Generate an "App Password" in Google Account → Security → App passwords</li>
            <li>Use your email address and the generated app password above</li>
            <li>For other providers: Use your regular email credentials</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

export default IMAPSettings;

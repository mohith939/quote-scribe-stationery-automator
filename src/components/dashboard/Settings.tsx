
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { Shield, Bell, RefreshCw, Key, Link as LinkIcon, Code, CheckCircle, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { GoogleSheetsSettings } from "./GoogleSheetsSettings";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/AuthProvider";

export function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [scriptUrl, setScriptUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Google Apps Script code template
  const googleAppsScriptCode = `/**
 * Gmail Integration Script for QuoteScribe
 * Deploy this as a web app and use the URL in QuoteScribe settings
 */

// Your configuration
const CONFIG = {
  // Add your configuration here
  targetEmail: 'your-business-email@gmail.com', // Email to monitor
  sheetId: 'your-google-sheet-id' // Your Google Sheets ID
};

function doGet(e) {
  const action = e.parameter.action;
  
  switch (action) {
    case 'fetchUnreadEmails':
      return fetchUnreadEmails();
    case 'testConnection':
      return testConnection();
    default:
      return ContentService.createTextOutput('QuoteScribe Gmail Integration Active');
  }
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  switch (action) {
    case 'markAsRead':
      return markEmailAsRead(data.emailId);
    case 'sendEmail':
      return sendQuoteEmail(data.to, data.subject, data.body);
    case 'logQuote':
      return logQuoteToSheet(data.quoteData);
    default:
      return ContentService.createTextOutput(JSON.stringify({success: false, error: 'Unknown action'}))
        .setMimeType(ContentService.MimeType.JSON);
  }
}

function fetchUnreadEmails() {
  try {
    const threads = GmailApp.search('is:unread to:' + CONFIG.targetEmail, 0, 10);
    const emails = [];
    
    threads.forEach(thread => {
      const messages = thread.getMessages();
      messages.forEach(message => {
        if (message.isUnread()) {
          emails.push({
            id: message.getId(),
            from: message.getFrom(),
            subject: message.getSubject(),
            body: message.getPlainBody(),
            date: message.getDate().toISOString()
          });
        }
      });
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      emails: emails
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function markEmailAsRead(emailId) {
  try {
    const message = GmailApp.getMessageById(emailId);
    message.markRead();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendQuoteEmail(to, subject, body) {
  try {
    GmailApp.sendEmail(to, subject, body);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function logQuoteToSheet(quoteData) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.sheetId).getActiveSheet();
    
    sheet.appendRow([
      quoteData.timestamp,
      quoteData.customerName,
      quoteData.emailAddress,
      quoteData.product,
      quoteData.quantity,
      quoteData.pricePerUnit,
      quoteData.totalAmount,
      quoteData.status
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function testConnection() {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Google Apps Script connection successful',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}`;

  // Load Google Apps Script configuration on component mount
  useEffect(() => {
    if (user) {
      loadGoogleAppsScriptConfig();
    }
  }, [user]);

  const loadGoogleAppsScriptConfig = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('google_apps_script_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading config:', error);
        return;
      }

      if (data) {
        setScriptUrl(data.script_url || '');
        setIsConnected(data.is_connected || false);
      }
    } catch (error) {
      console.error('Error loading Google Apps Script config:', error);
    }
  };

  const testConnection = async () => {
    if (!scriptUrl.trim()) {
      toast({
        title: "Missing URL",
        description: "Please enter the Google Apps Script URL first.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to test the connection.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${scriptUrl}?action=testConnection`);
      const data = await response.json();

      if (data.success) {
        await updateGoogleAppsScriptConfig(scriptUrl, true);
        setIsConnected(true);
        toast({
          title: "Connection Successful",
          description: "Google Apps Script is connected and working.",
        });
      } else {
        throw new Error(data.error || 'Connection test failed');
      }
    } catch (error) {
      await updateGoogleAppsScriptConfig(scriptUrl, false);
      setIsConnected(false);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Google Apps Script. Please check the URL.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateGoogleAppsScriptConfig = async (url: string, connected: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('google_apps_script_config')
        .upsert({
          user_id: user.id,
          script_url: url,
          is_connected: connected,
          last_sync_time: connected ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating config:', error);
      }
    } catch (error) {
      console.error('Error updating Google Apps Script config:', error);
    }
  };

  const handleSync = () => {
    toast({
      title: "Syncing Data",
      description: "Synchronizing product catalog and quote history...",
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    toast({
      title: "Code Copied",
      description: "Google Apps Script code has been copied to clipboard.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-600 mt-1">Manage your system configuration and integrations</p>
      </div>

      {/* Google Apps Script Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-green-600" />
            <CardTitle>Google Apps Script Integration</CardTitle>
            <div className="ml-auto flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Not Connected</span>
                </div>
              )}
            </div>
          </div>
          <CardDescription>
            Connect your Google Apps Script to enable email processing and Gmail integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="script-url">Google Apps Script Web App URL</Label>
            <Input 
              id="script-url" 
              type="url" 
              placeholder="https://script.google.com/macros/s/your-script-id/exec"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={testConnection} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                  Testing...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            
            <Dialog open={showCode} onOpenChange={setShowCode}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Code className="h-4 w-4 mr-2" />
                  View Script Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Google Apps Script Code</DialogTitle>
                  <DialogDescription>
                    Copy this code to your Google Apps Script project and deploy it as a web app
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={copyToClipboard} variant="outline" size="sm">
                      Copy to Clipboard
                    </Button>
                  </div>
                  <Textarea
                    value={googleAppsScriptCode}
                    readOnly
                    className="min-h-[400px] font-mono text-sm"
                  />
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium text-amber-800 mb-2">Setup Instructions:</h4>
                    <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                      <li>Go to <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="underline">script.google.com</a></li>
                      <li>Create a new project and paste the code above</li>
                      <li>Update the CONFIG section with your email and sheet ID</li>
                      <li>Deploy as a web app with "Execute as: Me" and "Access: Anyone"</li>
                      <li>Copy the web app URL and paste it in the field above</li>
                      <li>Click "Test Connection" to verify the setup</li>
                    </ol>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Google Sheets Integration */}
      <GoogleSheetsSettings />

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-600" />
            <CardTitle>AI Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure AI settings for email parsing and classification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gemini-api-key">Gemini AI API Key</Label>
            <Input 
              id="gemini-api-key" 
              type="password" 
              placeholder="Enter your Gemini AI API key"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="auto-classification" defaultChecked />
            <Label htmlFor="auto-classification">Enable automatic email classification</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="confidence-threshold" defaultChecked />
            <Label htmlFor="confidence-threshold">High confidence auto-processing</Label>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            <CardTitle>System Settings</CardTitle>
          </div>
          <CardDescription>
            General system configuration and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto Refresh Data</Label>
              <p className="text-sm text-slate-600">
                Automatically sync data every 15 minutes
              </p>
            </div>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Email Notifications</Label>
              <p className="text-sm text-slate-600">
                Receive notifications for failed quotes
              </p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Manual Data Sync</Label>
              <p className="text-sm text-slate-600">
                Force synchronization with Google Sheets
              </p>
            </div>
            <Button onClick={handleSync} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings;
